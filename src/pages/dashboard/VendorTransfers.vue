<template>
  <div class="flex flex-col h-full gap-3">
    <!-- Page header -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="section-label mb-1">Operations</p>
        <h1 class="page-title">Vendor Queue</h1>
        <p class="page-subtitle">
          Review assigned bank-transfer deposits and withdrawals, then complete or reject.
        </p>
      </div>

      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
        <div
          v-if="pagination.total > 0"
          class="hidden sm:flex items-center gap-2 h-9 rounded-xl border border-primary-border bg-card-background px-3 text-xs text-secondary-text"
        >
          <span class="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
          {{ pagination.total }}
          {{ pagination.total === 1 ? "record" : "records" }}
        </div>
        <div class="w-full sm:w-40">
          <BaseSelect
            v-model="filters.type"
            :options="typeOptions"
            placeholder="All types"
            variant="surface"
            py="2"
            @update:modelValue="onFilterChange"
          />
        </div>
        <div class="w-full sm:w-44">
          <BaseSelect
            v-model="filters.status"
            :options="statusOptions"
            placeholder="Select Status"
            variant="surface"
            py="2"
            @update:modelValue="onFilterChange"
          />
        </div>
        <div class="w-full sm:w-60">
          <BaseDatePicker
            v-model="filters.dateRange"
            mode="range"
            placeholder="Select date range"
            :maxDate="new Date()"
            variant="surface"
            triggerClass="py-2"
            @update:modelValue="onFilterChange"
          />
        </div>
        <button
          v-if="hasActiveFilters"
          type="button"
          class="bg-card-background border border-primary-border rounded-xl px-4 py-2 text-primary-text text-sm hover:bg-primary/5 transition-colors flex items-center justify-center"
          @click="clearFilters"
        >
          Clear
        </button>
        <button
          type="button"
          class="bg-card-background border border-primary-border rounded-xl p-1 text-secondary-text hover:bg-primary/5 transition-colors flex items-center justify-center"
          title="Refresh list"
          aria-label="Refresh list"
          :disabled="loading"
          @click="fetchTransfers"
        >
          <span
            class="material-symbols-outlined text-[18px]"
            :class="loading ? 'animate-spin' : ''"
          >
            refresh
          </span>
        </button>
      </div>
    </div>

    <!-- Data Table -->
    <DataTable
      :data="transfers"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      empty-title="No transfers"
      empty-text="There are no transfers for this status."
      @page-change="changePage"
      @per-page-change="changePerPage"
    >
      <template #empty>
        <EmptyState
          :icon="fetchError ? 'error' : hasActiveFilters ? 'filter_alt_off' : 'inbox'"
          :title="emptyStateTitle"
          :description="emptyStateDescription"
        >
          <template #action>
            <div class="flex flex-wrap items-center justify-center gap-2">
              <button
                v-if="hasActiveFilters"
                type="button"
                class="btn-secondary"
                @click="clearFilters"
              >
                Clear filters
              </button>
              <button type="button" class="btn-primary" @click="fetchTransfers">
                Refresh
              </button>
            </div>
          </template>
        </EmptyState>
      </template>
      <template #cell-created_at="{ row }">
        <div class="text-primary-text whitespace-nowrap">
          {{ formatDate(row.created_at) }}
        </div>
      </template>

      <template #cell-amount="{ row }">
        <div class="font-semibold text-primary-text tabular-nums whitespace-nowrap">
          {{ formatMoney(row.payment_request?.paid_amount) }}
          {{ row.payment_request?.paid_currency }}
        </div>
        <div class="text-xs text-secondary-text mt-0.5 tabular-nums whitespace-nowrap">
          Req: {{ formatMoney(row.payment_request?.amount) }}
          {{ row.payment_request?.currency }}
        </div>
      </template>

      <template #cell-type="{ row }">
        <div class="font-medium text-primary-text capitalize">
          {{ row.payment_request?.type || "—" }}
        </div>
        <div class="text-xs text-secondary-text mt-0.5">
          {{ row.payment_request?.method || row.payment_request?.gateway || "—" }}
        </div>
      </template>

      <template #cell-bank="{ row }">
        <div class="min-w-0" v-if="isDeposit(row)">
          <div class="font-medium text-primary-text truncate">
            {{ row.payment_request?.bank?.company_bank?.bank_name
              || row.payment_request?.bank?.bank
              || "Company bank" }}
          </div>
          <div class="text-xs text-secondary-text mt-0.5 truncate">
            UTR: {{ row.payment_request?.bank?.utr || row.payment_request?.txid || "—" }}
          </div>
          <button
            v-if="row.payment_request?.bank?.deposit_proof_url"
            type="button"
            class="text-xs text-primary-blue hover:underline font-medium cursor-pointer mt-0.5"
            @click.stop="openProofPreview(row.payment_request.bank.deposit_proof_url)"
          >
            View user proof
          </button>
        </div>
        <div class="min-w-0" v-else>
          <div class="font-medium text-primary-text truncate">
            {{ row.payment_request?.bank?.bank || "—" }}
          </div>
          <div class="text-xs text-secondary-text mt-0.5 truncate">
            {{ row.payment_request?.bank?.account_name || "—" }}
          </div>
          <div class="text-xs text-secondary-text font-mono mt-0.5">
            {{ row.payment_request?.bank?.account_number || "—" }}
          </div>
          <div
            v-if="row.payment_request?.bank?.account_type || row.payment_request?.bank?.bank_branch_code"
            class="text-[11px] text-secondary-text mt-0.5"
          >
            <span v-if="row.payment_request?.bank?.account_type">
              {{ row.payment_request.bank.account_type }}
            </span>
            <span
              v-if="row.payment_request?.bank?.account_type && row.payment_request?.bank?.bank_branch_code"
            >
              ·
            </span>
            <span v-if="row.payment_request?.bank?.bank_branch_code">
              IFSC/Branch: {{ row.payment_request.bank.bank_branch_code }}
            </span>
          </div>
        </div>
      </template>

      <template #cell-reference="{ row }">
        <div class="text-xs font-mono text-primary-text break-all max-w-[180px]">
          {{ row.payment_request?.reference_id || "—" }}
        </div>
        <div class="text-[11px] text-secondary-text mt-0.5">
          PR #{{ row.payment_request_id || row.payment_request?.id || "—" }}
        </div>
      </template>

      <template #cell-payment_status="{ row }">
        <div class="flex flex-col gap-1 items-start">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize border"
            :class="paymentStatusClass(row.payment_request?.payment_status)"
          >
            {{ row.payment_request?.payment_status || "—" }}
          </span>
          <span
            class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium capitalize border border-primary-border text-secondary-text bg-background"
          >
            {{ row.payment_request?.approval_status || "—" }}
          </span>
        </div>
      </template>

      <!-- Proof status -->
      <template #cell-proof="{ row }">
        <div class="flex flex-col gap-1.5 min-w-0">
          <div class="flex items-center gap-1.5 text-xs">
            <span
              class="material-symbols-outlined text-[16px]"
              :class="row.proof_url ? 'text-primary-green' : 'text-secondary-text'"
            >
              {{ row.proof_url ? "check_circle" : "radio_button_unchecked" }}
            </span>
            <span
              class="truncate"
              :class="row.proof_url ? 'text-primary-text' : 'text-secondary-text'"
              :title="row.proof_url || ''"
            >
              {{ row.proof_url ? truncateText(row.proof_url, 28) : "No UTR" }}
            </span>
          </div>
          <div class="flex items-center gap-1.5 text-xs">
            <span
              class="material-symbols-outlined text-[16px]"
              :class="row.proof_attachment_url ? 'text-primary-green' : 'text-secondary-text'"
            >
              {{ row.proof_attachment_url ? "attach_file" : "attach_file_off" }}
            </span>
            <button
              v-if="row.proof_attachment_url"
              type="button"
              class="text-primary-blue hover:underline font-medium cursor-pointer"
              @click.stop="openProofPreview(row.proof_attachment_url, row.proof_attachment)"
            >
              View file
            </button>
            <span v-else class="text-secondary-text">No attachment</span>
          </div>
        </div>
      </template>

      <template #cell-status="{ row }">
        <div class="flex flex-col gap-1 items-start">
          <span
            class="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide uppercase border"
            :class="statusBadgeClass(row.status)"
          >
            {{ row.status }}
          </span>
          <span
            v-if="isAwaitingAdmin(row)"
            class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border border-primary-yellow/30 bg-primary-yellow/10 text-primary-yellow"
          >
            Awaiting admin
          </span>
        </div>
      </template>

      <template #cell-actions="{ row }">
        <div class="flex flex-col sm:flex-row justify-end gap-1.5 sm:gap-2 flex-wrap" v-if="row.status === 'assigned'">
          <button
            v-if="!isAwaitingAdmin(row)"
            type="button"
            @click="openProcessModal(row)"
            class="h-8 px-2.5 sm:px-3 rounded-lg bg-primary text-btn-text-primary text-xs font-semibold hover:bg-primary-hover transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            Approve
          </button>
          <span
            v-else
            class="px-2.5 sm:px-3 py-1.5 rounded-lg border border-primary-yellow/30 bg-primary-yellow/5 text-primary-yellow text-xs sm:text-sm font-semibold whitespace-nowrap"
          >
            Awaiting admin
          </span>
          <button
            v-if="isDeposit(row)"
            type="button"
            @click="openRejectModal(row)"
            class="h-8 px-2.5 sm:px-3 rounded-lg border border-primary-red/30 bg-primary-red/5 text-primary-red text-xs font-semibold hover:bg-primary-red/10 transition-colors cursor-pointer"
          >
            Reject
          </button>
        </div>
      </template>
    </DataTable>

    <VendorTransferModals
      :type="modalType"
      :transfer="activeTransfer"
      @close="modalType = ''"
      @success="onModalSuccess"
      @open-preview="openProofPreview"
    />
    <!-- Proof preview modal -->
    <div
      v-if="showProofPreview"
      class="fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-[2px] p-4"
      style="background-color: var(--app-overlay)"
      @click.self="closeProofPreview"
    >
      <div
        class="modal-panel max-w-3xl flex flex-col max-h-[90vh]"
      >
        <div class="modal-header">
          <div class="min-w-0">
            <h3 class="title-text">Proof attachment</h3>
            <p class="text-xs text-secondary-text mt-0.5 truncate" :title="previewName">
              {{ previewName || "Attachment preview" }}
            </p>
          </div>
          <button
            type="button"
            @click="closeProofPreview"
            class="text-secondary-text hover:text-primary-text transition-colors cursor-pointer p-1 rounded-lg hover:bg-background shrink-0"
            aria-label="Close"
          >
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div class="p-4 sm:p-6 flex-1 overflow-auto bg-background/50 min-h-[280px] flex items-center justify-center">
          <div
            v-if="previewLoading"
            class="flex flex-col items-center gap-3 text-secondary-text"
          >
            <svg class="w-8 h-8 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p class="text-sm">Loading preview…</p>
          </div>

          <img
            v-else-if="previewKind === 'image' && previewDisplayUrl && !previewLoadError"
            :src="previewDisplayUrl"
            :alt="previewName || 'Proof attachment'"
            class="max-w-full max-h-[60vh] w-auto h-auto object-contain rounded-lg shadow-sm"
            @error="onPreviewError"
            @load="previewLoading = false"
          />
          <iframe
            v-else-if="previewKind === 'pdf' && previewDisplayUrl && !previewLoadError"
            :src="previewDisplayUrl"
            title="Proof PDF preview"
            class="w-full h-[60vh] rounded-lg border border-primary-border bg-card-background"
          />
          <div
            v-else
            class="flex flex-col items-center gap-3 text-center px-4"
          >
            <span class="material-symbols-outlined text-[48px] text-secondary-text">
              {{ previewKind === 'pdf' ? 'picture_as_pdf' : 'insert_drive_file' }}
            </span>
            <p class="text-sm text-secondary-text max-w-sm">
              {{ previewLoadError ? "Preview could not be loaded." : "Preview is not available for this file type." }}
              You can download the file instead.
            </p>
          </div>
        </div>

        <div class="modal-footer flex-col-reverse sm:flex-row">
          <button type="button" class="btn-secondary" @click="closeProofPreview">
            Close
          </button>
          <button type="button" class="btn-primary" @click="downloadProofFile">
            <span class="material-symbols-outlined text-[18px]">download</span>
            Download
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import DataTable from "@/components/common/DataTable/DataTable.vue";
import BaseSelect from "@/components/common/BaseSelect.vue";
import BaseDatePicker from "@/components/common/BaseDatePicker copy.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import VendorTransferModals from "@/components/dashboard/VendorTransferModals.vue";
import { useSnackbarStore } from "@/stores/snackbar/snackbar";

