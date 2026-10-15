<template>
  <div class="flex flex-col gap-2">
    <!-- Header Controls: Title, Scope, Segmented Switcher & Collapse -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-0.5">
      <!-- Title & Scope & Mobile Collapse Button -->
      <div class="flex items-center justify-between gap-2 w-full sm:w-auto">
        <div class="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div class="flex items-center gap-1.5 text-xs font-bold text-primary-text uppercase tracking-wider shrink-0">
            <span class="material-symbols-outlined text-[18px] text-primary">monitoring</span>
            <span class="truncate">Vendor Summary</span>
          </div>

          <!-- Scope Badge -->
          <span
            v-if="scope"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors shrink-0"
            :class="scope === 'overall'
              ? 'bg-primary-yellow/10 text-primary-yellow border-primary-yellow/25'
              : 'bg-primary-blue/10 text-primary-blue border-primary-blue/25'"
            :title="scopeTooltip"
          >
            <span
              class="h-1.5 w-1.5 rounded-full shrink-0"
              :class="scope === 'overall' ? 'bg-primary-yellow' : 'bg-primary-blue animate-pulse'"
            />
            <span class="truncate max-w-24 sm:max-w-none">{{ scopeLabel }}</span>
          </span>
        </div>

        <!-- Mobile-only Expand/Collapse Button -->
        <button
          type="button"
          class="sm:hidden inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-secondary-text hover:text-primary-text bg-card-background border border-primary-border transition cursor-pointer shrink-0"
          :title="isCollapsed ? 'Expand KPI cards' : 'Collapse to compact bar'"
          @click="toggleCollapse"
        >
          <span class="material-symbols-outlined text-[16px] text-primary">
            {{ isCollapsed ? "expand_more" : "expand_less" }}
          </span>
          <span>{{ isCollapsed ? "Expand" : "Compact" }}</span>
        </button>
      </div>

      <!-- Controls: Tabs & Desktop Collapse Button -->
      <div class="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
        <!-- Segmented Tab for Transfer KPIs (Overall / Deposit / Withdrawal) -->
        <div
          v-if="!isCollapsed && transfers"
          class="grid grid-cols-3 sm:flex p-0.5 rounded-xl bg-card-background border border-primary-border text-[11px] font-medium shadow-2xs w-full sm:w-auto"
        >
          <button
            v-for="tab in transferTabs"
            :key="tab.value"
            type="button"
            class="px-2 sm:px-2.5 py-1 rounded-lg transition-all cursor-pointer capitalize text-center"
            :class="selectedTab === tab.value
              ? 'bg-primary text-btn-text-primary font-bold shadow-xs'
              : 'text-secondary-text hover:text-primary-text hover:bg-background/80'"
            @click="selectedTab = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Desktop Expand / Collapse Button -->
        <button
          type="button"
          class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-medium text-secondary-text hover:text-primary-text bg-card-background border border-primary-border hover:bg-background transition cursor-pointer shadow-2xs shrink-0"
          :title="isCollapsed ? 'Expand KPI cards' : 'Collapse to compact bar'"
          @click="toggleCollapse"
        >
          <span class="material-symbols-outlined text-[16px] text-primary">
            {{ isCollapsed ? "expand_more" : "expand_less" }}
          </span>
          <span>{{ isCollapsed ? "Expand View" : "Compact View" }}</span>
        </button>
      </div>
    </div>

    <!-- ── Loading Skeleton ───────────────────────────── -->
    <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
      <div
        v-for="n in 6"
        :key="n"
        class="bg-card-background border border-primary-border/60 rounded-xl p-2.5 sm:p-3.5 animate-pulse space-y-2"
      >
        <div class="h-2.5 w-16 sm:w-20 bg-primary-border/60 rounded-full" />
        <div class="h-5 sm:h-6 w-20 sm:w-24 bg-primary-border/80 rounded" />
        <div class="h-2 w-14 sm:w-16 bg-primary-border/40 rounded-full" />
      </div>
    </div>

    <!-- ── 1. Compact / Collapsed Mode (Swipeable on mobile) ────────────────── -->
    <div
      v-else-if="isCollapsed && (wallets || transfers)"
      class="bg-card-background rounded-xl p-2 sm:p-2.5 flex items-center justify-between gap-3 shadow-2xs transition-all overflow-hidden"
    >
      <div class="flex items-center gap-3 sm:gap-6 overflow-x-auto scrollbar-none py-0.5 divide-x divide-primary-border/60 w-full sm:w-auto">
        <!-- Deposit Balance -->
        <div class="flex items-center gap-2 shrink-0">
          <div class="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[16px]">account_balance_wallet</span>
          </div>
          <div class="min-w-0">
            <span class="text-[10px] uppercase font-semibold text-secondary-text tracking-wider block leading-tight">Deposit</span>
            <span class="text-xs sm:text-sm font-bold text-primary-text tabular-nums leading-tight">
              {{ formatMoney(wallets?.total_deposit_balance) }}
            </span>
          </div>
        </div>

        <!-- Withdrawal Balance -->
        <div class="pl-3 sm:pl-6 flex items-center gap-2 shrink-0">
          <div class="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[16px]">payments</span>
          </div>
          <div class="min-w-0">
            <span class="text-[10px] uppercase font-semibold text-secondary-text tracking-wider block leading-tight">Withdrawal</span>
            <span class="text-xs sm:text-sm font-bold text-primary-text tabular-nums leading-tight">
              {{ formatMoney(wallets?.total_withdrawal_balance) }}
            </span>
          </div>
        </div>

        <!-- Pending Transfers -->
        <div
          class="pl-3 sm:pl-6 flex items-center gap-2 cursor-pointer group shrink-0"
          title="Click to view pending assigned transfers"
          @click="emitFilter('assigned', '')"
        >
          <div class="w-7 h-7 rounded-lg bg-primary-yellow/10 text-primary-yellow flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <span class="material-symbols-outlined text-[16px]">pending_actions</span>
          </div>
          <div class="min-w-0">
            <span class="text-[10px] uppercase font-semibold text-secondary-text tracking-wider block leading-tight">Pending</span>
            <span class="text-xs sm:text-sm font-bold text-primary-yellow tabular-nums leading-tight group-hover:underline">
              {{ activeTransfersKpi?.pending_count ?? 0 }}
              <span v-if="activeTransfersKpi?.pending_amount" class="text-[11px] font-medium text-secondary-text ml-1">
                ({{ formatMoney(activeTransfersKpi?.pending_amount) }})
              </span>
            </span>
          </div>
        </div>

        <!-- Completed Transfers -->
        <div
          class="pl-3 sm:pl-6 flex items-center gap-2 cursor-pointer group shrink-0"
          title="Click to view completed transfers"
          @click="emitFilter('completed', '')"
        >
          <div class="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <span class="material-symbols-outlined text-[16px]">task_alt</span>
          </div>
          <div class="min-w-0">
            <span class="text-[10px] uppercase font-semibold text-secondary-text tracking-wider block leading-tight">Completed</span>
            <span class="text-xs sm:text-sm font-bold text-primary-text tabular-nums leading-tight group-hover:underline">
              {{ activeTransfersKpi?.completed_count ?? 0 }}
            </span>
          </div>
        </div>

        <!-- Methods Count -->
        <div class="pl-3 sm:pl-6 flex items-center gap-2 shrink-0">
          <div class="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[16px]">credit_card</span>
          </div>
          <div class="min-w-0">
            <span class="text-[10px] uppercase font-semibold text-secondary-text tracking-wider block leading-tight">Channels</span>
            <span class="text-xs sm:text-sm font-bold text-primary-text tabular-nums leading-tight">
              {{ wallets?.payment_method_count ?? 0 }}
            </span>
          </div>
        </div>
      </div>

      <div class="text-[11px] text-secondary-text shrink-0 hidden sm:block">
        <span>Scope: </span>
        <strong class="text-primary-text font-semibold capitalize">{{ scope }}</strong>
      </div>
    </div>

    <!-- ── 2. Expanded Mode: Rich Multi-Card Grid ───────── -->
    <div
      v-else-if="!isCollapsed && (wallets || transfers)"
      class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5 transition-all"
    >
      <!-- Card 1: Deposit Balance -->
      <div
        class="group bg-card-background border border-primary-border/60 rounded-xl p-2.5 sm:p-3.5 flex flex-col justify-between hover:border-emerald-500/40 transition-colors shadow-none"
      >
        <div>
          <div class="flex items-center justify-between gap-1 mb-1 sm:mb-1.5">
            <span class="text-[10px] font-semibold uppercase tracking-wider text-secondary-text truncate">
              Deposit Balance
            </span>
            <div class="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[15px]">account_balance_wallet</span>
            </div>
          </div>
          <p class="text-base sm:text-xl font-bold text-primary-text tracking-tight tabular-nums truncate" :title="String(wallets?.total_deposit_balance)">
            {{ formatMoney(wallets?.total_deposit_balance) }}
          </p>
        </div>
        <p class="text-[10px] text-secondary-text mt-1 sm:mt-1.5 flex items-center gap-1 truncate">
          <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          <span class="truncate">Available for deposits</span>
        </p>
      </div>

      <!-- Card 2: Withdrawal Balance -->
      <div
        class="group bg-card-background border border-primary-border/60 rounded-xl p-2.5 sm:p-3.5 flex flex-col justify-between hover:border-blue-500/40 transition-colors shadow-none"
      >
        <div>
          <div class="flex items-center justify-between gap-1 mb-1 sm:mb-1.5">
            <span class="text-[10px] font-semibold uppercase tracking-wider text-secondary-text truncate">
              Withdrawal Balance
            </span>
            <div class="w-6 h-6 rounded-md bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[15px]">payments</span>
            </div>
          </div>
          <p class="text-base sm:text-xl font-bold text-primary-text tracking-tight tabular-nums truncate" :title="String(wallets?.total_withdrawal_balance)">
            {{ formatMoney(wallets?.total_withdrawal_balance) }}
          </p>
        </div>
        <p class="text-[10px] text-secondary-text mt-1 sm:mt-1.5 flex items-center gap-1 truncate">
          <span class="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
          <span class="truncate">Available for payouts</span>
        </p>
      </div>

      <!-- Card 3: Pending Transfers (Actionable) -->
      <div
        class="group bg-card-background border border-primary-border/60 rounded-xl p-2.5 sm:p-3.5 flex flex-col justify-between hover:border-primary-yellow/50 transition-colors shadow-none cursor-pointer"
        @click="emitFilter('assigned', selectedTab === 'overall' ? '' : selectedTab)"
      >
        <div>
          <div class="flex items-center justify-between gap-1 mb-1 sm:mb-1.5">
            <span class="text-[10px] font-semibold uppercase tracking-wider text-secondary-text truncate">
              Pending {{ activeCategoryName }}
            </span>
            <div class="w-6 h-6 rounded-md bg-primary-yellow/10 text-primary-yellow flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <span class="material-symbols-outlined text-[15px]">pending_actions</span>
            </div>
          </div>
          <div class="flex items-baseline gap-1.5">
            <p class="text-base sm:text-xl font-bold text-primary-yellow tracking-tight tabular-nums">
              {{ activeTransfersKpi?.pending_count ?? 0 }}
            </p>
            <span class="text-[11px] text-secondary-text">requests</span>
          </div>
        </div>
        <div class="mt-1 sm:mt-1.5 flex items-center justify-between text-[10px] text-secondary-text gap-1">
          <span class="truncate min-w-0 flex-1">
            Vol: <strong class="text-primary-text font-semibold">{{ formatMoney(activeTransfersKpi?.pending_amount) }}</strong>
          </span>
          <span class="text-primary text-[10px] font-medium shrink-0 group-hover:underline">Filter &rarr;</span>
        </div>
      </div>

      <!-- Card 4: Completed Transfers -->
      <div
        class="group bg-card-background border border-primary-border/60 rounded-xl p-2.5 sm:p-3.5 flex flex-col justify-between hover:border-primary-green/40 transition-colors shadow-none cursor-pointer"
        @click="emitFilter('completed', selectedTab === 'overall' ? '' : selectedTab)"
      >
        <div>
          <div class="flex items-center justify-between gap-1 mb-1 sm:mb-1.5">
            <span class="text-[10px] font-semibold uppercase tracking-wider text-secondary-text truncate">
              Completed {{ activeCategoryName }}
            </span>
            <div class="w-6 h-6 rounded-md bg-primary-green/10 text-primary-green flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <span class="material-symbols-outlined text-[15px]">task_alt</span>
            </div>
          </div>
          <div class="flex items-baseline gap-1.5">
            <p class="text-base sm:text-xl font-bold text-primary-text tracking-tight tabular-nums">
              {{ activeTransfersKpi?.completed_count ?? 0 }}
            </p>
            <span class="text-[11px] text-secondary-text">done</span>
          </div>
        </div>
        <div class="mt-1 sm:mt-1.5 flex items-center justify-between text-[10px] text-secondary-text gap-1">
          <span class="truncate min-w-0 flex-1">
            Vol: <strong class="text-primary-text font-semibold">{{ formatMoney(activeTransfersKpi?.completed_amount) }}</strong>
          </span>
          <span class="text-primary text-[10px] font-medium shrink-0 group-hover:underline">Filter &rarr;</span>
        </div>
      </div>

      <!-- Card 5: Cancelled Transfers -->
      <div
        class="group bg-card-background border border-primary-border/60 rounded-xl p-2.5 sm:p-3.5 flex flex-col justify-between hover:border-primary-red/40 transition-colors shadow-none cursor-pointer"
        @click="emitFilter('cancelled', selectedTab === 'overall' ? '' : selectedTab)"
      >
        <div>
          <div class="flex items-center justify-between gap-1 mb-1 sm:mb-1.5">
            <span class="text-[10px] font-semibold uppercase tracking-wider text-secondary-text truncate">
              Cancelled {{ activeCategoryName }}
            </span>
            <div class="w-6 h-6 rounded-md bg-primary-red/10 text-primary-red flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <span class="material-symbols-outlined text-[15px]">cancel</span>
            </div>
          </div>
          <div class="flex items-baseline gap-1.5">
            <p class="text-base sm:text-xl font-bold text-primary-text tracking-tight tabular-nums">
              {{ activeTransfersKpi?.cancelled_count ?? 0 }}
            </p>
            <span class="text-[11px] text-secondary-text">rejected</span>
          </div>
        </div>
        <div class="mt-1 sm:mt-1.5 flex items-center justify-between text-[10px] text-secondary-text gap-1">
          <span class="text-secondary-text truncate min-w-0 flex-1">Failed/cancelled</span>
          <span class="text-primary text-[10px] font-medium shrink-0 group-hover:underline">Filter &rarr;</span>
        </div>
      </div>

      <!-- Card 6: Payment Methods / Total Volume -->
      <div
        class="group bg-card-background border border-primary-border/60 rounded-xl p-2.5 sm:p-3.5 flex flex-col justify-between hover:border-primary/40 transition-colors shadow-none"
      >
        <div>
          <div class="flex items-center justify-between gap-1 mb-1 sm:mb-1.5">
            <span class="text-[10px] font-semibold uppercase tracking-wider text-secondary-text truncate">
              Payment Methods
            </span>
            <div class="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[15px]">credit_card</span>
            </div>
          </div>
          <div class="flex items-baseline gap-1.5">
            <p class="text-base sm:text-xl font-bold text-primary-text tracking-tight tabular-nums">
              {{ wallets?.payment_method_count ?? 0 }}
            </p>
            <span class="text-[11px] text-secondary-text">assigned</span>
          </div>
        </div>
        <p class="text-[10px] text-secondary-text mt-1 sm:mt-1.5 truncate">
          Total: <strong class="text-primary-text font-semibold">{{ activeTransfersKpi?.total_count ?? 0 }}</strong> transfers
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

