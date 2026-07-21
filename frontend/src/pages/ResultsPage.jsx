import { useEffect, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { api } from '../services/api'

/* ── Helpers ───────────────────────────────────────── */
function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)
}

/* Map frontend form values → backend enum values */
const AIRLINE_MAP = {
  AirAsia: 'AirAsia',
  'Air India': 'Air_India',
  'GO FIRST': 'GO_FIRST',
  Indigo: 'Indigo',
  SpiceJet: 'SpiceJet',
  Vistara: 'Vistara',
}

const TIME_MAP = {
  'Early Morning': 'Early_Morning',
  Morning: 'Morning',
  Afternoon: 'Afternoon',
  Evening: 'Evening',
  Night: 'Night',
  'Late Night': 'Late_Night',
}

const STOPS_MAP = {
  'Non-stop': 'zero',
  '1 Stop': 'one',
  '2+ Stops': 'two_or_more',
}

const CITIES = ['Bangalore', 'Chennai', 'Delhi', 'Hyderabad', 'Kolkata', 'Mumbai']
const AIRLINES = ['AirAsia', 'Air India', 'GO FIRST', 'Indigo', 'SpiceJet', 'Vistara']
const TIME_OPTIONS = ['Early Morning', 'Morning', 'Afternoon', 'Evening', 'Night', 'Late Night']
const STOP_OPTIONS = ['Non-stop', '1 Stop', '2+ Stops']
const CABIN_OPTIONS = ['Economy', 'Business']

function buildPredictPayload(params) {
  return {
    airline: AIRLINE_MAP[params.airline] || params.airline,
    source_city: params.from,
    destination_city: params.to,
    departure_time: TIME_MAP[params.departureTime] || params.departureTime,
    arrival_time: TIME_MAP[params.arrivalTime] || params.arrivalTime,
    stops: STOPS_MAP[params.stops] || params.stops,
    class: params.travelClass,
    duration: params.duration,
    days_left: Math.max(1, Math.min(49, params.daysLeft)),
  }
}

/* Days-left sample points for the trend curve */
const TREND_DAYS = [1, 3, 5, 7, 10, 14, 18, 21, 28, 35, 42, 49]

function buildBatchPayloads(params) {
  const base = buildPredictPayload(params)
  return TREND_DAYS.map((d) => ({ ...base, days_left: d }))
}

/* ── Custom chart tooltip ─────────────────────────── */
function TrendChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="results-chart-tooltip">
      <div className="rct-label">{label} days out</div>
      <div className="rct-price">{formatPrice(payload[0].value)}</div>
      {payload[0].payload.low != null && (
        <div className="rct-range">
          {formatPrice(payload[0].payload.low)} — {formatPrice(payload[0].payload.high)}
        </div>
      )}
    </div>
  )
}

