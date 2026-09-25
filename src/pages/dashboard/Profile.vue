<template>
  <div class="flex flex-col gap-5 max-w-4xl">
    <div class="flex items-center gap-3">
      <button
        type="button"
        @click="router.back()"
        class="flex h-10 w-10 items-center justify-center rounded-full border border-primary-border bg-card-background text-primary-text hover:bg-background transition-colors cursor-pointer"
        aria-label="Go back"
      >
        <span class="material-symbols-outlined text-[22px]">arrow_back</span>
      </button>
      <div class="flex items-center gap-3 flex-wrap">
        <h1 class="text-2xl font-semibold tracking-tight text-primary-text">
          Profile
        </h1>
        <span
          class="inline-flex items-center rounded-full border border-primary-blue/30 bg-primary-blue/10 px-2.5 py-0.5 text-xs font-semibold text-primary-blue"
        >
          {{ profile.roleLabel }}
        </span>
      </div>
    </div>

    <div
      class="relative rounded-2xl border border-primary-border bg-card-background p-5 sm:p-6 shadow-sm"
    >
      <button
        type="button"
        @click="profile.logout()"
        class="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-xl border border-primary-red/25 bg-primary-red/10 px-3 py-2 text-sm font-semibold text-primary-red hover:bg-primary-red/15 transition-colors cursor-pointer"
      >
        <span class="material-symbols-outlined text-[18px]">logout</span>
        Logout
      </button>

      <div class="flex flex-col sm:flex-row gap-5 sm:items-start pr-24">
        <div
          class="relative shrink-0 h-20 w-20 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-btn-text-primary shadow-sm"
        >
          {{ profile.initials }}
        </div>

        <div class="min-w-0 flex-1 space-y-4">
          <div>
            <h2 class="text-xl font-semibold text-primary-text truncate">
              {{ profile.displayName }}
            </h2>
            <div
              v-if="profile.userId"
              class="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-navbar text-navbar-text px-2.5 py-1 text-xs font-medium"
            >
              UID: {{ profile.userId }}
              <button
                type="button"
                class="text-navbar-muted hover:text-navbar-text cursor-pointer"
                @click="copyUid"
                aria-label="Copy UID"
              >
                <span class="material-symbols-outlined text-[14px]">content_copy</span>
              </button>
            </div>
          </div>

          <div
            class="flex flex-wrap gap-x-6 gap-y-3 text-sm text-secondary-text"
          >
            <div v-if="profile.email" class="inline-flex items-center gap-2 min-w-0">
              <span class="material-symbols-outlined text-[18px]">mail</span>
              <span class="truncate text-primary-text">{{ profile.email }}</span>
            </div>
            <div
              v-if="profile.user?.country"
              class="inline-flex items-center gap-2"
            >
              <span class="material-symbols-outlined text-[18px]">location_on</span>
              <span>{{ profile.user.country }}</span>
            </div>
            <div
              v-if="profile.user?.phone_number"
              class="inline-flex items-center gap-2"
            >
              <span class="material-symbols-outlined text-[18px]">call</span>
              <span>{{ profile.user.phone_number }}</span>
            </div>
            <div
              v-if="profile.user?.created_at"
              class="inline-flex items-center gap-2"
            >
              <span class="material-symbols-outlined text-[18px]">schedule</span>
              <span>
                Joined:
                {{ formatDate(profile.user.created_at) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p class="text-sm text-secondary-text">
      Please contact our
      <span class="font-semibold text-primary-text">Support Service</span>
      to make changes to your personal information.
    </p>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useProfileStore } from "@/stores/profile/profile";
import { useSnackbarStore } from "@/stores/snackbar/snackbar";

const router = useRouter();
const profile = useProfileStore();
const snackbar = useSnackbarStore();

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

onMounted(() => {
  if (!profile.user) profile.fetchUserProfile();
});
</script>
