<template>
  <div class="min-h-screen bg-background text-primary-text relative">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useThemeStore } from "@/stores/theme";

const themeStore = useThemeStore();

onMounted(() => {
  themeStore.setTheme("light");
});
</script>
