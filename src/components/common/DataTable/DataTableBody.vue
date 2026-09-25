<template>
  <tbody>
    <!-- Loading State: Skeleton Rows -->
    <template v-if="loading">
      <tr
        v-for="n in skeletonCount"
        :key="`skeleton-${n}`"
        class="border-b border-primary-border bg-card-background animate-pulse"
      >
        <!-- Selection checkbox skeleton -->
        <td v-if="selectable" class="w-10 px-3 py-3.5 text-center">
          <div class="w-3.5 h-3.5 rounded bg-background mx-auto" />
        </td>

        <!-- Column skeletons -->
        <td
          v-for="col in columns"
          :key="`skeleton-col-${col.key}`"
          class="px-4 py-3.5"
          :class="[
            getColumnAlignClass(col),
            col.sticky === 'left' ? 'sticky left-0 bg-card-background z-10 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)]' : '',
            col.sticky === 'right' ? 'sticky right-0 bg-card-background z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]' : '',
          ]"
          :style="getColumnCellStyle(col)"
        >
          <!-- Custom Skeleton Slot or Default Skeleton -->
          <slot :name="`skeleton-${col.key}`" :column="col">
            <div
              class="h-3.5 bg-background rounded"
              :class="getSkeletonWidthClass(col)"
            />
          </slot>
        </td>

        <!-- Actions skeleton -->
        <td
          v-if="hasActions"
          class="px-4 py-3.5 text-right"
          :class="actionsSticky ? 'sticky right-0 bg-card-background z-10' : ''"
          :style="actionsColumnStyle"
        >
          <div class="flex justify-end">
            <div class="w-7 h-7 bg-background rounded-lg" />
          </div>
        </td>
      </tr>
    </template>

    <!-- Empty State -->
    <template v-else-if="!data || data.length === 0">
      <tr>
        <td
          :colspan="totalColspan"
          class="py-16 px-4 text-center bg-card-background"
        >
          <slot name="empty">
            <div class="flex flex-col items-center justify-center gap-2.5 max-w-sm mx-auto">
              <div class="w-12 h-12 rounded-2xl bg-background flex items-center justify-center border border-primary-border text-secondary-text shadow-xs">
                <FolderOpen class="w-6 h-6 stroke-[1.5]" />
              </div>
              <p class="text-sm font-semibold text-primary-text">
                {{ emptyTitle }}
              </p>
              <p class="text-xs text-secondary-text">
                {{ emptyText }}
              </p>
            </div>
          </slot>
        </td>
      </tr>
    </template>

    <!-- Data Rows -->
    <template v-else>
      <tr
        v-for="(row, index) in data"
        :key="getRowKey(row, index)"
        class="border-b border-primary-border last:border-none bg-card-background hover:bg-background/80 transition-colors group"
        :class="[
          isRowSelected(row) ? 'bg-primary/5' : '',
          rowClass ? rowClass(row, index) : '',
        ]"
        @click="$emit('row-click', { row, index, event: $event })"
      >
        <!-- Row Selection Checkbox -->
        <td
          v-if="selectable"
          class="w-10 px-3 py-3.5 text-center shrink-0"
          :class="{ 'sticky left-0 bg-card-background group-hover:bg-background z-10': hasStickyLeft }"
          @click.stop
        >
          <div class="flex items-center justify-center">
            <input
              type="checkbox"
              :checked="isRowSelected(row)"
              @change="$emit('toggle-select-row', row)"
              class="w-3.5 h-3.5 rounded border-primary-border text-primary focus:ring-0 cursor-pointer accent-primary"
              :aria-label="`Select row ${index + 1}`"
            />
          </div>
        </td>

        <!-- Column Cells -->
        <td
          v-for="col in columns"
          :key="col.key"
          :style="getColumnCellStyle(col)"
          class="px-4 py-3.5 text-xs text-primary-text"
          :class="[
            getColumnAlignClass(col),
            col.sticky === 'left' ? 'sticky left-0 bg-card-background group-hover:bg-background z-10 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)]' : '',
            col.sticky === 'right' ? 'sticky right-0 bg-card-background group-hover:bg-background z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]' : '',
            col.sticky && isRowSelected(row) ? '!bg-primary/10' : '',
            col.cellClass || '',
          ]"
        >
          <!-- 1. Check for Named Cell Slot: cell-[col.key] -->
          <slot
            :name="`cell-${col.key}`"
            :value="row[col.key]"
            :row="row"
            :column="col"
            :index="index"
          >
            <!-- 2. Built-in Cell Renderers based on col.type -->

            <!-- Type: Badge -->
            <template v-if="col.type === 'badge'">
              <span
                class="inline-flex items-center text-[11px] font-medium px-2.5 py-0.5 rounded-full border transition capitalize"
                :class="getBadgeClass(getCellValue(row, col), col, row)"
              >
                {{ getBadgeLabel(getCellValue(row, col), col, row) }}
              </span>
            </template>

            <!-- Type: Link -->
            <template v-else-if="col.type === 'link'">
              <router-link
                v-if="isInternalLink(col, row)"
                :to="getLinkHref(col, row)"
                class="text-primary hover:underline font-medium inline-flex items-center gap-1"
                @click.stop
              >
                <span>{{ formatCellValue(row[col.key], col, row) }}</span>
              </router-link>
              <a
                v-else-if="getLinkHref(col, row)"
                :href="getLinkHref(col, row)"
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary hover:underline font-medium inline-flex items-center gap-1"
                @click.stop
              >
                <span>{{ formatCellValue(row[col.key], col, row) }}</span>
                <ExternalLink class="w-3 h-3 shrink-0 opacity-60" />
              </a>
              <span v-else>{{ formatCellValue(row[col.key], col, row) }}</span>
            </template>

            <!-- Type: Boolean -->
            <template v-else-if="col.type === 'boolean'">
              <span
                class="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border"
                :class="row[col.key]
                  ? 'bg-primary-green/10 text-primary-green border-primary-green/20'
                  : 'bg-secondary-text/10 text-secondary-text border-primary-border'"
              >
                {{ row[col.key] ? (col.trueLabel || 'Active') : (col.falseLabel || 'Inactive') }}
              </span>
            </template>

            <!-- Type: Percentage or Currency with positive/negative color support -->
            <template v-else-if="col.type === 'percentage' || col.type === 'currency'">
              <span
                class="tabular-nums font-medium"
                :class="getColoredNumberClass(row[col.key], col)"
              >
                {{ formatCellValue(row[col.key], col, row) }}
              </span>
            </template>

            <!-- Default: Formatted Text / Number / Date -->
            <template v-else>
              <span class="tabular-nums">
                {{ formatCellValue(row[col.key], col, row) }}
              </span>
            </template>
          </slot>
        </td>

        <!-- Actions Cell -->
        <td
          v-if="hasActions"
          class="px-4 py-3.5 text-right shrink-0 align-middle"
          :class="actionsSticky ? 'sticky right-0 bg-card-background group-hover:bg-background z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.04)]' : ''"
          :style="actionsColumnStyle"
          @click.stop
        >
          <!-- Custom Actions Slot -->
          <slot name="actions" :row="row" :index="index">
            <!-- Dynamic Actions Dropdown / Quick Buttons -->
            <div class="flex items-center justify-end gap-1.5">
              <DropdownMenu
                v-if="getRowActions(row).length"
                :items="getRowActions(row)"
                position="bottom-end"
                @select="handleActionSelect($event, row)"
              />
            </div>
          </slot>
        </td>
      </tr>
    </template>
  </tbody>
