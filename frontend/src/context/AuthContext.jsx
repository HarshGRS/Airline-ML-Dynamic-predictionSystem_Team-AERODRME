import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { googleLogout } from '@react-oauth/google'
import { api } from '../services/api'

const AuthContext = createContext(null)

const STORAGE_KEY_USER = 'aerodrome_auth_user'
const STORAGE_KEY_TOKEN = 'aerodrome_auth_token'

export function AuthProvider({ children }) {
  const navigate = useNavigate()

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USER)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN)
    if (token) {
      api.auth.getMe().then(userData => {
        const enhancedUser = {
          ...userData,
          givenName: userData.email.split('@')[0],
          picture: `https://ui-avatars.com/api/?name=${userData.email}&background=random`
        }
        setUser(enhancedUser)
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(enhancedUser))
      }).catch(err => {
        console.error('Failed to restore session:', err)
        logout()
      })
    }
  }, [])

  const handleAuthSuccess = async (tokenData) => {
    localStorage.setItem(STORAGE_KEY_TOKEN, tokenData.access_token)
    const userData = await api.auth.getMe()
    const enhancedUser = {
      ...userData,
      givenName: userData.email.split('@')[0],
      picture: `https://ui-avatars.com/api/?name=${userData.email}&background=random`
    }
    setUser(enhancedUser)
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(enhancedUser))
    navigate('/dashboard')
  }

  const loginWithGoogle = useCallback(async (credentialResponse) => {
    try {
      const tokenData = await api.auth.googleLogin({ credential: credentialResponse.credential })
      await handleAuthSuccess(tokenData)
    } catch (err) {
      console.error('Google login failed:', err)
      throw err
    }
  }, [navigate])

  const login = useCallback(async (email, password) => {
    const tokenData = await api.auth.login({ email, password })
    await handleAuthSuccess(tokenData)
  }, [navigate])

  const signup = useCallback(async (email, password) => {
    const tokenData = await api.auth.signup({ email, password })
    await handleAuthSuccess(tokenData)
  }, [navigate])

  const logout = useCallback(() => {
    googleLogout()
    setUser(null)
    localStorage.removeItem(STORAGE_KEY_USER)
    localStorage.removeItem(STORAGE_KEY_TOKEN)
    navigate('/')
  }, [navigate])

  const value = useMemo(() => ({ user, login, signup, loginWithGoogle, logout }), [user, login, signup, loginWithGoogle, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
