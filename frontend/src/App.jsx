import { Routes, Route, useLocation } from 'react-router-dom'
import { useCallback, useEffect, useState, lazy, Suspense } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Plane, LogOut, Map as MapIcon, Info, Code2, ExternalLink } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import HomePage from './pages/HomePage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import DashboardLayout from './components/DashboardLayout.jsx'
import './App.css'

// Lazy-loaded: keeps the initial bundle small — HomePage (the landing route)
// loads eagerly, everything else is fetched on first navigation.
const MapPage = lazy(() => import('./pages/MapPage.jsx'))
const ResultsPage = lazy(() => import('./pages/ResultsPage.jsx'))
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'))
const SavedSearchesPage = lazy(() => import('./pages/SavedSearchesPage.jsx'))
const RoutesPage = lazy(() => import('./pages/RoutesPage.jsx'))
const ActionCenterPage = lazy(() => import('./pages/ActionCenterPage.jsx'))
const PredictPage = lazy(() => import('./pages/PredictPage.jsx'))
const CalendarPage = lazy(() => import('./pages/CalendarPage.jsx'))
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.jsx'))
const MeetTheDevsPage = lazy(() => import('./pages/MeetTheDevsPage.jsx'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'))

function RouteFallback() {
  return <div className="route-loading" aria-label="Loading" />
}

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [watchlist, setWatchlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('aerodrome_watchlist') || '[]')
    } catch {
      return []
    }
  })

  // Persist watchlist to localStorage on every change
  useEffect(() => {
    localStorage.setItem('aerodrome_watchlist', JSON.stringify(watchlist))
  }, [watchlist])

  const addToWatchlist = useCallback((flight) => {
    setWatchlist((prev) => {
      const isDupe = prev.some(
        (f) => f.from === flight.from && f.to === flight.to && f.airline === flight.airline && f.departDate === flight.departDate
      )
      if (isDupe) return prev
      return [{ ...flight, id: Date.now(), addedAt: new Date().toISOString() }, ...prev]
    })
  }, [])

  const removeFromWatchlist = useCallback((id) => {
    setWatchlist((prev) => prev.filter((f) => f.id !== id))
  }, [])

  // Check if we're on a dashboard route (uses its own layout)
  const isDashboard = location.pathname.startsWith('/dashboard')

  // Auth pages render a focused, standalone layout — no topbar/footer chrome.
  const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password']
  const isAuthPage = AUTH_PATHS.includes(location.pathname)

  // Dashboard routes — rendered with DashboardLayout (sidebar, no topbar/footer)
  if (isDashboard) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/dashboard/predict" element={<PredictPage />} />
              <Route path="/dashboard/calendar" element={<CalendarPage />} />
              <Route path="/dashboard/routes" element={<RoutesPage />} />
              <Route path="/dashboard/action-center" element={<ActionCenterPage />} />
              <Route path="/dashboard/saved-searches" element={<SavedSearchesPage />} />
              {/* Future sub-pages: etc. */}
              <Route path="/dashboard/*" element={<DashboardPage />} />
            </Routes>
          </Suspense>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  // Normal routes — rendered with topbar + footer shell
  return (
    <main className="page-shell">
      {!isAuthPage && (
      <header className="topbar">
        <NavLink to="/" className="brand-mark" style={{ textDecoration: 'none' }}>
          <div className="brand-icon">A</div>
          <div>
            <strong>AERODROME</strong>
            <p>Flight pricing intelligence</p>
          </div>
        </NavLink>

        <nav className="topnav" aria-label="Primary">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `topnav-link ${isActive ? 'active' : ''}`}
          >
            <Plane size={14} strokeWidth={2.2} />
            Search
          </NavLink>
          <NavLink
            to="/map"
            className={({ isActive }) => `topnav-link ${isActive ? 'active' : ''}`}
          >
            <MapIcon size={14} strokeWidth={2.2} />
            Map
          </NavLink>
          <NavLink
            to="/devs"
            className={({ isActive }) => `topnav-link ${isActive ? 'active' : ''}`}
          >
            <Info size={14} strokeWidth={2.2} />
            About
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `topnav-link ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={14} strokeWidth={2.2} />
            Dashboard
            {watchlist.length > 0 && (
              <span className="topnav-badge">{watchlist.length}</span>
            )}
          </NavLink>

          {user ? (
            <div className="user-menu">
              <img
                src={user.picture}
                alt={user.name}
                className="user-avatar"
                referrerPolicy="no-referrer"
              />
              <span className="user-name">{user.givenName}</span>
              <button
                type="button"
                className="signout-btn"
                onClick={logout}
                title="Sign out"
              >
                <LogOut size={14} strokeWidth={2.4} />
              </button>
            </div>
          ) : (
            <NavLink to="/login" className="signin-btn" style={{ textDecoration: 'none' }}>
              Sign in
            </NavLink>
          )}
        </nav>
      </header>
      )}

      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/devs" element={<MeetTheDevsPage />} />
          <Route
            path="/results"
            element={
              <ProtectedRoute>
                <ResultsPage
                  onAddToWatchlist={addToWatchlist}
                  watchlist={watchlist}
                />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>

      {!isAuthPage && (
      <footer className="platform-footer" id="footer">
        <div className="footer-brand">
          <div className="brand-mark footer-mark">
            <div className="brand-icon">A</div>
            <div>
              <strong>AERODROME</strong>
              <p>Flight booking with predictive insight</p>
            </div>
          </div>
          <p>A professional flight-planning experience that combines route search, price trends, and machine learning support.</p>
          <a
            href="https://github.com/HarshGRS/Airline-ML-Dynamic-predictionSystem_Team-AERODRME"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-repo-link"
          >
            <Code2 size={13} strokeWidth={2.2} />
            View source on GitHub
            <ExternalLink size={11} strokeWidth={2.2} />
          </a>
        </div>

        <div className="footer-columns">
          {[
            {
              heading: 'product',
              links: [
                { label: 'Search flights', to: '/#search' },
                { label: 'Route map', to: '/map' },
                { label: 'Fare calendar', to: '/dashboard/calendar' },
                { label: 'Saved searches', to: '/dashboard/saved-searches' },
              ],
            },
            {
              heading: 'account',
              links: [
                { label: 'Dashboard', to: '/dashboard' },
                { label: 'Predict fares', to: '/dashboard/predict' },
                { label: 'Sign in', to: '/login' },
                { label: 'Create account', to: '/register' },
              ],
            },
            {
              heading: 'company',
              links: [
                { label: 'About AERODROME', to: '/devs' },
                { label: 'Meet the Devs', to: '/devs' },
                { label: 'Action center', to: '/dashboard/action-center' },
              ],
            },
          ].map(({ heading, links }) => (
            <div key={heading} className="footer-column">
              <h3>{heading}</h3>
              <ul>
                {links.map((link) => (
                  <li key={link.label}>
                    {link.to.startsWith('/#') ? (
                      <a href={link.to}>{link.label}</a>
                    ) : (
                      <NavLink to={link.to} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                        {link.label}
                      </NavLink>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
      )}
    </main>
  )
}
