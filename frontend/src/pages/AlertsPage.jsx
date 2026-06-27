import { useEffect, useState } from 'react'
import { Search, RefreshCw, TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react'
import { api } from '../services/api'

/* ── Alert type config ────────────────────────────── */
const TYPE_CONFIG = {
  PRICE_SPIKE: {
    label: 'PRICE_SPIKE',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.12)',
    border: 'rgba(249,115,22,0.35)',
    valueColor: '#f97316',
    icon: TrendingUp,
  },
  PRICE_DROP: {
    label: 'PRICE_DROP',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.35)',
    valueColor: '#ef4444',
    icon: TrendingDown,
  },
  DEMAND_SURGE: {
    label: 'DEMAND_SURGE',
    color: '#22d3ee',
    bg: 'rgba(34,211,238,0.12)',
    border: 'rgba(34,211,238,0.35)',
    valueColor: '#22d3ee',
    icon: Zap,
  },
  VOLATILITY: {
    label: 'VOLATILITY',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.12)',
    border: 'rgba(167,139,250,0.35)',
    valueColor: '#a78bfa',
    icon: Activity,
  },
}


/* ── Single Alert Card ────────────────────────────── */
function AlertCard({ alert }) {
  const [investigating, setInvestigating] = useState(false)
  const [done, setDone] = useState(false)

  const cfg = TYPE_CONFIG[alert.type] ?? {
    label: alert.type,
    color: '#22d3ee',
    bg: 'rgba(34,211,238,0.1)',
    border: 'rgba(34,211,238,0.25)',
    valueColor: '#22d3ee',
    icon: Activity,
  }
  const Icon = cfg.icon
  const isNeg = alert.value.startsWith('-')

  function handleInvestigate() {
    if (investigating || done) return
    setInvestigating(true)
    setTimeout(() => {
      setInvestigating(false)
      setDone(true)
      setTimeout(() => setDone(false), 3000)
    }, 1800)
  }

  return (
    <div
      className="ac-card"
      style={{ '--ac-accent': cfg.color, '--ac-accent-bg': cfg.bg, '--ac-accent-border': cfg.border }}
    >
      {/* Glow strip at top */}
      <div className="ac-card-glow" />

      {/* Card header */}
      <div className="ac-card-header">
        <span
          className="ac-type-badge"
          style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
        >
          {cfg.label}
        </span>
        <span className="ac-timestamp">{alert.timestamp}</span>
      </div>

      {/* Route */}
      <div className="ac-route">
        <span className="ac-route-src">{alert.source}</span>
        <span className="ac-route-arrow">→</span>
        <span className="ac-route-dst">{alert.destination}</span>
      </div>

      {/* Description */}
      <p className="ac-description">{alert.description}</p>

      {/* Footer */}
      <div className="ac-card-footer">
        <div className="ac-value-wrap">
          <Icon size={14} strokeWidth={2.5} style={{ color: cfg.valueColor }} />
          <span className="ac-value" style={{ color: isNeg ? '#ef4444' : cfg.valueColor }}>
            {alert.value}
          </span>
        </div>
        <button
          type="button"
          className={`ac-investigate-btn ${investigating ? 'ac-btn-busy' : ''} ${done ? 'ac-btn-done' : ''}`}
          onClick={handleInvestigate}
          disabled={investigating}
        >
          {investigating ? 'LOADING…' : done ? 'QUEUED ✓' : 'INVESTIGATE →'}
        </button>
      </div>
    </div>
  )
}

/* ── Main Page ────────────────────────────────────── */
export default function AlertsPage() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    document.title = 'Alerts Center — AERODROME Console'
    fetchAlerts()
  }, [])

  function fetchAlerts() {
    setLoading(true)
    setError(null)
    api.getAlerts()
      .then((data) => {
        setAlerts(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }

  function handleRefresh() {
    setRefreshing(true)
    api.getAlerts()
      .then((data) => {
        setAlerts(data)
        setRefreshing(false)
      })
      .catch(() => setRefreshing(false))
  }

  const countOf = (type) => alerts.filter((a) => a.type === type).length

  const visible = alerts.filter((a) => {
    const matchType = filter === 'ALL' || a.type === filter
    const q = search.trim().toLowerCase()
    const matchSearch =
      !q ||
      a.source.toLowerCase().includes(q) ||
      a.destination.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.type.toLowerCase().includes(q)
    return matchType && matchSearch
  })

  return (
    <>
      {/* Page header */}
      <div className="console-page-header">
        <div className="ac-header-row">
          <div>
            <h1>Alerts Center</h1>
            <p>Anomaly detection feed from the scheduled GitHub Actions job.</p>
          </div>
          <button
            type="button"
            className={`ac-refresh-btn ${refreshing ? 'ac-refreshing' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh alerts"
          >
            <RefreshCw size={14} strokeWidth={2.5} />
            {refreshing ? 'REFRESHING' : 'REFRESH'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="ac-search-wrap">
        <Search size={14} strokeWidth={2} className="ac-search-icon" />
        <input
          type="text"
          className="ac-search-input"
          placeholder="Search routes, alert types, descriptions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            type="button"
            className="ac-search-clear"
            onClick={() => setSearch('')}
          >
            ×
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="ac-filter-bar">
        <button
          type="button"
          className={`ac-filter-tab ${filter === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilter('ALL')}
        >
          ALL ({alerts.length})
        </button>
        {[...new Set(alerts.map(a => a.type))].map((type) => {
          const cnt = countOf(type)
          if (cnt === 0) return null
          const cfg = TYPE_CONFIG[type]
          return (
            <button
              key={type}
              type="button"
              className={`ac-filter-tab ${filter === type ? 'active' : ''}`}
              onClick={() => setFilter(type)}
              style={
                filter === type
                  ? { '--ac-tab-color': cfg?.color, color: cfg?.color, borderColor: cfg?.color, background: cfg?.bg }
                  : {}
              }
            >
              {type} ({cnt})
            </button>
          )
        })}
      </div>

      {/* Content area */}
      {loading ? (
        <div className="ac-state">
          <div className="ac-spinner" />
          <p>Loading alerts…</p>
        </div>
      ) : error ? (
        <div className="ac-state ac-state-error">
          <Activity size={28} strokeWidth={1.5} />
          <p>{error}</p>
          <button type="button" className="ac-retry-btn" onClick={fetchAlerts}>
            RETRY
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="ac-state">
          <Activity size={32} strokeWidth={1.5} style={{ opacity: 0.25 }} />
          <p style={{ opacity: 0.45 }}>No alerts match this filter.</p>
        </div>
      ) : (
        <div className="ac-grid">
          {visible.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </>
  )
}
