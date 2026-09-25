<template>
  <div
    v-if="pagination && (pagination.total_items !== undefined || pagination.total_pages !== undefined)"
    class="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-primary-border bg-card-background text-xs"
  >
    <!-- Left: Showing range & Rows per page -->
    <div class="flex flex-wrap items-center gap-4 text-secondary-text">
      <!-- Showing summary -->
      <span class="whitespace-nowrap">
        Showing
        <span class="font-semibold text-primary-text">{{ showingFrom }}</span>
        to
        <span class="font-semibold text-primary-text">{{ showingTo }}</span>
        of
        <span class="font-semibold text-primary-text">{{ totalItems }}</span>
        entries
      </span>

      <!-- Rows per page selector -->
      <div v-if="perPageOptions && perPageOptions.length" class="flex items-center gap-2">
        <span class="text-secondary-text whitespace-nowrap">Rows per page:</span>
        <div class="w-20">
          <BaseSelect
            :model-value="currentPerPage"
            :options="formattedPerPageOptions"
            :drop-up="true"
            placement="top"
            variant="surface"
            @update:model-value="handlePerPageChange"
          />
        </div>
      </div>
    </div>

    <!-- Right: Page buttons & Jump to page -->
    <div class="flex flex-wrap items-center gap-3">
      <!-- Jump to Page -->
      <div v-if="totalPages > 1" class="flex items-center gap-1.5 relative">
        <span class="text-secondary-text whitespace-nowrap">Jump to:</span>
        <div class="relative flex items-center">
          <input
            v-model="jumpPageInput"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            placeholder="Page"
            class="w-14 h-7 px-2 text-center rounded-lg border text-xs text-primary-text bg-background outline-none transition"
            :class="jumpError ? 'border-primary-red focus:border-primary-red' : 'border-primary-border focus:border-primary'"
            @keydown.enter="executeJump"
            @input="jumpError = ''"
          />
          <button
            type="button"
            @click="executeJump"
            class="ml-1 h-7 px-2.5 rounded-lg border border-primary-border bg-background hover:bg-card-background text-primary-text font-medium text-xs transition active:scale-95 cursor-pointer"
          >
            Go
          </button>
        </div>

        <!-- Validation Tooltip/Error Popover -->
        <Transition name="fade">
          <div
            v-if="jumpError"
            class="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-primary-red text-white text-[10px] whitespace-nowrap  z-30 pointer-events-none"
          >
            {{ jumpError }}
          </div>
        </Transition>
      </div>

      <!-- Page navigation buttons -->
      <div v-if="totalPages > 1" class="flex items-center gap-1">
        <!-- First Page -->
        <button
          type="button"
          :disabled="isFirst"
          @click="goToPage(1)"
          title="First Page"
          class="w-7 h-7 flex items-center justify-center rounded-lg border border-primary-border transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          :class="isFirst ? 'bg-background text-secondary-text' : 'bg-background text-secondary-text hover:text-primary-text hover:border-primary'"
        >
          <ChevronsLeft class="w-3.5 h-3.5" />
        </button>

        <!-- Previous Page -->
        <button
          type="button"
          :disabled="isFirst"
          @click="goToPage(currentPage - 1)"
          title="Previous Page"
          class="w-7 h-7 flex items-center justify-center rounded-lg border border-primary-border transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          :class="isFirst ? 'bg-background text-secondary-text' : 'bg-background text-secondary-text hover:text-primary-text hover:border-primary'"
        >
          <span class="material-symbols-outlined w-3.5 h-3.5">chevron_left</span>
        </button>

        <!-- Page Numbers with Ellipsis -->
        <template v-for="(p, i) in pagesList" :key="p === '...' ? `ellipsis-${i}` : p">
          <span
            v-if="p === '...'"
            class="w-7 h-7 flex items-center justify-center text-xs text-secondary-text select-none"
          >
            ...
          </span>

          <button
            v-else
            type="button"
            @click="goToPage(p)"
            class="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold border transition cursor-pointer select-none"
            :class="p === currentPage
              ? 'bg-primary text-white border-primary '
              : 'bg-background text-secondary-text border-primary-border hover:text-primary-text hover:border-primary'"
          >
            {{ p }}
          </button>
        </template>

        <!-- Next Page -->
        <button
          type="button"
          :disabled="isLast"
          @click="goToPage(currentPage + 1)"
          title="Next Page"
          class="w-7 h-7 flex items-center justify-center rounded-lg border border-primary-border transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          :class="isLast ? 'bg-background text-secondary-text' : 'bg-background text-secondary-text hover:text-primary-text hover:border-primary'"
        >
          <span class="material-symbols-outlined w-3.5 h-3.5">chevron_right</span>
        </button>

        <!-- Last Page -->
        <button
          type="button"
          :disabled="isLast"
          @click="goToPage(totalPages)"
          title="Last Page"
          class="w-7 h-7 flex items-center justify-center rounded-lg border border-primary-border transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          :class="isLast ? 'bg-background text-secondary-text' : 'bg-background text-secondary-text hover:text-primary-text hover:border-primary'"
        >
          <ChevronsRight class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import BaseSelect from '@/components/common/BaseSelect.vue'

