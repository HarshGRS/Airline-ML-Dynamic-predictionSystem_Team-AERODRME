import { GoogleLogin } from '@react-oauth/google'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Lock, Plane, TrendingUp, Bell, Shield } from 'lucide-react'

export default function LoginPage() {
  const { user, loginWithGoogle, login, signup } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Detect redirect intent from the home page prediction guard
  const redirectState = location.state || {}
  const nextPath = redirectState.next || null
  const searchParams = redirectState.searchParams || null

  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // If already signed in, redirect to intended destination or dashboard
  if (user) {
    if (nextPath && searchParams) {
      return <Navigate to={nextPath} state={searchParams} replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  // After successful auth, go to next destination if set
  const handlePostAuth = () => {
    if (nextPath && searchParams) {
      navigate(nextPath, { state: searchParams, replace: true })
    }
    // AuthContext.handleAuthSuccess navigates to /dashboard by default if no override
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      if (isSignUp) {
        await signup(email, password)
      } else {
        await login(email, password)
      }
      handlePostAuth()
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
              <span className="login-feature-icon"><Bell size={16} /></span>
              Price drop alerts & saved searches
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

            {/* Prediction redirect banner */}
            {nextPath && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.65rem 1rem', marginBottom: '0.75rem', width: '320px', borderRadius: '8px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.35)', fontSize: '0.82rem', color: 'var(--text-soft)' }}>
                <Lock size={13} strokeWidth={2.5} style={{ flexShrink: 0, color: '#818cf8' }} />
                Sign in to run your flight prediction
              </div>
            )}

            {error && (
              <div className="login-error" style={{ color: '#ef4444', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fee2e2', borderRadius: '8px', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem', width: '320px' }}>
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
                {isLoading ? 'Please wait...' : (isSignUp ? 'Create account' : 'Sign in')}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', width: '320px', gap: '1rem', marginBottom: '1.25rem' }}>
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
                    handlePostAuth()
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

            <div style={{ marginTop: '1.25rem', fontSize: '0.85rem', textAlign: 'center', width: '320px', color: 'var(--text-soft)' }}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="login-link-btn"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
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
