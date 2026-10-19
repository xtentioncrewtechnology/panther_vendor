<template>
  <div class="flex flex-col h-full gap-3">
    <!-- Top Navigation Tabs (Transfers Queue vs Wallet Transactions) -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
      <div class="flex items-center gap-1.5 p-1 rounded-xl bg-card-background border border-primary-border shadow-2xs w-full sm:w-auto">
        <router-link
          to="/vendor/transfers"
          class="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-secondary-text hover:text-primary-text hover:bg-background/80 transition-colors"
        >
          <span class="material-symbols-outlined text-[16px]">receipt_long</span>
          <span>Transfers Queue</span>
        </router-link>
        <div
          class="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-btn-text-primary shadow-xs cursor-default"
        >
          <span class="material-symbols-outlined text-[16px]">account_balance_wallet</span>
          <span>Wallet Transactions</span>
          <span
            v-if="pagination.total > 0"
            class="ml-1 px-1.5 py-0.2 rounded-full bg-btn-text-primary/15 text-[10px] font-bold"
          >
            {{ pagination.total }}
          </span>
        </div>
      </div>

      <!-- User ID Badge from Profile API -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="bg-card-background rounded-full p-2 text-secondary-text hover:text-primary-text hover:bg-primary/5 transition-colors flex items-center justify-center shadow-2xs cursor-pointer"
          title="Refresh transactions"
          aria-label="Refresh transactions"
          :disabled="transactionsLoading"
          @click="loadTransactions"
        >
          <span
            class="material-symbols-outlined text-[18px]"
            :class="transactionsLoading ? 'animate-spin' : ''"
          >
            refresh
          </span>
        </button>
      </div>
    </div>

    <!-- Quick Metrics Summary Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
      <!-- Total Transactions -->
      <div class="bg-card-background border border-primary-border/70 rounded-xl p-3 flex flex-col justify-between shadow-2xs">
        <div class="flex items-center justify-between gap-1 mb-1">
          <span class="text-[10px] font-semibold uppercase tracking-wider text-secondary-text">Total Records</span>
          <div class="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <span class="material-symbols-outlined text-[15px]">list_alt</span>
          </div>
        </div>
        <p class="text-lg sm:text-xl font-bold text-primary-text tabular-nums">
          {{ pagination.total }}
        </p>
        <span class="text-[10px] text-secondary-text mt-0.5">All transactions for UID {{ targetUserId || '—' }}</span>
      </div>

      <!-- Credits / Inflow -->
      <div class="bg-card-background border border-primary-border/70 rounded-xl p-3 flex flex-col justify-between shadow-2xs">
        <div class="flex items-center justify-between gap-1 mb-1">
          <span class="text-[10px] font-semibold uppercase tracking-wider text-secondary-text">Inflow / Credits</span>
          <div class="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <span class="material-symbols-outlined text-[15px]">arrow_downward</span>
          </div>
        </div>
        <p class="text-lg sm:text-xl font-bold text-emerald-500 tabular-nums">
          {{ formatMoney(metrics.totalCredit) }}
        </p>
        <span class="text-[10px] text-secondary-text mt-0.5">{{ metrics.creditCount }} credited entries</span>
      </div>

      <!-- Debits / Outflow -->
      <div class="bg-card-background border border-primary-border/70 rounded-xl p-3 flex flex-col justify-between shadow-2xs">
        <div class="flex items-center justify-between gap-1 mb-1">
          <span class="text-[10px] font-semibold uppercase tracking-wider text-secondary-text">Outflow / Debits</span>
          <div class="w-6 h-6 rounded-md bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <span class="material-symbols-outlined text-[15px]">arrow_upward</span>
          </div>
        </div>
        <p class="text-lg sm:text-xl font-bold text-rose-500 tabular-nums">
          {{ formatMoney(metrics.totalDebit) }}
        </p>
        <span class="text-[10px] text-secondary-text mt-0.5">{{ metrics.debitCount }} debited entries</span>
      </div>

      <!-- Net Movement -->
      <div class="bg-card-background border border-primary-border/70 rounded-xl p-3 flex flex-col justify-between shadow-2xs">
        <div class="flex items-center justify-between gap-1 mb-1">
          <span class="text-[10px] font-semibold uppercase tracking-wider text-secondary-text">Current Page Volume</span>
          <div class="w-6 h-6 rounded-md bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <span class="material-symbols-outlined text-[15px]">toll</span>
          </div>
        </div>
        <p class="text-lg sm:text-xl font-bold text-primary-text tabular-nums">
          {{ formatMoney(metrics.pageVolume) }}
        </p>
        <span class="text-[10px] text-secondary-text mt-0.5">{{ transactions.length }} items shown</span>
      </div>
    </div>

    <!-- Filter Bar & Search -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
      <!-- Search Input -->
      <div class="relative w-full sm:w-72">
        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text text-[18px]">
          search
        </span>
        <input
          v-model="filters.search"
          type="text"
          placeholder="Search by ref, ID or remark..."
          class="w-full pl-9 pr-3 py-2 rounded-xl border border-primary-border bg-card-background text-xs text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-primary transition-colors"
          @keyup.enter="applyFilters"
        />
        <button
          v-if="filters.search"
          type="button"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text"
          @click="filters.search = ''; applyFilters()"
        >
          <span class="material-symbols-outlined text-[14px] block">close</span>
        </button>
      </div>

      <!-- Controls: Type, Date, Clear -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
        <div class="w-full sm:w-44">
          <BaseSelect
            v-model="filters.type"
            :options="typeOptions"
            placeholder="All Types"
            variant="surface"
            py="2"
            @update:modelValue="applyFilters"
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
            @update:modelValue="applyFilters"
          />
        </div>

        <button
          v-if="hasActiveFilters"
          type="button"
          class="bg-card-background border border-primary-border rounded-xl px-3 py-2 text-primary-text text-xs hover:bg-primary/5 transition-colors flex items-center justify-center cursor-pointer shrink-0"
          @click="handleClearFilters"
        >
          Clear
        </button>
      </div>
    </div>

    <!-- Desktop Data Table -->
    <div class="hidden lg:block">
      <DataTable
        :data="filteredTransactions"
        :columns="columns"
        :loading="transactionsLoading"
        :pagination="pagination"
        row-key="id"
        empty-title="No transactions found"
        empty-text="There are no wallet transactions for this vendor account."
        @page-change="handlePageChange"
        @per-page-change="handlePerPageChange"
      >
        <template #empty>
          <EmptyState
            :icon="transactionsError ? 'error' : hasActiveFilters ? 'filter_alt_off' : 'account_balance_wallet'"
            :title="emptyStateTitle"
            :description="emptyStateDescription"
          >
            <template #action>
              <div class="flex items-center gap-2">
                <button
                  v-if="hasActiveFilters"
                  type="button"
                  class="btn-secondary"
                  @click="handleClearFilters"
                >
                  Clear filters
                </button>
                <button
                  type="button"
                  class="btn-primary"
                  @click="loadTransactions"
                >
                  Refresh
                </button>
              </div>
            </template>
          </EmptyState>
        </template>

        <!-- Date & Time -->
        <template #cell-created_at="{ row }">
          <div class="text-primary-text whitespace-nowrap text-xs font-medium">
            {{ formatDate(row.created_at || row.timestamp || row.date) }}
          </div>
          <div v-if="row.id" class="text-[11px] text-secondary-text font-mono mt-0.5">
            #{{ row.id }}
          </div>
        </template>

        <!-- Type / Nature Badge -->
        <template #cell-type="{ row }">
          <span
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border capitalize"
            :class="getTypeBadgeClass(row)"
          >
            <span class="material-symbols-outlined text-[13px]">
              {{ isCredit(row) ? 'arrow_downward' : 'arrow_upward' }}
            </span>
            {{ getTransactionType(row) }}
          </span>
        </template>

        <!-- Amount -->
        <template #cell-amount="{ row }">
          <div
            class="font-bold tabular-nums whitespace-nowrap text-sm"
            :class="isCredit(row) ? 'text-emerald-500' : 'text-rose-500'"
          >
            {{ isCredit(row) ? '+' : '-' }}{{ formatMoney(row.amount) }}
            <span class="text-xs font-medium text-secondary-text uppercase">
              {{ row.currency || row.currency_code || 'INR' }}
            </span>
          </div>
          <div v-if="row.payment_method?.name || row.method" class="text-[11px] text-secondary-text mt-0.5">
            {{ row.payment_method?.name || row.method }}
          </div>
        </template>

        <!-- Balance Info -->
        <template #cell-balance="{ row }">
          <div v-if="row.balance_after !== undefined || row.balance !== undefined" class="tabular-nums text-xs">
            <span class="text-primary-text font-semibold">
              {{ formatMoney(row.balance_after ?? row.balance) }}
            </span>
            <span class="text-[10px] text-secondary-text uppercase ml-0.5">
              {{ row.currency || 'INR' }}
            </span>
          </div>
          <div
            v-if="row.balance_before !== undefined"
            class="text-[10px] text-secondary-text tabular-nums mt-0.5"
          >
            Prev: {{ formatMoney(row.balance_before) }}
          </div>
          <span v-if="row.balance_after === undefined && row.balance === undefined && row.balance_before === undefined" class="text-secondary-text text-xs">
            —
          </span>
        </template>

        <!-- Reference / PR ID -->
        <template #cell-reference="{ row }">
          <div class="flex items-center gap-1.5 max-w-44">
            <span class="font-mono text-xs text-primary-text truncate select-all" :title="getReferenceText(row)">
              {{ getReferenceText(row) }}
            </span>
            <button
              v-if="getReferenceText(row) !== '—'"
              type="button"
              class="text-secondary-text hover:text-primary transition-colors p-0.5 cursor-pointer shrink-0"
              title="Copy Reference"
              @click.stop="copyToClipboard(getReferenceText(row), 'Reference')"
            >
              <span class="material-symbols-outlined text-[13px] block">content_copy</span>
            </button>
          </div>
          <div v-if="row.payment_request_id" class="text-[11px] text-secondary-text mt-0.5">
            PR #{{ row.payment_request_id }}
          </div>
        </template>

        <!-- Description / Remarks -->
        <template #cell-description="{ row }">
          <p class="text-xs text-primary-text max-w-64 truncate" :title="row.description || row.remarks || row.reason || '—'">
            {{ row.description || row.remarks || row.reason || '—' }}
          </p>
        </template>

        <!-- Status -->
        <template #cell-status="{ row }">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize border"
            :class="getStatusBadgeClass(row.status)"
          >
            {{ row.status || 'Completed' }}
          </span>
        </template>

        <!-- Actions -->
        <template #cell-actions="{ row }">
          <button
            type="button"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-primary-border bg-card-background text-primary-text hover:bg-primary/5 text-xs font-semibold transition cursor-pointer"
            @click.stop="openDetails(row)"
          >
            <span class="material-symbols-outlined text-[14px]">visibility</span>
            Details
          </button>
        </template>
      </DataTable>
    </div>

    <!-- Mobile Card View -->
    <div class="lg:hidden flex flex-col gap-2.5">
      <div v-if="transactionsLoading" class="flex flex-col gap-2">
        <div
          v-for="i in 4"
          :key="i"
          class="bg-card-background border border-primary-border rounded-xl p-3.5 animate-pulse space-y-2.5"
        >
          <div class="h-3 w-28 bg-primary-border/60 rounded" />
          <div class="h-5 w-40 bg-primary-border/80 rounded" />
          <div class="h-3 w-full bg-primary-border/40 rounded" />
        </div>
      </div>

      <div
        v-else-if="filteredTransactions.length === 0"
        class="bg-card-background border border-primary-border rounded-xl p-6"
      >
        <EmptyState
          :icon="transactionsError ? 'error' : hasActiveFilters ? 'filter_alt_off' : 'account_balance_wallet'"
          :title="emptyStateTitle"
          :description="emptyStateDescription"
        >
          <template #action>
            <button
              v-if="hasActiveFilters"
              type="button"
              class="btn-secondary"
              @click="handleClearFilters"
            >
              Clear filters
            </button>
          </template>
        </EmptyState>
      </div>

      <div
        v-for="row in filteredTransactions"
        :key="row.id || Math.random()"
        class="bg-card-background border border-primary-border rounded-xl p-3.5 flex flex-col gap-2.5 shadow-2xs"
        @click="openDetails(row)"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize"
              :class="getTypeBadgeClass(row)"
            >
              <span class="material-symbols-outlined text-[12px]">
                {{ isCredit(row) ? 'arrow_downward' : 'arrow_upward' }}
              </span>
              {{ getTransactionType(row) }}
            </span>
            <span class="text-xs text-secondary-text font-mono">
              #{{ row.id }}
            </span>
          </div>

          <span
            class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium capitalize border"
            :class="getStatusBadgeClass(row.status)"
          >
            {{ row.status || 'Completed' }}
          </span>
        </div>

        <div class="flex items-baseline justify-between gap-2">
          <div>
            <div
              class="font-bold tabular-nums text-base"
              :class="isCredit(row) ? 'text-emerald-500' : 'text-rose-500'"
            >
              {{ isCredit(row) ? '+' : '-' }}{{ formatMoney(row.amount) }}
              <span class="text-xs font-semibold text-secondary-text uppercase">
                {{ row.currency || row.currency_code || 'INR' }}
              </span>
            </div>
            <p v-if="row.description || row.remarks" class="text-xs text-secondary-text mt-0.5 line-clamp-1">
              {{ row.description || row.remarks }}
            </p>
          </div>

          <div class="text-right">
            <span class="text-[11px] text-secondary-text block">
              {{ formatDate(row.created_at || row.timestamp) }}
            </span>
            <span v-if="row.balance_after !== undefined" class="text-[10px] text-secondary-text tabular-nums">
              Bal: {{ formatMoney(row.balance_after) }}
            </span>
          </div>
        </div>

        <div class="pt-2 border-t border-primary-border/60 flex items-center justify-between text-xs text-secondary-text">
          <div class="flex items-center gap-1 truncate max-w-60">
            <span>Ref:</span>
            <span class="font-mono text-primary-text truncate">{{ getReferenceText(row) }}</span>
          </div>
          <button
            type="button"
            class="text-primary font-semibold text-xs inline-flex items-center gap-0.5"
            @click.stop="openDetails(row)"
          >
            Details &rarr;
          </button>
        </div>
      </div>

      <!-- Mobile Pagination simple controls -->
      <div
        v-if="pagination.total > pagination.per_page"
        class="flex items-center justify-between pt-2 pb-4 text-xs text-secondary-text"
      >
        <button
          type="button"
          class="btn-secondary py-1.5 px-3"
          :disabled="pagination.page <= 1"
          @click="handlePageChange(pagination.page - 1)"
        >
          Previous
        </button>
        <span>
          Page {{ pagination.page }} of {{ Math.ceil(pagination.total / pagination.per_page) }}
        </span>
        <button
          type="button"
          class="btn-secondary py-1.5 px-3"
          :disabled="pagination.page >= Math.ceil(pagination.total / pagination.per_page)"
          @click="handlePageChange(pagination.page + 1)"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Transaction Details Modal -->
    <div
      v-if="selectedTransaction"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      @click.self="selectedTransaction = null"
    >
      <div class="bg-card-background border border-primary-border rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Modal Header -->
        <div class="px-5 py-4 border-b border-primary-border flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span class="material-symbols-outlined text-[18px]">receipt</span>
            </div>
            <div>
              <h3 class="text-sm font-bold text-primary-text">Transaction Details</h3>
              <p class="text-[11px] text-secondary-text font-mono">ID: {{ selectedTransaction.id || '—' }}</p>
            </div>
          </div>
          <button
            type="button"
            class="text-secondary-text hover:text-primary-text p-1 cursor-pointer rounded-lg hover:bg-background transition"
            @click="selectedTransaction = null"
          >
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-5 overflow-y-auto space-y-4 text-xs">
          <!-- Big Amount Card -->
          <div class="p-4 rounded-xl border border-primary-border/80 bg-background/50 flex items-center justify-between">
            <div>
              <span class="text-[10px] uppercase font-semibold text-secondary-text tracking-wider">Amount</span>
              <p
                class="text-2xl font-bold tabular-nums mt-0.5"
                :class="isCredit(selectedTransaction) ? 'text-emerald-500' : 'text-rose-500'"
              >
                {{ isCredit(selectedTransaction) ? '+' : '-' }}{{ formatMoney(selectedTransaction.amount) }}
                <span class="text-xs uppercase font-medium text-secondary-text">
                  {{ selectedTransaction.currency || 'INR' }}
                </span>
              </p>
            </div>
            <span
              class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border capitalize"
              :class="getTypeBadgeClass(selectedTransaction)"
            >
              {{ getTransactionType(selectedTransaction) }}
            </span>
          </div>

          <!-- Key Value Grid -->
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 rounded-lg border border-primary-border/60 bg-card-background">
              <span class="text-[10px] text-secondary-text uppercase font-semibold block">Status</span>
              <span class="font-semibold text-primary-text capitalize mt-0.5 block">
                {{ selectedTransaction.status || 'Completed' }}
              </span>
            </div>

            <div class="p-3 rounded-lg border border-primary-border/60 bg-card-background">
              <span class="text-[10px] text-secondary-text uppercase font-semibold block">Date & Time</span>
              <span class="font-semibold text-primary-text mt-0.5 block">
                {{ formatDate(selectedTransaction.created_at || selectedTransaction.timestamp) }}
              </span>
            </div>

            <div class="p-3 rounded-lg border border-primary-border/60 bg-card-background">
              <span class="text-[10px] text-secondary-text uppercase font-semibold block">Balance Before</span>
              <span class="font-mono font-semibold text-primary-text mt-0.5 block">
                {{ selectedTransaction.balance_before !== undefined ? formatMoney(selectedTransaction.balance_before) : '—' }}
              </span>
            </div>

            <div class="p-3 rounded-lg border border-primary-border/60 bg-card-background">
              <span class="text-[10px] text-secondary-text uppercase font-semibold block">Balance After</span>
              <span class="font-mono font-semibold text-primary-text mt-0.5 block">
                {{ (selectedTransaction.balance_after ?? selectedTransaction.balance) !== undefined ? formatMoney(selectedTransaction.balance_after ?? selectedTransaction.balance) : '—' }}
              </span>
            </div>
          </div>

          <!-- Reference & IDs -->
          <div class="space-y-2 p-3 rounded-xl border border-primary-border/60 bg-card-background">
            <div class="flex items-center justify-between">
              <span class="text-secondary-text">Reference / TXID:</span>
              <div class="flex items-center gap-1">
                <span class="font-mono font-bold text-primary-text select-all">
                  {{ getReferenceText(selectedTransaction) }}
                </span>
                <button
                  v-if="getReferenceText(selectedTransaction) !== '—'"
                  type="button"
                  class="text-secondary-text hover:text-primary cursor-pointer p-0.5"
                  @click="copyToClipboard(getReferenceText(selectedTransaction), 'Reference')"
                >
                  <span class="material-symbols-outlined text-[14px]">content_copy</span>
                </button>
              </div>
            </div>

            <div v-if="selectedTransaction.payment_request_id" class="flex items-center justify-between pt-1 border-t border-primary-border/40">
              <span class="text-secondary-text">Payment Request ID:</span>
              <span class="font-mono font-bold text-primary-text">
                #{{ selectedTransaction.payment_request_id }}
              </span>
            </div>

            <div v-if="selectedTransaction.user_id" class="flex items-center justify-between pt-1 border-t border-primary-border/40">
              <span class="text-secondary-text">User ID:</span>
              <span class="font-mono font-bold text-primary-text">
                {{ selectedTransaction.user_id }}
              </span>
            </div>
          </div>

          <!-- Remarks / Description -->
          <div v-if="selectedTransaction.description || selectedTransaction.remarks || selectedTransaction.reason" class="p-3 rounded-xl border border-primary-border/60 bg-card-background">
            <span class="text-[10px] text-secondary-text uppercase font-semibold block mb-1">Remarks</span>
            <p class="text-xs text-primary-text leading-relaxed">
              {{ selectedTransaction.description || selectedTransaction.remarks || selectedTransaction.reason }}
            </p>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-5 py-3 border-t border-primary-border flex items-center justify-end">
          <button
            type="button"
            class="btn-secondary"
            @click="selectedTransaction = null"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { storeToRefs } from "pinia";
