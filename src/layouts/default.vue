<script setup>
import TopBar from "@/components/default/TopBar.vue";
</script>

<template>
  <div class="flex flex-col h-screen w-full overflow-hidden bg-background text-primary-text transition-colors duration-200">
    <!-- Top Bar with Horizontal Navigation -->
    <TopBar />

    <!-- Main Content Area -->
    <main
      class="flex-1 overflow-y-auto no-scrollbar bg-background p-3 lg:p-5"
    >
      <router-view />
    </main>
  </div>
</template>
