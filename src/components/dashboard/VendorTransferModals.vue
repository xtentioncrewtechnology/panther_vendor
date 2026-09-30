<template>
    <!-- Process Modal Drawer -->
    <Transition name="backdrop">
      <div
        v-if="type === 'process'"
        class="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs cursor-pointer"
        @click="closeModal"
      />
    </Transition>

    <Transition name="drawer">
      <div
        v-if="type === 'process'"
        class="fixed right-0 top-0 bottom-0 z-[101] w-full max-w-xl bg-card-background border-l border-primary-border flex flex-col shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <!-- Sticky Header -->
        <div class="px-6 py-4.5 border-b border-primary-border flex items-center justify-between shrink-0 bg-card-background/90 backdrop-blur-md">
          <div>
            <h3 class="text-sm font-bold text-primary-text">
              {{ isDeposit(activeTransfer) ? "Confirm deposit" : "Complete payment" }}
            </h3>
            <p class="text-[11px] text-secondary-text mt-0.5">
              {{ processModalSubtitle }}
            </p>
          </div>
          <button
            type="button"
            class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background text-secondary-text hover:text-primary-text transition cursor-pointer"
            @click="closeModal"
            aria-label="Close"
          >
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div class="p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto flex-1 custom-scrollbar">
          <div class="bg-background p-4 rounded-xl flex flex-col gap-3 border border-primary-border">
            
            <!-- USER -->
            <div class="flex justify-between gap-4 text-xs items-center">
              <span class="text-secondary-text shrink-0">User Name</span>
              <span class="text-primary-text font-medium text-right">
                {{ activeTransfer?.payment_request?.user_name }}
              </span>
            </div>

            <!-- AMOUNT -->
            <div class="flex justify-between gap-4 text-xs items-center">
              <span class="text-secondary-text shrink-0">
                {{ isDeposit(activeTransfer) ? "Expected amount" : "Amount to pay" }}
              </span>
              <span class="text-primary-yellow font-bold text-base tabular-nums">
                {{ formatMoney(activeTransfer?.payment_request?.paid_amount) }}
                {{ activeTransfer?.payment_request?.paid_currency }}
              </span>
            </div>
            
            <div class="h-px bg-primary-border" />

            <!-- UTR & PROOF (Deposit Only) -->
            <template v-if="isDeposit(activeTransfer)">
              <div class="flex justify-between gap-4 text-xs items-center">
                <span class="text-secondary-text shrink-0">User UTR</span>
                <span class="text-primary-text text-right font-mono">
                  {{ activeTransfer?.payment_request?.txid }}
                </span>
              </div>
              <div class="flex justify-between gap-4 text-xs items-center" v-if="activeTransfer?.payment_request?.bank?.deposit_proof_url">
                <span class="text-secondary-text shrink-0">User proof</span>
                <button
                  type="button"
                  class="text-primary-blue text-xs font-medium hover:underline cursor-pointer"
                  @click="emit('open-preview', activeTransfer.payment_request.bank.deposit_proof_url)"
                >
                  View document
                </button>
              </div>
              <div class="h-px bg-primary-border" />
            </template>

            <!-- BANK DETAILS -->
            <div class="flex flex-col gap-3">
              <span class="text-xs font-bold text-primary-text uppercase tracking-wider opacity-80 mt-1">
                {{ isDeposit(activeTransfer) ? "Company Bank Details" : "User Bank Details" }}
              </span>
              
              <!-- Deposit: Company Bank -->
              <template v-if="isDeposit(activeTransfer) && activeTransfer?.payment_request?.bank?.company_bank">
                <div class="flex justify-between gap-4 text-xs items-center">
                  <span class="text-secondary-text shrink-0">Bank Name</span>
                  <span class="text-primary-text text-right font-medium">{{ activeTransfer.payment_request.bank.company_bank.bank_name }}</span>
                </div>
                <div class="flex justify-between gap-4 text-xs items-center">
                  <span class="text-secondary-text shrink-0">Account Name</span>
                  <span class="text-primary-text text-right">{{ activeTransfer.payment_request.bank.company_bank.account_name }}</span>
                </div>
                <div class="flex justify-between gap-4 text-xs items-center">
                  <span class="text-secondary-text shrink-0">Account Number</span>
                  <span class="text-primary-text text-right font-mono">{{ activeTransfer.payment_request.bank.company_bank.account_number }}</span>
                </div>
                <div class="flex justify-between gap-4 text-xs items-center">
                  <span class="text-secondary-text shrink-0">IFSC Code</span>
                  <span class="text-primary-text text-right font-mono">{{ activeTransfer.payment_request.bank.company_bank.ifsc_code }}</span>
                </div>
              </template>

              <!-- Withdrawal: User Bank -->
              <template v-else-if="!isDeposit(activeTransfer)">
                <div class="flex justify-between gap-4 text-xs items-center">
                  <span class="text-secondary-text shrink-0">Bank Name</span>
                  <span class="text-primary-text text-right font-medium">{{ activeTransfer?.payment_request?.bank?.bank }}</span>
                </div>
                <div class="flex justify-between gap-4 text-xs items-center">
                  <span class="text-secondary-text shrink-0">Account Name</span>
                  <span class="text-primary-text text-right">{{ activeTransfer?.payment_request?.bank?.account_name }}</span>
                </div>
                <div class="flex justify-between gap-4 text-xs items-center">
                  <span class="text-secondary-text shrink-0">Account Number</span>
                  <span class="text-primary-text text-right font-mono">{{ activeTransfer?.payment_request?.bank?.account_number }}</span>
                </div>
                <div class="flex justify-between gap-4 text-xs items-center">
                  <span class="text-secondary-text shrink-0">IFSC Code</span>
                  <span class="text-primary-text text-right font-mono">{{ activeTransfer?.payment_request?.bank?.bank_branch_code }}</span>
                </div>
              </template>
            </div>
          </div>

          <!-- Deposit amount (edit on demand) -->
          <div v-if="isDeposit(activeTransfer)" class="flex flex-col gap-1">
            <div class="flex items-center justify-between gap-2">
              <label class="text-xs font-semibold text-primary-text">
                Amount (INR)
                <span class="text-primary-red">*</span>
              </label>
              <button
                v-if="!isEditingAmount"
                type="button"
                class="text-xs font-semibold text-primary-blue hover:underline cursor-pointer"
                @click="startEditAmount"
              >
                Edit amount
              </button>
              <button
                v-else
                type="button"
                class="text-xs font-semibold text-secondary-text hover:text-primary-text hover:underline cursor-pointer"
                @click="cancelEditAmount"
              >
                Cancel edit
              </button>
            </div>
            <p class="text-[11px] text-secondary-text">
              {{
                isEditingAmount
                  ? "Changing the amount requires admin approval before credit"
                  : "Shown as submitted — use Edit amount to change (needs admin approval)"
              }}
            </p>
            <input
              v-if="isEditingAmount"
              ref="amountInputRef"
              v-model="processForm.amount_inr"
              type="number"
              min="0"
              step="0.01"
              class="input-field px-3 py-2 rounded-xl text-sm"
            />
            <div
              v-else
              class="input-field px-3 py-2 rounded-xl text-sm tabular-nums text-primary-text pointer-events-none select-text"
            >
              {{ formatMoney(processForm.amount_inr) }}
            </div>
            <p
              v-if="depositAmountChanged"
              class="text-[11px] text-primary-yellow"
            >
              Amount changed from
              {{ formatMoney(originalDepositAmount) }} INR — saving will send this to admin.
            </p>
          </div>

          <!-- UTR / Remittance -->
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-primary-text">
              UTR / Remittance
              <span class="text-primary-red">*</span>
            </label>
            <p class="text-[11px] text-secondary-text">
              {{
                isDeposit(activeTransfer)
                  ? "Required to confirm — enter bank UTR number or remittance link"
                  : "Required — enter bank UTR number or remittance link"
              }}
            </p>
            <input
              v-model="processForm.proof_url"
              type="text"
              placeholder="e.g. 123456789012 or https://bank.example/utr/..."
              class="input-field px-3 py-2 rounded-xl text-sm"
              autocomplete="off"
            />
            <p
              v-if="activeTransfer?.proof_url && !processForm.proof_url"
              class="text-[11px] text-secondary-text"
            >
              Previously saved UTR was cleared from this form.
            </p>
          </div>

          <!-- Proof attachment -->
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-primary-text">
              Proof attachment
              <span v-if="!isDeposit(activeTransfer)" class="text-primary-red">*</span>
            </label>
            <p class="text-[11px] text-secondary-text">
              {{
                isDeposit(activeTransfer)
                  ? "Optional · PNG, JPG, GIF, WEBP, or PDF · max 10 MB"
                  : "Required · PNG, JPG, GIF, WEBP, or PDF · max 10 MB"
              }}
            </p>

            <div
              role="button"
              tabindex="0"
              class="relative flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-4 py-4 transition-colors cursor-pointer"
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
              <span class="material-symbols-outlined text-secondary-text text-[24px] pointer-events-none">
                upload_file
              </span>
              <span class="text-xs text-secondary-text text-center pointer-events-none">
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
              <div class="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  class="text-xs font-semibold text-primary-blue hover:underline cursor-pointer"
                  @click="viewLocalProofFile"
                >
                  View
                </button>
                <button
                  type="button"
                  class="text-xs font-semibold text-primary-red hover:underline cursor-pointer"
                  @click="clearProofFile"
                >
                  Remove
                </button>
              </div>
            </div>

            <p
              v-else-if="activeTransfer?.proof_attachment_url"
              class="text-xs text-primary-green"
            >
              Saved attachment:
              <button
                type="button"
                class="underline font-medium cursor-pointer text-primary-green"
                @click="emit('open-preview', activeTransfer.proof_attachment_url, activeTransfer.proof_attachment)"
              >
                View document
              </button>
              <span class="text-secondary-text"> · upload a new file to replace</span>
            </p>
          </div>

          <!-- Note -->
          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-primary-text">
              Note
              <span class="text-secondary-text font-normal">(Optional)</span>
            </label>
            <textarea
              v-model="processForm.vendor_note"
              rows="2"
              placeholder="e.g. Sent via IMPS"
              class="input-field px-3 py-2 rounded-xl resize-none text-sm"
            />
          </div>
        </div>

        <div class="px-6 py-4 border-t border-primary-border bg-card-background flex flex-col-reverse sm:flex-row gap-3 shrink-0">
          <button
            type="button"
            class="btn-secondary flex-1 justify-center"
            :disabled="isSubmitting || !canSaveDraft"
            @click="saveDraft"
          >
            {{
              isSubmitting
                ? "Saving..."
                : depositAmountChanged
                  ? "Save amount (needs admin)"
                  : "Save Draft"
            }}
          </button>
          <button
            type="button"
            class="btn-primary flex-1 justify-center"
            :disabled="isSubmitting || !isFormValid || depositAmountChanged"
            :title="submitDisabledReason"
            @click="submitTransfer"
          >
            {{
              isSubmitting
                ? "Submitting..."
                : isDeposit(activeTransfer)
                  ? "Confirm deposit"
                  : "Complete Transfer"
            }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- Reject Drawer -->
    <Transition name="backdrop">
      <div
        v-if="type === 'reject'"
        class="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs cursor-pointer"
        @click="closeModal"
      />
    </Transition>
    <Transition name="drawer">
      <div
        v-if="type === 'reject'"
        class="fixed right-0 top-0 bottom-0 z-[101] w-full max-w-md bg-card-background border-l border-primary-border flex flex-col shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div class="px-6 py-4.5 border-b border-primary-border flex items-center justify-between shrink-0 bg-card-background/90 backdrop-blur-md">
          <div>
            <h3 class="text-sm font-bold text-primary-red">
              {{
                isDeposit(activeTransfer)
                  ? "Reject Deposit"
                  : "Reject Withdrawal"
              }}
            </h3>
            <p class="text-[11px] text-secondary-text mt-0.5">
              {{
                isDeposit(activeTransfer)
                  ? "Deposit will be rejected (no funds were credited yet)"
                  : "Funds will be reversed to the user"
              }}
            </p>
          </div>
          <button
            type="button"
            class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background text-secondary-text hover:text-primary-text transition cursor-pointer"
            @click="closeModal"
            aria-label="Close"
          >
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div class="p-6 flex flex-col gap-4 overflow-y-auto flex-1 custom-scrollbar">
          <p class="text-xs text-secondary-text leading-relaxed">
            Reject this <span class="font-semibold text-primary-text">{{ isDeposit(activeTransfer) ? 'deposit' : 'withdrawal' }}</span> of
            <span class="font-semibold text-primary-yellow tabular-nums">
              {{ formatMoney(activeTransfer?.payment_request?.paid_amount) }} {{ activeTransfer?.payment_request?.paid_currency }}</span>?
            This cannot be undone from this screen.
          </p>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-primary-text">
              Rejection Reason
              <span class="text-primary-red">*</span>
            </label>
            <p class="text-[11px] text-secondary-text">
              Required — explain why this request is being rejected
            </p>
            <textarea
              v-model="rejectForm.rejection_reason"
              rows="3"
              placeholder="Reason for rejection..."
              class="input-field px-3 resize-none"
            />
          </div>
        </div>

        <div class="px-6 py-4 border-t border-primary-border bg-card-background flex flex-col-reverse sm:flex-row gap-3 shrink-0">
          <button
            type="button"
            class="btn-secondary flex-1 justify-center"
            @click="closeModal"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn-danger flex-1 justify-center"
            :disabled="isSubmitting || !rejectForm.rejection_reason?.trim()"
            @click="rejectTransfer"
          >
            {{ isSubmitting ? "Rejecting..." : "Reject" }}
          </button>
        </div>
      </div>
    </Transition>

</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/snackbar/snackbar";

const props = defineProps({
  transfer: { type: Object, default: null },
  type: { type: String, default: "" }, // 'process' or 'reject'
});

const emit = defineEmits(["close", "success", "open-preview"]);
const snackbar = useSnackbarStore();

const activeTransfer = computed(() => props.transfer);

const closeModal = () => {
  emit("close");
  isDragging.value = false;
  isEditingAmount.value = false;
  revokeLocalProofObjectUrl();
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

const isDeposit = (row) =>
  String(row?.payment_request?.type || "").toLowerCase() === "deposit";

const isAwaitingAdmin = (row) =>
  isDeposit(row) &&
  !!row?.payment_request?.vendor_amount_adjusted &&
  String(row?.payment_request?.approval_status || "").toLowerCase() === "pending";

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

const isSubmitting = ref(false);
const isDragging = ref(false);
const fileInputRef = ref(null);

const processForm = reactive({
  proof_url: "",
  vendor_note: "",
  proof: null,
  amount_inr: "",
});

const rejectForm = reactive({
  rejection_reason: "",
});

const processModalSubtitle = computed(() => {
  if (!activeTransfer.value) return "";
  if (!isDeposit(activeTransfer.value)) {
    return "Add UTR and proof attachment to finish this payout";
  }
  if (depositAmountChanged.value) {
    return "Amount changed — save to send this deposit to admin for approval before credit";
  }
  return "Verify user UTR, then credit the account (attachment optional)";
});

const amountBaseline = ref(null);
const isEditingAmount = ref(false);
const amountInputRef = ref(null);

const startEditAmount = async () => {
  isEditingAmount.value = true;
  await nextTick();
  amountInputRef.value?.focus();
};

const cancelEditAmount = () => {
  processForm.amount_inr =
    amountBaseline.value != null ? String(amountBaseline.value) : "";
  isEditingAmount.value = false;
};

const originalDepositAmount = computed(() => {
  if (!activeTransfer.value) return 0;
  return activeTransfer.value.payment_request?.amount || 0;
});

const depositAmountChanged = computed(() => {
  if (!activeTransfer.value || !isDeposit(activeTransfer.value)) return false;
  if (!processForm.amount_inr) return false;
  const current = Number(processForm.amount_inr);
  const original = Number(originalDepositAmount.value);
  if (Number.isNaN(current) || Number.isNaN(original)) return false;
  return Math.abs(current - original) > 0.0001;
});

const isFormValid = computed(() => {
  if (!activeTransfer.value) return false;
  if (depositAmountChanged.value) return false;

  if (isDeposit(activeTransfer.value)) {
    const amount = Number(processForm.amount_inr);
    const hasAmount = Number.isFinite(amount) && amount > 0;
    const hasUtr =
      !!processForm.proof_url?.trim() || !!activeTransfer.value?.proof_url;
    return hasAmount && hasUtr;
  }

  const hasUtr = !!processForm.proof_url?.trim();
  const hasFile =
    !!processForm.proof || !!activeTransfer.value?.proof_attachment_url;
  return hasUtr && hasFile;
});

const submitDisabledReason = computed(() => {
  if (!activeTransfer.value) return "";
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
    return "Enter UTR to confirm";
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
      "error"
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
  emit("open-preview", localProofObjectUrl, processForm.proof.name);
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

// Initialize form when opened
watch(() => props.type, (newType) => {
  if (newType === 'process' && activeTransfer.value) {
    const item = activeTransfer.value;
    processForm.proof_url = item.proof_url || "";
    processForm.vendor_note = item.vendor_note || "";
    clearProofFile();
    const paid = item.payment_request?.paid_amount;
    processForm.amount_inr = paid != null ? String(paid) : "";
    amountBaseline.value = paid != null ? Number(paid) : null;
    isEditingAmount.value = false;
    isDragging.value = false;
  } else if (newType === 'reject' && activeTransfer.value) {
    rejectForm.rejection_reason = "";
  }
});

const apiErrorMessage = (err, fallback) => {
  return (
    err?.message ||
    err?.error ||
    err?.response?.data?.message ||
    fallback
  );
};

const saveDraft = async () => {
  if (!activeTransfer.value || !canSaveDraft.value) return;
  isSubmitting.value = true;
  const wasAmountAdjust = depositAmountChanged.value;

  try {
    let data;
    let headers = {};

    if (processForm.proof) {
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
        "success"
      );
      emit("success");
      closeModal();
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
        "success"
      );
      emit("success");
      closeModal();
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
      emit("success");
      closeModal();
    }
  } catch (error) {
    console.error("Reject failed", error);
    snackbar.show(apiErrorMessage(error, "Reject failed"), "error");
  } finally {
    isSubmitting.value = false;
  }
};
</script>
