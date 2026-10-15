import { defineStore } from "pinia";
import { ref, computed } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/snackbar";

export const useVendorWalletsStore = defineStore("vendorWallets", () => {
  const snackbar = useSnackbarStore();

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
  const updateBalances = (paymentMethodId, payload) => {
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

      apiRequest(urls.KEYS.PATCH, urls.vendor.wallets.balances(paymentMethodId), {
        data: payload,
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
        onFinally: finallyHandler,
      });
    });
  };

  // Fetch transactions history for a specific payment method
  const fetchTransactions = (paymentMethodId, params = {}) => {
    transactionsLoading.value = true;
    return new Promise((resolve, reject) => {
      const successHandler = (res) => {
        transactions.value = res?.data || [];
        resolve(res);
      };

      const failureHandler = (err) => {
        const msg = err?.message || "Failed to load wallet transactions";
        snackbar.show(msg, "error");
        reject(err);
      };

      const finallyHandler = () => {
        transactionsLoading.value = false;
      };

      apiRequest(urls.KEYS.GET, urls.vendor.wallets.transactions(paymentMethodId), {
        params,
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
        onFinally: finallyHandler,
      });
    });
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
    actionLoading,
    fetchSummary,
    updateBalances,
    fetchTransactions,
  };
});
