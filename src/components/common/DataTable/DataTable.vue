<template>
  <div class="w-full flex flex-col rounded-xl border border-primary-border bg-card-background overflow-hidden shadow-xs">
    <!-- Optional Toolbar Slot (for search, filters, batch actions above table) -->
    <div v-if="$slots.toolbar" class="px-4 py-3 border-b border-primary-border bg-card-background">
      <slot name="toolbar" :selected-rows="selectedRows" :selected-count="selectedRows.length" />
    </div>

    <!-- Table Horizontal Scroll Container -->
    <div class="w-full overflow-x-auto relative">
      <table class="w-full border-collapse text-left" :style="tableStyle">
        <!-- Table Header -->
        <DataTableHeader
          :columns="visibleColumns"
          :selectable="selectable"
          :is-all-selected="isAllSelected"
          :is-indeterminate="isIndeterminate"
          :has-sticky-left="hasStickyLeft"
          :has-actions="hasActions"
          :actions-sticky="actionsSticky"
          :actions-width="actionsWidth"
          :sort-key="activeSortKey"
          :sort-direction="activeSortDirection"
          :show-column-settings="showColumnSettings"
          :column-widths="columnWidths"
          @toggle-select-all="toggleSelectAll"
          @sort="handleSort"
          @resize-column="handleColumnResize"
          @open-column-menu="openColumnMenuFromTrigger"
          @header-context-menu="handleHeaderContextMenu"
        >
          <!-- Forward header slots to DataTableHeader -->
          <template
            v-for="col in visibleColumns"
            :key="`header-slot-${col.key}`"
            #[`header-${col.key}`]="slotProps"
          >
            <slot :name="`header-${col.key}`" v-bind="slotProps" />
          </template>
        </DataTableHeader>

        <!-- Table Body -->
        <DataTableBody
          :data="displayData"
          :columns="visibleColumns"
          :loading="loading"
          :skeleton-rows="skeletonRowsCount"
          :selectable="selectable"
          :selected-rows="selectedRows"
          :row-key="rowKey"
          :row-class="rowClass"
          :has-sticky-left="hasStickyLeft"
          :has-actions="hasActions"
          :actions="actions"
          :actions-sticky="actionsSticky"
          :actions-width="actionsWidth"
          :column-widths="columnWidths"
          :empty-title="emptyTitle"
          :empty-text="emptyText"
          @toggle-select-row="toggleSelectRow"
          @action="handleAction"
          @row-click="handleRowClick"
        >
          <!-- Forward cell slots dynamically to DataTableBody -->
          <template
            v-for="col in visibleColumns"
            :key="`cell-slot-${col.key}`"
            #[`cell-${col.key}`]="slotProps"
          >
            <slot :name="`cell-${col.key}`" v-bind="slotProps" />
          </template>

          <!-- Forward skeleton slots -->
          <template
            v-for="col in visibleColumns"
            :key="`skeleton-slot-${col.key}`"
            #[`skeleton-${col.key}`]="slotProps"
          >
            <slot :name="`skeleton-${col.key}`" v-bind="slotProps" />
          </template>

          <!-- Forward actions and empty slots -->
          <template v-if="$slots.actions" #actions="slotProps">
            <slot name="actions" v-bind="slotProps" />
          </template>

          <template v-if="$slots.empty" #empty>
            <slot name="empty" />
          </template>
        </DataTableBody>
      </table>
    </div>

    <!-- Table Pagination -->
    <slot name="pagination" :pagination="pagination" :handle-page-change="handlePageChange" :handle-per-page-change="handlePerPageChange">
      <DataTablePagination
        v-if="pagination"
        :pagination="pagination"
        :per-page-options="perPageOptions"
        @page-change="handlePageChange"
        @per-page-change="handlePerPageChange"
      />
    </slot>

    <!-- Column Visibility & Width Context Menu -->
    <DataTableColumnMenu
      ref="columnMenuRef"
      :all-columns="computedAllColumns"
      v-model:hidden-keys="hiddenColumnKeys"
      :has-custom-widths="hasCustomWidths"
      @reset-columns="resetColumnsToDefault"
      @reset-widths="resetColumnWidths"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import DataTableHeader from './DataTableHeader.vue'