import DataTable from "@/components/common/DataTable/DataTable.vue";
import BaseSelect from "@/components/common/BaseSelect.vue";
import BaseDatePicker from "@/components/common/BaseDatePicker copy.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import { useVendorWalletsStore } from "@/stores/vendor-wallets";
import { useProfileStore } from "@/stores/profile";
import { useSnackbarStore } from "@/stores/snackbar";

const walletsStore = useVendorWalletsStore();
const profileStore = useProfileStore();
const snackbar = useSnackbarStore();

const { transactions, transactionsLoading, transactionsError, pagination, filters } = storeToRefs(walletsStore);

const selectedTransaction = ref(null);
const targetUserId = ref(null);

const typeOptions = [
  { label: "All Types", value: "" },
  { label: "Credit", value: "credit" },
  { label: "Debit", value: "debit" },
  { label: "Deposit", value: "deposit" },
  { label: "Withdrawal", value: "withdrawal" },
  { label: "Adjustment", value: "adjustment" },
];

const columns = [
  { key: "created_at", label: "Date & ID", width: 160 },
  { key: "type", label: "Type", width: 130 },
  { key: "amount", label: "Amount", width: 160 },
  { key: "balance", label: "Balance", width: 150 },
  { key: "reference", label: "Reference", width: 180 },
  { key: "description", label: "Remarks", width: 220 },
  { key: "status", label: "Status", width: 120 },
  { key: "actions", label: "Action", width: 110, sticky: "right" },
];