/* ── Main Page ─────────────────────────────────────── */
export default function ResultsPage({ onAddToWatchlist, watchlist }) {
  const { state } = useLocation()
  const navigate = useNavigate()

  /* Current search params (editable) */
  const [params, setParams] = useState(null)

  /* API state */
  const [prediction, setPrediction] = useState(null)
  const [trendData, setTrendData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /* UI state */
  const [addedToast, setAddedToast] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)

  /* Initialize params from navigation state */
  useEffect(() => {
    if (state) {
      setParams({ ...state })
    }
  }, [state])

  /* Fetch prediction whenever params change */
  const fetchPrediction = useCallback(async (p) => {
    setLoading(true)
    setError(null)
    try {
      /* Single prediction for the user's chosen days_left */
      const mainPayload = buildPredictPayload(p)
      const mainResult = await api.predict(mainPayload)
      setPrediction(mainResult)

      /* Batch predictions for the trend curve */
      const batchPayloads = buildBatchPayloads(p)
      const batchResults = await api.predictBatch(batchPayloads)
      const trend = TREND_DAYS.map((d, i) => ({
        days: d,
        price: Math.round(batchResults[i].predicted_price),
        low: Math.round(batchResults[i].confidence_low),
        high: Math.round(batchResults[i].confidence_high),
      })).reverse() // So chart reads left-to-right: 49d → 1d
      setTrendData(trend)
    } catch (err) {
      console.error('Prediction error:', err)
      setError(err.message || 'Failed to fetch prediction')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    document.title = 'Price trends and booking decision — AERODROME'
  }, [])

  useEffect(() => {
    if (params) {
      fetchPrediction(params)
    }
  }, [params, fetchPrediction])

  /* No state → redirect prompt */
  if (!state) {
    return (
      <div className="results-no-data">
        <div className="results-no-data-inner">
          <span className="eyebrow">No search data</span>
          <h2>Nothing to show here yet</h2>
          <p>Run a search from the home page to see price trends and the ML prediction.</p>
          <button type="button" className="search-button" onClick={() => navigate('/')}>
            Go to search
          </button>
        </div>
      </div>
    )
  }

  if (!params) return null

  const {
    from, to, airline, tripType, travelClass, stops,
    departDate, returnDate, departureTime, arrivalTime,
    duration, daysLeft,
  } = params

  const predictedPrice = prediction?.predicted_price ?? 0
  const confidenceLow = prediction?.confidence_low ?? 0
  const confidenceHigh = prediction?.confidence_high ?? 0
  const modelVersion = prediction?.model_version ?? '—'
  const isOOD = prediction?.out_of_distribution ?? false

  /* Derive trend insight from batch data */
  const trendInsight = (() => {
    if (trendData.length < 3) return { text: 'Analyzing trend...', dir: 'stable' }
    const farOut = trendData[0]?.price ?? 0 // 49 days
    const closeIn = trendData[trendData.length - 1]?.price ?? 0 // 1 day
    const delta = closeIn - farOut
    if (delta > 800) return { text: 'Prices rise sharply as departure nears. Book early for the best fare.', dir: 'up' }
    if (delta > 200) return { text: 'Prices trend upward closer to departure. Booking soon is recommended.', dir: 'up' }
    if (delta < -300) return { text: 'Prices drop closer to departure. Waiting could improve the fare.', dir: 'down' }
    return { text: 'Prices are fairly stable across booking windows. This is a reasonable time to book.', dir: 'stable' }
  })()

  const verdict = predictedPrice < 7600 ? 'Book now' : 'Wait and watch'

  const isOnWatchlist = watchlist.some(
    (f) => f.from === from && f.to === to && f.airline === airline && f.departDate === departDate
  )

  const handleAddToWatchlist = () => {
    onAddToWatchlist({
      from, to, airline, tripType, travelClass, stops,
      departDate, returnDate, departureTime, arrivalTime,
      duration, daysLeft,
      priceContext: predictedPrice,
      verdict,
      trendDir: trendInsight.dir,
    })
    setAddedToast(true)
    setTimeout(() => setAddedToast(false), 3000)
  }

  /* Param updater */
  const updateParam = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  const handleEditorSubmit = (e) => {
    e.preventDefault()
    setEditorOpen(false)
    // params change triggers useEffect → fetchPrediction
  }

  return (
    <section className="decision-page">
      {/* Toast */}
      {addedToast && (
        <div className="watchlist-toast" role="status">
          <BookmarkCheck size={16} />
          Added to watchlist! View it in your Dashboard.
        </div>
      )}

      <header className="decision-hero">
        <div className="decision-copy">
          <span className="eyebrow">Booking decision page</span>
          <h1>Review price trends before booking</h1>
          <p className="lede">
            The ML model has analyzed this route. Use the predicted fare and trend chart to decide when to book.
          </p>

          {/* Key metrics */}
          <div className="decision-metrics">
            <article>
              <span>Route</span>
              <strong>{from} → {to}</strong>
            </article>
            <article>
              <span>ML predicted fare</span>
              <strong>
                {loading
                  ? <Loader2 size={16} className="spin-icon" />
                  : formatPrice(predictedPrice)
                }
              </strong>
            </article>
            <article>
              <span>Trip type</span>
              <strong>{tripType}</strong>
            </article>
            <article>
              <span>Decision</span>
              <strong>
                {loading
                  ? <Loader2 size={14} className="spin-icon" />
                  : verdict
                }
              </strong>
            </article>
          </div>

          {/* Action buttons */}
          <div className="results-actions">
            <button
              type="button"
              className="results-back-btn"
              onClick={() => setEditorOpen(!editorOpen)}
            >
              {editorOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              Modify search
            </button>
            <button
              type="button"
              className={`watchlist-btn ${isOnWatchlist ? 'watchlist-btn--saved' : ''}`}
              onClick={handleAddToWatchlist}
              disabled={isOnWatchlist || loading}
            >
              {isOnWatchlist ? (
                <><BookmarkCheck size={15} strokeWidth={2.2} /> Saved to watchlist</>
              ) : (
                <><Bookmark size={15} strokeWidth={2.2} /> Add to watchlist</>
              )}
            </button>
          </div>

          {/* ── Inline parameter editor ─────────────────── */}
          {editorOpen && (
            <form className="results-editor" onSubmit={handleEditorSubmit}>
              <div className="re-grid">
                <div className="re-field">
                  <label>FROM</label>
                  <select value={from} onChange={(e) => updateParam('from', e.target.value)}>
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="re-field">
                  <label>TO</label>
                  <select value={to} onChange={(e) => updateParam('to', e.target.value)}>
                    {CITIES.filter((c) => c !== from).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="re-field">
                  <label>AIRLINE</label>
                  <select value={airline} onChange={(e) => updateParam('airline', e.target.value)}>
                    {AIRLINES.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="re-field">
                  <label>CLASS</label>
                  <select value={travelClass} onChange={(e) => updateParam('travelClass', e.target.value)}>
                    {CABIN_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="re-field">
                  <label>STOPS</label>
                  <select value={stops} onChange={(e) => updateParam('stops', e.target.value)}>
                    {STOP_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="re-field">
                  <label>DEP. TIME</label>
                  <select value={departureTime} onChange={(e) => updateParam('departureTime', e.target.value)}>
                    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="re-field">
                  <label>ARR. TIME</label>
                  <select value={arrivalTime} onChange={(e) => updateParam('arrivalTime', e.target.value)}>
                    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="re-field">
                  <label>DEPART</label>
                  <input type="date" value={departDate} onChange={(e) => updateParam('departDate', e.target.value)} />
                </div>
                <div className="re-field">
                  <label>DURATION (h)</label>
                  <input
                    type="number" min="0.5" max="24" step="0.5" value={duration}
                    onChange={(e) => updateParam('duration', parseFloat(e.target.value))}
                  />
                </div>
                <div className="re-field">
                  <label>DAYS OUT</label>
                  <input
                    type="number" min="1" max="49" value={daysLeft}
                    onChange={(e) => updateParam('daysLeft', parseInt(e.target.value, 10))}
                  />
                </div>
              </div>
              <button type="submit" className="re-submit">
                <RefreshCw size={14} strokeWidth={2.5} />
                UPDATE PREDICTION
              </button>
            </form>
          )}
        </div>

        {/* Model verdict card */}
        <article className="decision-card decision-outcome">
          <span className="card-label">Model verdict</span>
          {loading ? (
            <div className="results-loading-card">
              <Loader2 size={28} className="spin-icon" />
              <p>Running ML prediction...</p>
            </div>
          ) : error ? (
            <div className="results-error-card">
              <ShieldAlert size={22} />
              <p>{error}</p>
              <button type="button" className="search-button" onClick={() => fetchPrediction(params)}>
                Retry
              </button>
            </div>
          ) : (
            <>
              <h2>{verdict}</h2>
              <p>
                The model predicts {formatPrice(predictedPrice)} for this route with{' '}
                {daysLeft} day{daysLeft > 1 ? 's' : ''} lead time.
              </p>

              {/* Confidence interval */}
              <div className="confidence-bar">
                <div className="confidence-labels">
                  <span>{formatPrice(confidenceLow)}</span>
                  <span className="confidence-predicted">{formatPrice(predictedPrice)}</span>
                  <span>{formatPrice(confidenceHigh)}</span>
                </div>
                <div className="confidence-track">
                  <div className="confidence-fill" />
                  <div className="confidence-marker" />
                </div>
                <span className="confidence-caption">Confidence interval (±MAE)</span>
              </div>

              {isOOD && (
                <div className="ood-warning">
                  <ShieldAlert size={13} />
                  Out-of-distribution — prediction may be less reliable
                </div>
              )}

              <div className="decision-outcome-grid">
                <div>
                  <span>Cabin</span>
                  <strong>{travelClass}</strong>
                </div>
                <div>
                  <span>Airline</span>
                  <strong>{airline}</strong>
                </div>
                <div>
                  <span>Departure</span>
                  <strong>{departDate}</strong>
                </div>
                <div>
                  <span>Model</span>
                  <strong>{modelVersion}</strong>
                </div>
              </div>
            </>
          )}
        </article>
      </header>

      {/* ── Trend chart section ────────────────────────── */}
      <section className="trend-grid">
        <article className="decision-card chart-card">
          <div className="chart-heading">
            <div>
              <span className="eyebrow">Price vs. booking window</span>
              <h2>How fare changes with lead time</h2>
              <p>ML predictions at different days-before-departure. Your current selection ({daysLeft}d) is highlighted.</p>
            </div>
            <div className="price-callout">
              <span>Predicted fare</span>
              <strong>
                {loading ? <Loader2 size={16} className="spin-icon" /> : formatPrice(predictedPrice)}
              </strong>
            </div>
          </div>
          <div className="chart-wrap">
            {loading ? (
              <div className="chart-loading">
                <Loader2 size={24} className="spin-icon" />
                <span>Generating trend data...</span>
              </div>
            ) : trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="days"
                    tick={{ fill: '#aeb7c2', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    reversed
                    label={{ value: 'Days before departure', position: 'insideBottom', offset: -2, fill: '#636b78', fontSize: 11 }}
                  />
                  <YAxis
                    tick={{ fill: '#aeb7c2', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={55}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(1)}k`}
                  />
                  <Tooltip content={<TrendChartTooltip />} cursor={{ stroke: 'rgba(34, 211, 238, 0.3)' }} />
                  <ReferenceLine
                    x={daysLeft}
                    stroke="rgba(109, 94, 245, 0.6)"
                    strokeDasharray="4 4"
                    label={{ value: 'You', position: 'top', fill: '#a78bfa', fontSize: 11 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#22d3ee"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#priceFill)"
                    dot={false}
                    activeDot={{
                      r: 5,
                      stroke: '#22d3ee',
                      strokeWidth: 2,
                      fill: '#0c0920',
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : null}
          </div>
          <div className="chart-legend">
            <span><span className="legend-dot" style={{ background: '#22d3ee' }} />Predicted price</span>
            <span><span className="legend-dot" style={{ background: '#a78bfa' }} />Your booking window</span>
          </div>
        </article>

        <div className="chart-side">
          <article className="insight-card">
            <span className="eyebrow">Trend analysis</span>
            <div className="insight-trend-header">
              {trendInsight.dir === 'down'
                ? <TrendingDown size={20} className="trend-icon trend-icon--down" />
                : <TrendingUp size={20} className={`trend-icon trend-icon--${trendInsight.dir === 'up' ? 'up' : 'stable'}`} />
              }
              <h3>{loading ? 'Analyzing...' : trendInsight.text}</h3>
            </div>
            <p>
              The chart shows how the ML model prices this exact route configuration at different booking lead times.
            </p>
          </article>

          <article className="insight-card">
            <span className="eyebrow">Decision support</span>
            <h3>Choose with data, not guesswork</h3>
            <p>
              Compare your booking timing against the price curve. The model accounts for route demand, seasonality, and fare class.
            </p>
          </article>

          <article className="insight-card insight-card--watchlist-cta">
            <span className="eyebrow">Track this flight</span>
            <h3>Monitor price changes over time</h3>
            <p>
              Save this route to your watchlist and check back in your dashboard to see how fares evolve.
            </p>
            <button
              type="button"
              className={`watchlist-btn watchlist-btn--full ${isOnWatchlist ? 'watchlist-btn--saved' : ''}`}
              onClick={handleAddToWatchlist}
              disabled={isOnWatchlist || loading}
            >
              {isOnWatchlist
                ? <><BookmarkCheck size={15} /> Saved to watchlist</>
                : <><Bookmark size={15} /> Add to watchlist</>
              }
            </button>
          </article>
        </div>
      </section>

      {/* ── Breakdown section ──────────────────────────── */}
      <section className="decision-breakdown">
        <article className="breakdown-card">
          <span className="eyebrow">Model input summary</span>
          <div className="breakdown-list">
            <div>
              <p>Route</p>
              <strong>{from} → {to}</strong>
            </div>
            <div>
              <p>Booking window</p>
              <strong>{daysLeft} day{daysLeft > 1 ? 's' : ''} out</strong>
            </div>
            <div>
              <p>Flight duration</p>
              <strong>{duration}h · {stops}</strong>
            </div>
          </div>
        </article>

        <article className="breakdown-card callout-card">
          <span className="eyebrow">Next step</span>
          <h3>Adjust parameters above or search another route to compare trend profiles.</h3>
          <button type="button" className="search-button" onClick={() => navigate('/')}>
            <ArrowLeft size={14} /> New search
          </button>
        </article>
      </section>
    </section>
  )
}
