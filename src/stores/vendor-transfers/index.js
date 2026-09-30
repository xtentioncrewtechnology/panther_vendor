import { defineStore } from "pinia";
import { ref, reactive } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/snackbar";

export const useVendorTransfersStore = defineStore("vendorTransfers", () => {
  const snackbar = useSnackbarStore();
  
  const transfers = ref([]);
  const loading = ref(false);
  const fetchError = ref(false);

  const filters = reactive({
    status: "assigned",
    type: "",
    dateRange: [],
  });

  const pagination = reactive({
    page: 1,
    per_page: 20,
    total: 0,
  });

  const fetchTransfers = () => {
    loading.value = true;
    fetchError.value = false;

    return new Promise((resolve, reject) => {
      const params = {
        status: filters.status,
        page: pagination.page,
        per_page: pagination.per_page,
      };
      
      if (filters.type) {
        params.type = filters.type;
      }
      
      if (filters.dateRange) {
        if (Array.isArray(filters.dateRange) && filters.dateRange.length === 2) {
          params.from_date = filters.dateRange[0];
          params.to_date = filters.dateRange[1];
        } else if (filters.dateRange.start && filters.dateRange.end) {
          params.from_date = filters.dateRange.start;
          params.to_date = filters.dateRange.end;
        }
      }

      const successHandler = (res) => {
        if (res?.status === "success") {
          transfers.value = res.data || [];
          if (res.pagination) {
            pagination.page = res.pagination.page;
            pagination.per_page = res.pagination.per_page;
            pagination.total = res.pagination.total;
          }
        }
        resolve(res);
      };

      const failureHandler = (err) => {
        console.error("Failed to fetch transfers", err);
        transfers.value = [];
        fetchError.value = true;
        snackbar.show("Failed to load transfers", "error");
        reject(err);
      };

      const finallyHandler = () => {
        loading.value = false;
      };

      apiRequest("get", urls.vendorTransfers.list, {
        params,
        isTokenRequired: true,
        onSuccess: successHandler,
        onFailure: failureHandler,
        onFinally: finallyHandler,
      });
    });
  };

  const clearFilters = () => {
    filters.type = "";
    filters.status = "assigned";
    filters.dateRange = [];
    pagination.page = 1;
    fetchTransfers();
  };

  const setPage = (page) => {
    pagination.page = page;
    fetchTransfers();
  };

  const setPerPage = (per_page) => {
    pagination.page = 1;
    pagination.per_page = per_page;
    fetchTransfers();
  };

  return {
    transfers,
    loading,
    fetchError,
    filters,
    pagination,
    fetchTransfers,
    clearFilters,
    setPage,
    setPerPage
  };
});
