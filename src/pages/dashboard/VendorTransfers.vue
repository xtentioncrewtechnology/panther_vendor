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
          Review assigned payouts, attach proof, and complete or reject transfers.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <div
          v-if="pagination.total > 0"
          class="hidden sm:flex items-center gap-2 rounded-xl border border-primary-border bg-card-background px-3 py-2 text-xs text-secondary-text"
        >
          <span class="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
          {{ pagination.total }}
          {{ pagination.total === 1 ? "record" : "records" }}
        </div>
        <div class="w-44">
          <BaseSelect
            v-model="filters.status"
            :options="statusOptions"
            placeholder="Select Status"
            variant="surface"
            py="2.5"
            @update:modelValue="fetchTransfers"
          />
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <DataTable
      :data="transfers"
      :columns="columns"
      :loading="loading"
      row-key="id"
      :has-actions="true"
      empty-title="No Records Found"
      empty-text="There are no transfers for this status."
    >
      <!-- Amount Column -->
      <template #cell-amount="{ row }">
        <div class="font-semibold text-primary-text tabular-nums">
          {{ row.payment_request?.paid_amount }}
          {{ row.payment_request?.paid_currency }}
        </div>
        <div class="text-xs text-secondary-text mt-0.5 tabular-nums">
          Req: {{ row.payment_request?.amount }}
          {{ row.payment_request?.currency }}
        </div>
      </template>

      <!-- Bank Column -->
      <template #cell-bank="{ row }">
        <div class="font-medium text-primary-text">
          {{ row.payment_request?.bank?.bank }}
        </div>
        <div class="text-xs text-secondary-text mt-0.5 font-mono">
          {{ row.payment_request?.bank?.account_number }}
        </div>
      </template>

      <!-- Status Column -->
      <template #cell-status="{ row }">
        <span
          class="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide uppercase border"
          :class="statusBadgeClass(row.status)"
        >
          {{ row.status }}
        </span>
      </template>

      <!-- Actions Column -->
      <template #actions="{ row }">
        <div class="flex justify-end gap-2" v-if="row.status === 'assigned'">
          <button
            type="button"
            @click="openProcessModal(row)"
            class="px-3 py-1.5 rounded-lg bg-primary text-btn-text-primary text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm cursor-pointer"
          >
            Process
          </button>
          <button
            type="button"
            @click="openRejectModal(row)"
            class="px-3 py-1.5 rounded-lg border border-primary-red/30 bg-primary-red/5 text-primary-red text-sm font-semibold hover:bg-primary-red/10 transition-colors cursor-pointer"
          >
            Reject
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Pagination -->
    <div
      v-if="pagination.total > 0"
      class="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mt-auto px-4 py-3 rounded-xl border border-primary-border bg-card-background"
    >
      <div class="text-sm text-secondary-text">
        Showing
        <span class="font-medium text-primary-text">
          {{ (pagination.page - 1) * pagination.per_page + 1 }}
        </span>
        to
        <span class="font-medium text-primary-text">
          {{ Math.min(pagination.page * pagination.per_page, pagination.total) }}
        </span>
        of
        <span class="font-medium text-primary-text">{{ pagination.total }}</span>
        entries
      </div>
      <div class="flex gap-2">
        <button
          type="button"
          :disabled="pagination.page === 1"
          @click="changePage(pagination.page - 1)"
          class="px-3.5 py-1.5 rounded-lg border border-primary-border bg-background text-primary-text text-sm font-medium hover:bg-card-background disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Previous
        </button>
        <button
          type="button"
          :disabled="pagination.page * pagination.per_page >= pagination.total"
          @click="changePage(pagination.page + 1)"
          class="px-3.5 py-1.5 rounded-lg border border-primary-border bg-background text-primary-text text-sm font-medium hover:bg-card-background disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Process Modal -->
    <div
      v-if="showProcessModal"
      class="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[2px] p-4"
      style="background-color: var(--app-overlay)"
      @click.self="showProcessModal = false"
    >
      <div
        class="bg-card-background border border-primary-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div class="px-6 py-4 border-b border-primary-border flex justify-between items-center">
          <div>
            <h3 class="text-lg font-semibold text-primary-text">
              Process Vendor Transfer
            </h3>
            <p class="text-xs text-secondary-text mt-0.5">
              Attach proof and complete the payout
            </p>
          </div>
          <button
            type="button"
            @click="showProcessModal = false"
            class="text-secondary-text hover:text-primary-text transition-colors cursor-pointer p-1 rounded-lg hover:bg-background"
            aria-label="Close"
          >
            <span class="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div class="p-6 flex flex-col gap-4 overflow-y-auto">
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
                {{ activeTransfer?.payment_request?.paid_amount }}
                {{ activeTransfer?.payment_request?.paid_currency }}
              </span>
            </div>
            <div class="h-px bg-primary-border" />
            <div class="flex justify-between gap-4 text-sm">
              <span class="text-secondary-text shrink-0">Bank</span>
              <span class="text-primary-text text-right text-sm leading-relaxed">
                {{ activeTransfer?.payment_request?.bank?.bank }}<br />
                <span class="text-secondary-text text-xs font-mono">
                  {{ activeTransfer?.payment_request?.bank?.account_number }}
                </span><br />
                {{ activeTransfer?.payment_request?.bank?.account_name }}
              </span>
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-[13px] font-semibold text-primary-text">
              Proof URL (UTR / Link)
              <span class="text-primary-red">*</span>
            </label>
            <input
              v-model="processForm.proof_url"
              type="url"
              placeholder="https://..."
              class="input-field px-4 py-2.5 rounded-xl"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-[13px] font-semibold text-primary-text">
              Proof File
              <span class="text-primary-red">*</span>
            </label>
            <label
              class="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary-border bg-background px-4 py-5 cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-colors"
            >
              <span class="material-symbols-outlined text-secondary-text text-[28px]">
                upload_file
              </span>
              <span class="text-sm text-secondary-text">
                <span class="font-semibold text-primary-text">Choose file</span>
                or drag & drop
              </span>
              <input type="file" class="hidden" @change="handleFileChange" />
            </label>
            <p v-if="processForm.proof" class="text-xs text-primary-text font-medium">
              Selected: {{ processForm.proof.name }}
            </p>
            <p
              v-else-if="activeTransfer?.proof_attachment_url"
              class="text-xs text-primary-green"
            >
              Currently saved:
              <a
                :href="activeTransfer.proof_attachment_url"
                target="_blank"
                class="underline font-medium"
              >
                View Document
              </a>
            </p>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-[13px] font-semibold text-primary-text">
              Note
              <span class="text-secondary-text font-normal">(Optional)</span>
            </label>
            <textarea
              v-model="processForm.vendor_note"
              rows="3"
              placeholder="Any details..."
              class="input-field px-4 py-2.5 rounded-xl resize-none"
            />
          </div>
        </div>

        <div
          class="px-6 py-4 border-t border-primary-border bg-background/80 flex justify-end gap-3"
        >
          <button
            type="button"
            @click="saveDraft"
            :disabled="isSubmitting"
            class="px-4 py-2 rounded-xl border border-primary-border bg-card-background text-primary-text text-sm font-semibold hover:bg-background transition-colors disabled:opacity-50 cursor-pointer"
          >
            Save Draft
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
        <div class="px-6 py-4 border-b border-primary-border flex justify-between items-center">
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

        <div class="p-6 flex flex-col gap-4">
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
          class="px-6 py-4 border-t border-primary-border bg-background/80 flex justify-end gap-3"
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import DataTable from "@/components/common/DataTable/DataTable.vue";
import BaseSelect from "@/components/common/BaseSelect.vue";