import DataTableBody from './DataTableBody.vue'
import DataTablePagination from './DataTablePagination.vue'
import DataTableColumnMenu from './DataTableColumnMenu.vue'
import {
  autoDetectColumns,
  loadTableSettings,
  saveTableSettings,
} from './utils'

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
  columns: {
    type: Array,
    default: null,
  },
  excludeColumns: {
    type: Array,
    default: () => [],
  },
  pagination: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  actions: {
    type: [Function, Array],
    default: null,
  },
  actionsSticky: {
    type: Boolean,
    default: true,
  },
  actionsWidth: {
    type: [Number, String],
    default: 100,
  },
  selectable: {
    type: Boolean,
    default: false,
  },
  selected: {
    type: Array,
    default: () => [],
  },
  rowKey: {
    type: String,
    default: 'id',
  },
  rowClass: {
    type: Function,
    default: null,
  },
  perPageOptions: {
    type: Array,
    default: () => [10, 20, 50, 100],
  },
  emptyTitle: {
    type: String,
    default: 'No Records Found',
  },
  emptyText: {
    type: String,
    default: 'There are no records available.',
  },
  tableKey: {
    type: String,
    default: '',
  },
  sortKey: {
    type: String,
    default: '',
  },
  sortDirection: {
    type: String,
    default: null,
  },
  showColumnSettings: {
    type: Boolean,
    default: true,
  },
  minTableWidth: {
    type: [Number, String],
    default: null,
  },
})

const emit = defineEmits([
  'page-change',
  'per-page-change',
  'sort-change',
  'action',
  'selection-change',
  'update:selected',
  'row-click',
])

const columnMenuRef = ref(null)
const columnWidths = ref({})
const hiddenColumnKeys = ref([])
const internalSortKey = ref(props.sortKey || '')
const internalSortDirection = ref(props.sortDirection || null)
const selectedRows = ref([...props.selected])

// Sync sort props if updated by parent
watch(
  () => props.sortKey,
  (val) => {
    internalSortKey.value = val || ''
  }
)
watch(
  () => props.sortDirection,
  (val) => {
    internalSortDirection.value = val || null
  }
)

// Sync selected prop with internal state
watch(
  () => props.selected,
  (val) => {
    if (val) selectedRows.value = [...val]
  },
  { deep: true }
)

// Compute all columns according to Priority Rules:
// Rule 1: If explicit columns provided, use columns only.
// Rule 2: If columns not provided, generate automatically from data keys.
// Rule 3: excludeColumns only applies to automatically generated columns.
const computedAllColumns = computed(() => {
  if (Array.isArray(props.columns) && props.columns.length > 0) {
    return props.columns
  }
  return autoDetectColumns(props.data, props.excludeColumns)
})

// Filter out user-hidden columns
const visibleColumns = computed(() => {
  const hidden = new Set(hiddenColumnKeys.value)
  return computedAllColumns.value.filter((col) => !hidden.has(col.key))
})

const hasStickyLeft = computed(() => {
  return visibleColumns.value.some((c) => c.sticky === 'left')
})

const hasActions = computed(() => {
  return props.actions !== null && props.actions !== undefined
})

const activeSortKey = computed(() => internalSortKey.value)
const activeSortDirection = computed(() => internalSortDirection.value)

// Smart built-in sorting (automatic fallback when sorting in memory)
const displayData = computed(() => {
  if (!Array.isArray(props.data)) return []

  const sortKey = internalSortKey.value
  const sortDir = internalSortDirection.value

  if (!sortKey || !sortDir) {
    return props.data
  }

  const col = computedAllColumns.value.find((c) => c.key === sortKey)
  const sortField = col?.sortKey || col?.key || sortKey

  return [...props.data].sort((a, b) => {
    let valA = a[sortField] !== undefined ? a[sortField] : (col?.formatter ? col.formatter(a[sortKey], a) : a[sortKey])
    let valB = b[sortField] !== undefined ? b[sortField] : (col?.formatter ? col.formatter(b[sortKey], b) : b[sortKey])

    // Fallback for common compound fields (e.g. client -> name)
    if (valA === undefined && sortKey === 'client') valA = a.name
    if (valB === undefined && sortKey === 'client') valB = b.name

    if (valA === null || valA === undefined) return sortDir === 'asc' ? 1 : -1
    if (valB === null || valB === undefined) return sortDir === 'asc' ? -1 : 1

    // Numeric comparison
    const numA = typeof valA === 'number' ? valA : Number(valA)
    const numB = typeof valB === 'number' ? valB : Number(valB)
    if (!isNaN(numA) && !isNaN(numB) && typeof valA !== 'boolean' && typeof valB !== 'boolean' && String(valA).trim() !== '' && String(valB).trim() !== '') {
      return sortDir === 'asc' ? numA - numB : numB - numA
    }

    // Date comparison
    const dateA = Date.parse(valA)
    const dateB = Date.parse(valB)
    if (!isNaN(dateA) && !isNaN(dateB) && typeof valA === 'string' && (valA.includes('-') || valA.includes('/') || valA.includes(':'))) {
      return sortDir === 'asc' ? dateA - dateB : dateB - dateA
    }

    // String comparison
    const strA = String(valA).toLowerCase()
    const strB = String(valB).toLowerCase()
    if (strA < strB) return sortDir === 'asc' ? -1 : 1
    if (strA > strB) return sortDir === 'asc' ? 1 : -1
    return 0
  })
})

