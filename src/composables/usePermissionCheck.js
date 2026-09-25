import { ref } from 'vue';

export function usePermissionCheck() {
  const hasNoPermissions = ref(false);

  return {
    hasNoPermissions
  };
}
