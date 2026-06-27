import { Routes, Route } from 'react-router-dom'
import { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Plane } from 'lucide-react'
import HomePage from './pages/HomePage.jsx'
import ResultsPage from './pages/ResultsPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import './App.css'

export default function App() {
  const navigate = useNavigate()
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

  return (
    <main className="page-shell">
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
            to="/dashboard"
            className={({ isActive }) => `topnav-link ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={14} strokeWidth={2.2} />
            Dashboard
            {watchlist.length > 0 && (
              <span className="topnav-badge">{watchlist.length}</span>
            )}
          </NavLink>
          <button type="button" className="signin-btn">Sign in</button>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/results"
          element={
            <ResultsPage
              onAddToWatchlist={addToWatchlist}
              watchlist={watchlist}
            />
          }
        />
        <Route
          path="/dashboard"
          element={
            <DashboardPage
              watchlist={watchlist}
              onRemove={removeFromWatchlist}
            />
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

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
        </div>

        <div className="footer-columns">
          {Object.entries({
            product: ['Search flights', 'Price trends', 'Booking guidance', 'Saved trips'],
            company: ['About us', 'Careers', 'Privacy', 'Terms'],
            support: ['Help center', 'Contact support', 'Travel advice', 'Accessibility'],
          }).map(([heading, links]) => (
            <div key={heading} className="footer-column">
              <h3>{heading}</h3>
              <ul>
                {links.map((link) => (
                  <li key={link}>
                    <a href="/#search">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
    </main>
  )
}
