'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Theme = 'light' | 'dark'
const ThemeContext = createContext({ theme: 'light' as Theme, ready: false, toggle: () => {} })

export function StudioTheme({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const system = window.matchMedia('(prefers-color-scheme: dark)')
    function syncTheme() {
      const saved = document.cookie.split('; ').find(cookie => cookie.startsWith('symbolbundle-theme='))?.split('=')[1]
      const next = saved === 'dark' || saved === 'light' ? saved : system.matches ? 'dark' : 'light'
      document.documentElement.classList.toggle('dark', next === 'dark')
      document.documentElement.style.colorScheme = next
      setTheme(next)
    }
    syncTheme()
    setReady(true)
    system.addEventListener('change', syncTheme)
    return () => system.removeEventListener('change', syncTheme)
  }, [])

  useEffect(() => {
    if (ready) document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach(meta => {
      meta.content = theme === 'dark' ? '#0A0908' : '#ffffff'
    })
  }, [theme, ready])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.classList.toggle('dark', next === 'dark')
    document.documentElement.style.colorScheme = next
    document.cookie = `symbolbundle-theme=${next}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`
    setTheme(next)
  }

  return <ThemeContext.Provider value={{ theme, ready, toggle }}>{children}</ThemeContext.Provider>
}

export function useStudioTheme() { return useContext(ThemeContext) }

export function ThemeToggle() {
  const { theme, ready, toggle } = useStudioTheme()
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
  return <Button type="button" variant="ghost" size="icon" aria-label={label} title={label} disabled={!ready} onClick={toggle}>
    {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
  </Button>
}
