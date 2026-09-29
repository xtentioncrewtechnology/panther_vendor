<script setup>
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import apiRequest from "@/api/request";
import authToken from "@/common/authToken";
import urls from "@/api/urls";

const router = useRouter();
const loading = ref(false);
const showPassword = ref(false);

const form = reactive({
  email: "",
  password: "",
});

const errors = reactive({
  email: "",
  password: "",
  general: "",
});

const validate = () => {
  let valid = true;
  errors.email = "";
  errors.password = "";
  errors.general = "";

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
  }

  return valid;
};

const handleLogin = () => {
  if (!validate()) return;

  loading.value = true;

  const successHandler = (res) => {
    loading.value = false;
    authToken.setToken(res.access_token);
    if (res.role) {
      localStorage.setItem("role", res.role);
    }
    if (res.user_id) {
      localStorage.setItem("user_id", res.user_id);
    }

    const redirect =
      typeof router.currentRoute.value.query.redirect === "string"
        ? router.currentRoute.value.query.redirect
        : "/vendor/transfers";

    router.push(redirect).catch(() => {
      window.location.href = redirect;
    });
  };

  const failureHandler = (err) => {
    loading.value = false;
    errors.general =
      err?.error || err?.message || "Invalid credentials. Please try again.";
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
  <div
    class="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4 py-10"
  >
    <div
      class="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-primary/15 blur-3xl"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-primary-yellow/10 blur-3xl"
      aria-hidden="true"
    />

    <div class="w-full max-w-md z-10">
      <div
        class="rounded-2xl border border-primary-border bg-card-background shadow-lg p-6 sm:p-8"
      >
        <div class="text-center mb-7">
          <div
            class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-btn-text-primary mb-4 shadow-sm"
          >
            <span class="material-symbols-outlined text-[26px]">payments</span>
          </div>
          <h1 class="page-title">Vendor Portal</h1>
          <p class="page-subtitle">Sign in to review bank transfers</p>
        </div>

        <form class="space-y-4" @submit.prevent="handleLogin">
          <div
            v-if="errors.general"
            class="px-3 py-2.5 rounded-xl bg-primary-red/10 border border-primary-red/25 text-primary-red text-xs text-center"
          >
            {{ errors.general }}
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-primary-text">Email</label>
            <div class="relative">
              <span
                class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-secondary-text pointer-events-none"
              >
                mail
              </span>
              <input
                v-model="form.email"
                type="email"
                autocomplete="username"
                placeholder="you@example.com"
                class="input-field pl-10 pr-3"
                :class="{
                  'border-primary-red focus:!border-primary-red': errors.email,
                }"
              />
            </div>
            <p v-if="errors.email" class="text-[11px] text-primary-red">
              {{ errors.email }}
            </p>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-semibold text-primary-text">Password</label>
            <div class="relative">
              <span
                class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-secondary-text pointer-events-none"
              >
                lock
              </span>
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="••••••••"
                class="input-field pl-10 pr-10"
                :class="{
                  'border-primary-red focus:!border-primary-red': errors.password,
                }"
              />
              <button
                type="button"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text cursor-pointer"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              >
                <span class="material-symbols-outlined text-[18px]">
                  {{ showPassword ? "visibility_off" : "visibility" }}
                </span>
              </button>
            </div>
            <p v-if="errors.password" class="text-[11px] text-primary-red">
              {{ errors.password }}
            </p>
          </div>

          <button type="submit" class="btn-primary w-full" :disabled="loading">
            <span
              v-if="loading"
              class="material-symbols-outlined text-[18px] animate-spin"
            >
              progress_activity
            </span>
            <span>{{ loading ? "Signing in…" : "Sign in" }}</span>
          </button>
        </form>

        <p class="mt-6 text-center text-[11px] text-secondary-text">
          Secure staff portal for vendor operations
        </p>
      </div>
    </div>
  </div>
</template>