const transfers = ref([]);
const loading = ref(false);
const isSubmitting = ref(false);

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
  { key: "id", title: "ID", width: "80px" },
  {
    key: "created_at",
    title: "Date",
    width: "160px",
    format: (val) => new Date(val).toLocaleString(),
  },
  {
    key: "user",
    title: "User",
    width: "180px",
    format: (_, row) => row.payment_request?.user_name || "-",
  },
  { key: "amount", title: "Amount", width: "160px" },
  { key: "bank", title: "Bank Info", width: "220px" },
  { key: "status", title: "Status", width: "120px" },
];

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
  } finally {
    loading.value = false;
  }
};

const changePage = (page) => {
  pagination.page = page;
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
  const hasUrl = !!processForm.proof_url;
  const hasFile =
    !!processForm.proof || !!activeTransfer.value?.proof_attachment_url;
  return hasUrl && hasFile;
});

const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    processForm.proof = file;
  }
};

const openProcessModal = (item) => {
  activeTransfer.value = item;
  processForm.proof_url = item.proof_url || "";
  processForm.vendor_note = item.vendor_note || "";
  processForm.proof = null;
  showProcessModal.value = true;
};

const openRejectModal = (item) => {
  activeTransfer.value = item;
  rejectForm.rejection_reason = "";
  showRejectModal.value = true;
};

const saveDraft = async () => {
  if (!activeTransfer.value) return;
  isSubmitting.value = true;

  try {
    const formData = new FormData();
    if (processForm.proof_url) formData.append("proof_url", processForm.proof_url);
    if (processForm.vendor_note)
      formData.append("vendor_note", processForm.vendor_note);
    if (processForm.proof) formData.append("proof", processForm.proof);

    let data = formData;
    let headers = { "Content-Type": "multipart/form-data" };

    if (!processForm.proof) {
      data = {
        proof_url: processForm.proof_url,
        vendor_note: processForm.vendor_note,
      };
      headers = { "Content-Type": "application/json" };
    }

    const res = await apiRequest("patch", urls.vendorTransfers.update, {
      look_up_key: activeTransfer.value.id,
      data,
      headers,
    });

    if (res.status === "success") {
      fetchTransfers();
      showProcessModal.value = false;
    }
  } catch (error) {
    console.error("Draft save failed", error);
  } finally {
    isSubmitting.value = false;
  }
};

const submitTransfer = async () => {
  if (!activeTransfer.value || !isFormValid.value) return;
  isSubmitting.value = true;

  try {
    const formData = new FormData();
    formData.append("proof_url", processForm.proof_url);
    if (processForm.vendor_note)
      formData.append("vendor_note", processForm.vendor_note);
    if (processForm.proof) formData.append("proof", processForm.proof);

    const res = await apiRequest("post", urls.vendorTransfers.submit, {
      look_up_key: `${activeTransfer.value.id}/submit`,
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (res.status === "success") {
      fetchTransfers();
      showProcessModal.value = false;
    }
  } catch (error) {
    console.error("Submit failed", error);
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
    });

    if (res.status === "success") {
      fetchTransfers();
      showRejectModal.value = false;
    }
  } catch (error) {
    console.error("Reject failed", error);
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  fetchTransfers();
});
</script>
