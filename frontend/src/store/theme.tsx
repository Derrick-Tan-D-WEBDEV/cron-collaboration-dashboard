import React from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ThemeMode, ThemeConfig } from '@types/index'

interface ThemeState {
  theme: ThemeMode
  config: ThemeConfig
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
  updateConfig: (config: Partial<ThemeConfig>) => void
}

const defaultConfig: ThemeConfig = {
  mode: 'auto',
  colors: {
    primary: '#1976d2',
    secondary: '#64748b',
    success: '#10b981',
    info: '#06b6d4',
    warning: '#f59e0b',
    danger: '#ef4444',
    light: '#f8fafc',
    dark: '#0f172a'
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: '14px'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '3rem'
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'auto',
      config: defaultConfig,
      
      setTheme: (theme: ThemeMode) => {
        set({ theme })
        
        // Apply theme to document
        const root = document.documentElement
        if (theme === 'auto') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
        } else {
          root.setAttribute('data-theme', theme)
        }
      },
      
      toggleTheme: () => {
        const { theme } = get()
        const newTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'auto' : 'light'
        get().setTheme(newTheme)
      },
      
      updateConfig: (newConfig: Partial<ThemeConfig>) => {
        set(state => ({
          config: { ...state.config, ...newConfig }
        }))
        
        // Apply CSS custom properties
        const root = document.documentElement
        const { config } = get()
        
        Object.entries(config.colors).forEach(([key, value]) => {
          root.style.setProperty(`--color-${key}`, value)
        })
        
        root.style.setProperty('--font-family', config.typography.fontFamily)
        root.style.setProperty('--font-size', config.typography.fontSize)
        
        Object.entries(config.spacing).forEach(([key, value]) => {
          root.style.setProperty(`--spacing-${key}`, value)
        })
      }
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({ 
        theme: state.theme, 
        config: state.config 
      })
    }
  )
)

// React hook for theme
export const useTheme = () => {
  const { theme, config, setTheme, toggleTheme, updateConfig } = useThemeStore()
  
  // Apply system theme changes
  React.useEffect(() => {
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      const handleChange = (e: MediaQueryListEvent) => {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light')
      }
      
      mediaQuery.addEventListener('change', handleChange)
      handleChange({ matches: mediaQuery.matches } as MediaQueryListEvent)
      
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])
  
  // Apply theme config on mount
  React.useEffect(() => {
    updateConfig(config)
  }, [])
  
  return {
    theme,
    config,
    setTheme,
    toggleTheme,
    updateConfig,
    isDark: theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  }
}

// Theme Provider Component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setTheme, updateConfig } = useThemeStore()
  
  React.useEffect(() => {
    // Initialize theme on app start
    const stored = localStorage.getItem('theme-storage')
    if (stored) {
      const { state } = JSON.parse(stored)
      if (state?.theme) {
        setTheme(state.theme)
      }
      if (state?.config) {
        updateConfig(state.config)
      }
    } else {
      // Default to system preference
      setTheme('auto')
    }
  }, [setTheme, updateConfig])
  
  return <>{children}</>
}