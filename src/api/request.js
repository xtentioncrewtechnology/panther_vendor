import axios from "axios";
import authToken from "../common/authToken";
import router from "../router";

// ─── Constants

const getBaseURL = () => {
  const customUrl = localStorage.getItem("custom_base_url");
  if (customUrl) {
    const base = customUrl.endsWith("/") ? customUrl.slice(0, -1) : customUrl;
    return `${base}/admin/`;
  }
  return `https://admin.panthercapitals.com/admin/`;
};

const DEFAULT_TIMEOUT = 2 * 60 * 1000;
const MAX_RETRY_ATTEMPTS = 2;
const RETRYABLE_STATUS_CODES = [502, 503, 504];
const NO_BODY_METHODS = ["get", "delete", "head", "options"];
const ALLOWED_METHODS = ["get", "post", "patch", "put", "delete"];

// ─── Request Deduplication (takeLatest)

const pendingRequests = new Map();

const generateRequestKey = (method, url) => {
  return `${method.toUpperCase()}:${url}`;
};

const cancelPreviousRequest = (requestKey) => {
  const existing = pendingRequests.get(requestKey);
  if (existing) {
    existing.abortController.abort();
  }
};

const cleanupRequest = (requestKey, controller) => {
  const current = pendingRequests.get(requestKey);

  if (current?.abortController === controller) {
    pendingRequests.delete(requestKey);
  }
};

// ─── Axios Instance

const axiosInstance = axios.create({
  timeout: DEFAULT_TIMEOUT,
});

// ─── Request Interceptor

axiosInstance.interceptors.request.use(
  (config) => {
    if (config.isTokenRequired !== false) {
      const { accessToken } = authToken.getToken();
      if (accessToken) {
        config.headers["Authorization"] = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (newToken) => {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // ── 401: logout (no refresh)
    if (error.response?.status === 401) {
      authToken.removeToken();
      localStorage.removeItem('role')
      router.push({ name: "login" });
      return Promise.reject(error);
    }

    // ── Retry on transient server errors
    const shouldRetry =
      RETRYABLE_STATUS_CODES.includes(error.response?.status) &&
      (originalRequest._retryCount ?? 0) < MAX_RETRY_ATTEMPTS;

    if (shouldRetry) {
      originalRequest._retryCount = (originalRequest._retryCount ?? 0) + 1;
      const delay = 300 * originalRequest._retryCount;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return axiosInstance(originalRequest);
    }

    handleError(error);
    return Promise.reject(error);
  }
);

// ─── Global Error Handler
const handleError = (error) => {
  // Cancelled request — not an error
  if (error.code === "ERR_CANCELED") {
    console.warn("Request cancelled:", error.message);
    return;
  }

  // Network / no-response errors
  if (!error.response) {
    console.error("Network error:", error.message || "Unknown network error");
    return;
  }

  const { status, statusText, data } = error.response;

  switch (status) {
    case 404:
      console.error(`Not found (404): ${error.config?.url}`);
      break;

    case 500:
    case 502:
    case 503:
      console.error(`Server error (${status}): ${statusText}`);
      break;

    default: {
      const message = data?.message;

      if (!message) {
        console.error("Unexpected error occurred");
        return;
      }

      // Validation errors come as { field: string[] }
      if (typeof message === "object") {
        Object.entries(message).forEach(([field, messages]) => {
          const msgs = Array.isArray(messages) ? messages : [messages];
          msgs.forEach((msg) => console.error(`Validation [${field}]:`, msg));
        });
      } else {
        console.error("API error:", message);
      }
    }
  }
};

// ─── apiRequest
const apiRequest = (
  method,
  url,
  {
    headers = {},
    params = {},
    data = {},
    look_up_key = null,
    onSuccess = null,
    onFailure = null,
    onFinally = null,
    responseType = "json",
    onUploadProgress = null,
    onDownloadProgress = null,
    isTokenRequired = true,
    signal = null,
    timeout = null,
    cancelPrevious = false,
  } = {}
) => {
  if (!ALLOWED_METHODS.includes(method)) {
    throw new Error(
      `Method "${method}" is not allowed. Use one of: ${ALLOWED_METHODS.join(", ")}`
    );
  }
  if (!url) {
    throw new Error("URL is required");
  }
  if (look_up_key !== null && look_up_key !== undefined) {
    url = `${url.replace(/\/$/, "")}/${look_up_key}`;
  }

  let abortController = null;
  let requestKey = null;

  if (cancelPrevious) {
    requestKey = generateRequestKey(method, url);
    abortController = new AbortController();
    cancelPreviousRequest(requestKey);
    pendingRequests.set(requestKey, { abortController });
  }

  const config = {
    method,
    url,
    headers,
    params,
    responseType,
    onUploadProgress,
    onDownloadProgress,
    isTokenRequired,
    baseURL: getBaseURL(),
    signal: abortController?.signal || signal,
    ...(timeout != null && { timeout }),
  };

  // Do not send a body for methods that don't support it
  if (!NO_BODY_METHODS.includes(method)) {
    config.data = data;
  }
  return axiosInstance(config)
  .then((response) => {
    if (onSuccess) onSuccess(response.data);
    return response.data;
  })
  .catch((error) => {
    if (error.code === "ERR_CANCELED") {
      console.warn("Request cancelled:", error.message);
      throw error;
    }

    if (onFailure) {
      onFailure(error.response?.data ?? error);
      return;
    }

    throw error;
  })
  .finally(() => {
    if (requestKey) {
      cleanupRequest(requestKey, abortController);
    }

    if (onFinally) onFinally();
  });
};

export { axiosInstance };
export default apiRequest;
