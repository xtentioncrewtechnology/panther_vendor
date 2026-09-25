<template>
  <div class="flex flex-col items-center justify-center h-full text-center">
    <h2 class="text-xl font-semibold mb-2">Access Denied</h2>
    <p class="text-gray-500 mb-4">You do not have permission to view this page.</p>
    <button @click="$emit('retry')" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
      Retry
    </button>
  </div>
</template>

<script setup>
defineEmits(['retry']);
</script>
