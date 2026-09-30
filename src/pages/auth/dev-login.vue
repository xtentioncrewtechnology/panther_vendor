<script setup>
import { ref, reactive, onMounted } from "vue";
import { useSnackbarStore } from "@/stores/snackbar";
import apiRequest from "@/api/request";
import authToken from "@/common/authToken";
import urls from "@/api/urls";
import { useRouter } from "vue-router";
import { useMyPermissionsStore } from "@/stores/rbac";
import BaseSelect from "@/components/common/BaseSelect.vue";

const router = useRouter();
const snackbar = useSnackbarStore();

const loading = ref(false);
const showPassword = ref(false);

const presetUrls = [
  {
    label: "Vaibhav Anand",
    value: "https://zpj8dpf6-2504.inc1.devtunnels.ms/admin",
  },
  {
    label: "Pulkit 💦",
    value: "https://848ncvt5-2504.euw.devtunnels.ms/admin",
  },
  { label: "Lokesh", value: "https://ls01t281-2504.inc1.devtunnels.ms/admin" },
  {
    label: "Production",
    value: "https://1pz4zm0b-2504.euw.devtunnels.ms/admin",
  },
  { label: "Sarkari", value: "https://w2llv2cm-2504.inc1.devtunnels.ms/admin" },
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
    const targetPath =
      myPermissionsStore.firstAllowedPath || "/vendor/transfers";
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
  <div class="min-h-screen flex bg-white dark:bg-background">
    <!-- Left Side: Form -->
    <div class="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 sm:px-12 py-10 relative order-2 lg:order-1">
      <div class="w-full max-w-105 dev-login__form">
        <!-- Logo -->
        <div class="flex justify-center mb-10">
          <img src="/2.png" alt="Veyntro Logo" class="h-16" />
        </div>

        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Developer Login Override</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">Target custom environments in production</p>
        </div>

        <!-- Form -->
        <div class="space-y-5">
          <!-- Base URL Override -->
          <div class="flex flex-col gap-1.5">
            <div class="flex justify-between items-center">
              <label class="text-xs font-bold text-gray-900 dark:text-primary-text">Target Base URL</label>
              <button
                v-if="form.baseUrl"
                type="button"
                @click="resetToDefault"
                class="text-xs text-red-500 hover:underline font-bold transition cursor-pointer"
              >
                Reset to Default
              </button>
            </div>

            <div class="space-y-2.5 rounded-xl border border-gray-200 dark:border-primary-border bg-gray-50 dark:bg-card-background/80 p-3">
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
                  class="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-primary-border bg-white dark:bg-card-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-900 dark:text-primary-text placeholder-gray-400"
                  :class="{ 'border-red-500 focus:ring-red-500/20 focus:border-red-500': errors.baseUrl }"
                  @focus="clearError('baseUrl')"
                  @keyup.enter="handleLogin"
                />
              </div>
            </div>
            <p v-if="errors.baseUrl" class="text-xs text-red-500 mt-1">{{ errors.baseUrl }}</p>
          </div>

          <!-- Email -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-gray-900 dark:text-primary-text">Super Admin Email</label>
            <input
              v-model="form.email"
              type="email"
              placeholder="you@example.com"
              class="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-primary-border bg-white dark:bg-card-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-900 dark:text-primary-text placeholder-gray-400"
              :class="{ 'border-red-500 focus:ring-red-500/20 focus:border-red-500': errors.email }"
              @focus="clearError('email')"
            />
            <p v-if="errors.email" class="text-xs text-red-500 mt-1">{{ errors.email }}</p>
          </div>

          <!-- Password -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-gray-900 dark:text-primary-text">Password</label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••••"
                class="w-full pl-4 pr-10 py-3 text-sm rounded-xl border border-gray-200 dark:border-primary-border bg-white dark:bg-card-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-900 dark:text-primary-text placeholder-gray-400"
                :class="{ 'border-red-500 focus:ring-red-500/20 focus:border-red-500': errors.password }"
                @focus="clearError('password')"
                @keyup.enter="handleLogin"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              >
                <span class="material-symbols-outlined text-[18px]">
                  {{ showPassword ? "visibility_off" : "visibility" }}
                </span>
              </button>
            </div>
            <p v-if="errors.password" class="text-xs text-red-500 mt-1">{{ errors.password }}</p>
          </div>

          <!-- Submit Button -->
          <button type="button" @click="handleLogin" :disabled="loading" class="w-full bg-[#fcd535] hover:bg-[#f3ca26] text-gray-900 font-bold py-3.5 rounded-xl transition-colors flex justify-center items-center gap-2 mt-4">
            <span
              v-if="loading"
              class="material-symbols-outlined text-[18px] animate-spin"
            >
              progress_activity
            </span>
            <span>{{ loading ? "Connecting..." : "Connect to Environment" }}</span>
          </button>
          
          <p class="text-center text-[11px] text-gray-400 dark:text-secondary-text pt-2">
            Credentials are sent only to the target base URL you set above.
          </p>
        </div>
      </div>
    </div>

    <!-- Right Side: Image -->
    <div
      class="hidden lg:block lg:w-1/2 bg-cover bg-left bg-no-repeat bg-[#0F172A] order-1 lg:order-2"
      style="background-image: url('/3.png'); border-left: 1px solid rgba(0,0,0,0.05);"
    ></div>
  </div>
</template>

<style scoped>
.dev-login__grid {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
  background-size: 32px 32px;
}

.dev-login__panel {
  animation: panel-in 0.55s ease-out both;
}

.dev-login__form {
  animation: form-in 0.5s ease-out 0.08s both;
}

@keyframes panel-in {
  from {
    opacity: 0;
    transform: translateX(-12px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes form-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dev-login__panel,
  .dev-login__form {
    animation: none;
  }
}
</style>
