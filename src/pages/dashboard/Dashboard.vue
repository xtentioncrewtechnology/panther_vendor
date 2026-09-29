<template>
  <div class="flex flex-col gap-4 max-w-3xl">
    <div>
      <p class="section-label mb-1">Home</p>
      <h1 class="page-title">Operations</h1>
      <p class="page-subtitle">
        Welcome back{{ profile.displayName ? `, ${profile.displayName}` : "" }}.
        Jump into your assigned transfer queue.
      </p>
    </div>

    <router-link
      to="/vendor/transfers"
      class="group rounded-2xl border border-primary-border bg-card-background p-5 shadow-sm hover:border-primary/50 hover:bg-primary/5 transition-colors"
    >
      <div class="flex items-start gap-4">
        <div
          class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-btn-text-primary shrink-0"
        >
          <span class="material-symbols-outlined text-[24px]">payments</span>
        </div>
        <div class="min-w-0 flex-1">
          <h2 class="title-text group-hover:text-primary-text">Vendor Queue</h2>
          <p class="mt-1 text-xs text-secondary-text leading-relaxed">
            Review assigned bank-transfer deposits and withdrawals, attach proof, and complete or reject.
          </p>
          <span
            class="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary-yellow"
          >
            Open queue
            <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
          </span>
        </div>
      </div>
    </router-link>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useProfileStore } from "@/stores/profile/profile";

const profile = useProfileStore();

onMounted(() => {
  if (!profile.user) profile.fetchUserProfile();
});
</script>