</template>

<script setup>
import { computed } from 'vue'

import DropdownMenu from '@/components/common/DropdownMenu.vue'
import { formatCellValue } from './utils'

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
  columns: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  skeletonRows: {
    type: Number,
    default: 10,
  },
  selectable: {
    type: Boolean,
    default: false,
  },
  selectedRows: {
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
  hasStickyLeft: {
    type: Boolean,
    default: false,
  },
  hasActions: {
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
  columnWidths: {
    type: Object,
    default: () => ({}),
  },
  emptyTitle: {
    type: String,
    default: 'No Records Found',
  },
  emptyText: {
    type: String,
    default: 'There are no records available.',
  },
})

const emit = defineEmits([
  'toggle-select-row',
  'action',
  'row-click',
])

const skeletonCount = computed(() => Math.max(1, props.skeletonRows))

const totalColspan = computed(() => {
  let count = props.columns.length
  if (props.selectable) count++
  if (props.hasActions) count++
  return count
})

const actionsColumnStyle = {
  width: typeof props.actionsWidth === 'number' ? `${props.actionsWidth}px` : props.actionsWidth,
  minWidth: typeof props.actionsWidth === 'number' ? `${props.actionsWidth}px` : props.actionsWidth,
}

function getRowKey(row, index) {
  if (row && row[props.rowKey] !== undefined) {
    return row[props.rowKey]
  }
  return index
}

function isRowSelected(row) {
  const key = getRowKey(row)
  return props.selectedRows.some((r) => getRowKey(r) === key)
}

