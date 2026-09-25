<template>
  <header class="bg-white shadow-md border-b border-gray-200 h-16 flex items-center justify-between px-4 relative z-10">
    <button @click="$emit('toggle-sidebar')" class="text-gray-500 hover:text-gray-700 lg:hidden flex items-center justify-center">
      <span class="material-symbols-outlined">menu</span>
    </button>
    <div>
      <span class="text-sm text-gray-700 font-semibold">Admin User</span>
    </div>
  </header>
</template>

<script setup>
defineEmits(['toggle-sidebar']);
</script>
