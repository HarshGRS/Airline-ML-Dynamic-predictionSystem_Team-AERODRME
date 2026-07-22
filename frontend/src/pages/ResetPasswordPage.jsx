import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Plane, TrendingUp, Shield } from 'lucide-react'
import { api } from '../services/api'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    try {
      await api.auth.resetPassword({ token, new_password: password })
      navigate('/login')
    } catch (err) {
      setError(err.message || 'This reset link is invalid or has expired.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="login-page">
      <div className="login-card">
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

        <div className="login-form-panel">
          <div className="login-form-content">
            <h1 className="login-title">Choose a new password</h1>
            <p className="login-subtitle">
              Enter and confirm your new password below.
            </p>

            {error && (
              <div className="login-error" style={{ color: '#ef4444', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fee2e2', borderRadius: '8px', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            {!token && (
              <div style={{ color: '#ef4444', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fee2e2', borderRadius: '8px', fontSize: '0.875rem' }}>
                This reset link is missing its token. Please use the link from your email.
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem', width: '100%', maxWidth: '320px' }}>
              <input
                type="password"
                placeholder="New password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-white)', outline: 'none' }}
              />
              <input
                type="password"
                placeholder="Confirm new password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-white)', outline: 'none' }}
              />
              <button
                type="submit"
                disabled={isLoading || !token}
                className="login-submit-btn"
              >
                {isLoading ? 'Resetting...' : 'Reset password'}
              </button>
            </form>

            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', textAlign: 'center', width: '100%', maxWidth: '320px', color: 'var(--text-soft)' }}>
              <Link to="/login" className="login-link-btn">
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
