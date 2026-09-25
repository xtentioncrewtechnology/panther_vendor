<template>
  <nav
    class="bg-navbar text-navbar-text h-full flex flex-col fixed z-30 transition-all duration-300 border-r border-navbar-border"
    :class="[
      isCollapsed ? 'w-20' : 'w-60',
      isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
    ]"
  >
    <div
      class="p-4 font-bold text-xl mb-4 border-b border-navbar-border tracking-tight"
    >
      <span v-if="!isCollapsed">Admin Logo</span>
      <span v-else class="text-primary">AL</span>
    </div>

    <div class="flex flex-col px-2 gap-1.5 flex-1">
      <router-link
        to="/vendor/transfers"
        active-class="!bg-primary !text-btn-text-primary shadow-sm"
        class="flex items-center px-4 py-3 text-navbar-muted hover:text-navbar-text hover:bg-navbar-hover rounded-xl transition-colors font-semibold"
      >
        <span class="material-symbols-outlined mr-3 text-[22px]">payments</span>
        <span v-if="!isCollapsed">Vendor Queue</span>
      </router-link>
    </div>

    <div
      class="border-t border-navbar-border p-4 hidden lg:flex justify-end"
    >
      <button
        type="button"
        @click="$emit('toggle-collapse')"
        class="text-navbar-muted hover:text-navbar-text cursor-pointer flex items-center justify-center p-1.5 rounded-lg hover:bg-navbar-hover transition-colors"
        aria-label="Collapse sidebar"
      >
        <span v-if="!isCollapsed" class="material-symbols-outlined">chevron_left</span>
        <span v-else class="material-symbols-outlined">chevron_right</span>
      </button>
    </div>
  </nav>
</template>

<script setup>
defineProps({
  isOpen: Boolean,
  isCollapsed: Boolean,
});
defineEmits(["close", "toggle-collapse"]);
</script>
