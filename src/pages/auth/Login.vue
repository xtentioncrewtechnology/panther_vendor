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
  <div class="min-h-screen flex bg-white dark:bg-background">
    <!-- Left Side: Image -->
    <div
      class="hidden lg:block lg:w-1/2 bg-cover bg-left bg-no-repeat bg-[#0F172A]"
      style="background-image: url('/3.png'); border-right: 1px solid rgba(0,0,0,0.05);"
    ></div>

    <!-- Right Side: Form -->
    <div class="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 sm:px-12 py-10 relative">
      <div class="w-full max-w-105">
        <!-- Logo -->
        <div class="flex justify-center mb-10">
          <img src="/2.png" alt="Veyntro Logo" class="h-16" />
        </div>

        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Enter your email to continue</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">Log in to Veyntro with your account.</p>
        </div>
        <!-- Form -->
        <form class="space-y-5" @submit.prevent="handleLogin">
          <div
            v-if="errors.general"
            class="px-4 py-3 rounded-xl bg-primary-red/10 border border-primary-red/25 text-primary-red text-sm text-center"
          >
            {{ errors.general }}
          </div>

          <!-- Email -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-gray-900 dark:text-primary-text">Email</label>
            <input
              v-model="form.email"
              type="email"
              autocomplete="username"
              placeholder="Enter Your Email here"
              class="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-primary-border bg-white dark:bg-card-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-900 dark:text-primary-text placeholder-gray-400"
              :class="{
                'border-red-500 focus:ring-red-500/20 focus:border-red-500': errors.email,
              }"
            />
            <p v-if="errors.email" class="text-xs text-red-500 mt-1">
              {{ errors.email }}
            </p>
          </div>

          <!-- Password -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold text-gray-900 dark:text-primary-text">Password</label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="••••••••••"
                class="w-full pl-4 pr-10 py-3 text-sm rounded-xl border border-gray-200 dark:border-primary-border bg-white dark:bg-card-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-900 dark:text-primary-text placeholder-gray-400"
                :class="{
                  'border-red-500 focus:ring-red-500/20 focus:border-red-500': errors.password,
                }"
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
            <p v-if="errors.password" class="text-xs text-red-500 mt-1">
              {{ errors.password }}
            </p>
          </div>

          <!-- Submit Button -->
          <button type="submit" class="w-full bg-[#fcd535] hover:bg-[#f3ca26] text-gray-900 font-bold py-3.5 rounded-xl transition-colors flex justify-center items-center gap-2" :disabled="loading">
            <span
              v-if="loading"
              class="material-symbols-outlined text-[18px] animate-spin"
            >
              progress_activity
            </span>
            <span>{{ loading ? "Submitting..." : "Submit" }}</span>
          </button>
        </form>

        <!-- Sign Up Link -->
        <div class="mt-6 text-center text-sm text-gray-500 dark:text-secondary-text">
          Don't have an account? <a href="#" class="text-gray-900 dark:text-primary-text font-bold hover:underline">Sign Up</a>
        </div>
      </div>
    </div>
  </div>
</template>