const hasActiveFilters = computed(() => {
  return !!filters.value.type || !!filters.value.search || (filters.value.dateRange && filters.value.dateRange.length > 0);
});

const filteredTransactions = computed(() => {
  let list = transactions.value || [];
  if (filters.value.search) {
    const q = filters.value.search.toLowerCase().trim();
    list = list.filter((item) => {
      const ref = String(item.reference || item.reference_id || item.txid || "").toLowerCase();
      const id = String(item.id || "");
      const prId = String(item.payment_request_id || "");
      const desc = String(item.description || item.remarks || item.reason || "").toLowerCase();
      return ref.includes(q) || id.includes(q) || prId.includes(q) || desc.includes(q);
    });
  }
  return list;
});

const metrics = computed(() => {
  let credit = 0;
  let debit = 0;
  let creditCount = 0;
  let debitCount = 0;
  let pageVolume = 0;

  for (const item of transactions.value || []) {
    const num = Math.abs(Number(item.amount) || 0);
    pageVolume += num;
    if (isCredit(item)) {
      credit += num;
      creditCount++;
    } else {
      debit += num;
      debitCount++;
    }
  }

  return {
    totalCredit: credit,
    totalDebit: debit,
    creditCount,
    debitCount,
    pageVolume,
  };
});

const emptyStateTitle = computed(() => {
  if (transactionsError.value) return "Couldn’t load transactions";
  if (hasActiveFilters.value) return "No matching transactions";
  return "No transactions yet";
});

