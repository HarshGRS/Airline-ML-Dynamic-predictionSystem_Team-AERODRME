import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plane, TrendingUp, Bell, Shield } from 'lucide-react'
import { api } from '../services/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setIsLoading(true)
    try {
      const res = await api.auth.forgotPassword({ email })
      setMessage(res.message)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="login-page">
      <div className="login-card">
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
              Price drop alerts & watchlists
            </li>
            <li>
              <span className="login-feature-icon"><Shield size={16} /></span>
              Secure sign-in
            </li>
          </ul>
        </div>

        <div className="login-form-panel">
          <div className="login-form-content">
            <h1 className="login-title">Reset your password</h1>
            <p className="login-subtitle">
              Enter the email on your account and we'll send you a link to reset your password.
            </p>

            {error && (
              <div className="login-error" style={{ color: '#ef4444', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fee2e2', borderRadius: '8px', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            {message && (
              <div style={{ color: '#16a34a', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#dcfce7', borderRadius: '8px', fontSize: '0.875rem' }}>
                {message}
              </div>
            )}

            {!message && (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem', width: '100%', maxWidth: '320px' }}>
                <input
                  type="email"
                  placeholder="Email address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-white)', outline: 'none' }}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="login-submit-btn"
                >
                  {isLoading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>
            )}

            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', textAlign: 'center', width: '100%', maxWidth: '320px', color: 'var(--text-soft)' }}>
              Remembered your password?{' '}
              <Link to="/login" className="login-link-btn">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
