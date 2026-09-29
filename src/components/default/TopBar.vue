<template>
  <header
    class="bg-topbar border-b border-primary-border h-16 flex items-center justify-between px-4 lg:px-6 relative z-10"
  >
    <!-- Left: Logo & Navigation -->
    <div class="flex items-center gap-6 min-w-0">
      <!-- Logo -->
      <div class="font-bold text-lg text-primary-text tracking-tight flex items-center gap-2">
        <span class="text-primary material-symbols-outlined">storefront</span>
        <span class="hidden sm:inline">Vendor Portal</span>
      </div>

    </div>

    <!-- Right: Theme, Profile, Logout -->
    <div class="flex items-center gap-3">
      <!-- Theme Toggle -->
      <button
        type="button"
        @click="themeStore.toggleTheme()"
        class="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-primary-border bg-card-background text-secondary-text hover:text-primary-text hover:bg-background transition-colors cursor-pointer"
        :title="themeStore.isDark ? 'Switch to light theme' : 'Switch to dark theme'"
      >
        <span class="material-symbols-outlined text-[18px]" :class="themeStore.isDark ? 'text-primary-yellow' : ''">
          {{ themeStore.isDark ? "light_mode" : "dark_mode" }}
        </span>
      </button>

      <!-- Profile -->
      <button
        type="button"
        @click="goProfile"
        class="flex items-center gap-2 pl-3 border-l border-primary-border cursor-pointer hover:opacity-80 transition-opacity text-left"
      >
        <div
          class="shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-btn-text-primary"
        >
          {{ profile.initials }}
        </div>
        <div class="hidden sm:block min-w-0">
          <p class="text-xs font-semibold text-primary-text truncate leading-tight">
            {{ profile.displayName }}
          </p>
          <p class="text-[11px] text-secondary-text truncate mt-0.5">
            {{ profile.roleLabel }}
          </p>
        </div>
      </button>

      <!-- Logout -->
      <button
        type="button"
        @click="handleLogout"
        class="text-primary-red/80 hover:text-primary-red cursor-pointer flex items-center justify-center h-9 w-9 rounded-xl hover:bg-primary-red/10 transition-colors ml-1"
        title="Logout"
      >
        <span class="material-symbols-outlined text-[20px]">logout</span>
      </button>
    </div>
  </header>
</template>

<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useThemeStore } from "@/stores/theme/theme";
import { useProfileStore } from "@/stores/profile/profile";

const router = useRouter();
const themeStore = useThemeStore();
const profile = useProfileStore();

const goProfile = () => {
  router.push({ name: "Profile" });
};

const handleLogout = () => {
  const theme = localStorage.getItem("theme");
  localStorage.clear();
  if (theme) {
    localStorage.setItem("theme", theme);
  }
  
  // Clear pinia state manually since logout() didn't exist
  profile.user = null;
  
  router.push({ name: "Login" });
};

onMounted(() => {
  if (!profile.user) profile.fetchUserProfile();
});
</script>