const emptyStateDescription = computed(() => {
  if (transactionsError.value) return transactionsError.value;
  if (hasActiveFilters.value) return "Try adjusting or clearing your filters to see transactions.";
  return "Wallet balance movements and transfer adjustments will appear here.";
});

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") return "₹0.00";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
};

const isCredit = (row) => {
  if (!row) return false;
  const t = String(row.type || row.transaction_type || "").toLowerCase();
  if (t.includes("credit") || t.includes("deposit") || t.includes("inflow")) return true;
  if (t.includes("debit") || t.includes("withdrawal") || t.includes("outflow")) return false;
  return Number(row.amount) >= 0;
};

const getTransactionType = (row) => {
  if (!row) return "Transaction";
  return row.type || row.transaction_type || (isCredit(row) ? "Credit" : "Debit");
};

const getTypeBadgeClass = (row) => {
  if (isCredit(row)) {
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  }
  return "bg-rose-500/10 text-rose-400 border-rose-500/30";
};

const getStatusBadgeClass = (status) => {
  const s = String(status || "completed").toLowerCase();
  if (s === "completed" || s === "success") {
    return "bg-primary-green/10 text-primary-green border-primary-green/30";
  }
  if (s === "pending" || s === "processing") {
    return "bg-primary-yellow/10 text-primary-yellow border-primary-yellow/30";
  }
  if (s === "failed" || s === "rejected" || s === "cancelled") {
    return "bg-primary-red/10 text-primary-red border-primary-red/30";
  }
  return "bg-secondary-text/10 text-secondary-text border-primary-border";
};

