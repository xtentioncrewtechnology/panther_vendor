<template>
  <div
    class="flex flex-col items-center justify-center text-center px-6 py-10 gap-3"
  >
    <div
      v-if="icon"
      class="flex h-12 w-12 items-center justify-center rounded-2xl bg-background border border-primary-border text-secondary-text"
    >
      <span class="material-symbols-outlined text-[28px]">{{ icon }}</span>
    </div>
    <div class="space-y-1 max-w-sm">
      <h3 class="title-text text-primary-text">{{ title }}</h3>
      <p v-if="description" class="text-xs text-secondary-text leading-relaxed">
        {{ description }}
      </p>
    </div>
    <div v-if="$slots.action" class="mt-1">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  icon: { type: String, default: "inbox" },
});
</script>