const snackbar = useSnackbarStore();

const PROOF_ALLOWED_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "pdf",
]);
const PROOF_MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const PROOF_ACCEPT = ".png,.jpg,.jpeg,.gif,.webp,.pdf";

const transfers = ref([]);
const loading = ref(false);
const fetchError = ref(false);
const isSubmitting = ref(false);
const isDragging = ref(false);
const fileInputRef = ref(null);

const showProofPreview = ref(false);
const previewUrl = ref("");
const previewDisplayUrl = ref("");
const previewName = ref("");
const previewLoadError = ref(false);
const previewLoading = ref(false);
let previewObjectUrl = null;

const getUrlExtension = (value) => {
  if (!value) return "";
  try {
    const path = String(value).split("?")[0].split("#")[0];
    const base = path.split("/").pop() || path;
    const parts = base.toLowerCase().split(".");
    return parts.length > 1 ? parts.pop() : "";
  } catch {
    return "";
  }
};

const previewKind = computed(() => {
  const ext = getUrlExtension(previewName.value || previewUrl.value);
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  return "other";
});

const statusOptions = [
  { label: "Assigned", value: "assigned" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const typeOptions = [
  { label: "All types", value: "" },
  { label: "Deposit", value: "deposit" },
  { label: "Withdrawal", value: "withdrawal" },
];

const filters = reactive({
  status: "assigned",
  type: "",
  dateRange: [],
});

const isDeposit = (row) =>
  String(row?.payment_request?.type || "").toLowerCase() === "deposit";

const isAwaitingAdmin = (row) =>
  isDeposit(row) &&
  !!row?.payment_request?.vendor_amount_adjusted &&
  String(row?.payment_request?.approval_status || "").toLowerCase() === "pending";

const processModalSubtitle = computed(() => {
  if (!isDeposit(activeTransfer.value)) {
    return "Add UTR and proof attachment to finish this payout";
  }
  if (depositAmountChanged.value) {
    return "Amount changed — save to send this deposit to admin for approval before credit";
  }
  return "Confirm amount to credit (vendor UTR/proof optional if user already sent UTR/proof)";
});

const amountBaseline = ref(null);
const isEditingAmount = ref(false);
const amountInputRef = ref(null);

const startEditAmount = async () => {
  isEditingAmount.value = true;
  await nextTick();
  amountInputRef.value?.focus?.();
  amountInputRef.value?.select?.();
};

const cancelEditAmount = () => {
  const original = originalDepositAmount.value;
  processForm.amount_inr =
    original != null && !Number.isNaN(Number(original))
      ? String(original)
      : "";
  isEditingAmount.value = false;
};

const originalDepositAmount = computed(() => {
  if (amountBaseline.value !== null && amountBaseline.value !== undefined) {
    return Number(amountBaseline.value);
  }
  const pr = activeTransfer.value?.payment_request;
  return pr?.paid_amount != null ? Number(pr.paid_amount) : null;
});

const depositAmountChanged = computed(() => {
  if (!isDeposit(activeTransfer.value)) return false;
  const current = Number(processForm.amount_inr);
  const original = Number(originalDepositAmount.value);
  if (Number.isNaN(current) || Number.isNaN(original)) return false;
  return Math.abs(current - original) > 0.0001;
});
const pagination = reactive({
  page: 1,
  per_page: 20,
  total: 0,
});

const columns = [
  { key: "id", label: "ID", width: 70 },
  { key: "created_at", label: "Date", width: 150 },
  { key: "amount", label: "Amount", width: 150 },
  { key: "type", label: "Type", width: 140 },
  { key: "bank", label: "Bank", width: 220 },
  { key: "reference", label: "Reference", width: 180 },
  { key: "payment_status", label: "Payment", width: 120 },
  { key: "proof", label: "Proof", width: 180 },
  { key: "status", label: "Status", width: 110 },
  { key: "actions", label: "Actions", width: 160, sticky: "right" },
];

const formatDate = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
};

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const truncateText = (text, max = 28) => {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

const fileNameFromUrl = (url, fallback = "") => {
  if (fallback) {
    const base = String(fallback).split("/").pop();
    if (base) return base;
  }
  if (!url) return "attachment";
  try {
    const path = String(url).split("?")[0];
    return path.split("/").pop() || "attachment";
  } catch {
    return "attachment";
  }
};

const getApiOrigin = () => {
  const customUrl = localStorage.getItem("custom_base_url");
  if (customUrl) {
    return customUrl.endsWith("/") ? customUrl.slice(0, -1) : customUrl;
  }
  const fromEnv = import.meta.env.VITE_API_HOST;
  if (fromEnv) return String(fromEnv).replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
};

/** Resolve relative proof paths to a fetchable absolute URL. */
const resolveProofUrl = (url) => {
  if (!url) return "";
  const raw = String(url).trim();
  if (/^https?:\/\//i.test(raw) || raw.startsWith("blob:") || raw.startsWith("data:")) {
    return raw;
  }
  const origin = getApiOrigin();
  const path = raw.replace(/^\/+/, "");
  // Backend serves uploads at /uploads/<path> and may also embed full PUBLIC_BASE_URL
  if (path.startsWith("uploads/")) {
    return `${origin}/${path}`;
  }
  return `${origin}/uploads/${path}`;
};

const revokePreviewObjectUrl = () => {
  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
  }
};

const onPreviewError = () => {
  previewLoadError.value = true;
  previewLoading.value = false;
};

const loadPreviewContent = async (resolvedUrl) => {
  previewLoading.value = true;
  previewLoadError.value = false;
  revokePreviewObjectUrl();
  previewDisplayUrl.value = "";

  try {
    const res = await fetch(resolvedUrl, {
      mode: "cors",
      credentials: "omit",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    previewObjectUrl = URL.createObjectURL(blob);
    previewDisplayUrl.value = previewObjectUrl;
    previewLoading.value = false;
  } catch {
    // Fall back to direct URL (works when CDN allows img src but blocks fetch CORS)
    previewDisplayUrl.value = resolvedUrl;
    previewLoading.value = false;
  }
};

const openProofPreview = (url, pathOrName = "") => {
  if (!url && !pathOrName) return;
  const resolved = resolveProofUrl(url || pathOrName);
  previewUrl.value = resolved;
  previewName.value = fileNameFromUrl(url || resolved, pathOrName);
  previewLoadError.value = false;
  showProofPreview.value = true;
  loadPreviewContent(resolved);
};

const closeProofPreview = () => {
  showProofPreview.value = false;
  previewUrl.value = "";
  previewDisplayUrl.value = "";
  previewName.value = "";
  previewLoadError.value = false;
  previewLoading.value = false;
  revokePreviewObjectUrl();
};

const downloadProofFile = async () => {
  const source = previewDisplayUrl.value || previewUrl.value;
  if (!source) return;
  const filename = previewName.value || "proof-attachment";

  try {
    let blob;
    if (source.startsWith("blob:")) {
      const res = await fetch(source);
      blob = await res.blob();
    } else {
      const res = await fetch(source, { mode: "cors" });
      if (!res.ok) throw new Error("fetch failed");
      blob = await res.blob();
    }
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    const a = document.createElement("a");
    a.href = previewUrl.value || source;
    a.download = filename;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
};

const statusBadgeClass = (status) => {
  if (status === "assigned") {
    return "bg-primary-yellow/10 text-primary-yellow border-primary-yellow/25";
  }
  if (status === "completed") {
    return "bg-primary-green/10 text-primary-green border-primary-green/25";
  }
  if (status === "cancelled") {
    return "bg-primary-red/10 text-primary-red border-primary-red/25";
  }
  return "bg-background text-secondary-text border-primary-border";
};

const paymentStatusClass = (status) => {
  if (status === "paid") {
    return "bg-primary-green/10 text-primary-green border-primary-green/25";
  }
  if (status === "pending") {
    return "bg-primary-yellow/10 text-primary-yellow border-primary-yellow/25";
  }
  if (status === "failed" || status === "cancelled") {
    return "bg-primary-red/10 text-primary-red border-primary-red/25";
  }
  return "bg-background text-secondary-text border-primary-border";
};

const apiErrorMessage = (err, fallback) => {
  return (
    err?.message ||
    err?.error ||
    err?.response?.data?.message ||
    fallback
  );
};

const fetchTransfers = async () => {
  loading.value = true;
  fetchError.value = false;
  try {
    const params = {
      status: filters.status,
      page: pagination.page,
      per_page: pagination.per_page,
    };
    if (filters.type) {
      params.type = filters.type;
    }
    if (filters.dateRange && filters.dateRange.length === 2) {
      params.from_date = filters.dateRange[0];
      params.to_date = filters.dateRange[1];
    }
    const res = await apiRequest("get", urls.vendorTransfers.list, {
      params,
    });
    if (res.status === "success") {
      transfers.value = res.data || [];
      if (res.pagination) {
        pagination.page = res.pagination.page;
        pagination.per_page = res.pagination.per_page;
        pagination.total = res.pagination.total;
      }
    }
  } catch (error) {
    console.error("Failed to fetch transfers", error);
    transfers.value = [];
    fetchError.value = true;
    snackbar.show("Failed to load transfers", "error");
  } finally {
    loading.value = false;
  }
};

const hasActiveFilters = computed(
  () => !!filters.type || (filters.status && filters.status !== "assigned") || (filters.dateRange && filters.dateRange.length > 0),
);

const emptyStateTitle = computed(() => {
  if (fetchError.value) return "Couldn’t load transfers";
  if (hasActiveFilters.value) return "No matching transfers";
  return "No transfers yet";
});

const emptyStateDescription = computed(() => {
  if (fetchError.value) {
    return "Something went wrong while loading the queue. Try refreshing.";
  }
  if (hasActiveFilters.value) {
    return "No transfers match the current filters. Clear filters or try another status.";
  }
  return "Assigned bank transfers will appear here when they need your review.";
});

const clearFilters = () => {
  filters.type = "";
  filters.status = "assigned";
  filters.dateRange = [];
  pagination.page = 1;
  fetchTransfers();
};

const onFilterChange = () => {
  pagination.page = 1;
  fetchTransfers();
};
const changePage = (page) => {
  pagination.page = page;
  fetchTransfers();
};

const changePerPage = ({ page, per_page }) => {
  pagination.page = page;
  pagination.per_page = per_page;
  fetchTransfers();
};

const showProcessModal = ref(false);
const showRejectModal = ref(false);
const modalType = ref("");

const onModalSuccess = () => {
  modalType.value = "";
  fetchTransfers();
};
const activeTransfer = ref(null);

const processForm = reactive({
  proof_url: "",
  vendor_note: "",
  proof: null,
  amount_inr: "",
});

const rejectForm = reactive({
  rejection_reason: "",
});

const userDepositHasProof = (transfer) => {
  const bank = transfer?.payment_request?.bank;
  const pr = transfer?.payment_request;
  if ((bank?.utr || pr?.txid || "").toString().trim()) return true;
  if ((bank?.deposit_proof_url || "").toString().trim()) return true;
  return false;
};

const depositHasAnyProof = (transfer) => {
  if (userDepositHasProof(transfer)) return true;
  if (processForm.proof_url?.trim() || transfer?.proof_url) return true;
  if (processForm.proof || transfer?.proof_attachment_url) return true;
  return false;
};

const isFormValid = computed(() => {
  if (depositAmountChanged.value) return false;

  if (isDeposit(activeTransfer.value)) {
    const amount = Number(processForm.amount_inr);
    const hasAmount = Number.isFinite(amount) && amount > 0;
    // Amount required; vendor UTR optional when user UTR/proof (or vendor proof) exists
    return hasAmount && depositHasAnyProof(activeTransfer.value);
  }

  const hasUtr = !!processForm.proof_url?.trim();
  const hasFile =
    !!processForm.proof || !!activeTransfer.value?.proof_attachment_url;
  return hasUtr && hasFile;
});

const submitDisabledReason = computed(() => {
  if (isSubmitting.value) return "";
  if (depositAmountChanged.value) {
    return "Amount changed — save draft for admin approval first";
  }
  if (isFormValid.value) return "";

  if (isDeposit(activeTransfer.value)) {
    const amount = Number(processForm.amount_inr);
    if (!Number.isFinite(amount) || amount <= 0) {
      return "Enter a valid amount greater than 0";
    }
    return "Add UTR or proof (user has none on this request)";
  }

  const hasUtr = !!processForm.proof_url?.trim();
  const hasFile =
    !!processForm.proof || !!activeTransfer.value?.proof_attachment_url;
  if (!hasUtr && !hasFile) return "Enter UTR and attach proof";
  if (!hasUtr) return "Enter UTR / remittance";
  if (!hasFile) return "Attach a proof file";
  return "";
});

const canSaveDraft = computed(() => {
  return (
    !!processForm.proof_url?.trim() ||
    !!processForm.vendor_note?.trim() ||
    !!processForm.proof ||
    depositAmountChanged.value
  );
});

const getFileExtension = (filename) => {
  const parts = String(filename || "").toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() : "";
};

const validateProofFile = (file) => {
  if (!file) return false;
  const ext = getFileExtension(file.name);
  if (!PROOF_ALLOWED_EXTENSIONS.has(ext)) {
    snackbar.show(
      "Invalid file type. Use PNG, JPG, GIF, WEBP, or PDF.",
      "error",
    );
    return false;
  }
  if (file.size > PROOF_MAX_SIZE) {
    snackbar.show("File too large. Maximum size is 10 MB.", "error");
    return false;
  }
  return true;
};

let localProofObjectUrl = null;

const revokeLocalProofObjectUrl = () => {
  if (localProofObjectUrl) {
    URL.revokeObjectURL(localProofObjectUrl);
    localProofObjectUrl = null;
  }
};

const setProofFile = (file) => {
  if (!validateProofFile(file)) return;
  revokeLocalProofObjectUrl();
  processForm.proof = file;
};

const clearProofFile = () => {
  processForm.proof = null;
  revokeLocalProofObjectUrl();
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
};

const viewLocalProofFile = () => {
  if (!processForm.proof) return;
  revokeLocalProofObjectUrl();
  localProofObjectUrl = URL.createObjectURL(processForm.proof);
  openProofPreview(localProofObjectUrl, processForm.proof.name);
};

const openFilePicker = () => {
  fileInputRef.value?.click();
};

const handleFileChange = (e) => {
  const file = e.target.files?.[0];
  if (file) setProofFile(file);
  else clearProofFile();
};

const onDragLeave = (e) => {
  if (e.currentTarget.contains(e.relatedTarget)) return;
  isDragging.value = false;
};

const onDrop = (e) => {
  isDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) setProofFile(file);
};

const openProcessModal = (item) => {
  if (isAwaitingAdmin(item)) {
    snackbar.show(
      "Amount was adjusted; waiting for admin approval before credit",
      "info",
    );
    return;
  }
  activeTransfer.value = item;
  modalType.value = 'process';
};

const closeProcessModal = () => {
  showProcessModal.value = false;
  isDragging.value = false;
  isEditingAmount.value = false;
  revokeLocalProofObjectUrl();
};

const openRejectModal = (item) => {
  activeTransfer.value = item;
  modalType.value = 'reject';
};

const saveDraft = async () => {
  if (!activeTransfer.value || !canSaveDraft.value) return;
  isSubmitting.value = true;
  const wasAmountAdjust = depositAmountChanged.value;

  try {
    let data;
    let headers = {};

    if (processForm.proof) {
      // Let the browser set multipart boundary — do not set Content-Type
      data = new FormData();
      if (processForm.proof_url?.trim()) {
        data.append("proof_url", processForm.proof_url.trim());
      }
      if (processForm.vendor_note != null) {
        data.append("vendor_note", processForm.vendor_note);
      }
      if (wasAmountAdjust && processForm.amount_inr !== "") {
        data.append("amount", String(processForm.amount_inr));
      }
      data.append("proof", processForm.proof);
    } else {
      data = {};
      if (processForm.proof_url?.trim()) {
        data.proof_url = processForm.proof_url.trim();
      }
      if (processForm.vendor_note != null) {
        data.vendor_note = processForm.vendor_note;
      }
      if (wasAmountAdjust && processForm.amount_inr !== "") {
        data.amount = Number(processForm.amount_inr);
      }
      headers = { "Content-Type": "application/json" };
    }

    const res = await apiRequest("patch", urls.vendorTransfers.update, {
      look_up_key: activeTransfer.value.id,
      data,
      headers,
      onFailure: (err) => {
        snackbar.show(apiErrorMessage(err, "Draft save failed"), "error");
      },
    });

    if (res?.status === "success") {
      snackbar.show(
        wasAmountAdjust
          ? res.message || "Sent to admin for approval"
          : res.message || "Draft saved",
        "success",
      );
      closeProcessModal();
      fetchTransfers();
    }
  } catch (error) {
    console.error("Draft save failed", error);
    snackbar.show(apiErrorMessage(error, "Draft save failed"), "error");
  } finally {
    isSubmitting.value = false;
  }
};

const submitTransfer = async () => {
  if (!activeTransfer.value || !isFormValid.value || depositAmountChanged.value) return;
  isSubmitting.value = true;

  try {
    const formData = new FormData();
    if (processForm.proof_url?.trim()) {
      formData.append("proof_url", processForm.proof_url.trim());
    }
    if (processForm.vendor_note) {
      formData.append("vendor_note", processForm.vendor_note);
    }
    if (processForm.proof) {
      formData.append("proof", processForm.proof);
    }

    // Do not set Content-Type — axios sets multipart boundary
    const res = await apiRequest("post", urls.vendorTransfers.submit, {
      look_up_key: `${activeTransfer.value.id}/submit`,
      data: formData,
      onFailure: (err) => {
        snackbar.show(apiErrorMessage(err, "Submit failed"), "error");
      },
    });

    if (res?.status === "success") {
      snackbar.show(
        res.message ||
          (isDeposit(activeTransfer.value)
            ? "Deposit confirmed"
            : "Transfer submitted and withdrawal completed"),
        "success",
      );
      closeProcessModal();
      fetchTransfers();
    }
  } catch (error) {
    console.error("Submit failed", error);
    snackbar.show(apiErrorMessage(error, "Submit failed"), "error");
  } finally {
    isSubmitting.value = false;
  }
};

const rejectTransfer = async () => {
  const reason = rejectForm.rejection_reason?.trim();
  if (!activeTransfer.value || !reason) return;
  isSubmitting.value = true;

  try {
    const res = await apiRequest("post", urls.vendorTransfers.reject, {
      look_up_key: `${activeTransfer.value.id}/reject`,
      data: {
        rejection_reason: reason,
      },
      onFailure: (err) => {
        snackbar.show(apiErrorMessage(err, "Reject failed"), "error");
      },
    });

    if (res?.status === "success") {
      snackbar.show(res.message || "Transfer rejected", "success");
      showRejectModal.value = false;
      fetchTransfers();
    }
  } catch (error) {
    console.error("Reject failed", error);
    snackbar.show(apiErrorMessage(error, "Reject failed"), "error");
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  fetchTransfers();
});
</script>
