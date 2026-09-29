<template>
  <div class="min-h-screen bg-background text-primary-text relative">
    <button
      type="button"
      class="absolute top-4 right-4 z-20 inline-flex items-center gap-2 h-9 rounded-xl border border-primary-border bg-card-background px-3 text-sm font-medium text-primary-text hover:bg-background transition-colors cursor-pointer"
      :title="themeStore.isDark ? 'Switch to light theme' : 'Switch to dark theme'"
      @click="themeStore.toggleTheme()"
    >
      <span class="material-symbols-outlined text-[18px] text-primary-yellow">
        {{ themeStore.isDark ? "light_mode" : "dark_mode" }}
      </span>
      <span class="text-xs text-secondary-text hidden sm:inline">
        {{ themeStore.isDark ? "Light" : "Dark" }}
      </span>
    </button>
    <router-view />
  </div>
</template>

<script setup>
import { useThemeStore } from "@/stores/theme/theme";

const themeStore = useThemeStore();
</script>
