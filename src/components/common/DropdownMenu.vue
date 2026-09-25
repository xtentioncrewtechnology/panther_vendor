<template>
  <div class="relative inline-block text-left">
    <!-- Dummy DropdownMenu component for DataTable fallback -->
  </div>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    default: () => []
  },
  position: {
    type: String,
    default: 'bottom-end'
  }
});
defineEmits(['select']);
</script>
