<template>
  <Teleport to="body">
    <Transition name="menu-fade">
      <div
        v-if="isOpen"
        ref="menuRef"
        class="fixed z-999 min-w-56 max-h-96 rounded-xl border border-primary-border bg-card-background shadow-xl py-2 overflow-hidden flex flex-col"
        :style="menuStyle"
        @mousedown.stop
        @click.stop
      >
        <!-- Menu Header -->
        <div class="px-3.5 pb-2 border-b border-primary-border flex items-center justify-between">
          <div class="flex items-center gap-1.5 text-xs font-semibold text-primary-text">
            <Columns3 class="w-3.5 h-3.5 text-primary" />
            <span>Customize Columns</span>
          </div>
          <button
            type="button"
            @click="close"
            class="text-secondary-text hover:text-primary-text p-0.5 rounded-md hover:bg-background transition"
          >
            <span class="material-symbols-outlined w-3.5 h-3.5">close</span>
          </button>
        </div>

        <!-- Quick actions -->
        <div class="px-2 py-1.5 border-b border-primary-border flex items-center justify-between text-[11px]">
          <button
            type="button"
            @click="showAllColumns"
            class="px-2 py-1 rounded text-primary hover:bg-primary/10 font-medium transition cursor-pointer"
          >
            Show All
          </button>
          <button
            type="button"
            @click="resetColumns"
            class="px-2 py-1 rounded text-secondary-text hover:text-primary-text hover:bg-background font-medium transition cursor-pointer"
          >
            Reset Defaults
          </button>
          <button
            v-if="hasCustomWidths"
            type="button"
            @click="resetWidths"
            class="px-2 py-1 rounded text-secondary-text hover:text-primary-text hover:bg-background font-medium transition cursor-pointer"
            title="Reset column sizes"
          >
            Reset Widths
          </button>
        </div>

        <!-- Column list with checkboxes -->
        <div class="overflow-y-auto max-h-60 px-2 py-1 space-y-0.5">
          <label
            v-for="col in allColumns"
            :key="col.key"
            class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs hover:bg-background cursor-pointer select-none transition"
            :class="{ 'opacity-60 cursor-not-allowed': isLastVisible(col.key) && isVisible(col.key) }"
          >
            <input
              type="checkbox"
              :checked="isVisible(col.key)"
              :disabled="isLastVisible(col.key) && isVisible(col.key)"
              @change="toggleColumn(col.key)"
              class="w-3.5 h-3.5 rounded border-primary-border text-primary focus:ring-0 cursor-pointer accent-primary"
            />
            <span class="truncate text-primary-text font-medium">{{ col.label || col.key }}</span>
          </label>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, nextTick, onBeforeUnmount } from 'vue'


const props = defineProps({
  allColumns: {
    type: Array,
    required: true,
  },
  hiddenKeys: {
    type: Array,
    default: () => [],
  },
  hasCustomWidths: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:hiddenKeys', 'reset-columns', 'reset-widths'])

const isOpen = ref(false)
const menuRef = ref(null)
const menuStyle = ref({})

const visibleCount = computed(() => {
  return props.allColumns.filter((c) => !props.hiddenKeys.includes(c.key)).length
})

function isVisible(key) {
  return !props.hiddenKeys.includes(key)
}

function isLastVisible(key) {
  return visibleCount.value <= 1 && isVisible(key)
}

function toggleColumn(key) {
  const current = [...props.hiddenKeys]
  const idx = current.indexOf(key)
  if (idx > -1) {
    current.splice(idx, 1)
  } else {
    // Prevent hiding the very last visible column
    if (visibleCount.value <= 1) return
    current.push(key)
  }
  emit('update:hiddenKeys', current)
}

function showAllColumns() {
  emit('update:hiddenKeys', [])
}

function resetColumns() {
  emit('reset-columns')
}

function resetWidths() {
  emit('reset-widths')
  close()
}

function openAt(x, y) {
  isOpen.value = true
  nextTick(() => {
    positionAt(x, y)
    document.addEventListener('mousedown', handleClickOutside, true)
    document.addEventListener('keydown', handleKeydown)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', close)
  })
}

function openFromTrigger(triggerEl) {
  if (!triggerEl) return
  const rect = triggerEl.getBoundingClientRect()
  openAt(rect.right, rect.bottom + 6)
}

function close() {
  if (!isOpen.value) return
  isOpen.value = false
  document.removeEventListener('mousedown', handleClickOutside, true)
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('scroll', handleScroll, true)
  window.removeEventListener('resize', close)
}

function positionAt(x, y) {
  if (!menuRef.value) return
  const menu = menuRef.value.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight

  let left = x
  let top = y

  if (left + menu.width > vw - 12) {
    left = Math.max(12, left - menu.width)
  }
  if (top + menu.height > vh - 12) {
    top = Math.max(12, vh - menu.height - 12)
  }

  menuStyle.value = {
    top: `${Math.max(12, top)}px`,
    left: `${Math.max(12, left)}px`,
  }
}

function handleScroll(e) {
  if (!isOpen.value) return
  // If scrolling inside the menu itself (e.g. the column list), do not close
  if (menuRef.value && menuRef.value.contains(e.target)) {
    return
  }
  // Ignore scroll events originating from within the table container during column toggling/reflow
  if (e.target && e.target !== document && e.target !== window && e.target !== document.documentElement && e.target !== document.body) {
    return
  }
  close()
}

function handleClickOutside(e) {
  if (!isOpen.value) return
  if (menuRef.value && (menuRef.value === e.target || menuRef.value.contains(e.target))) {
    return
  }
  close()
}

function handleKeydown(e) {
  if (e.key === 'Escape') {
    close()
  }
}

onBeforeUnmount(close)

defineExpose({
  openAt,
  openFromTrigger,
  close,
})
</script>

<style scoped>
.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-4px);
}
</style>
