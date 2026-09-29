import { ref, computed } from "vue";
import { defineStore } from "pinia";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/snackbar/snackbar";
import { useMyPermissionsStore } from "@/stores/rbac/myPermissions";

export const useProfileStore = defineStore("user", () => {
  const snackbar = useSnackbarStore();

  const user = ref(null);
  const loading = ref(false);
  const updateLoading = ref(false);

  const dashboard = ref(null);
  const dashboardLoading = ref(false);

  const displayName = computed(() => {
    return user.value?.name || user.value?.email || "Vendor User";
  });

  const roleLabel = computed(() => {
    return user.value?.role || "Vendor";
  });

  const initials = computed(() => {
    const name = user.value?.name || user.value?.email || "V";
    return name.charAt(0).toUpperCase();
  });

  // ─── Fetch User ────────────────────────────────────
  function fetchUserProfile() {
    loading.value = true;

    return new Promise((resolve, reject) => {
      const successHandler = (res) => {
        const data = res?.data || res;
        user.value = data;
        resolve(data);
      };

      const failureHandler = (err) => {
        console.error("User fetch error:", err);
        reject(err);
      };

      const finallyHandler = () => {
        loading.value = false;
      };

      apiRequest("get", urls.auth.profile, {
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
        onFinally: finallyHandler,
      });
    });
  }
  function updateUserProfile(userId, payload) {
    const myPermissionsStore = useMyPermissionsStore();

    const targetUserId =
      userId ||
      user.value?.id ||
      user.value?.user_id ||
      user.value?.user?.id ||
      user.value?.user?.user_id ||
      myPermissionsStore.userId;

    if (!targetUserId) {
      const msg = "User ID not found";
      snackbar.show(msg, "error");
      return Promise.reject(new Error(msg));
    }

    // Clean payload: exclude empty strings, null, or undefined fields
    const cleanData = {};
    if (payload && typeof payload === "object") {
      Object.keys(payload).forEach((key) => {
        const val = payload[key];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          cleanData[key] = typeof val === "string" ? val.trim() : val;
        }
      });
    }

    updateLoading.value = true;

    return new Promise((resolve, reject) => {
      const successHandler = (res) => {
        updateLoading.value = false;
        snackbar.show(
          res?.message || "User profile updated successfully",
          "success",
        );
        fetchUserProfile();
        resolve(res);
      };

      const failureHandler = (err) => {
        updateLoading.value = false;
        const msg =
          err?.error || err?.message || "Failed to update user profile";
        snackbar.show(msg, "error");
        reject(err);
      };

      apiRequest(urls.KEYS.PUT, urls.auth.updateProfile, {
        look_up_key: targetUserId,
        data: cleanData,
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
      });
    });
  }

  // ─── Fetch Dashboard ───────────────────────────────
  function fetchDashboard() {
    dashboardLoading.value = true;

    const successHandler = (res) => {
      const data = res?.data || res;
      dashboard.value = data;
    };

    const failureHandler = (err) => {
      console.error("Dashboard fetch error:", err);
    };

    const finallyHandler = () => {
      dashboardLoading.value = false;
    };

    apiRequest("get", urls.dashboard.stats, {
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
      onFinally: finallyHandler,
    });
  }

  // ─── Submit FM Registration Request ───────────────
  function submitFmRequest(payload) {
    return new Promise((resolve, reject) => {
      const body = {
        performance_fee: Number(payload.performance_fee),
        fm_share: Number(payload.fm_share),
        broker_share: Number(payload.broker_share),
        ib_pool_percentage: Number(payload.ib_pool_percentage),
        settlement_type: payload.settlement_type,
        settlement_time: payload.settlement_time,
      };

      const successHandler = (res) => {
        resolve(res?.data || res);
      };

      const failureHandler = (err) => {
        console.error("FM request submission error:", err);
        reject(err);
      };

      apiRequest("post", urls.auth.fmRequest, {
        data: body,
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
      });
    });
  }

  return {
    user,
    loading,
    updateLoading,
    fetchUserProfile,
    updateUserProfile,
    dashboard,
    dashboardLoading,
    fetchDashboard,
    submitFmRequest,
    displayName,
    roleLabel,
    initials,
  };
});
