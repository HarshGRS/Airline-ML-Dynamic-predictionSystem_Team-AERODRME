import { GoogleLogin } from '@react-oauth/google'
import { Navigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Plane, TrendingUp, Shield } from 'lucide-react'

export default function RegisterPage() {
  const { user, loginWithGoogle, signup } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // If already signed in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    try {
      await signup(email, password)
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="login-page">
      <div className="login-card">
        {/* Left: branding panel */}
        <div className="login-branding">
          <div className="login-brand-header">
            <img src="/logo.png" alt="AERODROME" className="brand-icon login-brand-icon" />
            <div>
              <strong className="login-brand-name">AERODROME</strong>
              <p className="login-brand-sub">Flight pricing intelligence</p>
            </div>
          </div>

          <h2 className="login-brand-headline">
            Smarter flights start here.
          </h2>
          <p className="login-brand-body">
            Track prices, predict trends, and book at the perfect moment — all powered by machine learning.
          </p>

          <ul className="login-features">
            <li>
              <span className="login-feature-icon"><Plane size={16} /></span>
              Search flights across major airlines
            </li>
            <li>
              <span className="login-feature-icon"><TrendingUp size={16} /></span>
              ML-powered price predictions
            </li>
            <li>
              <span className="login-feature-icon"><Shield size={16} /></span>
              Secure sign-in
            </li>
          </ul>
        </div>

        {/* Right: sign-up form */}
        <div className="login-form-panel">
          <div className="login-form-content">
            <h1 className="login-title">Create your account</h1>
            <p className="login-subtitle">
              Sign up to track prices, save searches, and get personalized insights.
            </p>

            {error && (
              <div className="login-error" style={{ color: '#ef4444', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fee2e2', borderRadius: '8px', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem', width: '100%', maxWidth: '320px' }}>
              <input
                type="email"
                placeholder="Email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-white)', outline: 'none' }}
              />
              <input
                type="password"
                placeholder="Password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-white)', outline: 'none' }}
              />
              <input
                type="password"
                placeholder="Confirm password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-white)', outline: 'none' }}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="login-submit-btn"
              >
                {isLoading ? 'Please wait...' : 'Create account'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '320px', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>or</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
            </div>

            <div className="login-google-wrapper">
              <GoogleLogin
                onSuccess={async (res) => {
                  setError('')
                  setIsLoading(true)
                  try {
                    await loginWithGoogle(res)
                  } catch (err) {
                    setError(err.message || 'Google sign-up failed. Please try again.')
                  } finally {
                    setIsLoading(false)
                  }
                }}
                onError={() => {
                  setError('Google sign-up failed.')
                }}
                theme="filled_black"
                size="large"
                shape="pill"
                text="signup_with"
                width="320"
              />
            </div>

            <div style={{ marginTop: '1.25rem', fontSize: '0.85rem', textAlign: 'center', width: '100%', maxWidth: '320px', color: 'var(--text-soft)' }}>
              {'Already have an account? '}
              <Link to="/login" className="login-link-btn">
                Sign in
              </Link>
            </div>

            <p className="login-terms" style={{ marginTop: '1.5rem' }}>
              By signing up, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
