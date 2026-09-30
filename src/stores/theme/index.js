import { defineStore } from "pinia";
import { computed, ref } from "vue";
import {
  getTheme,
  getSystemTheme,
  initTheme,
  setTheme as applyTheme,
  toggleTheme as flipTheme,
} from "@/utils/theme";

export const useThemeStore = defineStore("theme", () => {
  const mode = ref(getTheme() || getSystemTheme());

  const isDark = computed(() => mode.value === "dark");
  const isLight = computed(() => mode.value === "light");

  function syncFromDom() {
    mode.value = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
  }

  function setTheme(theme) {
    mode.value = applyTheme(theme);
    return mode.value;
  }

  function toggleTheme() {
    mode.value = flipTheme();
    return mode.value;
  }

  function init() {
    mode.value = initTheme();
    return mode.value;
  }

  return {
    mode,
    isDark,
    isLight,
    setTheme,
    toggleTheme,
    init,
    syncFromDom,
  };
});
