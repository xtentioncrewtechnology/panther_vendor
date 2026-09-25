import { defineStore } from "pinia";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import authToken from "@/common/authToken";
import router from "@/router";

export const useProfileStore = defineStore("profile", {
  state: () => ({
    user: null,
    loading: false,
    error: null,
  }),

  getters: {
    displayName(state) {
      return state.user?.name || "Admin User";
    },
    email(state) {
      return state.user?.email || "";
    },
    roleLabel(state) {
      const role = state.user?.role || localStorage.getItem("role") || "admin";
      return String(role)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    },
    initials(state) {
      const name = state.user?.name || "A";
      const parts = name.trim().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.slice(0, 1).toUpperCase();
    },
    userId(state) {
      return state.user?.user_id || localStorage.getItem("user_id") || null;
    },
  },

  actions: {
    async fetchUserProfile() {
      this.loading = true;
      this.error = null;
      try {
        const res = await apiRequest(urls.KEYS.GET, urls.auth.profile, {
          onFailure: (err) => {
            this.error = err?.error || err?.message || "Failed to load profile";
          },
        });
        if (res) {
          this.user = res;
          if (res.role) localStorage.setItem("role", res.role);
          if (res.user_id) localStorage.setItem("user_id", String(res.user_id));
        }
      } catch (_) {
        // keep placeholder if request fails (401 handled globally)
      } finally {
        this.loading = false;
      }
    },

    /** Alias used by websocket ticker store */
    async getBrokerProfile() {
      return this.fetchUserProfile();
    },

    logout() {
      this.user = null;
      authToken.removeToken();
      try {
        const channel = new BroadcastChannel("my-channel");
        channel.postMessage({ type: "logout" });
        channel.close();
      } catch (_) {
        // BroadcastChannel may be unavailable
      }
      router.push({ name: "Login" }).catch(() => {
        window.location.href = "/auth/login";
      });
    },
  },
});