const props = defineProps({
  pagination: {
    type: Object,
    required: true,
    default: () => ({ page: 1, per_page: 10, total_items: 0, total_pages: 1 }),
  },
  perPageOptions: {
    type: Array,
    default: () => [10, 20, 50, 100],
  },
})

const emit = defineEmits(['page-change', 'per-page-change'])

const jumpPageInput = ref('')
const jumpError = ref('')

const formattedPerPageOptions = computed(() => {
  if (!props.perPageOptions || !Array.isArray(props.perPageOptions)) return []
  return props.perPageOptions.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        label: String(opt.label ?? opt.value),
        value: Number(opt.value ?? opt.label),
      }
    }
    return {
      label: String(opt),
      value: Number(opt),
    }
  })
})

const currentPage = computed(() => Number(props.pagination?.page) || 1)
const currentPerPage = computed(() => Number(props.pagination?.per_page) || 10)
const totalItems = computed(() => Number(props.pagination?.total_items) || 0)
const totalPages = computed(() => {
  if (props.pagination?.total_pages !== undefined) {
    return Math.max(1, Number(props.pagination.total_pages))
  }
  if (totalItems.value && currentPerPage.value) {
    return Math.max(1, Math.ceil(totalItems.value / currentPerPage.value))
  }
  return 1
})

const isFirst = computed(() => currentPage.value <= 1)
const isLast = computed(() => currentPage.value >= totalPages.value)

const showingFrom = computed(() => {
  if (totalItems.value === 0) return 0
  return (currentPage.value - 1) * currentPerPage.value + 1
})

const showingTo = computed(() => {
  if (totalItems.value === 0) return 0
  return Math.min(currentPage.value * currentPerPage.value, totalItems.value)
})

const pagesList = computed(() => {
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const result = []
  result.push(1)

  if (current > 3) {
    result.push('...')
  }

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) {
    result.push(i)
  }

  if (current < total - 2) {
    result.push('...')
  }

  result.push(total)
  return result
})

function goToPage(page) {
  const target = Number(page)
  if (isNaN(target) || target < 1 || target > totalPages.value) return
  if (target === currentPage.value) return
  jumpError.value = ''
  emit('page-change', target)
}

function handlePerPageChange(newVal) {
  const perPage = Number(newVal)
  if (isNaN(perPage) || perPage <= 0) return
  emit('per-page-change', { page: 1, per_page: perPage })
}

function executeJump() {
  const val = jumpPageInput.value.trim()
  if (!val) {
    jumpError.value = 'Enter page number'
    return
  }

  const pageNum = Number(val)
  if (isNaN(pageNum) || !Number.isInteger(pageNum)) {
    jumpError.value = 'Invalid number'
    return
  }

  if (pageNum < 1 || pageNum > totalPages.value) {
    jumpError.value = `Page must be between 1 and ${totalPages.value}`
    return
  }

  jumpError.value = ''
  jumpPageInput.value = ''
  goToPage(pageNum)
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 4px);
}
</style>
