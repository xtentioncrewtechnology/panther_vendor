<template>
  <nav
    class="bg-navbar text-navbar-text h-full flex flex-col fixed z-30 transition-all duration-300 border-r border-navbar-border"
    :class="[
      railCollapsed ? 'w-60 lg:w-20' : 'w-60',
      isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
    ]"
  >
    <div
      class="px-3 py-3 font-bold text-base mb-2 border-b border-navbar-border tracking-tight"
      :class="railCollapsed ? 'lg:text-center' : ''"
    >
      <span v-if="!railCollapsed">Vendor</span>
      <span v-else class="text-primary">V</span>
    </div>

    <div class="flex flex-col px-2 gap-1 flex-1 overflow-y-auto no-scrollbar">
      <router-link
        to="/vendor/transfers"
        active-class="!bg-primary !text-btn-text-primary shadow-sm"
        class="flex items-center h-10 px-3 text-navbar-muted hover:text-navbar-text hover:bg-navbar-hover rounded-xl transition-colors font-medium text-sm"
        :class="railCollapsed ? 'lg:justify-center lg:px-0' : ''"
        @click="$emit('close')"
      >
        <span
          class="material-symbols-outlined text-[20px]"
          :class="railCollapsed ? 'lg:mr-0 mr-2.5' : 'mr-2.5'"
        >
          payments
        </span>
        <span v-if="!railCollapsed">Vendor Queue</span>
      </router-link>
    </div>

    <!-- Bottom: profile + logout -->
    <div class="mt-auto border-t border-navbar-border">
      <div v-if="!railCollapsed" class="px-2 pt-2">
        <button
          type="button"
          @click="handleLogout"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-primary-red/90 hover:text-primary-red hover:bg-primary-red/10 transition-colors cursor-pointer"
        >
          <span class="material-symbols-outlined text-[20px]">logout</span>
          <span class="text-xs font-semibold">Logout</span>
        </button>
      </div>

      <div
        class="flex items-center gap-2 p-3"
        :class="railCollapsed ? 'lg:flex-col' : ''"
      >
        <button
          type="button"
          class="flex items-center gap-3 min-w-0 flex-1 rounded-xl p-1.5 hover:bg-navbar-hover transition-colors cursor-pointer text-left"
          :class="railCollapsed ? 'lg:justify-center lg:flex-none' : ''"
          :title="profile.displayName"
          @click="goProfile"
        >
          <div
            class="shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-btn-text-primary"
          >
            {{ profile.initials }}
          </div>
          <div v-if="!railCollapsed" class="min-w-0 flex-1">
            <p class="text-xs font-semibold text-navbar-text truncate leading-tight">
              {{ profile.displayName }}
            </p>
            <p class="text-[11px] text-navbar-muted truncate mt-0.5">
              {{ profile.roleLabel }}
            </p>
          </div>
        </button>

        <button
          v-if="railCollapsed"
          type="button"
          @click="handleLogout"
          class="text-primary-red/80 hover:text-primary-red cursor-pointer flex items-center justify-center p-1.5 rounded-lg hover:bg-primary-red/10 transition-colors"
          aria-label="Logout"
          title="Logout"
        >
          <span class="material-symbols-outlined text-[20px]">logout</span>
        </button>

        <button
          type="button"
          @click="$emit('toggle-collapse')"
          class="hidden lg:flex text-navbar-muted hover:text-navbar-text cursor-pointer items-center justify-center p-1.5 rounded-lg hover:bg-navbar-hover transition-colors shrink-0"
          aria-label="Collapse sidebar"
        >
          <span v-if="!railCollapsed" class="material-symbols-outlined">chevron_left</span>
          <span v-else class="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";
import { useProfileStore } from "@/stores/profile/profile";

const props = defineProps({
  isOpen: Boolean,
  isCollapsed: Boolean,
});
const emit = defineEmits(["close", "toggle-collapse"]);

const router = useRouter();
const profile = useProfileStore();
const isDesktop = ref(false);

const railCollapsed = computed(() => props.isCollapsed && isDesktop.value);

const updateDesktop = () => {
  isDesktop.value = window.matchMedia("(min-width: 1024px)").matches;
};

const onKeydown = (event) => {
  if (event.key === "Escape" && props.isOpen && !isDesktop.value) {
    emit("close");
  }
};

const goProfile = () => {
  emit("close");
  router.push({ name: "Profile" });
};

const handleLogout = () => {
  emit("close");
  profile.logout();
};

onMounted(() => {
  if (!profile.user) profile.fetchUserProfile();
  updateDesktop();
  window.addEventListener("resize", updateDesktop);
  window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateDesktop);
  window.removeEventListener("keydown", onKeydown);
});
</script>
