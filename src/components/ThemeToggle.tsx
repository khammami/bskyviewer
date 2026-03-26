import { useEffect, useState } from 'react'
import { type Theme, getTheme, setTheme, initThemeListener } from '../utils/theme'

const icons: Record<Theme, { label: string; path: string }> = {
  light: {
    label: 'Light mode',
    path: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
  },
  system: {
    label: 'System preference',
    path: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  dark: {
    label: 'Dark mode',
    path: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
  },
}

const order: Theme[] = ['light', 'system', 'dark']

function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>(getTheme)

  useEffect(() => initThemeListener(), [])

  const cycle = () => {
    const next = order[(order.indexOf(theme) + 1) % order.length]
    setThemeState(next)
    setTheme(next)
  }

  const { label, path } = icons[theme]

  return (
    <button
      onClick={cycle}
      className="p-2 rounded-lg text-contrast-600 dark:text-contrast-400 hover:bg-contrast-50 dark:hover:bg-contrast-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors"
      aria-label={`Theme: ${label}. Click to change.`}
      title={label}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={path} />
      </svg>
    </button>
  )
}

export default ThemeToggle
