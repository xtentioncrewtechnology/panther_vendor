<template>
  <thead class="border-b border-primary-border bg-card-background text-[11px] font-semibold text-secondary-text uppercase tracking-wider select-none sticky top-0 z-20">
    <tr>
      <!-- Row Selection Checkbox Header -->
      <th
        v-if="selectable"
        class="w-10 px-3 py-3 text-center border-b border-primary-border bg-card-background shrink-0"
        :class="{ 'sticky left-0 z-25': hasStickyLeft }"
      >
        <div class="flex items-center justify-center">
          <input
            type="checkbox"
            :checked="isAllSelected"
            :indeterminate.prop="isIndeterminate"
            @change="$emit('toggle-select-all')"
            class="w-3.5 h-3.5 rounded border-primary-border text-primary focus:ring-0 cursor-pointer accent-primary"
            aria-label="Select all rows"
          />
        </div>
      </th>

      <!-- Data Column Headers -->
      <th
        v-for="col in columns"
        :key="col.key"
        :style="getColumnHeaderStyle(col)"
        class="relative px-4 py-3 border-b border-primary-border bg-card-background transition-colors group"
        :class="[
          getColumnAlignClass(col),
          col.sortable ? 'cursor-pointer hover:text-primary-text hover:bg-background/60' : '',
          col.sticky === 'left' ? 'sticky left-0 z-25 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)]' : '',
          col.sticky === 'right' ? 'sticky right-0 z-25 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]' : '',
          col.headerClass || '',
        ]"
        @click="handleHeaderClick(col)"
        @contextmenu.prevent="handleContextMenu($event, col)"
      >
        <div class="flex items-center gap-1.5" :class="getContainerAlignClass(col)">
          <!-- Custom Header Slot or Default Label -->
          <slot :name="`header-${col.key}`" :column="col" :sort-key="sortKey" :sort-direction="sortDirection">
            <span class="truncate" :title="col.label || col.key">
              {{ col.label || col.key }}
            </span>
          </slot>

          <!-- Sorting Indicator -->
          <span v-if="col.sortable" class="shrink-0 inline-flex items-center transition-transform">
            <span class="material-symbols-outlined w-3.5 h-3.5 text-primary" v-if="sortKey === col.key && sortDirection === 'asc'">arrow_upward</span>
            <span class="material-symbols-outlined w-3.5 h-3.5 text-primary" v-else-if="sortKey === col.key && sortDirection === 'desc'">arrow_downward</span>
            <ArrowUpDown v-else class="w-3 h-3 text-secondary-text/40 group-hover:text-secondary-text/80 transition-opacity" />
          </span>
        </div>

        <!-- Column Resizer Handle -->
        <div
          v-if="col.resizable !== false"
          class="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize flex justify-center items-center hover:bg-primary/20 transition-colors z-30 group-hover:opacity-100"
          :class="resizingColumnKey === col.key ? 'bg-primary opacity-100' : 'opacity-0'"
          @mousedown.stop.prevent="startResize($event, col)"
          @click.stop
          title="Drag to resize column"
        >
          <div class="w-0.5 h-3 bg-secondary-text/30 group-hover:bg-primary" />
        </div>
      </th>

      <!-- Actions Column Header -->
      <th
        v-if="hasActions"
        :style="actionsColumnStyle"
        class="px-4 py-3 text-right border-b border-primary-border bg-card-background shrink-0"
        :class="actionsSticky ? 'sticky right-0 z-25 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.04)]' : ''"
      >
        <div class="flex items-center justify-end gap-1.5">
          <span>Actions</span>
          <!-- Column Settings Trigger Button -->
          <button
            v-if="showColumnSettings"
            type="button"
            ref="settingsBtnRef"
            @click.stop="$emit('open-column-menu', $refs.settingsBtnRef)"
            title="Customize columns"
            class="p-1 rounded hover:bg-background text-secondary-text hover:text-primary-text transition cursor-pointer"
          >
            <SlidersHorizontal class="w-3.5 h-3.5" />
          </button>
        </div>
      </th>
    </tr>
  </thead>
</template>

<script setup>
import { ref } from 'vue';


const props = defineProps({
  columns: {
    type: Array,
    required: true,
  },
  selectable: {
    type: Boolean,
    default: false,
  },
  isAllSelected: {
    type: Boolean,
    default: false,
  },
  isIndeterminate: {
    type: Boolean,
    default: false,
  },
  hasStickyLeft: {
    type: Boolean,
    default: false,
  },
  hasActions: {
    type: Boolean,
    default: false,
  },
  actionsSticky: {
    type: Boolean,
    default: true,
  },
  actionsWidth: {
    type: [Number, String],
    default: 100,
  },
  sortKey: {
    type: String,
    default: '',
  },
  sortDirection: {
    type: String,
    default: null, // 'asc' | 'desc' | null
  },
  showColumnSettings: {
    type: Boolean,
    default: true,
  },
  columnWidths: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits([
  'toggle-select-all',
  'sort',
  'resize-column',
  'open-column-menu',
  'header-context-menu',
])

const resizingColumnKey = ref(null)
const startX = ref(0)
const startWidth = ref(0)
let currentResizingCol = null

function getColumnHeaderStyle(col) {
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

const actionsColumnStyle = {
  width: typeof props.actionsWidth === 'number' ? `${props.actionsWidth}px` : props.actionsWidth,
  minWidth: typeof props.actionsWidth === 'number' ? `${props.actionsWidth}px` : props.actionsWidth,
}

function getColumnAlignClass(col) {
  if (col.align === 'center') return 'text-center'
  if (col.align === 'right' || col.type === 'number' || col.type === 'currency' || col.type === 'percentage') {
    return 'text-right'
  }
  return 'text-left'
}

function getContainerAlignClass(col) {
  if (col.align === 'center') return 'justify-center'
  if (col.align === 'right' || col.type === 'number' || col.type === 'currency' || col.type === 'percentage') {
    return 'justify-end'
  }
  return 'justify-start'
}

function handleHeaderClick(col) {
  if (!col.sortable) return

  let nextDirection = 'asc'
  if (props.sortKey === col.key) {
    if (props.sortDirection === 'asc') nextDirection = 'desc'
    else if (props.sortDirection === 'desc') nextDirection = null
    else nextDirection = 'asc'
  }

  emit('sort', {
    key: nextDirection ? col.key : '',
    direction: nextDirection,
  })
}

function handleContextMenu(e, col) {
  emit('header-context-menu', { event: e, column: col })
}

function startResize(e, col) {
  resizingColumnKey.value = col.key
  currentResizingCol = col
  startX.value = e.clientX

  const th = e.target.closest('th')
  startWidth.value = th ? th.getBoundingClientRect().width : (props.columnWidths[col.key] || col.width || 120)

  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'

  window.addEventListener('mousemove', handleResizing)
  window.addEventListener('mouseup', stopResize)
}

function handleResizing(e) {
  if (!resizingColumnKey.value || !currentResizingCol) return

  const delta = e.clientX - startX.value
  const min = currentResizingCol.minWidth || 60
  const max = currentResizingCol.maxWidth || 800
  const newWidth = Math.max(min, Math.min(max, Math.round(startWidth.value + delta)))

  emit('resize-column', { key: resizingColumnKey.value, width: newWidth })
}

function stopResize() {
  resizingColumnKey.value = null
  currentResizingCol = null
  document.body.style.cursor = ''
  document.body.style.userSelect = ''

  window.removeEventListener('mousemove', handleResizing)
  window.removeEventListener('mouseup', stopResize)
}
</script>
