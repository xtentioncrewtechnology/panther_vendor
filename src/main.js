import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import { initTheme } from '@/utils/theme'
import { useThemeStore } from '@/stores/theme/theme'

// Apply theme before mount to avoid flash of wrong theme
initTheme()

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Keep Pinia store in sync with DOM / localStorage
useThemeStore(pinia).syncFromDom()

app.mount('#app')