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
  <div class="dev-login min-h-screen flex bg-background">
    <!-- LEFT SIDE -->
    <div class="hidden lg:flex lg:w-[48%] p-5">
      <div class="dev-login__panel relative w-full h-full overflow-hidden rounded-3xl shadow-2xl">
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(59,130,246,0.35),transparent_55%),radial-gradient(ellipse_at_80%_80%,rgba(15,23,42,0.9),transparent_50%),linear-gradient(145deg,#0c1a3a_0%,#0f172a_45%,#1e3a5f_100%)]" />
        <div class="dev-login__grid absolute inset-0 opacity-[0.12]" />
        <div class="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-primary/20 blur-3xl" />
        <div class="absolute -bottom-20 -right-10 w-80 h-80 rounded-full bg-blue-500/15 blur-3xl" />

        <div class="relative z-10 h-full flex flex-col items-center justify-center px-10 text-center">
          <div class="mb-8 w-20 h-20 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <p class="text-[11px] font-semibold tracking-[0.35em] uppercase text-primary mb-3">
            Local Override
          </p>
          <h2 class="text-5xl font-bold tracking-[0.2em] text-white/25 select-none">
            DEV
          </h2>
          <p class="mt-6 max-w-xs text-sm leading-relaxed text-slate-300/80">
            Point this build at a tunnel or staging host without changing env files.
          </p>
        </div>
      </div>
    </div>

    <!-- RIGHT SIDE -->
    <div class="w-full lg:w-[52%] flex items-center justify-center px-6 sm:px-10 py-12 bg-background">
      <div class="dev-login__form w-full max-w-[420px]">
        <!-- Header -->
        <div class="text-center mb-9">
          <div class="flex justify-center mb-5">
            <div class="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 shadow-sm flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-primary-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
          </div>

          <h1 class="text-2xl font-semibold tracking-tight text-primary-text">
            Developer Login Override
          </h1>
          <p class="text-[13px] text-primary-yellow mt-2 font-medium">
            Target custom environments in production
          </p>
        </div>

        <!-- Form -->
        <div class="space-y-5">
          <!-- Base URL Override -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-[13px] font-semibold text-primary-text">
                Target Base URL
              </label>
              <button
                v-if="form.baseUrl"
                type="button"
                @click="resetToDefault"
                class="text-xs text-primary-red hover:underline font-medium transition cursor-pointer"
              >
                Reset to Default
              </button>
            </div>

            <div class="space-y-2.5 rounded-xl border border-primary-border bg-card-background/80 p-3">
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
                <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-text">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </span>
                <input
                  v-model="form.baseUrl"
                  type="text"
                  placeholder="Or enter custom URL..."
                  class="input-field w-full pl-10 pr-4 py-3 text-sm rounded-xl"
                  :class="{ 'border-primary-red': errors.baseUrl }"
                  @focus="clearError('baseUrl')"
                  @keyup.enter="handleLogin"
                />
              </div>
            </div>
            <p v-if="errors.baseUrl" class="text-xs text-primary-red mt-1.5">{{ errors.baseUrl }}</p>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-[13px] font-semibold text-primary-text mb-2">
              Super Admin Email
            </label>
            <div class="relative">
              <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-text">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </span>
              <input
                v-model="form.email"
                type="email"
                placeholder="you@example.com"
                class="input-field w-full pl-10 pr-4 py-3 text-sm rounded-xl"
                :class="{ 'border-primary-red': errors.email }"
                @focus="clearError('email')"
              />
            </div>
            <p v-if="errors.email" class="text-xs text-primary-red mt-1.5">{{ errors.email }}</p>
          </div>

          <!-- Password -->
          <div>
            <label class="block text-[13px] font-semibold text-primary-text mb-2">
              Password
            </label>
            <div class="relative">
              <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-text">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                class="input-field w-full pl-10 pr-11 py-3 text-sm rounded-xl"
                :class="{ 'border-primary-red': errors.password }"
                @focus="clearError('password')"
                @keyup.enter="handleLogin"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text transition cursor-pointer p-1"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
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
            <p v-if="errors.password" class="text-xs text-primary-red mt-1.5">{{ errors.password }}</p>
          </div>

          <!-- Submit -->
          <button
            type="button"
            @click="handleLogin"
            :disabled="loading"
            class="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-btn-text-primary hover:bg-primary-hover shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2 cursor-pointer mt-1"
          >
            <svg v-if="loading" class="w-4 h-4 animate-spin text-btn-text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ loading ? "Connecting..." : "Connect to Environment" }}</span>
          </button>

          <p class="text-center text-[11px] text-secondary-text pt-1">
            Credentials are sent only to the target base URL you set above.
          </p>
        </div>
      </div>
    </div>
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
