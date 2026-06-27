import { GoogleLogin } from '@react-oauth/google'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Plane, TrendingUp, Bell, Shield } from 'lucide-react'

export default function LoginPage() {
  const { user, login } = useAuth()

  // If already signed in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />
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
              Price drop alerts & watchlists
            </li>
            <li>
              <span className="login-feature-icon"><Shield size={16} /></span>
              Secure Google sign-in
            </li>
          </ul>
        </div>

        {/* Right: sign-in form */}
        <div className="login-form-panel">
          <div className="login-form-content">
            <h1 className="login-title">Welcome aboard</h1>
            <p className="login-subtitle">
              Sign in with your Google account to access your dashboard, saved flights, and personalized insights.
            </p>

            <div className="login-google-wrapper">
              <GoogleLogin
                onSuccess={login}
                onError={() => {
                  console.error('Google Login Failed')
                }}
                theme="filled_black"
                size="large"
                shape="pill"
                text="signin_with"
                width="320"
              />
            </div>

            <p className="login-terms">
              By signing in, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
