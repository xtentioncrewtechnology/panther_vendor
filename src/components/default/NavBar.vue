<template>
  <nav 
    class="bg-black text-white h-full flex flex-col fixed z-30 transition-all duration-300"
    :class="[
      isCollapsed ? 'w-20' : 'w-60',
      isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    ]"
  >
    <div class="p-4 font-bold text-xl mb-4 border-b border-gray-800">
      <span v-if="!isCollapsed">Admin Logo</span>
      <span v-else>AL</span>
    </div>
    
    <!-- Navigation Links -->
    <div class="flex flex-col px-2 gap-2">
      <router-link to="/vendor/transfers" active-class="bg-[linear-gradient(180deg,#E0CA3C_0%,#FFE74D_100%)] text-black" class="flex items-center px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg transition-colors font-semibold shadow-sm">
        <span class="material-symbols-outlined mr-3">payments</span>
        <span v-if="!isCollapsed">Vendor Queue</span>
      </router-link>
    </div>

    <!-- Desktop Collapse Toggle -->
    <div class="mt-auto border-t border-gray-800 p-4 hidden lg:flex justify-end">
      <button @click="$emit('toggle-collapse')" class="text-gray-400 hover:text-white cursor-pointer flex items-center justify-center">
        <span v-if="!isCollapsed" class="material-symbols-outlined">chevron_left</span>
        <span v-else class="material-symbols-outlined">chevron_right</span>
      </button>
    </div>
  </nav>
</template>

<script setup>
defineProps({
  isOpen: Boolean,
  isCollapsed: Boolean
});
defineEmits(['close', 'toggle-collapse']);
</script>
