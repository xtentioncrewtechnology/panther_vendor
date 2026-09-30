import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSnackbarStore = defineStore('snackbar', () => {
  const visible = ref(false)
  const message = ref('')
  const color   = ref('success') // 'success' | 'error' | 'warning' | 'info'

  let timer = null

  function show(msg, clr = 'success') {
    // Reset if already showing
    if (timer) clearTimeout(timer)
    message.value = msg
    color.value   = clr
    visible.value = true

    timer = setTimeout(() => {
      visible.value = false
      timer = null
    }, 3000)
  }

  function hide() {
    if (timer) clearTimeout(timer)
    visible.value = false
    timer = null
  }

  return { visible, message, color, show, hide }
})