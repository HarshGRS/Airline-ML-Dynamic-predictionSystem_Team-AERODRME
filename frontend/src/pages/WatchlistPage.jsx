import { useEffect, useState } from 'react'
import { Trash2, ToggleLeft, ToggleRight, Bell } from 'lucide-react'
import { api } from '../services/api'

/* ── city options from backend City enum ───────────── */
const CITIES = ['Bangalore', 'Chennai', 'Delhi', 'Hyderabad', 'Kolkata', 'Mumbai']

/* helper: "Bangalore" → "BLR" style abbreviation table */
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

/* pick a channel label to show per item (backend doesn't store channel,
   so we pick a visual rotation for demo consistency) */
const CHANNEL_CYCLE = ['EMAIL', 'PUSH', 'WEBHOOK']

function routeLabel(src, dst) {
  return `${CITY_CODE[src] ?? src} → ${CITY_CODE[dst] ?? dst}`
}

function routeSubLabel(src, dst) {
  return `${CITY_LABEL[src] ?? src} to ${CITY_LABEL[dst] ?? dst}`
}

/* ── Single alert row ──────────────────────────────── */
function AlertRow({ item, index, onToggle, onDelete }) {
  const [armed, setArmed] = useState(item.armed ?? true)
  const channel = CHANNEL_CYCLE[index % 3]

  function handleToggle() {
    const next = !armed
    setArmed(next)
    onToggle(item.id, next)
  }

  return (
    <div className={`wl-alert-row ${armed ? 'armed' : 'disarmed'}`}>
      {/* Status badge */}
      <span className={`wl-status-badge ${armed ? 'badge-armed' : 'badge-disarmed'}`}>
        {armed ? 'ARMED' : 'DISARMED'}
      </span>

      {/* Route info */}
      <div className="wl-alert-route">
        <span className="wl-alert-route-label">{routeLabel(item.source_city, item.destination_city)}</span>
        <span className="wl-alert-route-sub">{routeSubLabel(item.source_city, item.destination_city)}</span>
      </div>

      {/* Target price */}
      <div className="wl-alert-target">
        <span className="wl-target-label">target</span>
        <span className="wl-target-price">₹{Number(item.target_price).toLocaleString('en-IN')}</span>
      </div>

      {/* Channel */}
      <span className="wl-channel-badge">{channel}</span>

      {/* Actions */}
      <div className="wl-alert-actions">
        <button
          type="button"
          className="wl-action-btn"
          onClick={handleToggle}
          title={armed ? 'Disarm alert' : 'Arm alert'}
        >
          {armed
            ? <ToggleRight size={14} strokeWidth={2} />
            : <ToggleLeft size={14} strokeWidth={2} />}
          TOGGLE
        </button>
        <button
          type="button"
          className="wl-action-btn wl-delete-btn"
          onClick={() => onDelete(item.id)}
          title="Delete alert"
        >
          <Trash2 size={14} strokeWidth={2} />
          DELETE
        </button>
      </div>
    </div>
  )
}

