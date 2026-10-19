import { defineStore } from "pinia";
import { ref, computed } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/snackbar";
import { useProfileStore } from "@/stores/profile";

export const useVendorWalletsStore = defineStore("vendorWallets", () => {
  const snackbar = useSnackbarStore();
  const profileStore = useProfileStore();

  const resolveUserId = async (explicitUserId = null) => {
    if (explicitUserId) return explicitUserId;
    return await profileStore.ensureUserId();
  };

  const summary = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const transactions = ref([]);
  const transactionsLoading = ref(false);
  const actionLoading = ref(false);

  const isFetched = ref({
    summary: false,
    transactions: false,
  });

  const inFlight = {
    summary: false,
    transactions: false,
  };

  const wallets = computed(() => summary.value?.wallets || null);
  const scope = computed(() => summary.value?.scope || "assigned");
  const transfersKpi = computed(() => summary.value?.transfers || null);

  const fetchSummary = (force = false) => {
    if (inFlight.summary) return Promise.resolve();
    if (isFetched.value.summary && !force) return Promise.resolve();

    inFlight.summary = true;
    loading.value = true;
    error.value = null;

    return new Promise((resolve, reject) => {
      const successHandler = (res) => {
        summary.value = res?.data || res;
        isFetched.value.summary = true;
        resolve(res);
      };

      const failureHandler = (err) => {
        error.value = err?.message || "Failed to load vendor summary";
        console.error("Vendor summary error:", err);
        reject(err);
      };

      const finallyHandler = () => {
        inFlight.summary = false;
        loading.value = false;
      };

      apiRequest(urls.KEYS.GET, urls.vendor.summary, {
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
        onFinally: finallyHandler,
      });
    });
  };

  // Adjust exact balances (when permitted via vendor.wallet_adjust)
  const updateBalances = async (userId, payload) => {
    const targetUserId = await resolveUserId(userId);
    if (!targetUserId) {
      const msg = "User ID not found in profile";
      snackbar.show(msg, "error");
      return Promise.reject(new Error(msg));
    }

    actionLoading.value = true;
    return new Promise((resolve, reject) => {
      const successHandler = (res) => {
        snackbar.show(res?.message || "Wallet balances updated successfully", "success");
        fetchSummary(true);
        resolve(res);
      };

      const failureHandler = (err) => {
        const msg = err?.message || err?.error || "Failed to update balances";
        snackbar.show(msg, "error");
        reject(err);
      };

      const finallyHandler = () => {
        actionLoading.value = false;
      };

      apiRequest(urls.KEYS.PATCH, urls.vendor.wallets.balances(targetUserId), {
        data: payload,
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
        onFinally: finallyHandler,
      });
    });
  };

  // Credit wallet for vendor user
  const creditWallet = async (userId, payload) => {
    const targetUserId = await resolveUserId(userId);
    if (!targetUserId) {
      const msg = "User ID not found in profile";
      snackbar.show(msg, "error");
      return Promise.reject(new Error(msg));
    }

    actionLoading.value = true;
    return new Promise((resolve, reject) => {
      const successHandler = (res) => {
        snackbar.show(res?.message || "Wallet credited successfully", "success");
        fetchSummary(true);
        resolve(res);
      };

      const failureHandler = (err) => {
        const msg = err?.message || err?.error || "Failed to credit wallet";
        snackbar.show(msg, "error");
        reject(err);
      };

      const finallyHandler = () => {
        actionLoading.value = false;
      };

      apiRequest(urls.KEYS.POST, urls.vendor.wallets.credit(targetUserId), {
        data: payload,
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
        onFinally: finallyHandler,
      });
    });
  };

  // Fetch transactions history for user wallet / payment method
  const transactionsError = ref(null);
  const pagination = ref({
    page: 1,
    per_page: 20,
    total: 0,
  });

  const filters = ref({
    type: "",
    search: "",
    dateRange: [],
  });

  const fetchTransactions = async (userId = null, customParams = {}) => {
    const targetUserId = await resolveUserId(userId);
    if (!targetUserId) {
      console.warn("fetchTransactions called without user_id");
      return Promise.reject(new Error("User ID is required"));
    }

    transactionsLoading.value = true;
    transactionsError.value = null;

    const params = {
      page: customParams.page ?? pagination.value.page,
      per_page: customParams.per_page ?? pagination.value.per_page,
      ...customParams,
    };

    if (filters.value.type && !params.type) {
      params.type = filters.value.type;
    }

    if (filters.value.search && !params.search) {
      params.search = filters.value.search;
    }

    if (filters.value.dateRange && !params.from_date && !params.to_date) {
      const dr = filters.value.dateRange;
      if (Array.isArray(dr) && dr.length === 2) {
        params.from_date = dr[0];
        params.to_date = dr[1];
      } else if (dr?.start && dr?.end) {
        params.from_date = dr.start;
        params.to_date = dr.end;
      }
    }

    return new Promise((resolve, reject) => {
      const successHandler = (res) => {
        const rawData = res?.data;
        if (Array.isArray(rawData)) {
          transactions.value = rawData;
        } else if (Array.isArray(rawData?.transactions)) {
          transactions.value = rawData.transactions;
        } else if (Array.isArray(rawData?.data)) {
          transactions.value = rawData.data;
        } else if (Array.isArray(res?.transactions)) {
          transactions.value = res.transactions;
        } else {
          transactions.value = [];
        }

        const p = res?.pagination || rawData?.pagination;
        if (p) {
          pagination.value.page = Number(p.page ?? p.current_page ?? pagination.value.page);
          pagination.value.per_page = Number(p.per_page ?? pagination.value.per_page);
          pagination.value.total = Number(p.total ?? transactions.value.length);
        } else if (typeof res?.total === "number" || typeof rawData?.total === "number") {
          pagination.value.total = Number(res?.total ?? rawData?.total ?? transactions.value.length);
        } else {
          pagination.value.total = transactions.value.length;
        }

        resolve(res);
      };

      const failureHandler = (err) => {
        const msg = err?.message || err?.error || "Failed to load wallet transactions";
        transactionsError.value = msg;
        snackbar.show(msg, "error");
        transactions.value = [];
        reject(err);
      };

      const finallyHandler = () => {
        transactionsLoading.value = false;
      };

      apiRequest(urls.KEYS.GET, urls.vendor.wallets.transactions(targetUserId), {
        params,
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
        onFinally: finallyHandler,
      });
    });
  };

  const clearFilters = () => {
    filters.value.type = "";
    filters.value.search = "";
    filters.value.dateRange = [];
    pagination.value.page = 1;
  };

  return {
    summary,
    loading,
    error,
    wallets,
    scope,
    transfersKpi,
    transactions,
    transactionsLoading,
    transactionsError,
    pagination,
    filters,
    actionLoading,
    fetchSummary,
    updateBalances,
    creditWallet,
    fetchTransactions,
    clearFilters,
  };
});
