import { Routes, Route, useLocation, NavLink, useNavigate, Link } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { LayoutDashboard, Plane, LogOut, Map as MapIcon, Users } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import HomePage from './pages/HomePage.jsx'
import MapPage from './pages/MapPage.jsx'
import ResultsPage from './pages/ResultsPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import SavedSearchesPage from './pages/SavedSearchesPage.jsx'
import RoutesPage from './pages/RoutesPage.jsx'
import ActionCenterPage from './pages/ActionCenterPage.jsx'
import PredictPage from './pages/PredictPage.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import MeetTheDevsPage from './pages/MeetTheDevsPage.jsx'
import PrivacyPage from './pages/PrivacyPage.jsx'
import TermsPage from './pages/TermsPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import DashboardLayout from './components/DashboardLayout.jsx'
import { api } from './services/api.js'
import './App.css'

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [savedSearches, setSavedSearches] = useState([])

  // Fetch saved searches when user logs in
  useEffect(() => {
    if (user) {
      api.getSavedSearches()
        .then(data => setSavedSearches(data))
        .catch(err => console.error('Failed to fetch saved searches:', err))
    } else {
      setSavedSearches([])
    }
  }, [user])

  const saveSearch = useCallback(async (flight) => {
    if (!user) return false
    try {
      const saved = await api.createSavedSearch(flight)
      setSavedSearches(prev => [saved, ...prev])
      return true
    } catch (err) {
      console.error('Failed to save search:', err)
      return false
    }
  }, [user])

  const removeSavedSearch = useCallback(async (id) => {
    try {
      await api.deleteSavedSearch(id)
      setSavedSearches(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      console.error('Failed to remove saved search:', err)
    }
  }, [])

  // Check if we're on a dashboard route (uses its own layout)
  const isDashboard = location.pathname.startsWith('/dashboard')

  // Dashboard routes — rendered with DashboardLayout (sidebar, no topbar/footer)
  if (isDashboard) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/predict" element={<PredictPage />} />
            <Route path="/dashboard/calendar" element={<CalendarPage />} />
            <Route path="/dashboard/routes" element={<RoutesPage />} />
            <Route path="/dashboard/action-center" element={<ActionCenterPage />} />
            <Route path="/dashboard/saved-searches" element={<SavedSearchesPage savedSearches={savedSearches} onRemove={removeSavedSearch} />} />
            {/* Future sub-pages: etc. */}
            <Route path="/dashboard/*" element={<DashboardPage />} />
          </Routes>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  // Normal routes — rendered with topbar + footer shell
  return (
    <div className="app-layout">
      <main className="page-shell">
        <header className="topbar">
          <Link to="/" className="brand-mark" style={{ textDecoration: 'none' }}>
            <img src="/logo-aerodrome.png" alt="Aerodrome" className="brand-logo" />
            <div>
              <strong>AERODROME</strong>
              <p>Flight pricing intelligence</p>
            </div>
          </Link>

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
              to="/dashboard"
              className={({ isActive }) => `topnav-link ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={14} strokeWidth={2.2} />
              Dashboard
              {savedSearches.length > 0 && (
                <span className="topnav-badge">{savedSearches.length}</span>
              )}
            </NavLink>
            <NavLink
              to="/devs"
              className={({ isActive }) => `topnav-link ${isActive ? 'active' : ''}`}
            >
              <Users size={14} strokeWidth={2.2} />
              About Us
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

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/devs" element={<MeetTheDevsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route
            path="/results"
            element={
              <ResultsPage
                onSaveSearch={saveSearch}
                savedSearches={savedSearches}
              />
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <footer className="platform-footer">
        <div className="footer-left">
          <img src="/logo-aerodrome.png" alt="Aerodrome" className="brand-logo" style={{ width: '2.2rem', height: '2.2rem', padding: '4px' }} />
          <span className="footer-brand-name">AERODROME</span>
          <span className="footer-tagline">Flight pricing intelligence</span>
        </div>
        <div className="footer-right">
          <NavLink to="/devs" className="footer-link">About Us</NavLink>
          <span className="footer-divider" />
          <NavLink to="/privacy" className="footer-link">Privacy</NavLink>
          <span className="footer-divider" />
          <NavLink to="/terms" className="footer-link">Terms</NavLink>
          <span className="footer-divider" />
          <span className="footer-copy">&copy; {new Date().getFullYear()} Team AERODROME</span>
        </div>
      </footer>
    </div>
  )
}
