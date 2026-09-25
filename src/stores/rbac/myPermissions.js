import { defineStore } from 'pinia';

export const useMyPermissionsStore = defineStore('myPermissions', {
  state: () => ({
    permissions: [],
  }),
  actions: {
    fetchMyPermissions(retry = false) {
      // Placeholder for fetching permissions
      this.permissions = ['ALL'];
    }
  }
});