const props = defineProps({
  summary: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["filter-status", "filter-type"]);

const STORAGE_KEY = "vendor_kpi_summary_collapsed";
const isCollapsed = ref(false);
const selectedTab = ref("overall");

const transferTabs = [
  { label: "Overall", value: "overall" },
  { label: "Deposit", value: "deposit" },
  { label: "Withdrawal", value: "withdrawal" },
];

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved !== null) {
    isCollapsed.value = saved === "true";
  }
});

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
  localStorage.setItem(STORAGE_KEY, String(isCollapsed.value));
};

const scope = computed(() => props.summary?.scope || "assigned");
const wallets = computed(() => props.summary?.wallets || null);
const transfers = computed(() => props.summary?.transfers || null);

const activeTransfersKpi = computed(() => {
  if (!transfers.value) return null;
  return transfers.value[selectedTab.value] || transfers.value.overall || null;
});

const activeCategoryName = computed(() => {
  if (selectedTab.value === "deposit") return "Deposits";
  if (selectedTab.value === "withdrawal") return "Withdrawals";
  return "";
});

const scopeLabel = computed(() => {
  return scope.value === "overall" ? "Scope: Overall" : "Scope: Assigned";
});

const scopeTooltip = computed(() => {
  return scope.value === "overall"
    ? "Viewing overall totals across all vendors (vendor.view_all permission)"
    : "Viewing payment methods and transfers assigned to your vendor account";
});

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") return "₹0.00";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const emitFilter = (status, type) => {
  if (status) emit("filter-status", status);
  if (type !== undefined) emit("filter-type", type);
};
</script>
