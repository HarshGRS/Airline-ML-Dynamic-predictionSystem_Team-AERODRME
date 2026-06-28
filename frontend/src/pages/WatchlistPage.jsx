import { useEffect, useState } from 'react'
import { Trash2, Bookmark, Plane, TrendingUp, TrendingDown, Minus, Clock, Calendar, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/* ── city abbreviation table ──────────────────────── */
const CITY_CODE = {
  Bangalore: 'BLR',
  Chennai: 'MAA',
  Delhi: 'DEL',
  Hyderabad: 'HYD',
  Kolkata: 'CCU',
  Mumbai: 'BOM',
}

const CITY_LABEL = {
  Bangalore: 'Bangalore',
  Chennai: 'Chennai',
  Delhi: 'New Delhi',
  Hyderabad: 'Hyderabad',
  Kolkata: 'Kolkata',
  Mumbai: 'Mumbai',
}

function codeOf(city) {
  return CITY_CODE[city] ?? city
}

function labelOf(city) {
  return CITY_LABEL[city] ?? city
}

/* ── Trend icon helper ────────────────────────────── */
function TrendIcon({ dir }) {
  if (dir === 'up') return <TrendingUp size={13} strokeWidth={2.5} />
  if (dir === 'down') return <TrendingDown size={13} strokeWidth={2.5} />
  return <Minus size={13} strokeWidth={2.5} />
}

function trendLabel(dir) {
  if (dir === 'up') return 'Rising'
  if (dir === 'down') return 'Dropping'
  return 'Stable'
}

/* ── Relative time helper ─────────────────────────── */
function timeAgo(isoString) {
  if (!isoString) return ''
  const ms = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

/* ── Single watchlist card ────────────────────────── */
function WatchlistCard({ item, onDelete }) {
  const [removing, setRemoving] = useState(false)

  function handleDelete() {
    setRemoving(true)
    // Small delay for exit animation
    setTimeout(() => onDelete(item.id), 280)
  }

  return (
    <div className={`wl-route-card ${removing ? 'wl-card-exit' : ''}`}>
      {/* Top: Route header */}
      <div className="wl-card-header">
        <div className="wl-card-route">
          <span className="wl-card-code">{codeOf(item.from)}</span>
          <ArrowRight size={14} strokeWidth={2} className="wl-card-arrow" />
          <span className="wl-card-code">{codeOf(item.to)}</span>
        </div>
        <button
          type="button"
          className="wl-card-delete"
          onClick={handleDelete}
          title="Remove from watchlist"
        >
          <Trash2 size={13} strokeWidth={2} />
        </button>
      </div>

      {/* Sub-route label */}
      <div className="wl-card-sub-route">
        {labelOf(item.from)} to {labelOf(item.to)}
      </div>

      {/* Info grid */}
      <div className="wl-card-info-grid">
        {item.airline && (
          <div className="wl-card-info">
            <Plane size={12} strokeWidth={2} />
            <span>{item.airline}</span>
          </div>
        )}
        {item.departDate && (
          <div className="wl-card-info">
            <Calendar size={12} strokeWidth={2} />
            <span>{item.departDate}</span>
          </div>
        )}
        {item.travelClass && (
          <div className="wl-card-info">
            <span className="wl-card-class-dot" />
            <span>{item.travelClass}</span>
          </div>
        )}
        {item.stops != null && (
          <div className="wl-card-info">
            <span className="wl-card-class-dot" />
            <span>{item.stops === 'zero' || item.stops === 0 ? 'Non-stop' : `${item.stops} stop${item.stops > 1 ? 's' : ''}`}</span>
          </div>
        )}
      </div>

      {/* Bottom row: Price + Verdict + Trend */}
      <div className="wl-card-bottom">
        <div className="wl-card-price">
          ₹{Number(item.priceContext || 0).toLocaleString('en-IN')}
        </div>

        {item.verdict && (
          <span className={`wl-card-verdict ${item.verdict === 'Book now' ? 'verdict-book' : 'verdict-wait'}`}>
            {item.verdict}
          </span>
        )}

        {item.trendDir && (
          <span className={`wl-card-trend trend-${item.trendDir}`}>
            <TrendIcon dir={item.trendDir} />
            {trendLabel(item.trendDir)}
          </span>
        )}

        {item.addedAt && (
          <span className="wl-card-time">
            <Clock size={11} strokeWidth={2} />
            {timeAgo(item.addedAt)}
          </span>
        )}
      </div>
    </div>
  )
}

/* ── Main Page ─────────────────────────────────────── */
export default function WatchlistPage({ watchlist = [], onRemove }) {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Watchlist — AERODROME Console'
  }, [])

  // Compute summary stats
  const totalRoutes = watchlist.length
  const uniqueRoutes = new Set(watchlist.map((w) => `${w.from}-${w.to}`)).size
  const bookNowCount = watchlist.filter((w) => w.verdict === 'Book now').length
  const avgPrice = totalRoutes > 0
    ? Math.round(watchlist.reduce((sum, w) => sum + (w.priceContext || 0), 0) / totalRoutes)
    : 0

  return (
    <>
      {/* Page header */}
      <div className="console-page-header">
        <h1>Watchlist</h1>
        <p>Your saved flight routes — track prices and find the best time to book.</p>
      </div>

      {/* Summary strip */}
      <div className="wl-summary-strip">
        <div className="wl-summary-stat">
          <span className="wl-stat-value">{totalRoutes}</span>
          <span className="wl-stat-label">SAVED</span>
        </div>
        <div className="wl-summary-stat">
          <span className="wl-stat-value">{uniqueRoutes}</span>
          <span className="wl-stat-label">ROUTES</span>
        </div>
        <div className="wl-summary-stat">
          <span className="wl-stat-value">{bookNowCount}</span>
          <span className="wl-stat-label">BOOK NOW</span>
        </div>
        <div className="wl-summary-stat">
          <span className="wl-stat-value">{avgPrice > 0 ? `₹${avgPrice.toLocaleString('en-IN')}` : '—'}</span>
          <span className="wl-stat-label">AVG PRICE</span>
        </div>
      </div>

      {/* Watchlist items */}
      <div className="console-panel wl-items-panel">
        <div className="console-panel-header">
          <h2 className="console-panel-title">SAVED_ROUTES</h2>
          {totalRoutes > 0 && (
            <span className="wl-total-badge">{totalRoutes} TOTAL</span>
          )}
        </div>

        <div className="wl-items-body">
          {totalRoutes === 0 ? (
            <div className="wl-empty">
              <Bookmark size={36} strokeWidth={1.5} style={{ opacity: 0.3 }} />
              <p>No saved routes yet.</p>
              <p>Search for a flight and add it to your watchlist from the results page.</p>
              <button
                type="button"
                className="wl-empty-cta"
                onClick={() => navigate('/dashboard/predict')}
              >
                <Plane size={14} strokeWidth={2.5} />
                SEARCH_FLIGHTS
              </button>
            </div>
          ) : (
            <div className="wl-cards-grid">
              {watchlist.map((item) => (
                <WatchlistCard
                  key={item.id}
                  item={item}
                  onDelete={onRemove}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
