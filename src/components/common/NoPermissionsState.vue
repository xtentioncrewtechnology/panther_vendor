<template>
  <EmptyState
    title="Access Denied"
    description="You do not have permission to view this page."
    icon="lock"
  >
    <template #action>
      <button type="button" class="btn-primary" @click="$emit('retry')">
        Retry
      </button>
    </template>
  </EmptyState>
</template>

<script setup>
import EmptyState from "./EmptyState.vue";

defineEmits(["retry"]);
</script>
