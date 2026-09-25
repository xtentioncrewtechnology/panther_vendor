import { defineStore } from 'pinia';

export const useProfileStore = defineStore('profile', {
  state: () => ({
    user: null,
  }),
  actions: {
    async fetchUserProfile() {
      // Placeholder for fetching user profile
      this.user = { name: 'Admin User' };
    }
  }
});
