<template>
  <div class="flex flex-col h-full gap-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-white">Vendor Queue</h1>
      <div class="flex gap-4">
        <!-- Status Filter -->
        <div class="w-48">
          <BaseSelect
            v-model="filters.status"
            :options="statusOptions"
            placeholder="Select Status"
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
    >
      <!-- Amount Column -->
      <template #cell-amount="{ row }">
        <div class="font-semibold text-white">
          {{ row.payment_request?.paid_amount }} {{ row.payment_request?.paid_currency }}
        </div>
        <div class="text-xs text-gray-400">
          Req: {{ row.payment_request?.amount }} {{ row.payment_request?.currency }}
        </div>
      </template>

      <!-- Bank Column -->
      <template #cell-bank="{ row }">
        <div class="text-white">{{ row.payment_request?.bank?.bank }}</div>
        <div class="text-xs text-gray-400">
          Acct: {{ row.payment_request?.bank?.account_number }}
        </div>
      </template>

      <!-- Status Column -->
      <template #cell-status="{ row }">
        <span 
          class="px-2 py-1 rounded text-xs font-semibold"
          :class="{
            'bg-yellow-900/50 text-yellow-400': row.status === 'assigned',
            'bg-green-900/50 text-green-400': row.status === 'completed',
            'bg-red-900/50 text-red-400': row.status === 'cancelled',
          }"
        >
          {{ row.status.toUpperCase() }}
        </span>
      </template>

      <!-- Actions Column -->
      <template #actions="{ row }">
        <div class="flex justify-end gap-2" v-if="row.status === 'assigned'">
          <button 
            @click="openProcessModal(row)"
            class="px-3 py-1 bg-[linear-gradient(180deg,#E0CA3C_0%,#FFE74D_100%)] text-black rounded font-medium hover:opacity-90 transition-opacity text-sm"
          >
            Process
          </button>
          <button 
            @click="openRejectModal(row)"
            class="px-3 py-1 bg-red-600/20 text-red-500 rounded font-medium hover:bg-red-600/30 transition-colors text-sm"
          >
            Reject
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Pagination -->
    <div class="flex justify-between items-center mt-auto p-4 bg-gray-900 rounded-lg border border-gray-800" v-if="pagination.total > 0">
      <div class="text-sm text-gray-400">
        Showing {{ ((pagination.page - 1) * pagination.per_page) + 1 }} to {{ Math.min(pagination.page * pagination.per_page, pagination.total) }} of {{ pagination.total }} entries
      </div>
      <div class="flex gap-2">
        <button 
          :disabled="pagination.page === 1"
          @click="changePage(pagination.page - 1)"
          class="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50"
        >
          Previous
        </button>
        <button 
          :disabled="pagination.page * pagination.per_page >= pagination.total"
          @click="changePage(pagination.page + 1)"
          class="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Process Modal -->
    <div v-if="showProcessModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="bg-gray-900 border border-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div class="p-6 border-b border-gray-800 flex justify-between items-center">
          <h3 class="text-xl font-bold text-white">Process Vendor Transfer</h3>
          <button @click="showProcessModal = false" class="text-gray-400 hover:text-white">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div class="p-6 flex flex-col gap-4 overflow-y-auto">
          <!-- User / Transfer Info -->
          <div class="bg-gray-800/50 p-4 rounded-lg flex flex-col gap-2 border border-gray-700">
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">User:</span>
              <span class="text-white font-medium">{{ activeTransfer?.payment_request?.user_name }} ({{ activeTransfer?.payment_request?.user_email }})</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">Amount to pay:</span>
              <span class="text-yellow-400 font-bold text-lg">{{ activeTransfer?.payment_request?.paid_amount }} {{ activeTransfer?.payment_request?.paid_currency }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">Bank:</span>
              <span class="text-white text-right">
                {{ activeTransfer?.payment_request?.bank?.bank }}<br/>
                Acct: {{ activeTransfer?.payment_request?.bank?.account_number }}<br/>
                Name: {{ activeTransfer?.payment_request?.bank?.account_name }}
              </span>
            </div>
          </div>

          <!-- Form Fields -->
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-300">Proof URL (UTR / Link) <span class="text-red-500">*</span></label>
            <input 
              v-model="processForm.proof_url" 
              type="url" 
              placeholder="https://..."
              class="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-400 outline-none"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-300">Proof File <span class="text-red-500">*</span></label>
            <input 
              type="file"
              @change="handleFileChange"
              class="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-800 file:text-yellow-400 hover:file:bg-gray-700"
            />
            <div v-if="activeTransfer?.proof_attachment_url" class="text-xs text-green-400 mt-1">
              Currently saved: <a :href="activeTransfer.proof_attachment_url" target="_blank" class="underline">View Document</a>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-300">Note (Optional)</label>
            <textarea 
              v-model="processForm.vendor_note" 
              rows="3"
              placeholder="Any details..."
              class="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-400 outline-none resize-none"
            ></textarea>
          </div>
        </div>

        <div class="p-6 border-t border-gray-800 bg-gray-900/50 flex justify-end gap-3">
          <button 
            @click="saveDraft" 
            :disabled="isSubmitting"
            class="px-4 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Save Draft (PATCH)
          </button>
          <button 
            @click="submitTransfer" 
            :disabled="isSubmitting || !isFormValid"
            class="px-4 py-2 bg-[linear-gradient(180deg,#E0CA3C_0%,#FFE74D_100%)] text-black rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
          >
            {{ isSubmitting ? 'Submitting...' : 'Complete Transfer' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <div v-if="showRejectModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="bg-gray-900 border border-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div class="p-6 border-b border-gray-800 flex justify-between items-center">
          <h3 class="text-xl font-bold text-red-500">Reject Transfer</h3>
          <button @click="showRejectModal = false" class="text-gray-400 hover:text-white">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div class="p-6 flex flex-col gap-4">
          <p class="text-gray-300 text-sm">
            Are you sure you want to reject this transfer for 
            <span class="font-bold text-white">{{ activeTransfer?.payment_request?.user_name }}</span>?
            This will reverse the funds back to the user.
          </p>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-300">Rejection Reason</label>
            <textarea 
              v-model="rejectForm.rejection_reason" 
              rows="3"
              placeholder="Reason for rejection..."
              class="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none resize-none"
            ></textarea>
          </div>
        </div>

        <div class="p-6 border-t border-gray-800 bg-gray-900/50 flex justify-end gap-3">
          <button 
            @click="showRejectModal = false" 
            class="px-4 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button 
            @click="rejectTransfer" 
            :disabled="isSubmitting || !rejectForm.rejection_reason"
            class="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-500 transition-colors disabled:opacity-50 shadow-md"
          >
            {{ isSubmitting ? 'Rejecting...' : 'Reject' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import apiRequest from '@/api/request';
import urls from '@/api/urls';
import DataTable from '@/components/common/DataTable/DataTable.vue';
import BaseSelect from '@/components/common/BaseSelect.vue';

const transfers = ref([]);
const loading = ref(false);
const isSubmitting = ref(false);

const statusOptions = [
  { label: 'Assigned', value: 'assigned' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const filters = reactive({
  status: 'assigned',
});

const pagination = reactive({
  page: 1,
  per_page: 20,
  total: 0,
});

const columns = [
  { key: 'id', title: 'ID', width: '80px' },
  { key: 'created_at', title: 'Date', width: '160px', format: (val) => new Date(val).toLocaleString() },
  { key: 'user', title: 'User', width: '180px', format: (_, row) => row.payment_request?.user_name || '-' },
  { key: 'amount', title: 'Amount', width: '160px' },
  { key: 'bank', title: 'Bank Info', width: '220px' },
  { key: 'status', title: 'Status', width: '120px' },
];

const fetchTransfers = async () => {
  loading.value = true;
  try {
    const res = await apiRequest('get', urls.vendorTransfers.list, {
      params: {
        status: filters.status,
        page: pagination.page,
        per_page: pagination.per_page,
      }
    });
    if (res.status === 'success') {
      transfers.value = res.data || [];
      if (res.pagination) {
        pagination.page = res.pagination.page;
        pagination.per_page = res.pagination.per_page;
        pagination.total = res.pagination.total;
      }
    }
  } catch (error) {
    console.error('Failed to fetch transfers', error);
  } finally {
    loading.value = false;
  }
};

const changePage = (page) => {
  pagination.page = page;
  fetchTransfers();
};

// Modals State
const showProcessModal = ref(false);
const showRejectModal = ref(false);
const activeTransfer = ref(null);

const processForm = reactive({
  proof_url: '',
  vendor_note: '',
  proof: null,
});

const rejectForm = reactive({
  rejection_reason: '',
});

const isFormValid = computed(() => {
  const hasUrl = !!processForm.proof_url;
  const hasFile = !!processForm.proof || !!activeTransfer.value?.proof_attachment_url;
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
  processForm.proof_url = item.proof_url || '';
  processForm.vendor_note = item.vendor_note || '';
  processForm.proof = null;
  showProcessModal.value = true;
};

const openRejectModal = (item) => {
  activeTransfer.value = item;
  rejectForm.rejection_reason = '';
  showRejectModal.value = true;
};

const saveDraft = async () => {
  if (!activeTransfer.value) return;
  isSubmitting.value = true;
  
  try {
    const formData = new FormData();
    if (processForm.proof_url) formData.append('proof_url', processForm.proof_url);
    if (processForm.vendor_note) formData.append('vendor_note', processForm.vendor_note);
    if (processForm.proof) formData.append('proof', processForm.proof);
    
    // We can also just send JSON if no file, but let's use multipart if file exists
    let data = formData;
    let headers = { 'Content-Type': 'multipart/form-data' };
    
    if (!processForm.proof) {
      data = {
        proof_url: processForm.proof_url,
        vendor_note: processForm.vendor_note,
      };
      headers = { 'Content-Type': 'application/json' };
    }

    const res = await apiRequest('patch', urls.vendorTransfers.update, {
      look_up_key: activeTransfer.value.id,
      data,
      headers
    });
    
    if (res.status === 'success') {
      fetchTransfers(); // Refresh
      showProcessModal.value = false;
    }
  } catch (error) {
    console.error('Draft save failed', error);
  } finally {
    isSubmitting.value = false;
  }
};

const submitTransfer = async () => {
  if (!activeTransfer.value || !isFormValid.value) return;
  isSubmitting.value = true;
  
  try {
    const formData = new FormData();
    formData.append('proof_url', processForm.proof_url);
    if (processForm.vendor_note) formData.append('vendor_note', processForm.vendor_note);
    if (processForm.proof) formData.append('proof', processForm.proof);

    const res = await apiRequest('post', urls.vendorTransfers.submit, {
      look_up_key: `${activeTransfer.value.id}/submit`,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (res.status === 'success') {
      fetchTransfers(); // Refresh
      showProcessModal.value = false;
    }
  } catch (error) {
    console.error('Submit failed', error);
  } finally {
    isSubmitting.value = false;
  }
};

const rejectTransfer = async () => {
  if (!activeTransfer.value || !rejectForm.rejection_reason) return;
  isSubmitting.value = true;
  
  try {
    const res = await apiRequest('post', urls.vendorTransfers.reject, {
      look_up_key: `${activeTransfer.value.id}/reject`,
      data: {
        rejection_reason: rejectForm.rejection_reason
      }
    });
    
    if (res.status === 'success') {
      fetchTransfers(); // Refresh
      showRejectModal.value = false;
    }
  } catch (error) {
    console.error('Reject failed', error);
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  fetchTransfers();
});
</script>
