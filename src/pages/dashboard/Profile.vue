<template>
  <div class="flex flex-col gap-3 max-w-2xl">
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="flex h-8 w-8 items-center justify-center rounded-full border border-primary-border bg-card-background text-primary-text hover:bg-background transition-colors cursor-pointer"
        aria-label="Go back"
        @click="router.back()"
      >
        <span class="material-symbols-outlined text-[18px]">arrow_back</span>
      </button>
      <div class="flex items-center gap-2 flex-wrap">
        <h1 class="page-title">Profile</h1>
        <span
          v-if="profile.user || !profileLoading"
          class="inline-flex items-center rounded-full border border-primary-blue/30 bg-primary-blue/10 px-2 py-0.5 text-[11px] font-semibold text-primary-blue"
        >
          {{ profile.roleLabel }}
        </span>
      </div>
    </div>

    <div
      v-if="profileLoading"
      class="rounded-xl border border-primary-border bg-card-background p-4 animate-pulse"
    >
      <div class="flex gap-3 items-start">
        <div class="h-12 w-12 rounded-full bg-background" />
        <div class="flex-1 space-y-2">
          <div class="h-4 w-40 rounded bg-background" />
          <div class="h-3 w-56 rounded bg-background" />
          <div class="h-3 w-32 rounded bg-background" />
        </div>
      </div>
    </div>

    <EmptyState
      v-else-if="!profile.user"
      title="Profile unavailable"
      description="We couldn’t load your account details. Try again or sign in again."
      icon="person_off"
    >
      <template #action>
        <button type="button" class="btn-primary" @click="reloadProfile">
          Retry
        </button>
      </template>
    </EmptyState>

    <div
      v-else
      class="relative rounded-xl border border-primary-border bg-card-background p-3.5 sm:p-4 shadow-sm"
    >
      <button
        type="button"
        class="absolute top-3 right-3 inline-flex items-center gap-1 rounded-lg border border-primary-red/25 bg-primary-red/10 px-2.5 py-1.5 text-xs font-semibold text-primary-red hover:bg-primary-red/15 transition-colors cursor-pointer"
        @click="profile.logout()"
      >
        <span class="material-symbols-outlined text-[16px]">logout</span>
        Logout
      </button>

      <div class="flex flex-col sm:flex-row gap-3 sm:items-start pr-20">
        <div
          class="relative shrink-0 h-12 w-12 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-btn-text-primary shadow-sm"
        >
          {{ profile.initials }}
        </div>

        <div class="min-w-0 flex-1 space-y-2.5">
          <div>
            <h2 class="title-text truncate">
              {{ profile.displayName }}
            </h2>
            <div
              v-if="profile.userId"
              class="mt-1.5 inline-flex items-center gap-1 rounded-md bg-navbar text-navbar-text px-2 py-0.5 text-[11px] font-medium"
            >
              UID: {{ profile.userId }}
              <button
                type="button"
                class="text-navbar-muted hover:text-navbar-text cursor-pointer"
                aria-label="Copy UID"
                @click="copyUid"
              >
                <span class="material-symbols-outlined text-[12px]">content_copy</span>
              </button>
            </div>
          </div>

          <div class="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-secondary-text">
            <div v-if="profile.email" class="inline-flex items-center gap-1.5 min-w-0">
              <span class="material-symbols-outlined text-[16px]">mail</span>
              <span class="truncate text-primary-text">{{ profile.email }}</span>
            </div>
            <div
              v-if="profile.user?.country"
              class="inline-flex items-center gap-1.5"
            >
              <span class="material-symbols-outlined text-[16px]">location_on</span>
              <span>{{ profile.user.country }}</span>
            </div>
            <div
              v-if="profile.user?.phone_number"
              class="inline-flex items-center gap-1.5"
            >
              <span class="material-symbols-outlined text-[16px]">call</span>
              <span>{{ profile.user.phone_number }}</span>
            </div>
            <div
              v-if="profile.user?.created_at"
              class="inline-flex items-center gap-1.5"
            >
              <span class="material-symbols-outlined text-[16px]">schedule</span>
              <span>Joined: {{ formatDate(profile.user.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p class="text-xs text-secondary-text">
      Please contact our
      <span class="font-semibold text-primary-text">Support Service</span>
      to make changes to your personal information.
    </p>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useProfileStore } from "@/stores/profile/profile";
import { useSnackbarStore } from "@/stores/snackbar/snackbar";
import EmptyState from "@/components/common/EmptyState.vue";

const router = useRouter();
const profile = useProfileStore();
const snackbar = useSnackbarStore();
const profileLoading = ref(false);

const formatDate = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
};

const copyUid = async () => {
  if (!profile.userId) return;
  try {
    await navigator.clipboard.writeText(String(profile.userId));
    snackbar.show("UID copied", "success");
  } catch {
    snackbar.show("Could not copy UID", "error");
  }
};

const reloadProfile = async () => {
  profileLoading.value = true;
  try {
    await profile.fetchUserProfile();
  } finally {
    profileLoading.value = false;
  }
};

onMounted(async () => {
  if (!profile.user) {
    await reloadProfile();
  }
});
</script>
