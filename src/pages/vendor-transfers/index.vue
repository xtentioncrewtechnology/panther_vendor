<template>
  <div class="flex flex-col h-full gap-3">
    <!-- Top Controls -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center">
        <!-- Optional: Left aligned controls if needed in future -->
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

    <!-- Desktop Data Table -->
    <div class="hidden lg:block">
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
        <div class="text-xs font-mono text-primary-text break-all max-w-45">
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
    </div>

    <!-- Mobile / Tablet Card View -->
    <div class="flex lg:hidden flex-col gap-4 mt-4 pb-4">
      <div v-if="loading" class="flex justify-center p-8">
        <span class="material-symbols-outlined text-[24px] text-primary animate-spin">refresh</span>
      </div>
      <EmptyState
        v-else-if="!transfers.length"
        :icon="fetchError ? 'error' : hasActiveFilters ? 'filter_alt_off' : 'inbox'"
        :title="emptyStateTitle"
        :description="emptyStateDescription"
      >
        <template #action>
          <div class="flex flex-wrap items-center justify-center gap-2">
            <button v-if="hasActiveFilters" type="button" class="btn-secondary" @click="clearFilters">Clear filters</button>
            <button type="button" class="btn-primary" @click="fetchTransfers">Refresh</button>
          </div>
        </template>
      </EmptyState>

      <div
        v-else
        v-for="row in transfers"
        :key="row.id"
        class="bg-background border border-primary-border rounded-xl p-4 flex flex-col gap-3 shadow-sm relative overflow-hidden"
      >
        <!-- Top row: Status and ID -->
        <div class="flex justify-between items-start gap-2">
          <div class="flex flex-col gap-1 items-start">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide uppercase border"
              :class="statusBadgeClass(row.status)"
            >
              {{ row.status }}
            </span>
            <span
              v-if="isAwaitingAdmin(row)"
              class="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-semibold border border-primary-yellow/30 bg-primary-yellow/10 text-primary-yellow"
            >
              Awaiting admin
            </span>
          </div>
          <div class="text-right">
            <div class="text-[11px] font-mono text-primary-text">{{ formatDate(row.created_at) }}</div>
            <div class="text-[10px] text-secondary-text mt-0.5">PR #{{ row.payment_request_id || row.payment_request?.id || "—" }}</div>
          </div>
        </div>

        <!-- Main Info -->
        <div class="flex justify-between items-center gap-2 mt-1">
          <div>
            <div class="font-bold text-primary-text text-base tabular-nums">
              {{ formatMoney(row.payment_request?.paid_amount) }} {{ row.payment_request?.paid_currency }}
            </div>
            <div class="text-[11px] text-secondary-text mt-0.5 capitalize">
              {{ row.payment_request?.type || "—" }} · {{ row.payment_request?.method || row.payment_request?.gateway || "—" }}
            </div>
          </div>
          <div class="text-right flex flex-col items-end">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold capitalize border"
              :class="paymentStatusClass(row.payment_request?.payment_status)"
            >
              {{ row.payment_request?.payment_status || "—" }}
            </span>
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium capitalize border border-primary-border text-secondary-text bg-card-background mt-1"
            >
              {{ row.payment_request?.approval_status || "—" }}
            </span>
          </div>
        </div>

        <div class="h-px bg-primary-border my-1" />

        <!-- Bank Details -->
        <div class="grid grid-cols-2 gap-3">
          <div class="min-w-0" v-if="isDeposit(row)">
            <div class="text-[10px] text-secondary-text uppercase tracking-wide font-semibold mb-1">Company Bank</div>
            <div class="font-medium text-primary-text text-xs truncate">
              {{ row.payment_request?.bank?.company_bank?.bank_name || row.payment_request?.bank?.bank || "Company bank" }}
            </div>
            <div class="text-[11px] text-secondary-text mt-0.5 truncate">
              UTR: {{ row.payment_request?.bank?.utr || row.payment_request?.txid || "—" }}
            </div>
          </div>
          <div class="min-w-0" v-else>
            <div class="text-[10px] text-secondary-text uppercase tracking-wide font-semibold mb-1">User Bank</div>
            <div class="font-medium text-primary-text text-xs truncate">
              {{ row.payment_request?.bank?.bank || "—" }}
            </div>
            <div class="text-[11px] text-secondary-text mt-0.5 truncate">
              {{ row.payment_request?.bank?.account_name || "—" }}
            </div>
            <div class="text-[11px] text-secondary-text font-mono mt-0.5">
              {{ row.payment_request?.bank?.account_number || "—" }}
            </div>
          </div>

          <!-- Proof -->
          <div class="min-w-0 flex flex-col gap-1.5">
            <div class="text-[10px] text-secondary-text uppercase tracking-wide font-semibold mb-0.5">Proof</div>
            <div class="flex items-center gap-1.5 text-[11px]">
              <span class="material-symbols-outlined text-[14px]" :class="row.proof_url ? 'text-primary-green' : 'text-secondary-text'">
                {{ row.proof_url ? "check_circle" : "radio_button_unchecked" }}
              </span>
              <span class="truncate" :class="row.proof_url ? 'text-primary-text' : 'text-secondary-text'">
                {{ row.proof_url ? truncateText(row.proof_url, 18) : "No UTR" }}
              </span>
            </div>
            <div class="flex items-center gap-1.5 text-[11px]">
              <span class="material-symbols-outlined text-[14px]" :class="row.proof_attachment_url ? 'text-primary-green' : 'text-secondary-text'">
                {{ row.proof_attachment_url ? "attach_file" : "attach_file_off" }}
              </span>
              <button
                v-if="row.proof_attachment_url"
                type="button"
                class="text-primary-blue hover:underline font-medium cursor-pointer truncate"
                @click.stop="openProofPreview(row.proof_attachment_url, row.proof_attachment)"
              >
                View file
              </button>
              <span v-else class="text-secondary-text truncate">No attachment</span>
            </div>
          </div>
        </div>

        <div class="h-px bg-primary-border my-1" v-if="row.status === 'assigned'" />

        <!-- Actions -->
        <div class="flex gap-2 w-full pt-1" v-if="row.status === 'assigned'">
          <button
            v-if="!isAwaitingAdmin(row)"
            type="button"
            @click="openProcessModal(row)"
            class="flex-1 h-9 rounded-lg bg-primary text-btn-text-primary text-xs font-semibold hover:bg-primary-hover transition-colors shadow-sm cursor-pointer flex items-center justify-center"
          >
            Approve
          </button>
          <span
            v-else
            class="flex-1 h-9 flex items-center justify-center rounded-lg border border-primary-yellow/30 bg-primary-yellow/5 text-primary-yellow text-xs font-semibold"
          >
            Awaiting admin
          </span>
          <button
            v-if="isDeposit(row)"
            type="button"
            @click="openRejectModal(row)"
            class="flex-1 h-9 rounded-lg border border-primary-red/30 bg-primary-red/5 text-primary-red text-xs font-semibold hover:bg-primary-red/10 transition-colors cursor-pointer flex items-center justify-center"
          >
            Reject
          </button>
        </div>
      </div>

      <!-- Mobile Pagination -->
      <div v-if="!loading && transfers.length > 0" class="flex justify-between items-center bg-background border border-primary-border p-3 rounded-xl mt-1 shadow-sm">
         <span class="text-[11px] font-medium text-secondary-text">Page {{ pagination.page }} of {{ Math.ceil(pagination.total / pagination.per_page) }}</span>
         <div class="flex gap-1.5">
           <button class="px-3 py-1.5 rounded-lg border border-primary-border bg-card-background text-xs font-medium disabled:opacity-50 cursor-pointer" :disabled="pagination.page === 1" @click="changePage(pagination.page - 1)">Prev</button>
           <button class="px-3 py-1.5 rounded-lg border border-primary-border bg-card-background text-xs font-medium disabled:opacity-50 cursor-pointer" :disabled="pagination.page * pagination.per_page >= pagination.total" @click="changePage(pagination.page + 1)">Next</button>
         </div>
      </div>
    </div>

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
      class="fixed inset-0 z-60 flex items-center justify-center backdrop-blur-[2px] p-4"
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

        <div class="p-4 sm:p-6 flex-1 overflow-auto bg-background/50 min-h-70 flex items-center justify-center">
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
import { ref, computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import DataTable from "@/components/common/DataTable/DataTable.vue";
import BaseSelect from "@/components/common/BaseSelect.vue";
import BaseDatePicker from "@/components/common/BaseDatePicker copy.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import VendorTransferModals from "@/components/vendor-transfers/VendorTransferModals.vue";
import { useVendorTransfersStore } from "@/stores/vendor-transfers";
import { useSnackbarStore } from "@/stores/snackbar";

const store = useVendorTransfersStore();
const snackbar = useSnackbarStore();
const { transfers, loading, fetchError, filters, pagination } = storeToRefs(store);

// --- Modals State ---
const modalType = ref("");
const activeTransfer = ref(null);

// --- Proof Preview State ---
const showProofPreview = ref(false);
const previewUrl = ref("");
const previewDisplayUrl = ref("");
const previewName = ref("");
const previewLoadError = ref(false);
const previewLoading = ref(false);
let previewObjectUrl = null;

// --- Options & Columns ---
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

// --- Computed & Helpers ---
const hasActiveFilters = computed(() => !!filters.value.type || (filters.value.status && filters.value.status !== "assigned") || (filters.value.dateRange && filters.value.dateRange.length > 0));

const emptyStateTitle = computed(() => {
  if (fetchError.value) return "Couldn’t load transfers";
  if (hasActiveFilters.value) return "No matching transfers";
  return "No transfers yet";
});

const emptyStateDescription = computed(() => {
  if (fetchError.value) return "Something went wrong while loading the queue. Try refreshing.";
  if (hasActiveFilters.value) return "No transfers match the current filters. Clear filters or try another status.";
  return "Assigned bank transfers will appear here when they need your review.";
});

const isDeposit = (row) => String(row?.payment_request?.type || "").toLowerCase() === "deposit";
const isAwaitingAdmin = (row) => isDeposit(row) && !!row?.payment_request?.vendor_amount_adjusted && String(row?.payment_request?.approval_status || "").toLowerCase() === "pending";

const formatDate = (value) => {
  if (!value) return "—";
  try { return new Date(value).toLocaleString(); } catch { return String(value); }
};

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const truncateText = (text, max = 28) => text && text.length > max ? `${text.slice(0, max)}…` : text;

const statusBadgeClass = (status) => {
  if (status === "assigned") return "bg-primary-yellow/10 text-primary-yellow border-primary-yellow/25";
  if (status === "completed") return "bg-primary-green/10 text-primary-green border-primary-green/25";
  if (status === "cancelled") return "bg-primary-red/10 text-primary-red border-primary-red/25";
  return "bg-background text-secondary-text border-primary-border";
};

const paymentStatusClass = (status) => {
  if (status === "paid") return "bg-primary-green/10 text-primary-green border-primary-green/25";
  if (status === "pending") return "bg-primary-yellow/10 text-primary-yellow border-primary-yellow/25";
  if (status === "failed" || status === "cancelled") return "bg-primary-red/10 text-primary-red border-primary-red/25";
  return "bg-background text-secondary-text border-primary-border";
};

// --- Actions & Handlers ---
const fetchTransfers = () => store.fetchTransfers();
const clearFilters = () => store.clearFilters();
const onFilterChange = () => {
  pagination.value.page = 1;
  store.fetchTransfers();
};
const changePage = (page) => store.setPage(page);
const changePerPage = ({ page, per_page }) => store.setPerPage(per_page);

const openProcessModal = (item) => {
  if (isAwaitingAdmin(item)) {
    snackbar.show("Amount was adjusted; waiting for admin approval before credit", "info");
    return;
  }
  activeTransfer.value = item;
  modalType.value = 'process';
};

const openRejectModal = (item) => {
  activeTransfer.value = item;
  modalType.value = 'reject';
};

const onModalSuccess = () => {
  modalType.value = "";
  store.fetchTransfers();
};

// --- Preview Logic ---
const getUrlExtension = (value) => {
  if (!value) return "";
  try {
    const path = String(value).split("?")[0].split("#")[0];
    const base = path.split("/").pop() || path;
    const parts = base.toLowerCase().split(".");
    return parts.length > 1 ? parts.pop() : "";
  } catch { return ""; }
};

const previewKind = computed(() => {
  const ext = getUrlExtension(previewName.value || previewUrl.value);
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  return "other";
});

const fileNameFromUrl = (url, fallback = "") => {
  if (fallback) {
    const base = String(fallback).split("/").pop();
    if (base) return base;
  }
  if (!url) return "attachment";
  try { return String(url).split("?")[0].split("/").pop() || "attachment"; } catch { return "attachment"; }
};

const getApiOrigin = () => {
  const customUrl = localStorage.getItem("custom_base_url");
  if (customUrl) return customUrl.endsWith("/") ? customUrl.slice(0, -1) : customUrl;
  const fromEnv = import.meta.env.VITE_API_HOST;
  if (fromEnv) return String(fromEnv).replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return "";
};

const resolveProofUrl = (url) => {
  if (!url) return "";
  const raw = String(url).trim();
  if (/^https?:\/\//i.test(raw) || raw.startsWith("blob:") || raw.startsWith("data:")) return raw;
  const origin = getApiOrigin();
  const path = raw.replace(/^\/+/, "");
  return path.startsWith("uploads/") ? `${origin}/${path}` : `${origin}/uploads/${path}`;
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
    const res = await fetch(resolvedUrl, { mode: "cors", credentials: "omit" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    previewObjectUrl = URL.createObjectURL(blob);
    previewDisplayUrl.value = previewObjectUrl;
  } catch {
    previewDisplayUrl.value = resolvedUrl;
  } finally {
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

onMounted(() => {
  store.fetchTransfers();
});
</script>
