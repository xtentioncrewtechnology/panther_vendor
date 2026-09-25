<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      leave-active-class="transition-all duration-200 ease-in"
      enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:translate-x-4"
      leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:translate-x-4"
    >
      <div
        v-if="snackbar.visible"
        class="fixed z-[9999] flex items-center backdrop-blur-md gap-3 px-4 py-3 rounded-xl shadow-lg
               left-4 right-4 bottom-5
               sm:left-auto sm:right-5 sm:bottom-auto sm:top-5 sm:min-w-[220px] sm:max-w-[320px]"
        :class="colorClasses"
      >
        <component :is="icon" :size="17" class="shrink-0" />
        <span class="text-[13px] font-medium flex-1">{{ snackbar.message }}</span>
        <button
          class="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          @click="snackbar.hide()"
        >
          <span class="material-symbols-outlined" >close</span>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

import { useSnackbarStore } from '@/stores/snackbar/snackbar.js'

const snackbar = useSnackbarStore()

const colorClasses = computed(() => ({
  success: 'bg-[#0f2a1f] border border-[#22c55e]/30 text-[#4ade80]',
  error:   'bg-[#3a1a1a] border border-[#2A2A2A]/40 text-[#f87171]',
  warning: 'bg-[#3a2a0a] border border-[#f0a500]/40 text-[#fbbf24]',
  info:    'bg-[#0F0F0F] border border-[#4fc3f7]/40 text-[#7dd3fc]',
}[snackbar.color] ?? 'bg-[#0F0F0F] border border-white/10 text-white'))

const icon = computed(() => ({
  success: CheckCircle,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
}[snackbar.color] ?? Info))
</script>