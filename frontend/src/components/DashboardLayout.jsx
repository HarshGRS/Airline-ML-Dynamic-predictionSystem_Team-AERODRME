import { useEffect, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import {
  LayoutDashboard,
  TrendingUp,
  Calendar,
  Bookmark,
  Bell,
  Shield,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import '../styles/Dashboard.css'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, num: '01' },
  { to: '/dashboard/predict', label: 'Predict', icon: TrendingUp, num: '02' },
  { to: '/dashboard/calendar', label: 'Calendar', icon: Calendar, num: '03' },
  { to: '/dashboard/saved-searches', label: 'Save Search', icon: Bookmark, num: '04' },
]

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [systemInfo, setSystemInfo] = useState({ status: 'checking', version: 'UNKNOWN', latency: 0 })

  // Derive current page label from URL
  const pathSegments = location.pathname.replace(/\/$/, '').split('/')
  const lastSegment = pathSegments[pathSegments.length - 1] || 'dashboard'
  const breadcrumbLabel = lastSegment.toUpperCase()

  useEffect(() => {
    const start = performance.now()
    api.getHealth()
      .then((res) => {
        const latency = Math.round(performance.now() - start)
        setSystemInfo({ status: res.status, version: res.model_version, latency })
      })
      .catch(() => {
        setSystemInfo({ status: 'error', version: 'OFFLINE', latency: 0 })
      })
  }, [])

  const now = new Date()
  const utcString = now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC'

  return (
    <div className="console-shell">
      {/* Mobile overlay */}
      <div
        className={`console-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`console-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Link to="/" className="console-sidebar-brand" style={{ textDecoration: 'none' }}>
          <img src="/logo.png" alt="AERODROME" className="brand-icon" />
          <span className="console-sidebar-brand-name">AERODROME</span>
        </Link>

        <nav className="console-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                `console-nav-item ${isActive ? 'active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className="console-nav-number">{item.num}</span>
              <item.icon size={15} strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* System status */}
        <div className="console-sidebar-footer">
          <div className="console-status-row">
            <span className="console-status-dot" style={{ 
              backgroundColor: systemInfo.status === 'ok' ? '#22c55e' : 
                               systemInfo.status === 'error' ? '#ef4444' : '#eab308',
              boxShadow: systemInfo.status === 'ok' ? '0 0 8px rgba(34, 197, 94, 0.4)' : 'none'
            }} />
            <span className="console-status-label">
              {systemInfo.status === 'ok' ? 'System Normal' : 
               systemInfo.status === 'error' ? 'System Offline' : 'Checking...'}
            </span>
          </div>
          <span className="console-status-meta">MODEL: {systemInfo.version}</span>
          <span className="console-status-meta">LATENCY: {systemInfo.latency > 0 ? `${systemInfo.latency}ms` : '--'}</span>
        </div>

        {/* User */}
        {user && (
          <div className="console-sidebar-user">
            <img
              src={user.picture}
              alt={user.name}
              referrerPolicy="no-referrer"
            />
            <div className="console-sidebar-user-info">
              <span className="console-sidebar-user-name">{user.name}</span>
              <span className="console-sidebar-user-email">{user.email}</span>
            </div>
            <button
              type="button"
              className="console-signout-btn"
              onClick={logout}
              title="Sign out"
            >
              <LogOut size={13} strokeWidth={2.4} />
            </button>
          </div>
        )}
      </aside>

      {/* Content */}
      <div className="console-content">
        <header className="console-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              className="console-hamburger"
              onClick={() => setSidebarOpen((s) => !s)}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
            <span className="console-breadcrumb">
              CONSOLE / <span>{breadcrumbLabel}</span>
            </span>
          </div>
          <div className="console-topbar-right">
            <span className="console-datetime">{utcString}</span>
            <span className="console-demo-badge">DEMO_MODE</span>
          </div>
        </header>

        <main className="console-main">
          {children}
        </main>
      </div>
    </div>
  )
}