const getReferenceText = (row) => {
  return row?.reference || row?.reference_id || row?.txid || row?.transaction_id || "—";
};

const copyToClipboard = async (text, label = "Item") => {
  if (!text || text === "—") return;
  try {
    await navigator.clipboard.writeText(String(text).trim());
    snackbar.show(`${label} copied`, "success");
  } catch (err) {
    console.error("Copy failed", err);
    snackbar.show(`Failed to copy ${label.toLowerCase()}`, "error");
  }
};

const openDetails = (row) => {
  selectedTransaction.value = row;
};

const loadTransactions = async () => {
  try {
    // Resolve user ID from profile API / store
    const uid = await profileStore.ensureUserId();
    targetUserId.value = uid;
    if (!uid) {
      snackbar.show("User profile ID not found", "error");
      return;
    }
    await walletsStore.fetchTransactions(uid);
  } catch (err) {
    console.error("Error loading transactions:", err);
  }
};

const applyFilters = () => {
  pagination.value.page = 1;
  loadTransactions();
};

const handleClearFilters = () => {
  walletsStore.clearFilters();
  loadTransactions();
};

const handlePageChange = (newPage) => {
  pagination.value.page = newPage;
  loadTransactions();
};

const handlePerPageChange = (newPerPage) => {
  pagination.value.page = 1;
  pagination.value.per_page = newPerPage;
  loadTransactions();
};

onMounted(async () => {
  await loadTransactions();
});
</script>