function getColumnCellStyle(col) {
  const width = props.columnWidths[col.key] || col.width
  const style = {}
  if (width) {
    style.width = typeof width === 'number' ? `${width}px` : width
    style.minWidth = style.width
  } else if (col.minWidth) {
    style.minWidth = typeof col.minWidth === 'number' ? `${col.minWidth}px` : col.minWidth
  }
  if (col.maxWidth) {
    style.maxWidth = typeof col.maxWidth === 'number' ? `${col.maxWidth}px` : col.maxWidth
  }
  return style
}

function getColumnAlignClass(col) {
  if (col.align === 'center') return 'text-center'
  if (col.align === 'right' || col.type === 'number' || col.type === 'currency' || col.type === 'percentage') {
    return 'text-right'
  }
  return 'text-left'
}

function getSkeletonWidthClass(col) {
  if (col.type === 'badge' || col.type === 'boolean') return 'w-16'
  if (col.align === 'right' || col.type === 'number' || col.type === 'currency' || col.type === 'percentage') {
    return 'w-20 ml-auto'
  }
  if (col.align === 'center') return 'w-20 mx-auto'
  return 'w-28'
}

function getRowActions(row) {
  if (typeof props.actions === 'function') {
    return props.actions(row) || []
  }
  if (Array.isArray(props.actions)) {
    return props.actions
  }
  return []
}

function handleActionSelect(item, row) {
  emit('action', {
    action: item.action,
    item,
    row,
  })
}

function getCellValue(row, col) {
  if (typeof col.formatter === 'function') {
    return col.formatter(row[col.key], row)
  }
  return row[col.key]
}

function getBadgeLabel(val, col, row) {
  if (val === null || val === undefined || val === '') return '—'
  
  if (typeof col.badge?.label === 'function') {
    return col.badge.label(val, row)
  }

  const rawVal = row?.[col.key]
  const map = col.badge?.map
  if (map) {
    if (map[val]?.label) return map[val].label
    if (map[rawVal]?.label) return map[rawVal].label
  }

  const str = String(val).replace(/_/g, ' ')
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function getBadgeClass(val, col, row) {
  const rawVal = row?.[col.key]
  
  // 1. Direct custom class function/string on badge config
  if (typeof col.badge?.class === 'function') {
    return col.badge.class(val, row)
  }
  if (typeof col.badge?.class === 'string' && col.badge.class) {
    return col.badge.class
  }

  // 2. Map lookup
  const map = col.badge?.map
  const item = map ? (map[val] || map[rawVal]) : null
  
  // 3. Variant resolution (string or function)
  let variant = item?.variant
  if (!variant && typeof col.badge?.variant === 'function') {
    variant = col.badge.variant(val, row)
  }
  if (!variant) {
    variant = col.badge?.variant || 'default'
  }

  switch (variant) {
    case 'success':
    case 'green':
      return 'bg-primary-green/10 text-primary-green border-primary-green/20'
    case 'warning':
    case 'yellow':
      return 'bg-primary-yellow/10 text-primary-yellow border-primary-yellow/20'
    case 'danger':
    case 'red':
      return 'bg-primary-red/10 text-primary-red border-primary-red/20'
    case 'info':
    case 'blue':
    case 'primary':
      return 'bg-primary-blue/10 text-primary-blue border-primary-blue/20'
    default: {
      const lower = String(val).toLowerCase()
      if (['approved', 'active', 'completed', 'success', 'deposit', 'paid'].includes(lower)) {
        return 'bg-primary-green/10 text-primary-green border-primary-green/20'
      }
      if (['pending', 'processing', 'in_review', 'fee_paid'].includes(lower)) {
        return 'bg-primary-yellow/10 text-primary-yellow border-primary-yellow/20'
      }
      if (['rejected', 'cancelled', 'failed', 'inactive', 'danger', 'withdrawal'].includes(lower)) {
        return 'bg-primary-red/10 text-primary-red border-primary-red/20'
      }
      if (['trade_pnl'].includes(lower)) {
        return 'bg-primary-blue/10 text-primary-blue border-primary-blue/20'
      }
      return 'bg-secondary-text/10 text-secondary-text border-primary-border'
    }
  }
}

function getColoredNumberClass(val, col) {
  if (!col.colorize) return ''
  const num = Number(val)
  if (isNaN(num) || num === 0) return ''
  return num > 0 ? 'text-primary-green' : 'text-primary-red'
}

function getLinkHref(col, row) {
  if (typeof col.href === 'function') {
    return col.href(row)
  }
  return col.href || ''
}

function isInternalLink(col, row) {
  const href = getLinkHref(col, row)
  return typeof href === 'string' && href.startsWith('/') && !href.startsWith('//')
}
</script>
