const THEME_KEY = 'theme'

export const setTheme = (theme) => {
  const html = document.documentElement

  if (theme === 'dark') {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }

  localStorage.setItem(THEME_KEY, theme)
}

export const getTheme = () => {
  return localStorage.getItem(THEME_KEY)
}

export const initTheme = () => {
  const savedTheme = getTheme()

  if (savedTheme) {
    setTheme(savedTheme)
    return savedTheme
  }

  // system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const defaultTheme = prefersDark ? 'dark' : 'light'

  setTheme(defaultTheme)
  return defaultTheme
}

export const toggleTheme = () => {
  const current = getTheme()
  const newTheme = current === 'dark' ? 'light' : 'dark'

  setTheme(newTheme)
  return newTheme
}