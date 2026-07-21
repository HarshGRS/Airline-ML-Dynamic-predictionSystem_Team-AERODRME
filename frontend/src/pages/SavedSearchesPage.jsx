import { useEffect, useState } from 'react'
import { Trash2, Bookmark, Plane, Calendar, ArrowRight, Play } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

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

/* ── Single saved search card ─────────────────────── */
function SavedSearchCard({ item, onUse, onDelete }) {
  const [removing, setRemoving] = useState(false)

  function handleDelete() {
    setRemoving(true)
    setTimeout(() => onDelete(item.id), 280)
  }

  return (
    <div className={`wl-route-card ${removing ? 'wl-card-exit' : ''}`}>
      {/* Top: Route header */}
      <div className="wl-card-header">
        <div className="wl-card-route">
          <span className="wl-card-code">{codeOf(item.source_city)}</span>
          <ArrowRight size={14} strokeWidth={2} className="wl-card-arrow" />
          <span className="wl-card-code">{codeOf(item.destination_city)}</span>
        </div>
        <button
          type="button"
          className="wl-card-delete"
          onClick={handleDelete}
          title="Delete saved search"
        >
          <Trash2 size={13} strokeWidth={2} />
        </button>
      </div>

      {/* Sub-route label */}
      <div className="wl-card-sub-route">
        {labelOf(item.source_city)} to {labelOf(item.destination_city)}
      </div>

      {/* Info grid */}
      <div className="wl-card-info-grid">
        <div className="wl-card-info">
          <Plane size={12} strokeWidth={2} />
          <span>{item.airline.replace(/_/g, ' ')}</span>
        </div>
        <div className="wl-card-info">
          <Calendar size={12} strokeWidth={2} />
          <span>{item.departure_date}</span>
        </div>
        <div className="wl-card-info">
          <span className="wl-card-class-dot" />
          <span>{item.flight_class}</span>
        </div>
        <div className="wl-card-info">
          <span className="wl-card-class-dot" />
          <span>{item.stops === 'zero' ? 'Non-stop' : item.stops === 'one' ? '1 stop' : '2+ stops'}</span>
        </div>
      </div>

      {/* Bottom row: Use this search */}
      <div className="wl-card-bottom">
        <button
          type="button"
          className="wl-empty-cta"
          onClick={() => onUse(item)}
        >
          <Play size={13} strokeWidth={2.5} />
          USE_THIS_SEARCH
        </button>
      </div>
    </div>
  )
}

/* ── Main Page ─────────────────────────────────────── */
export default function SavedSearchesPage() {
  const navigate = useNavigate()
  const [savedSearches, setSavedSearches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    document.title = 'Saved Search — AERODROME Console'
    api.getSavedSearches()
      .then(setSavedSearches)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id) {
    setSavedSearches((prev) => prev.filter((s) => s.id !== id))
    await api.deleteSavedSearch(id)
  }

  function handleUse(item) {
    // Hand the saved fields to the Predict page via router state — it
    // pre-fills the form so the user just hits RUN_PREDICTION.
    navigate('/dashboard/predict', { state: { savedSearch: item } })
  }

  const totalSaved = savedSearches.length

  return (
    <>
      {/* Page header */}
      <div className="console-page-header">
        <h1>Save Search</h1>
        <p>Your saved prediction queries — reuse one to skip re-entering the form.</p>
      </div>

      {/* Saved search items */}
      <div className="console-panel wl-items-panel">
        <div className="console-panel-header">
          <h2 className="console-panel-title">SAVED_SEARCHES</h2>
          {totalSaved > 0 && (
            <span className="wl-total-badge">{totalSaved} TOTAL</span>
          )}
        </div>

        <div className="wl-items-body">
          {loading ? (
            <div className="wl-empty">
              <p>Loading saved searches...</p>
            </div>
          ) : error ? (
            <div className="wl-empty">
              <p>{error}</p>
            </div>
          ) : totalSaved === 0 ? (
            <div className="wl-empty">
              <Bookmark size={36} strokeWidth={1.5} style={{ opacity: 0.3 }} />
              <p>No saved searches yet.</p>
              <p>Run a prediction and save it to reuse the same query later.</p>
              <button
                type="button"
                className="wl-empty-cta"
                onClick={() => navigate('/dashboard/predict')}
              >
                <Plane size={14} strokeWidth={2.5} />
                GO_TO_PREDICT
              </button>
            </div>
          ) : (
            <div className="wl-cards-grid">
              {savedSearches.map((item) => (
                <SavedSearchCard
                  key={item.id}
                  item={item}
                  onUse={handleUse}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
