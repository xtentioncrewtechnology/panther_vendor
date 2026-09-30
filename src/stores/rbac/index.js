import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useMyPermissionsStore = defineStore('myPermissions', () => {
  const permissions = ref([]);

  function fetchMyPermissions(retry = false) {
    // Placeholder for fetching permissions
    permissions.value = ['ALL'];
  }

  return {
    permissions,
    fetchMyPermissions
  };
});