const skeletonRowsCount = computed(() => {
  if (props.pagination?.per_page) {
    return Number(props.pagination.per_page)
  }
  return 10
})

const hasCustomWidths = computed(() => {
  return Object.keys(columnWidths.value).length > 0
})

const tableStyle = computed(() => {
  if (props.minTableWidth) {
    const minW = typeof props.minTableWidth === 'number' ? `${props.minTableWidth}px` : props.minTableWidth
    return { minWidth: minW }
  }
  return {}
})

// Row selection helpers
function getRowKey(row, index) {
  if (row && row[props.rowKey] !== undefined) {
    return row[props.rowKey]
  }
  return index
}

const isAllSelected = computed(() => {
  if (!props.data || props.data.length === 0) return false
  return props.data.every((row) =>
    selectedRows.value.some((r) => getRowKey(r) === getRowKey(row))
  )
})

const isIndeterminate = computed(() => {
  if (!props.data || props.data.length === 0) return false
  const selectedCount = props.data.filter((row) =>
    selectedRows.value.some((r) => getRowKey(r) === getRowKey(row))
  ).length
  return selectedCount > 0 && selectedCount < props.data.length
})

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedRows.value = []
  } else {
    selectedRows.value = [...props.data]
  }
  emit('update:selected', selectedRows.value)
  emit('selection-change', selectedRows.value)
}

function toggleSelectRow(row) {
  const key = getRowKey(row)
  const index = selectedRows.value.findIndex((r) => getRowKey(r) === key)
  if (index > -1) {
    selectedRows.value.splice(index, 1)
  } else {
    selectedRows.value.push(row)
  }
  emit('update:selected', selectedRows.value)
  emit('selection-change', selectedRows.value)
}

// Sorting handler (UI only, emits to parent for server-side handling)
function handleSort({ key, direction }) {
  internalSortKey.value = key
  internalSortDirection.value = direction
  emit('sort-change', { key, direction })
}

// Pagination handlers
function handlePageChange(page) {
  emit('page-change', page)
}

function handlePerPageChange(payload) {
  emit('per-page-change', payload)
}

// Action emit
function handleAction(payload) {
  emit('action', payload)
}

function handleRowClick(payload) {
  emit('row-click', payload)
}

// Column resize handler
function handleColumnResize({ key, width }) {
  columnWidths.value = {
    ...columnWidths.value,
    [key]: width,
  }
  persistSettings()
}

function resetColumnWidths() {
  columnWidths.value = {}
  persistSettings()
}

function resetColumnsToDefault() {
  hiddenColumnKeys.value = []
  persistSettings()
}

// Column menu openers
function openColumnMenuFromTrigger(triggerEl) {
  if (columnMenuRef.value) {
    columnMenuRef.value.openFromTrigger(triggerEl)
  }
}

function handleHeaderContextMenu({ event }) {
  if (columnMenuRef.value && props.showColumnSettings) {
    columnMenuRef.value.openAt(event.clientX, event.clientY)
  }
}

// Persistence (widths & visibility)
function persistSettings() {
  if (!props.tableKey) return
  saveTableSettings(props.tableKey, {
    widths: columnWidths.value,
    hidden: hiddenColumnKeys.value,
  })
}

function restoreSettings() {
  if (!props.tableKey) return
  const saved = loadTableSettings(props.tableKey)
  if (saved) {
    if (saved.widths && typeof saved.widths === 'object') {
      columnWidths.value = saved.widths
    }
    if (Array.isArray(saved.hidden)) {
      hiddenColumnKeys.value = saved.hidden
    }
  }
}

watch(
  () => hiddenColumnKeys.value,
  () => persistSettings(),
  { deep: true }
)

onMounted(() => {
  restoreSettings()
})
</script>
