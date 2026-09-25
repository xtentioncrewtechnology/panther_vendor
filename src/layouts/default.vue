<script setup>
import { ref } from "vue";
import NavBar from "@/components/default/NavBar.vue";
import TopBar from "@/components/default/TopBar.vue";

const SIDEBAR_COLLAPSED_KEY = "panther_sidebar_collapsed";
const storedSidebarCollapsed =
  typeof window !== "undefined"
    ? localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true"
    : false;

const sidebarOpen = ref(false);
const isSidebarCollapsed = ref(storedSidebarCollapsed);

const setSidebarCollapsed = (value) => {
  isSidebarCollapsed.value = value;
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(value));
};

const toggleSidebarCollapsed = () => {
  setSidebarCollapsed(!isSidebarCollapsed.value);
};
</script>

<template>
  <div class="flex h-screen w-full overflow-hidden bg-background text-primary-text transition-colors duration-200">
    <!-- NavBar Sidebar -->
    <NavBar
      :is-open="sidebarOpen"
      :is-collapsed="isSidebarCollapsed"
      @close="sidebarOpen = false"
      @toggle-collapse="toggleSidebarCollapsed"
    />

    <!-- Main column — offset by sidebar width only on desktop -->
    <div
      class="flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out ml-0"
      :class="isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-60'"
    >
      <!-- Top Bar -->
      <TopBar @toggle-sidebar="sidebarOpen = !sidebarOpen" />

      <!-- Router View Area -->
      <main
        class="flex-1 overflow-y-auto no-scrollbar bg-background p-4 lg:p-6"
      >
        <router-view />
      </main>
    </div>
  </div>
</template>
