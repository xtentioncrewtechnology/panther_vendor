<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import apiRequest from '@/api/request'
import authToken from '@/common/authToken'
import urls from '@/api/urls'

const router = useRouter()
const loading = ref(false)
const showPassword = ref(false)

const form = reactive({
  email: '',
  password: '',
})

const errors = reactive({
  email: '',
  password: '',
  general: ''
})

const validate = () => {
  let valid = true
  errors.email = ''
  errors.password = ''
  errors.general = ''

  if (!form.email) {
    errors.email = 'Email is required.'
    valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Enter a valid email address.'
    valid = false
  }

  if (!form.password) {
    errors.password = 'Password is required.'
    valid = false
  }

  return valid
}

const handleLogin = () => {
  if (!validate()) return

  loading.value = true

  const successHandler = (res) => {
    loading.value = false
    authToken.setToken(res.access_token)
    if (res.role) {
      localStorage.setItem('role', res.role)
    }
    if (res.user_id) {
      localStorage.setItem('user_id', res.user_id)
    }
    
    router.push('/dashboard').catch(() => {
      window.location.href = '/dashboard'
    })
  }

  const failureHandler = (err) => {
    loading.value = false
    errors.general = err?.error || err?.message || 'Invalid credentials. Please try again.'
  }

  apiRequest(urls.KEYS.POST, urls.auth.login, {
    data: {
      email: form.email,
      password: form.password,
    },
    isTokenRequired: false,
    onSuccess: successHandler,
    onFailure: failureHandler,
  })
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0a0a0a] to-[#0a0a0a] relative overflow-hidden font-sans">
    
    <!-- Ambient glowing orbs -->
    <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px]"></div>

    <!-- Login Card -->
    <div class="w-full max-w-md mx-auto p-8 z-10">
      
      <div class="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl">
        <div class="text-center mb-10">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 mb-6 shadow-[0_0_40px_rgba(79,70,229,0.4)]">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h2>
          <p class="text-sm text-gray-400">Sign in to your admin workspace</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          
          <div v-if="errors.general" class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {{ errors.general }}
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input 
                v-model="form.email" 
                type="email" 
                class="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all duration-300" 
                :class="{'border-red-500/50 focus:ring-red-500/50 focus:border-red-500': errors.email}"
                placeholder="superadmin@example.com" 
              />
            </div>
            <p v-if="errors.email" class="text-xs text-red-400 mt-2">{{ errors.email }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input 
                v-model="form.password" 
                :type="showPassword ? 'text' : 'password'" 
                class="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-12 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all duration-300" 
                :class="{'border-red-500/50 focus:ring-red-500/50 focus:border-red-500': errors.password}"
                placeholder="••••••••" 
              />
              <button 
                type="button" 
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white transition-colors"
                @click="showPassword = !showPassword"
              >
                <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a10.05 10.05 0 015.188-1.583c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.29-3.29" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
            <p v-if="errors.password" class="text-xs text-red-400 mt-2">{{ errors.password }}</p>
          </div>

          <button 
            type="submit" 
            :disabled="loading"
            class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            <svg v-if="loading" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ loading ? 'Signing In...' : 'Sign In' }}</span>
          </button>
        </form>
        
        <div class="mt-8 text-center">
          <p class="text-xs text-gray-500">
            Secure admin portal for Panther Capitals
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
