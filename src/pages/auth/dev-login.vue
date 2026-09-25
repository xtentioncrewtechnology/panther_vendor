<script setup>
import { ref, reactive, onMounted } from "vue";
import { useSnackbarStore } from "@/stores/snackbar/snackbar";
import apiRequest from "@/api/request";
import authToken from "@/common/authToken";
import urls from "@/api/urls";
import { useRouter } from "vue-router";
import { useMyPermissionsStore } from "@/stores/rbac/myPermissions";
import BaseSelect from "@/components/common/BaseSelect.vue";

const router = useRouter();
const snackbar = useSnackbarStore();

const loading = ref(false);
const showPassword = ref(false);

const presetUrls = [
  { label: "Vaibhav Anand", value: "https://zpj8dpf6-2504.inc1.devtunnels.ms" },
  { label: "Pulkit 💦", value: "https://848ncvt5-2504.euw.devtunnels.ms" },
  { label: "Lokesh", value: "https://ls01t281-2504.inc1.devtunnels.ms" },
  { label: "Production", value: "https://1pz4zm0b-2504.euw.devtunnels.ms" },
  { label: "Sarkari", value: "https://w2llv2cm-2504.inc1.devtunnels.ms" },
];

const form = reactive({
  email: "",
  password: "",
  baseUrl: "",
});

const errors = reactive({
  email: "",
  password: "",
  baseUrl: "",
});

// Load saved custom base URL on mounted
onMounted(() => {
  const savedUrl = localStorage.getItem("custom_base_url");
  if (savedUrl) {
    form.baseUrl = savedUrl;
  }
});

// ─── Validation ─────────────────────────────────────────
const validate = () => {
  let valid = true;

  if (!form.email) {
    errors.email = "Email is required.";
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email address.";
    valid = false;
  }

  if (!form.password) {
    errors.password = "Password is required.";
    valid = false;
  } else if (form.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
    valid = false;
  }

  if (!form.baseUrl) {
    errors.baseUrl = "Base URL is required.";
    valid = false;
  } else {
    try {
      const url = new URL(form.baseUrl.trim());
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        errors.baseUrl = "URL must start with http:// or https://";
        valid = false;
      }
    } catch (_) {
      errors.baseUrl = "Enter a valid URL.";
      valid = false;
    }
  }

  return valid;
};

const clearError = (field) => {
  errors[field] = "";
};

const resetToDefault = () => {
  form.baseUrl = "";
  localStorage.removeItem("custom_base_url");
  snackbar.show("Target Base URL reset to default.", "success");
};

// ─── API Call ─────────────────────────────────────────
const handleLogin = () => {
  if (!validate()) return;

  loading.value = true;

  // Save the custom URL first so the login request hits this URL
  localStorage.setItem("custom_base_url", form.baseUrl.trim());

  const successHandler = async (res) => {
    authToken.setToken(res.access_token);
    const myPermissionsStore = useMyPermissionsStore();
    try {
      await myPermissionsStore.fetchMyPermissions(true);
    } catch (_) {
      // ignore
    }
    loading.value = false;
    snackbar.show("Connected to target host successfully.", "success");
    const targetPath = myPermissionsStore.firstAllowedPath || "/dashboard";
    router.push(targetPath).catch(() => {
      window.location.href = targetPath;
    });
  };

  const failureHandler = (err) => {
    loading.value = false;
    snackbar.show(
      err?.error || "Authentication failed on target host.",
      "error",
    );
  };

  apiRequest(urls.KEYS.POST, urls.auth.login, {
    data: {
      email: form.email,
      password: form.password,
    },
    isTokenRequired: false,
    onSuccess: successHandler,
    onFailure: failureHandler,
  });
};
</script>

<template>
  <div class="min-h-screen flex bg-background">
    <!-- LEFT SIDE -->
    <div class="hidden lg:flex lg:w-1/2 p-4">
      <div class="w-full h-full overflow-hidden rounded-2xl shadow-xl bg-card-background border border-primary-border">
        <div class="w-full h-full bg-gradient-to-tr from-blue-900 to-indigo-900 flex items-center justify-center text-primary-text">
          <span class="text-3xl font-bold tracking-widest opacity-20">DEV</span>
        </div>
      </div>
    </div>

    <!-- RIGHT SIDE -->
    <div class="w-full lg:w-1/2 flex items-center justify-center px-6 py-10 bg-background">
      <div class="w-full max-w-md">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="flex justify-center mb-6">
            <div class="w-16 h-16 rounded-2xl bg-card-background border border-primary-border shadow-sm flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
          </div>

          <h1 class="title-text">Developer Login Override</h1>
          <p class="sub-text text-primary-yellow mt-2 font-medium">Target custom environments in production</p>
        </div>

        <!-- Form -->
        <div class="space-y-6">
          
          <!-- Base URL Override -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-sm font-medium text-primary-text">Target Base URL</label>
              <button
                v-if="form.baseUrl"
                type="button"
                @click="resetToDefault"
                class="text-xs text-primary-red hover:underline font-medium transition cursor-pointer"
              >
                Reset to Default
              </button>
            </div>

            <div class="space-y-3">
              <BaseSelect
                v-model="form.baseUrl"
                :options="presetUrls"
                placeholder="Select environment preset..."
                searchable
                local-search
                variant="surface"
                py="2.5"
                @update:modelValue="clearError('baseUrl')"
              />

              <div class="relative">
                <input
                  v-model="form.baseUrl"
                  type="text"
                  placeholder="Or enter custom URL..."
                  class="input-field w-full px-4 py-3 text-sm"
                  :class="{ 'border-primary-red': errors.baseUrl }"
                  @focus="clearError('baseUrl')"
                  @keyup.enter="handleLogin"
                />
              </div>
            </div>
            <p v-if="errors.baseUrl" class="text-xs text-primary-red mt-1">{{ errors.baseUrl }}</p>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-primary-text mb-2">Super Admin Email</label>
            <input
              v-model="form.email"
              type="email"
              placeholder="you@example.com"
              class="input-field w-full px-4 py-3 text-sm"
              :class="{ 'border-primary-red': errors.email }"
              @focus="clearError('email')"
            />
            <p v-if="errors.email" class="text-xs text-primary-red mt-1">{{ errors.email }}</p>
          </div>

          <!-- Password -->
          <div>
            <label class="block text-sm font-medium text-primary-text mb-2">Password</label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                class="input-field w-full px-4 py-3 pr-11 text-sm"
                :class="{ 'border-primary-red': errors.password }"
                @focus="clearError('password')"
                @keyup.enter="handleLogin"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text transition cursor-pointer"
                @click="showPassword = !showPassword"
              >
                <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a10.05 10.05 0 015.188-1.583c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.29-3.29" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
            <p v-if="errors.password" class="text-xs text-primary-red mt-1">{{ errors.password }}</p>
          </div>

          <!-- Submit -->
          <button
            type="button"
            @click="handleLogin"
            :disabled="loading"
            class="w-full rounded-lg bg-primary py-3 text-sm font-medium text-white hover:bg-primary-hover transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg v-if="loading" class="w-4 h-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ loading ? "Connecting..." : "Connect to Environment" }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
