# Vendor Portal - Frontend Engineering Rules & Architecture Standards

> **Scope**: This document defines the universal architectural standards, store conventions, component guidelines, styling rules, shared component usage, and folder structure for all modules across the Vendor Portal frontend application. Every new module (e.g., Commission Engine, Loyalty, Settlements, etc.) **must** adhere strictly to these rules.

---

## Table of Contents
1. [Core Philosophy](#1-core-philosophy)
2. [Pinia Store Architecture Rules](#2-pinia-store-architecture-rules)
3. [Vue File & Component Rules](#3-vue-file--component-rules)
4. [Global Styling & Design System (`src/style.css`)](#4-global-styling--design-system-srcstylecss)
5. [Shared Component Reuse & Global Component Immutability (`src/components/common`)](#5-shared-component-reuse--global-component-immutability-srccomponentscommon)
6. [Standard Folder Structure](#6-standard-folder-structure)
7. [API & Network Request Conventions](#7-api--network-request-conventions)
8. [Iconography Standards](#8-iconography-standards)
9. [Module Implementation Checklist (e.g., Commission Engine)](#9-module-implementation-checklist)

---

## 1. Core Philosophy

1. **Simplicity First**: Write readable, predictable, and maintainable code. Avoid over-engineering and superfluous abstraction layers.
2. **Backend as the Single Source of Truth**: All calculations, aggregate sums, balances, commissions, status values, and business logic originate from the API. The frontend is strictly a presentation and interaction layer.
3. **No Redundant Mapping**: Do not create complex client-side transformations or mapping layers. Pass API data directly to store state and consume it directly in Vue templates.
4. **Style Integrity**: All styling must leverage the centralized design system in `@/src/style.css` and theme variables to ensure consistent visual aesthetics and seamless light/dark mode support.
5. **Smart State Caching (`isFetched` & `inFlight`)**: Prevent duplicate network calls and redundant re-fetches using standardized store flags.
6. **Maximum Reuse & Zero Mutation of Global Components**: Always reuse existing UI components from `src/components/common/` (e.g. `DataTable`, `BaseDatePicker`, `BaseSelect`, `ConfirmationDialog`). **Never mutate common component code directly**, as changes affect the entire project globally.

---

## 2. Pinia Store Architecture Rules

Every module store located in `src/stores/[module]/[module].js` must follow this exact standard:

### A. State Declaration
- Store state variables should store API response payloads directly (e.g., `ref([])`, `ref(null)`).
- Maintain `inFlight` and `isFetched` tracking dictionaries.
- Maintain standardized loading flags (`loading`, `actionLoading`, `detailLoading`) and `error`.

```javascript
import { defineStore } from "pinia";
import { ref } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import { useSnackbarStore } from "@/stores/snackbar/snackbar";

export const useCommissionEngineStore = defineStore("commissionEngine", () => {
  const snackbar = useSnackbarStore();

  // ─── 1. Primary State (Direct Data Storage) ────────────
  const plans = ref([]);
  const activePlan = ref(null);
  const rules = ref([]);
  const reports = ref([]);
  const pagination = ref({
    page: 1,
    per_page: 20,
    total: 0,
    pages: 1,
  });

  // ─── 2. In-Flight Tracking (Prevents Parallel Duplicate Requests) ─
  const inFlight = {
    plans: false,
    activePlan: false,
    rules: false,
    reports: false,
  };

  // ─── 3. isFetched Tracking (Prevents Redundant API Calls) ─
  const isFetched = ref({
    plans: false,
    activePlan: false,
    rules: false,
    reports: false,
  });

  // ─── 4. Loading & Error Flags ──────────────────────────
  const loading = ref(false);
  const actionLoading = ref(false);
  const detailLoading = ref(false);
  const error = ref(null);

  // ─── 5. Reset Helper ──────────────────────────────────
  const resetFetchedFlags = () => {
    isFetched.value = {
      plans: false,
      activePlan: false,
      rules: false,
      reports: false,
    };
  };
```

### B. Standard Fetch Action Pattern
Fetch actions **must**:
1. Check `inFlight` lock: If currently fetching, return immediately.
2. Check `isFetched` cache: If already fetched and `force === false`, return immediately.
3. Use `successHandler`, `failureHandler`, and `finallyHandler`.
4. **Directly assign** `res.data` without unnecessary mappings.

```javascript
  // ─── Fetch Action ──────────────────────────────────────
  const fetchPlans = (params = {}, force = false) => {
    // Prevent duplicate concurrent calls
    if (inFlight.plans) return;
    // Prevent redundant fetches if already loaded (unless forced)
    if (isFetched.value.plans && !force) return;

    inFlight.plans = true;
    loading.value = true;
    error.value = null;

    const successHandler = (res) => {
      // Direct assignment — NO useless mapping
      plans.value = Array.isArray(res?.data) ? res.data : [];
      if (res?.pagination) {
        pagination.value = res.pagination;
      }
      isFetched.value.plans = true;
    };

    const failureHandler = (err) => {
      error.value = err?.message || "Failed to fetch plans";
      snackbar.show(err?.message || "Failed to fetch plans", "error");
    };

    const finallyHandler = () => {
      inFlight.plans = false;
      loading.value = false;
    };

    return apiRequest(urls.KEYS.GET, urls.commissionEngine.plans, {
      params,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
      onFinally: finallyHandler,
    });
  };
```

### C. Standard Mutation Action Pattern (Create / Update / Delete)
Mutation actions **must**:
1. Manage `actionLoading.value = true/false`.
2. Display success notification via `snackbar.show(res?.message, "success")`.
3. Invalidate relevant `isFetched` flags or re-fetch with `force = true`.
4. Display error notification via `snackbar.show(err?.message, "error")`.

```javascript
  // ─── Mutation Action ───────────────────────────────────
  const createPlan = (payload) => {
    actionLoading.value = true;

    const successHandler = (res) => {
      snackbar.show(res?.message || "Plan created successfully", "success");
      // Force refresh list to stay in sync with server
      fetchPlans({}, true);
      if (res?.data) {
        activePlan.value = res.data;
        isFetched.value.activePlan = true;
      }
    };

    const failureHandler = (err) => {
      snackbar.show(err?.message || "Failed to create plan", "error");
    };

    const finallyHandler = () => {
      actionLoading.value = false;
    };

    return apiRequest(urls.KEYS.POST, urls.commissionEngine.createPlan, {
      data: payload,
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
      onFinally: finallyHandler,
    });
  };
```

---

## 3. Vue File & Component Rules

### A. Direct Store Consumption
- Access store state variables directly in `<template>` and `<script setup>`.
- **DO NOT** make duplicate local `ref` copies of arrays or objects already present in the store unless editing a local form copy.
- **DO NOT** perform useless client-side mappings (e.g. mapping an array into a new array just to rename keys). Keep the backend field names directly.

### B. ZERO Frontend Calculated Data
- **Never** compute core business numbers, fees, totals, payouts, tier thresholds, or summary analytics on the client side.
- All aggregate stats, calculations, totals, and percentages must be returned by the backend API.
- The Vue component simply renders `item.total_payout`, `item.commission_rate`, `stats.total_volume`, etc.

### C. Clean Script Setup Structure
1. `import` statements (Vue core, icons, store, common components).
2. Store instantiation (`const store = useCommissionEngineStore()`).
3. Local UI state (e.g. `isModalOpen = ref(false)`, `selectedTab = ref('overview')`).
4. Lifecycle hooks (`onMounted` calling store fetch actions).
5. Event handler functions (`handleSubmit`, `handleDelete`).

---

## 4. Global Styling & Design System (`src/style.css`)

All components **must** use the centralized design system defined in `src/style.css`. Do not write arbitrary inline styles or custom hex colors when a theme token exists.

Root rem: `html { font-size: 14px; }`. Class-based dark mode via `html.dark`. Brand primary is **yellow** (`#facc15`) with dark button text (`text-btn-text-primary`). Never use `text-white` on `bg-primary`.

### A. Core Theme Color Tokens (Tailwind Theme Variables)

| Variable Token | Purpose | Light Mode | Dark Mode |
| :--- | :--- | :--- | :--- |
| `bg-background` | Application Canvas / Page Background | `#f3f4f6` | `#0b0f17` |
| `bg-card-background` | Cards, Modals, Drawers, Panels | `#ffffff` | `#111827` |
| `border-primary-border` | Standard Borders & Dividers | `#e5e7eb` | `#374151` |
| `text-primary-text` | Primary Headings & Main Text | `#111827` | `#f3f4f6` |
| `text-secondary-text` | Subtitles, Labels, Table Headers | `#6b7280` | `#9ca3af` |
| `bg-primary` / `text-primary` | Brand primary (yellow) | `#facc15` | `#facc15` |
| `bg-primary-hover` | Primary hover | `#eab308` | `#eab308` |
| `text-btn-text-primary` | Text on yellow primary buttons | `#111827` | `#111827` |
| `text-primary-green` | Success status, Active state, positive | `#22c55e` | `#4ade80` |
| `text-primary-yellow` | Pending, warning, processing status | `#f59e0b` | `#fbbf24` |
| `text-primary-red` | Failed, inactive, error status, delete | `#ef4444` | `#f87171` |
| `text-primary-blue` | Info badges, active tabs, secondary links | `#3b82f6` | `#60a5fa` |

### B. Global Typography & Utility Classes

| Class Name | Definition | Usage |
| :--- | :--- | :--- |
| `.page-title` | `text-lg font-semibold tracking-tight` | Ops page H1 (max; avoid `text-2xl`) |
| `.page-subtitle` | `text-xs text-secondary-text` | Page supporting line |
| `.section-label` | `text-[11px] uppercase tracking-wide` | Eyebrow labels |
| `.title-text` | `font-semibold text-[16px]` | Card & modal headings |
| `.sub-text` | `text-[11px]` | Supporting explanations |
| `.normal-text` | `text-[14px] font-medium` | Emphasized body text |
| `.mid-text` | `text-[12px]` | Standard body / table cell text |
| `.input-field` | `h-9` themed input, `rounded-xl` | Form inputs |
| `.btn-primary` / `.btn-secondary` / `.btn-danger` | `h-9` action buttons | Primary / ghost / danger CTAs |
| `.modal-panel` / `.modal-header` / `.modal-footer` | Consistent modal chrome | Dialogs |

### C. Density

- Controls: `h-9` + `text-sm`
- Table row actions: `h-8` + `text-xs`
- Table cells: `px-3 py-2`
- Modal header/footer: `px-5 py-3`; modal title: `text-base`

### D. Standard Form Input Example
```html
<input
  v-model="formData.name"
  type="text"
  placeholder="Enter plan name..."
  class="input-field px-3 text-sm"
/>
```

---

## 5. Shared Component Reuse & Global Component Immutability (`src/components/common`)

> ⚠️ **CRITICAL ARCHITECTURAL RULE: DO NOT MODIFY GLOBAL COMMON COMPONENTS FOR ONE MODULE**
>
> All components in `src/components/common/` are shared across the vendor portal.
> - **DO NOT** change common components for a single page’s convenience — use props, slots, and events.
> - **DO** fix common components when the issue is global (tokens, light/dark contrast, density).
> - **ALWAYS check `src/components/common/` first** before writing a duplicate widget.
> - Prefer shared **`EmptyState`** for empty / error placeholders.

### Standard Shared Components Registry

| Component | Path | Usage & Purpose |
| :--- | :--- | :--- |
| **`DataTable`** | `@/components/common/DataTable` | **Mandatory Table Component**. Always use for tabular data, pagination, sorting, search, column filters, and actions. |
| **`BaseDatePicker`** | `@/components/common/BaseDatePicker.vue` | Standard unified single & date-range picker with predefined quick presets. |
| **`BaseSelect`** | `@/components/common/BaseSelect.vue` | Standard custom select dropdown supporting search, multi-select, and clearable options. |
| **`ConfirmationDialog`** | `@/components/common/ConfirmationDialog.vue` | Standard confirmation modal for dangerous/destructive actions (e.g. Delete, Revoke, Terminate). |
| **`DynamicFormModal`** | `@/components/common/DynamicFormModal.vue` | Schema-driven dynamic modal form for structured inputs. |
| **`MetricCard`** / **`AnalyticsCard`** | `@/components/common/MetricCard.vue` | Summary stats card displaying titles, values, percentage diffs, and icons. |
| **`StatusBadge`** | `@/components/common/StatusBadge.vue` | Unified status pill (e.g., active, pending, failed, draft) with theme-matching background and text colors. |
| **`TagChip`** / **`TagSelector`** / **`TagAssignmentModal`** | `@/components/common/` | Reusable tag management and assignment components. |
| **`Tooltip`** | `@/components/common/Tooltip.vue` | Hover tooltip for hints and contextual descriptions. |
| **`DropdownMenu`** | `@/components/common/DropdownMenu.vue` | Action menu dropdown for table rows or card options. |
| **`Pagination`** / **`SimplePagination`** | `@/components/common/` | Standard pagination controllers. |
| **`SkeletonCard`** | `@/components/common/SkeletonCard.vue` | Shimmer/skeleton placeholder while loading cards. |
| **`EmptyState`** | `@/components/common/EmptyState.vue` | Standard empty / error placeholder with optional CTA. |
| **`NoPermissionsState`** | `@/components/common/NoPermissionsState.vue` | Standard 403 access restricted placeholder. |

### Example: Using `DataTable` in a Module
```html
<template>
  <DataTable
    :columns="tableColumns"
    :data="store.plans"
    :loading="store.loading"
    :pagination="store.pagination"
    @page-change="handlePageChange"
    @per-page-change="handlePerPageChange"
    @search="handleSearch"
  >
    <!-- Custom Cell Slot Example -->
    <template #cell-status="{ row }">
      <StatusBadge :status="row.status" />
    </template>

    <template #cell-actions="{ row }">
      <button 
        class="text-xs text-primary hover:underline font-medium"
        @click="openEditModal(row)"
      >
        Edit
      </button>
    </template>
  </DataTable>
</template>
```

---

## 6. Standard Folder Structure

Every module in the codebase adheres to the standard directory layout:

```
src/
├── api/
│   ├── urls.js                 # Central API endpoint registry
│   └── request.js              # Centralized Axios request handler
├── stores/
│   └── [moduleName]/           # e.g., stores/commissionEngine/
│       └── [moduleName].js     # Pinia store with isFetched/inFlight/successHandler
├── pages/
│   └── [moduleName]/           # e.g., pages/commission-engine/
│       ├── index.vue           # Module landing page & tab controller
│       ├── tabs/               # Sub-views/tabs for the module
│       │   ├── OverviewTab.vue
│       │   ├── RulesTab.vue
│       │   └── PayoutsTab.vue
│       └── components/         # Module-specific modals, drawers, cards
│           ├── CreatePlanModal.vue
│           └── PlanRuleCard.vue
├── components/
│   └── common/                 # Global shared components (IMMUTABLE)
│       ├── DataTable/          # Unified table component
│       ├── BaseDatePicker.vue  # Date picker component
│       ├── BaseSelect.vue      # Custom select dropdown
│       ├── ConfirmationDialog.vue # Deletion & action confirmations
│       ├── MetricCard.vue      # Analytics / summary card
│       ├── StatusBadge.vue     # Status indicator pill
│       └── snackbar.vue        # Toast notification system
└── style.css                   # Global theme tokens, typography & classes
```

---

## 7. API & Network Request Conventions

### A. Endpoint Registration in `src/api/urls.js`
Register all endpoints under a clear module key:

```javascript
// src/api/urls.js
export default {
  KEYS: {
    GET: "get",
    POST: "post",
    PUT: "put",
    DELETE: "delete",
    PATCH: "patch",
  },
  commissionEngine: {
    plans: "commission/plans",
    createPlan: "commission/plans/create",
    updatePlan: (id) => `commission/plans/${id}`,
    deletePlan: (id) => `commission/plans/${id}`,
    rules: "commission/rules",
    reports: "commission/reports",
  },
  // ... other modules
};
```

### B. Standard `apiRequest` Invocation
Always supply:
- `urls.KEYS.[METHOD]`
- Endpoint URL (from `urls.[module].[endpoint]`)
- Config Object:
  - `look_up_key` (if appending an ID to the URL path, use this instead of manual string concatenation)
  - `params` (for query params)
  - `data` (for POST/PUT body payloads)
  - `isTokenRequired: true`
  - `onSuccess: successHandler`
  - `onFailure: failureHandler`
  - `onFinally: finallyHandler`

### C. PATCH Requests (Partial Updates)
When sending `PATCH` requests to update a resource (e.g., in edit modals or forms):
1. **Send only modified fields:** Compare the local form state with the original `props` or store object. Only include fields in the request payload that have actually been changed by the user.
2. **Deep comparison for objects:** For nested JSON objects (e.g., `eligibility_rules`, `settings`), compare the stringified updated object with the original before including it in the payload.
3. **Skip unnecessary requests:** If no fields have changed, do not send an API request; simply close the modal or exit the form.

---

## 8. Iconography Standards

- **Icons**: Use Material Symbols via `<span class="material-symbols-outlined">icon_name</span>`.
- **Standard sizing** (approx.):
  - Buttons / table actions: 16–18px
  - Nav / card headers: 18–20px
  - Modal / hero accents: 20–24px

---

## 9. Module Implementation Checklist

When creating or updating a module (such as the **Commission Engine**), follow this checklist:

- [ ] **1. API Endpoints**: Add module endpoints to `src/api/urls.js`.
- [ ] **2. Pinia Store**:
  - [ ] State declared with direct data structures (no artificial wrappers).
  - [ ] `inFlight` lock dictionary implemented for all fetch actions.
  - [ ] `isFetched` cache dictionary implemented with optional `force` flag.
  - [ ] `resetFetchedFlags()` helper provided.
  - [ ] All API calls use `successHandler`, `failureHandler`, and `finallyHandler`.
  - [ ] Errors and success messages notified via `useSnackbarStore()`.
  - [ ] Direct payload assignment (`data.value = res.data`). No unnecessary client mapping.
- [ ] **3. UI & Components**:
  - [ ] **Tables**: Uses standard `DataTable` from `@/components/common/DataTable` (never custom table implementations).
  - [ ] **Shared UI**: Uses existing components from `@/components/common/` (`BaseDatePicker`, `BaseSelect`, `ConfirmationDialog`, `StatusBadge`, `MetricCard`, etc.).
  - [ ] **No Common Component Mutation**: Did **NOT** modify or edit any files inside `src/components/common/`.
  - [ ] Module page created in `src/pages/[module]/index.vue`.
  - [ ] Sub-tabs partitioned in `src/pages/[module]/tabs/`.
  - [ ] Module-specific modals and drawers placed in `src/pages/[module]/components/`.
  - [ ] Uses direct store state; zero duplicate local mirroring.
  - [ ] Zero client-side calculated business data (all numbers come from backend).
  - [ ] Strict use of global styling classes from `src/style.css` (`.title-text`, `.sub-text`, `.input-field`, theme colors).
  - [ ] Uses `@hugeicons/core-free-icons`.
- [ ] **4. Routing & Navigation**: Register route in `src/router/` with appropriate permission guards.


## DataTable Component

- Use the `DataTable` component (`@/components/common/DataTable/DataTable.vue`) to render tables.
- The `DataTable` component has an automatic columns generation feature. You can just pass the list of array data to the `:data` prop (without needing to define `:columns` manually), and it will automatically plot the table headers and rows based on the keys in the data objects.
