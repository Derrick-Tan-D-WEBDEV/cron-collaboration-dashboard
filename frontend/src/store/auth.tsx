import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@types/index'
import { authService } from '@services/auth'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on app start
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (token) {
          const userData = await authService.verifyToken(token)
          setUser(userData)
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('refresh_token')
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { user: userData, token, refreshToken } = await authService.login(email, password)
      
      localStorage.setItem('auth_token', token)
      localStorage.setItem('refresh_token', refreshToken)
      setUser(userData)
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await authService.logout()
      localStorage.removeItem('auth_token')
      localStorage.removeItem('refresh_token')
      setUser(null)
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) throw new Error('No refresh token')

      const { token, user: userData } = await authService.refreshToken(refreshToken)
      localStorage.setItem('auth_token', token)
      setUser(userData)
    } catch (error) {
      console.error('Token refresh failed:', error)
      await logout()
      throw error
    }
  }

  const updateUser = (updates: Partial<User>) => {
    setUser(current => current ? { ...current, ...updates } : null)
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshToken,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}