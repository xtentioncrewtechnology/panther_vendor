const THEME_KEY = "theme";
const THEMES = ["light", "dark"];

const applyDomTheme = (theme) => {
  const html = document.documentElement;
  const resolved = THEMES.includes(theme) ? theme : "light";

  html.classList.toggle("dark", resolved === "dark");
  html.dataset.theme = resolved;
  html.style.colorScheme = resolved;
};

export const setTheme = (theme) => {
  const resolved = THEMES.includes(theme) ? theme : "light";
  applyDomTheme(resolved);
  localStorage.setItem(THEME_KEY, resolved);
  return resolved;
};

export const getTheme = () => {
  const saved = localStorage.getItem(THEME_KEY);
  return THEMES.includes(saved) ? saved : null;
};

export const getSystemTheme = () => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const initTheme = () => {
  const savedTheme = getTheme();
  const theme = savedTheme || getSystemTheme();
  return setTheme(theme);
};

export const toggleTheme = () => {
  const current = getTheme() || getSystemTheme();
  const next = current === "dark" ? "light" : "dark";
  return setTheme(next);
};

export { THEME_KEY, THEMES };
