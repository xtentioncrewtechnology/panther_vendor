<template>
  <div class="flex flex-col h-full gap-5">
    <!-- Page header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary-text mb-1">
          Operations
        </p>
        <h1 class="text-2xl font-semibold tracking-tight text-primary-text">
          Vendor Queue
        </h1>
        <p class="mt-1 text-sm text-secondary-text">
          Review assigned payouts, attach UTR + proof, and complete or reject transfers.
        </p>
      </div>

      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
        <div
          v-if="pagination.total > 0"
          class="hidden sm:flex items-center gap-2 rounded-xl border border-primary-border bg-card-background px-3 py-2 text-xs text-secondary-text"
        >
          <span class="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
          {{ pagination.total }}
          {{ pagination.total === 1 ? "record" : "records" }}
        </div>
        <div class="w-full sm:w-44">
          <BaseSelect
            v-model="filters.status"
            :options="statusOptions"
            placeholder="Select Status"
            variant="surface"
            py="2.5"
            @update:modelValue="fetchTransfers"
          />
        </div>
        <button
          type="button"
          @click="fetchTransfers"
          :disabled="loading"
          class="inline-flex items-center justify-center gap-2 rounded-xl border border-primary-border bg-card-background px-3.5 py-2.5 text-sm font-semibold text-primary-text hover:bg-background transition-colors disabled:opacity-50 cursor-pointer shrink-0"
          title="Refresh list"
          aria-label="Refresh list"
        >
          <span
            class="material-symbols-outlined text-[18px]"
            :class="loading ? 'animate-spin' : ''"
          >
            refresh
          </span>
          <span class="sm:inline">Refresh</span>
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
      :has-actions="true"
      :actions-sticky="true"
      :actions-width="160"
      empty-title="No Records Found"
      empty-text="There are no transfers for this status."
      @page-change="changePage"
      @per-page-change="changePerPage"
    >
      <template #cell-created_at="{ row }">
        <div class="text-primary-text whitespace-nowrap">
          {{ formatDate(row.created_at) }}
        </div>
      </template>

      <template #cell-user="{ row }">
        <div class="min-w-0">
          <div class="font-semibold text-primary-text truncate">
            {{ row.payment_request?.user_name || "—" }}
          </div>
          <div class="text-xs text-secondary-text truncate mt-0.5">
            {{ row.payment_request?.user_email || "—" }}
          </div>
         
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
        <div class="min-w-0">
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
          <button
            v-if="row.status === 'assigned' && (!row.proof_url || !row.proof_attachment_url)"
            type="button"
            class="mt-0.5 self-start text-xs font-semibold text-primary-yellow hover:underline cursor-pointer"
            @click.stop="openProcessModal(row)"
          >
            Add proof
          </button>
        </div>
      </template>

      <template #cell-status="{ row }">
        <span
          class="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide uppercase border"
          :class="statusBadgeClass(row.status)"
        >
          {{ row.status }}
        </span>
      </template>

      <template #actions="{ row }">
        <div class="flex flex-col sm:flex-row justify-end gap-1.5 sm:gap-2 flex-wrap" v-if="row.status === 'assigned'">
          <button
            type="button"
            @click="openProcessModal(row)"
            class="px-2.5 sm:px-3 py-1.5 rounded-lg bg-primary text-btn-text-primary text-xs sm:text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            <span class="sm:hidden">Complete</span>
            <span class="hidden sm:inline">Complete payment</span>
          </button>
          <button
            type="button"
            @click="openRejectModal(row)"
            class="px-2.5 sm:px-3 py-1.5 rounded-lg border border-primary-red/30 bg-primary-red/5 text-primary-red text-xs sm:text-sm font-semibold hover:bg-primary-red/10 transition-colors cursor-pointer"
          >
            Reject
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Process Modal -->
    <div
      v-if="showProcessModal"
      class="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[2px] p-4"
      style="background-color: var(--app-overlay)"
      @click.self="closeProcessModal"
    >
      <div
        class="bg-card-background border border-primary-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div class="px-4 sm:px-6 py-4 border-b border-primary-border flex justify-between items-center">
          <div>
            <h3 class="text-lg font-semibold text-primary-text">
              Complete payment
            </h3>
            <p class="text-xs text-secondary-text mt-0.5">
              Add UTR and proof attachment to finish this payout
            </p>
          </div>
          <button
            type="button"
            @click="closeProcessModal"
            class="text-secondary-text hover:text-primary-text transition-colors cursor-pointer p-1 rounded-lg hover:bg-background"
            aria-label="Close"
          >
            <span class="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div class="p-4 sm:p-6 flex flex-col gap-5 overflow-y-auto">
          <!-- Remittance summary -->
          <div
            class="bg-background p-4 rounded-xl flex flex-col gap-2.5 border border-primary-border"
          >
            <div class="flex justify-between gap-4 text-sm">
              <span class="text-secondary-text shrink-0">User</span>
              <span class="text-primary-text font-medium text-right">
                {{ activeTransfer?.payment_request?.user_name }}
                <span class="block text-xs text-secondary-text font-normal mt-0.5">
                  {{ activeTransfer?.payment_request?.user_email }}
                </span>
              </span>
            </div>
            <div class="h-px bg-primary-border" />
            <div class="flex justify-between gap-4 text-sm items-center">
              <span class="text-secondary-text">Amount to pay</span>
              <span class="text-primary-yellow font-bold text-lg tabular-nums">
                {{ formatMoney(activeTransfer?.payment_request?.paid_amount) }}
                {{ activeTransfer?.payment_request?.paid_currency }}
              </span>
            </div>
            <div class="h-px bg-primary-border" />
            <div class="flex justify-between gap-4 text-sm">
              <span class="text-secondary-text shrink-0">Bank</span>
              <span class="text-primary-text text-right text-sm leading-relaxed">
                {{ activeTransfer?.payment_request?.bank?.bank }}<br />
                {{ activeTransfer?.payment_request?.bank?.account_name }}<br />
                <span class="text-secondary-text text-xs font-mono">
                  {{ activeTransfer?.payment_request?.bank?.account_number }}
                </span>
                <template v-if="activeTransfer?.payment_request?.bank?.bank_branch_code">
                  <br />
                  <span class="text-secondary-text text-xs">
                    IFSC: {{ activeTransfer.payment_request.bank.bank_branch_code }}
                  </span>
                </template>
              </span>
            </div>
          </div>

          <!-- UTR / Remittance -->
          <div class="flex flex-col gap-1.5">
            <label class="text-[13px] font-semibold text-primary-text">
              UTR / Remittance
              <span class="text-primary-red">*</span>
            </label>
            <p class="text-[11px] text-secondary-text -mt-0.5 mb-0.5">
              Enter bank UTR number or remittance link
            </p>
            <input
              v-model="processForm.proof_url"
              type="text"
              placeholder="e.g. 123456789012 or https://bank.example/utr/..."
              class="input-field px-4 py-2.5 rounded-xl"
              autocomplete="off"
            />
            <p
              v-if="activeTransfer?.proof_url && !processForm.proof_url"
              class="text-xs text-secondary-text"
            >
              Previously saved UTR was cleared from this form.
            </p>
          </div>

          <!-- Proof attachment -->
          <div class="flex flex-col gap-1.5">
            <label class="text-[13px] font-semibold text-primary-text">
              Proof attachment
              <span class="text-primary-red">*</span>
            </label>
            <p class="text-[11px] text-secondary-text -mt-0.5 mb-0.5">
              PNG, JPG, GIF, WEBP, or PDF · max 10 MB
            </p>

            <div
              role="button"
              tabindex="0"
              class="relative flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 transition-colors cursor-pointer"
              :class="
                isDragging
                  ? 'border-primary bg-primary/10'
                  : 'border-primary-border bg-background hover:border-primary/60 hover:bg-primary/5'
              "
              @click="openFilePicker"
              @keydown.enter.prevent="openFilePicker"
              @keydown.space.prevent="openFilePicker"
              @dragenter.prevent="isDragging = true"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="onDragLeave"
              @drop.prevent="onDrop"
            >
              <input
                ref="fileInputRef"
                type="file"
                class="hidden"
                :accept="PROOF_ACCEPT"
                @change="handleFileChange"
                @click.stop
              />
              <span class="material-symbols-outlined text-secondary-text text-[28px] pointer-events-none">
                upload_file
              </span>
              <span class="text-sm text-secondary-text text-center pointer-events-none">
                <span class="font-semibold text-primary-text">Choose file</span>
                or drag & drop here
              </span>
            </div>

            <div
              v-if="processForm.proof"
              class="flex items-center justify-between gap-2 rounded-xl border border-primary-border bg-background px-3 py-2"
            >
              <div class="min-w-0 flex items-center gap-2">
                <span class="material-symbols-outlined text-primary-green text-[18px]">
                  draft
                </span>
                <div class="min-w-0">
                  <p class="text-xs font-medium text-primary-text truncate">
                    {{ processForm.proof.name }}
                  </p>
                  <p class="text-[11px] text-secondary-text">
                    {{ formatFileSize(processForm.proof.size) }}
                  </p>
                </div>
              </div>
              <button
                type="button"
                class="text-xs font-semibold text-primary-red hover:underline cursor-pointer shrink-0"
                @click="clearProofFile"
              >
                Remove
              </button>
            </div>

            <p
              v-else-if="activeTransfer?.proof_attachment_url"
              class="text-xs text-primary-green"
            >
              Saved attachment:
              <button
                type="button"
                class="underline font-medium cursor-pointer text-primary-green"
                @click="openProofPreview(activeTransfer.proof_attachment_url, activeTransfer.proof_attachment)"
              >
                View document
              </button>
              <span class="text-secondary-text"> · upload a new file to replace</span>
            </p>
          </div>

          <!-- Note -->
          <div class="flex flex-col gap-1.5">
            <label class="text-[13px] font-semibold text-primary-text">
              Note
              <span class="text-secondary-text font-normal">(Optional)</span>
            </label>
            <textarea
              v-model="processForm.vendor_note"
              rows="3"
              placeholder="e.g. Sent via IMPS"
              class="input-field px-4 py-2.5 rounded-xl resize-none"
            />
          </div>
        </div>

        <div
          class="px-4 sm:px-6 py-4 border-t border-primary-border bg-background/80 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3"
        >
          <button
            type="button"
            @click="saveDraft"
            :disabled="isSubmitting || !canSaveDraft"
            class="px-4 py-2 rounded-xl border border-primary-border bg-card-background text-primary-text text-sm font-semibold hover:bg-background transition-colors disabled:opacity-50 cursor-pointer"
          >
            {{ isSubmitting ? "Saving..." : "Save Draft" }}
          </button>
          <button
            type="button"
            @click="submitTransfer"
            :disabled="isSubmitting || !isFormValid"
            class="px-4 py-2 rounded-xl bg-primary text-btn-text-primary text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
          >
            {{ isSubmitting ? "Submitting..." : "Complete Transfer" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <div
      v-if="showRejectModal"
      class="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[2px] p-4"
      style="background-color: var(--app-overlay)"
      @click.self="showRejectModal = false"
    >
      <div
        class="bg-card-background border border-primary-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
      >
        <div class="px-4 sm:px-6 py-4 border-b border-primary-border flex justify-between items-center">
          <div>
            <h3 class="text-lg font-semibold text-primary-red">Reject Transfer</h3>
            <p class="text-xs text-secondary-text mt-0.5">
              Funds will be reversed to the user
            </p>
          </div>
          <button
            type="button"
            @click="showRejectModal = false"
            class="text-secondary-text hover:text-primary-text transition-colors cursor-pointer p-1 rounded-lg hover:bg-background"
            aria-label="Close"
          >
            <span class="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div class="p-4 sm:p-6 flex flex-col gap-4">
          <p class="text-sm text-secondary-text leading-relaxed">
            Reject transfer for
            <span class="font-semibold text-primary-text">
              {{ activeTransfer?.payment_request?.user_name }}
            </span>?
            This cannot be undone from this screen.
          </p>

          <div class="flex flex-col gap-1.5">
            <label class="text-[13px] font-semibold text-primary-text">
              Rejection Reason
            </label>
            <textarea
              v-model="rejectForm.rejection_reason"
              rows="3"
              placeholder="Reason for rejection..."
              class="input-field px-4 py-2.5 rounded-xl resize-none"
            />
          </div>
        </div>

        <div
          class="px-4 sm:px-6 py-4 border-t border-primary-border bg-background/80 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3"
        >
          <button
            type="button"
            @click="showRejectModal = false"
            class="px-4 py-2 rounded-xl border border-primary-border bg-card-background text-primary-text text-sm font-semibold hover:bg-background transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="rejectTransfer"
            :disabled="isSubmitting || !rejectForm.rejection_reason"
            class="px-4 py-2 rounded-xl bg-primary-red text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm cursor-pointer"
          >
            {{ isSubmitting ? "Rejecting..." : "Reject" }}
          </button>
        </div>
      </div>
    </div>
    <!-- Proof preview modal -->
    <div
      v-if="showProofPreview"
      class="fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-[2px] p-4"
      style="background-color: var(--app-overlay)"
      @click.self="closeProofPreview"
    >
      <div
        class="bg-card-background border border-primary-border rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div class="px-4 sm:px-6 py-4 border-b border-primary-border flex justify-between items-center gap-3">
          <div class="min-w-0">
            <h3 class="text-lg font-semibold text-primary-text">
              Proof attachment
            </h3>
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
            <span class="material-symbols-outlined text-[22px]">close</span>
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

        <div
          class="px-4 sm:px-6 py-4 border-t border-primary-border bg-background/80 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3"
        >
          <button
            type="button"
            @click="closeProofPreview"
            class="px-4 py-2 rounded-xl border border-primary-border bg-card-background text-primary-text text-sm font-semibold hover:bg-background transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            @click="downloadProofFile"
            class="px-4 py-2 rounded-xl bg-primary text-btn-text-primary text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm cursor-pointer inline-flex items-center justify-center gap-1.5"
          >
            <span class="material-symbols-outlined text-[18px]">download</span>
            Download
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import DataTable from "@/components/common/DataTable/DataTable.vue";
import BaseSelect from "@/components/common/BaseSelect.vue";
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

const filters = reactive({
  status: "assigned",
});

const pagination = reactive({
  page: 1,
  per_page: 20,
  total: 0,
});

const columns = [
  { key: "id", label: "ID", width: 70 },
  { key: "created_at", label: "Date", width: 150 },
  { key: "user", label: "User", width: 200 },
  { key: "amount", label: "Amount", width: 150 },
  { key: "type", label: "Type", width: 140 },
  { key: "bank", label: "Bank", width: 220 },
  { key: "reference", label: "Reference", width: 180 },
  { key: "payment_status", label: "Payment", width: 120 },
  { key: "proof", label: "Proof", width: 180, sticky: "right" },
  { key: "status", label: "Status", width: 110, sticky: "right" },
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
  try {
    const res = await apiRequest("get", urls.vendorTransfers.list, {
      params: {
        status: filters.status,
        page: pagination.page,
        per_page: pagination.per_page,
      },
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
    snackbar.show("Failed to load transfers", "error");
  } finally {
    loading.value = false;
  }
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
const activeTransfer = ref(null);

const processForm = reactive({
  proof_url: "",
  vendor_note: "",
  proof: null,
});

const rejectForm = reactive({
  rejection_reason: "",
});

const isFormValid = computed(() => {
  const hasUtr = !!processForm.proof_url?.trim();
  const hasFile =
    !!processForm.proof || !!activeTransfer.value?.proof_attachment_url;
  return hasUtr && hasFile;
});

const canSaveDraft = computed(() => {
  return (
    !!processForm.proof_url?.trim() ||
    !!processForm.vendor_note?.trim() ||
    !!processForm.proof
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

const setProofFile = (file) => {
  if (!validateProofFile(file)) return;
  processForm.proof = file;
};

const clearProofFile = () => {
  processForm.proof = null;
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
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
  activeTransfer.value = item;
  processForm.proof_url = item.proof_url || "";
  processForm.vendor_note = item.vendor_note || "";
  processForm.proof = null;
  isDragging.value = false;
  showProcessModal.value = true;
};

const closeProcessModal = () => {
  showProcessModal.value = false;
  isDragging.value = false;
};

const openRejectModal = (item) => {
  activeTransfer.value = item;
  rejectForm.rejection_reason = "";
  showRejectModal.value = true;
};

const saveDraft = async () => {
  if (!activeTransfer.value || !canSaveDraft.value) return;
  isSubmitting.value = true;

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
      data.append("proof", processForm.proof);
    } else {
      data = {};
      if (processForm.proof_url?.trim()) {
        data.proof_url = processForm.proof_url.trim();
      }
      if (processForm.vendor_note != null) {
        data.vendor_note = processForm.vendor_note;
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
      snackbar.show(res.message || "Draft saved", "success");
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
  if (!activeTransfer.value || !isFormValid.value) return;
  isSubmitting.value = true;

  try {
    const formData = new FormData();
    formData.append("proof_url", processForm.proof_url.trim());
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
        res.message || "Transfer submitted and withdrawal completed",
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
  if (!activeTransfer.value || !rejectForm.rejection_reason) return;
  isSubmitting.value = true;

  try {
    const res = await apiRequest("post", urls.vendorTransfers.reject, {
      look_up_key: `${activeTransfer.value.id}/reject`,
      data: {
        rejection_reason: rejectForm.rejection_reason,
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
