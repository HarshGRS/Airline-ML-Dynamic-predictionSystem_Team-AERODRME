import { useEffect, useState } from 'react'
import { Trash2, Bookmark, Plane, Clock, ArrowRight } from 'lucide-react'
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

/* ── Single saved search card ─────────────────────── */
function SavedSearchCard({ item, onDelete }) {
  const navigate = useNavigate()
  const [removing, setRemoving] = useState(false)
  const [hovered, setHovered] = useState(false)

  function handleDelete(e) {
    e.stopPropagation() // prevent card click
    setRemoving(true)
    setTimeout(() => onDelete(item.id), 280)
  }

  function handleInvestigate() {
    navigate('/dashboard/predict', {
      state: {
        source_city: item.source_city,
        destination_city: item.destination_city,
        cabin: item.flight_class || 'Economy',
        // Intentionally not setting depart_date so the user can select a new one
      }
    })
  }

  return (
    <div
      className={`saved-search-route-card ${removing ? 'saved-search-card-exit' : ''}`}
      onClick={handleInvestigate}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer', position: 'relative', transition: 'border-color 200ms, box-shadow 200ms' }}
    >
      {/* Top: Route header */}
      <div className="saved-search-card-header">
        <div className="saved-search-card-route">
          <span className="saved-search-card-code">{codeOf(item.source_city)}</span>
          <ArrowRight size={14} strokeWidth={2} className="saved-search-card-arrow" />
          <span className="saved-search-card-code">{codeOf(item.destination_city)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {hovered && (
            <span style={{
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em',
              color: '#a78bfa', fontFamily: "'Space Grotesk', sans-serif",
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              opacity: hovered ? 1 : 0, transition: 'opacity 150ms',
            }}>
              SEARCH <ArrowRight size={11} strokeWidth={2.5} />
            </span>
          )}
          <button
            type="button"
            className="saved-search-card-delete"
            onClick={handleDelete}
            title="Remove from saved searches"
          >
            <Trash2 size={13} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Sub-route label */}
      <div className="saved-search-card-sub-route">
        {labelOf(item.source_city)} to {labelOf(item.destination_city)}
      </div>

      {/* Info grid */}
      <div className="saved-search-card-info-grid">
        {item.flight_class && (
          <div className="saved-search-card-info">
            <span className="saved-search-card-class-dot" />
            <span>{item.flight_class}</span>
          </div>
        )}
      </div>

      {/* Bottom row */}
      <div className="saved-search-card-bottom">
        {item.created_at && (
          <span className="saved-search-card-time">
            <Clock size={11} strokeWidth={2} />
            {timeAgo(item.created_at)}
          </span>
        )}
      </div>
    </div>
  )
}

/* ── Main Page ─────────────────────────────────────── */
export default function SavedSearchesPage({ savedSearches = [], onRemove }) {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Saved Searches — AERODROME Console'
  }, [])

  // Compute summary stats
  const totalRoutes = savedSearches.length
  const uniqueRoutes = new Set(savedSearches.map((w) => `${w.source_city}-${w.destination_city}`)).size

  return (
    <>
      {/* Page header */}
      <div className="console-page-header">
        <h1>Saved Searches</h1>
        <p>Your saved flight routes — quickly re-run predictions for your favorite routes.</p>
      </div>

      {/* Summary strip */}
      <div className="saved-search-summary-strip">
        <div className="saved-search-summary-stat">
          <span className="saved-search-stat-value">{totalRoutes}</span>
          <span className="saved-search-stat-label">SAVED</span>
        </div>
        <div className="saved-search-summary-stat">
          <span className="saved-search-stat-value">{uniqueRoutes}</span>
          <span className="saved-search-stat-label">ROUTES</span>
        </div>
      </div>

      {/* Saved Search items */}
      <div className="console-panel saved-search-items-panel">
        <div className="console-panel-header">
          <h2 className="console-panel-title">SAVED_ROUTES</h2>
          {totalRoutes > 0 && (
            <span className="saved-search-total-badge">{totalRoutes} TOTAL</span>
          )}
        </div>

        <div className="saved-search-items-body">
          {totalRoutes === 0 ? (
            <div className="saved-search-empty">
              <Bookmark size={36} strokeWidth={1.5} style={{ opacity: 0.3 }} />
              <p>No saved routes yet.</p>
              <p>Search for a flight and save it to quickly access it later.</p>
              <button
                type="button"
                className="saved-search-empty-cta"
                onClick={() => navigate('/dashboard/predict')}
              >
                <Plane size={14} strokeWidth={2.5} />
                SEARCH_FLIGHTS
              </button>
            </div>
          ) : (
            <div className="saved-search-cards-grid">
              {savedSearches.map((item) => (
                <SavedSearchCard
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
