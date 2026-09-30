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
        class="fixed z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md
               left-4 right-4 bottom-5
               sm:left-auto sm:right-5 sm:bottom-auto sm:top-5 sm:min-w-[220px] sm:max-w-[320px]"
        :class="colorClasses"
      >
        <span class="material-symbols-outlined text-[18px] shrink-0">{{ iconName }}</span>
        <span class="text-xs font-medium flex-1 text-primary-text">{{ snackbar.message }}</span>
        <button
          type="button"
          class="shrink-0 text-secondary-text hover:text-primary-text transition-colors cursor-pointer"
          @click="snackbar.hide()"
        >
          <span class="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from "vue";
import { useSnackbarStore } from "@/stores/snackbar";

const snackbar = useSnackbarStore();

const colorClasses = computed(
  () =>
    ({
      success:
        "bg-card-background border-primary-green/40 text-primary-green",
      error: "bg-card-background border-primary-red/40 text-primary-red",
      warning:
        "bg-card-background border-primary-yellow/40 text-primary-yellow",
      info: "bg-card-background border-primary-blue/40 text-primary-blue",
    })[snackbar.color] ??
    "bg-card-background border-primary-border text-primary-text",
);

const iconName = computed(
  () =>
    ({
      success: "check_circle",
      error: "error",
      warning: "warning",
      info: "info",
    })[snackbar.color] ?? "info",
);
</script>
