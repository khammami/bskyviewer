export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme'

export function getTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return 'system'
}

export function setTheme(theme: Theme) {
  if (theme === 'system') {
    localStorage.removeItem(STORAGE_KEY)
  } else {
    localStorage.setItem(STORAGE_KEY, theme)
  }
  applyTheme()
}

export function applyTheme() {
  const theme = getTheme()
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  document.documentElement.classList.toggle('dark', isDark)
}

export function initThemeListener() {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = () => {
    if (getTheme() === 'system') applyTheme()
  }
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
}
