<template>
  <header
    class="bg-topbar border-b border-primary-border h-16 flex items-center justify-between px-4 lg:px-6 relative z-10 shadow-sm"
  >
    <div class="flex items-center gap-3">
      <button
        type="button"
        @click="$emit('toggle-sidebar')"
        class="text-secondary-text hover:text-primary-text lg:hidden flex items-center justify-center p-1.5 rounded-lg hover:bg-background transition-colors cursor-pointer"
        aria-label="Toggle sidebar"
      >
        <span class="material-symbols-outlined">menu</span>
      </button>
      <span class="text-sm text-primary-text font-semibold">Admin User</span>
    </div>

    <div class="flex items-center gap-2">
      <button
        type="button"
        @click="themeStore.toggleTheme()"
        class="inline-flex items-center gap-2 rounded-xl border border-primary-border bg-card-background px-3 py-2 text-sm font-medium text-primary-text hover:bg-background transition-colors cursor-pointer"
        :title="themeStore.isDark ? 'Switch to light theme' : 'Switch to dark theme'"
        :aria-label="themeStore.isDark ? 'Switch to light theme' : 'Switch to dark theme'"
      >
        <span class="material-symbols-outlined text-[20px] text-primary-yellow">
          {{ themeStore.isDark ? "light_mode" : "dark_mode" }}
        </span>
        <span class="hidden sm:inline text-xs text-secondary-text">
          {{ themeStore.isDark ? "Light" : "Dark" }}
        </span>
      </button>
    </div>
  </header>
</template>

<script setup>
import { useThemeStore } from "@/stores/theme/theme";

defineEmits(["toggle-sidebar"]);

const themeStore = useThemeStore();
</script>