/* ── Main Page ─────────────────────────────────────── */
export default function WatchlistPage() {
  const [watchlists, setWatchlists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [success, setSuccess] = useState(false)

  /* Form state */
  const [sourceCity, setSourceCity] = useState('Delhi')
  const [destCity, setDestCity] = useState('Mumbai')
  const [targetPrice, setTargetPrice] = useState('')
  const [channel, setChannel] = useState('EMAIL')

  useEffect(() => {
    document.title = 'Watchlist — AERODROME Console'
    fetchWatchlists()
  }, [])

  function fetchWatchlists() {
    setLoading(true)
    api.getWatchlists()
      .then((res) => {
        setWatchlists(res)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError(null)
    setSuccess(false)

    if (sourceCity === destCity) {
      setFormError('Source and destination cities must differ.')
      return
    }
    const price = parseFloat(targetPrice)
    if (!targetPrice || isNaN(price) || price <= 0) {
      setFormError('Enter a valid target price.')
      return
    }

    setSubmitting(true)
    try {
      const newItem = await api.createWatchlist({
        source_city: sourceCity,
        destination_city: destCity,
        target_price: price,
      })
      setWatchlists((prev) => [newItem, ...prev])
      setTargetPrice('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    await api.deleteWatchlist(id)
    setWatchlists((prev) => prev.filter((w) => w.id !== id))
  }

  function handleToggle(id, armed) {
    // Toggle is UI-only for now (no backend endpoint for toggle)
    setWatchlists((prev) =>
      prev.map((w) => (w.id === id ? { ...w, armed } : w))
    )
  }

  return (
    <>
      {/* Page header */}
      <div className="console-page-header">
        <h1>Watchlist</h1>
        <p>Arm drop alerts on any route — fires when the predicted price falls below your target.</p>
      </div>

      {/* Two-column layout */}
      <div className="wl-layout">
        {/* ── Left: New Alert Form ─────────────────── */}
        <div className="wl-form-panel console-panel">
          <div className="console-panel-header">
            <h2 className="console-panel-title">NEW_ALERT</h2>
          </div>

          <form className="wl-form" onSubmit={handleSubmit}>
            {/* Route selector */}
            <div className="wl-field">
              <label className="wl-label">ROUTE</label>
              <select
                className="wl-select"
                value={`${sourceCity}|||${destCity}`}
                onChange={(e) => {
                  const [src, dst] = e.target.value.split('|||')
                  setSourceCity(src)
                  setDestCity(dst)
                }}
              >
                {CITIES.flatMap((src) =>
                  CITIES.filter((dst) => dst !== src).map((dst) => (
                    <option key={`${src}-${dst}`} value={`${src}|||${dst}`}>
                      {CITY_CODE[src]} → {CITY_CODE[dst]}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Target price */}
            <div className="wl-field">
              <label className="wl-label" htmlFor="wl-price">TARGET_PRICE_INR</label>
              <input
                id="wl-price"
                type="number"
                min="1"
                max="200000"
                step="1"
                className="wl-input"
                placeholder="e.g. 8000"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
              />
            </div>

            {/* Channel toggle */}
            <div className="wl-field">
              <label className="wl-label">CHANNEL</label>
              <div className="wl-channel-group">
                {['EMAIL', 'PUSH', 'WEBHOOK'].map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    className={`wl-channel-btn ${channel === ch ? 'active' : ''}`}
                    onClick={() => setChannel(ch)}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            {formError && (
              <p className="wl-form-error">{formError}</p>
            )}
            {success && (
              <p className="wl-form-success">Alert armed successfully.</p>
            )}

            <button
              type="submit"
              className="wl-arm-btn"
              disabled={submitting}
            >
              <Bell size={14} strokeWidth={2.5} />
              {submitting ? 'ARMING...' : 'ARM_ALERT'}
            </button>
          </form>
        </div>

        {/* ── Right: Active Alerts ─────────────────── */}
        <div className="wl-alerts-panel console-panel">
          <div className="console-panel-header">
            <h2 className="console-panel-title">ACTIVE_ALERTS</h2>
            {!loading && (
              <span className="wl-total-badge">{watchlists.length} TOTAL</span>
            )}
          </div>

          <div className="wl-alerts-body">
            {loading ? (
              <div className="wl-state-msg">Loading alerts...</div>
            ) : error ? (
              <div className="wl-state-msg wl-state-error">
                {error}
              </div>
            ) : watchlists.length === 0 ? (
              <div className="wl-empty">
                <Bell size={32} strokeWidth={1.5} style={{ opacity: 0.3 }} />
                <p>No active watchlist alerts.</p>
                <p>Create one using the form on the left.</p>
              </div>
            ) : (
              watchlists.map((item, i) => (
                <AlertRow
                  key={item.id}
                  item={item}
                  index={i}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}
