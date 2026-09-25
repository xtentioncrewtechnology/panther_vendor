<template>
  <div>
    <router-view />
    <Snackbar />
  </div>
</template>

<script setup>
import Snackbar from '@/components/common/snackbar.vue'
</script>