<script setup>
import { ref, watch, onBeforeUnmount } from "vue";
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

const closeSidebar = () => {
  sidebarOpen.value = false;
};

watch(sidebarOpen, (open) => {
  if (typeof document === "undefined") return;
  document.body.style.overflow = open ? "hidden" : "";
});

onBeforeUnmount(() => {
  if (typeof document !== "undefined") {
    document.body.style.overflow = "";
  }
});
</script>

<template>
  <div class="flex h-screen w-full overflow-hidden bg-background text-primary-text transition-colors duration-200">
    <!-- Mobile drawer backdrop -->
    <Transition name="sidebar-backdrop">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-20 bg-black/50 backdrop-blur-[1px] lg:hidden"
        aria-hidden="true"
        @click="closeSidebar"
      />
    </Transition>

    <!-- NavBar Sidebar -->
    <NavBar
      :is-open="sidebarOpen"
      :is-collapsed="isSidebarCollapsed"
      @close="closeSidebar"
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

<style scoped>
.sidebar-backdrop-enter-active,
.sidebar-backdrop-leave-active {
  transition: opacity 0.2s ease;
}
.sidebar-backdrop-enter-from,
.sidebar-backdrop-leave-to {
  opacity: 0;
}
</style>
