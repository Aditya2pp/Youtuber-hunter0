// lib/theme.js
// Handles Light / Dark theme toggling and sync across sessions (Strict Light Default)

const THEME_KEY = 'yt_theme';

export function getTheme() {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem(THEME_KEY);
  // Default is STRICTLY light mode unless user explicitly selected 'dark'
  if (saved === 'dark') return 'dark';
  return 'light';
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    root.setAttribute('data-theme', 'light');
  }
}

export function setTheme(theme) {
  if (typeof window === 'undefined') return;
  const target = theme === 'dark' ? 'dark' : 'light';
  localStorage.setItem(THEME_KEY, target);
  applyTheme(target);
  window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme: target } }));
  return target;
}

export function toggleTheme() {
  const current = getTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  return setTheme(next);
}

export function initTheme() {
  if (typeof window === 'undefined') return;
  const t = getTheme();
  applyTheme(t);
}
