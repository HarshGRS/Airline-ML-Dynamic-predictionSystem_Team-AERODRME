import { GoogleLogin } from '@react-oauth/google'
import { Navigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Plane, TrendingUp, Shield } from 'lucide-react'

export default function LoginPage() {
  const { user, loginWithGoogle, login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // If already signed in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.')
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
            <div className="brand-icon login-brand-icon">A</div>
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

        {/* Right: sign-in form */}
        <div className="login-form-panel">
          <div className="login-form-content">
            <h1 className="login-title">Welcome aboard</h1>
            <p className="login-subtitle">
              Sign in to access your dashboard, saved flights, and personalized insights.
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
              <button
                type="submit"
                disabled={isLoading}
                className="login-submit-btn"
              >
                {isLoading ? 'Please wait...' : 'Sign in'}
              </button>

              <Link to="/forgot-password" className="login-link-btn" style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                Forgot password?
              </Link>
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
                    setError(err.message || 'Google Login failed. Please try again.')
                  } finally {
                    setIsLoading(false)
                  }
                }}
                onError={() => {
                  setError('Google Login Failed')
                }}
                theme="filled_black"
                size="large"
                shape="pill"
                text="continue_with"
                width="320"
              />
            </div>

            <div style={{ marginTop: '1.25rem', fontSize: '0.85rem', textAlign: 'center', width: '100%', maxWidth: '320px', color: 'var(--text-soft)' }}>
              {"Don't have an account? "}
              <Link to="/register" className="login-link-btn">
                Sign up
              </Link>
            </div>

            <p className="login-terms" style={{ marginTop: '1.5rem' }}>
              By signing in, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
