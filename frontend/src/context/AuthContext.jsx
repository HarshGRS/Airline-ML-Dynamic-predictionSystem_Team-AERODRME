import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { googleLogout } from '@react-oauth/google'

const AuthContext = createContext(null)

/**
 * Decode a Google JWT credential (ID token) to extract user info.
 * This is a simple base64 decode — no cryptographic verification on the client.
 * For production, verify the token on the backend.
 */
function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

const STORAGE_KEY = 'aerodrome_auth_user'

export function AuthProvider({ children }) {
  const navigate = useNavigate()

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const login = useCallback(
    (credentialResponse) => {
      const decoded = decodeJwt(credentialResponse.credential)
      if (!decoded) return

      const userData = {
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
        givenName: decoded.given_name,
        familyName: decoded.family_name,
      }

      setUser(userData)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
      navigate('/dashboard')
    },
    [navigate]
  )

  const logout = useCallback(() => {
    googleLogout()
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
    navigate('/')
  }, [navigate])

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
