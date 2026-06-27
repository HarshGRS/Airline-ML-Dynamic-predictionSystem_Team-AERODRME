import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { api } from '../services/api'

/* ── Static enum data matching backend schemas ─────── */
const CITIES  = ['Bangalore', 'Chennai', 'Delhi', 'Hyderabad', 'Kolkata', 'Mumbai']
const AIRLINES = ['AirAsia', 'Air_India', 'GO_FIRST', 'Indigo', 'SpiceJet', 'Vistara']
const STOPS    = ['zero', 'one', 'two_or_more']
const TIMES    = ['Early_Morning', 'Morning', 'Afternoon', 'Evening', 'Night', 'Late_Night']

const CITY_CODE = {
  Bangalore: 'BLR', Chennai: 'MAA', Delhi: 'DEL',
  Hyderabad: 'HYD', Kolkata: 'CCU', Mumbai: 'BOM',
}

/* Typical city-pair durations (hours) */
const DURATION_MAP = {
  'Bangalore-Chennai': 1.5, 'Chennai-Bangalore': 1.5,
  'Bangalore-Delhi': 2.8,   'Delhi-Bangalore': 2.8,
  'Bangalore-Hyderabad': 1.3, 'Hyderabad-Bangalore': 1.3,
  'Bangalore-Kolkata': 2.5, 'Kolkata-Bangalore': 2.5,
  'Bangalore-Mumbai': 1.7,  'Mumbai-Bangalore': 1.7,
  'Chennai-Delhi': 2.8,     'Delhi-Chennai': 2.8,
  'Chennai-Hyderabad': 1.2, 'Hyderabad-Chennai': 1.2,
  'Chennai-Kolkata': 2.2,   'Kolkata-Chennai': 2.2,
  'Chennai-Mumbai': 2.0,    'Mumbai-Chennai': 2.0,
  'Delhi-Hyderabad': 2.3,   'Hyderabad-Delhi': 2.3,
  'Delhi-Kolkata': 2.2,     'Kolkata-Delhi': 2.2,
  'Delhi-Mumbai': 2.2,      'Mumbai-Delhi': 2.2,
  'Hyderabad-Kolkata': 2.0, 'Kolkata-Hyderabad': 2.0,
  'Hyderabad-Mumbai': 1.5,  'Mumbai-Hyderabad': 1.5,
  'Kolkata-Mumbai': 2.7,    'Mumbai-Kolkata': 2.7,
}

function getDuration(src, dst) {
  return DURATION_MAP[`${src}-${dst}`] ?? 2.5
}

function daysFromToday(dateStr) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const depart = new Date(dateStr); depart.setHours(0, 0, 0, 0)
  const diff = Math.round((depart - today) / 86400000)
  return Math.min(Math.max(diff, 1), 49)
}

function todayPlusDays(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

const formatINR = (v) => new Intl.NumberFormat('en-IN').format(Math.round(v))

/* ─────────────────────────────────────────────────────
   Build a realistic "price vs days before departure" curve.
   We sweep days_left from 49 → 1 and modulate the base price
   using a smooth curve: prices tend to rise as departure nears.
   The confidence band is shown as a shaded area.
───────────────────────────────────────────────────── */
function buildForecastCurve(result) {
  if (!result) return []
  const { predicted_price: base, confidence_low, confidence_high } = result
  const spread = confidence_high - confidence_low

  const points = []
  const STEPS = 24
  for (let i = 0; i <= STEPS; i++) {
    // t goes from 0 (far out, 49 days) → 1 (close, ~2 days)
    const t = i / STEPS
    const daysLeft = Math.round(49 - t * 47)

    // Price curve: cheaper early, spike close to departure
    // Uses smooth sigmoid + noise
    const trendFactor = 0.85 + 0.35 * (t * t) + 0.12 * Math.sin(t * Math.PI * 2.8)
    const price = base * trendFactor

    // Confidence band widens as we approach departure
    const bandFactor = 0.7 + 0.6 * t
    const low  = price - (spread / 2) * bandFactor
    const high = price + (spread / 2) * bandFactor

    points.push({
      daysLeft,
      price: Math.round(price),
      low:   Math.round(Math.max(low, 0)),
      high:  Math.round(high),
    })
  }
  return points.reverse() // left = few days, right = many days → chronological
}

/* ── Custom tooltip ──────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const price = payload.find((p) => p.dataKey === 'price')
  const high  = payload.find((p) => p.dataKey === 'high')
  const low   = payload.find((p) => p.dataKey === 'low')
  return (
    <div style={{
      background: 'rgba(8,6,25,0.97)',
      border: '1px solid rgba(34,211,238,0.3)',
      borderRadius: 10,
      padding: '0.55rem 0.9rem',
      fontSize: '0.75rem',
      fontFamily: "'Space Grotesk', sans-serif",
      lineHeight: 1.7,
    }}>
      <div style={{ color: '#635d8a', marginBottom: '0.2rem', letterSpacing: '0.06em', fontSize: '0.65rem' }}>
        {label} DAYS TO DEP
      </div>
      {price && (
        <div style={{ color: '#22d3ee', fontWeight: 800, fontSize: '1rem' }}>
          ₹{formatINR(price.value)}
        </div>
      )}
      {high && low && (
        <div style={{ color: '#635d8a', fontSize: '0.68rem' }}>
          ₹{formatINR(low.value)} – ₹{formatINR(high.value)}
        </div>
      )}
    </div>
  )
}

/* ── Stat mini-card ──────────────────────────────── */
function StatCard({ label, value }) {
  return (
    <div className="pred-stat-card">
      <span className="pred-stat-label">{label}</span>
      <span className="pred-stat-value">{value}</span>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════ */
export default function PredictPage() {
  const [sourceCity,  setSourceCity]  = useState('Delhi')
  const [destCity,    setDestCity]    = useState('Mumbai')
  const [departDate,  setDepartDate]  = useState(todayPlusDays(14))
  const [cabin,       setCabin]       = useState('Economy')
  const [airline,     setAirline]     = useState('Indigo')
  const [stops,       setStops]       = useState('zero')
  const [departTime,  setDepartTime]  = useState('Morning')
  const [arrivalTime, setArrivalTime] = useState('Afternoon')

  const [result,    setResult]    = useState(null)
  const [modelInfo, setModelInfo] = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [latencyMs, setLatencyMs] = useState(null)

  useEffect(() => {
    document.title = 'Predict — AERODROME Console'
    api.getModelInfo().then(setModelInfo).catch(() => {})
  }, [])

  async function handlePredict(e) {
    e.preventDefault()
    if (sourceCity === destCity) { setError('Source and destination must differ.'); return }
    setError(null)
    setLoading(true)
    const payload = {
      airline,
      source_city:      sourceCity,
      destination_city: destCity,
      departure_time:   departTime,
      arrival_time:     arrivalTime,
      stops,
      class:    cabin,
      duration: getDuration(sourceCity, destCity),
      days_left: daysFromToday(departDate),
    }
    const t0 = performance.now()
    try {
      const res = await api.predict(payload)
      setLatencyMs(Math.round(performance.now() - t0))
      setResult(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const forecastData  = buildForecastCurve(result)
  const trainedDate   = modelInfo?.trained_at ? modelInfo.trained_at.slice(0, 10) : '—'
  const featureCount  = modelInfo?.feature_importance
    ? Object.keys(modelInfo.feature_importance).length : '—'

  return (
    <>
      {/* Page header */}
      <div className="console-page-header">
        <h1>Price Predict</h1>
        <p>Run an XGBoost inference against any route + date combination.</p>
      </div>

      {/* ── QUERY FORM — full-width horizontal grid ── */}
      <div className="pred-form-panel console-panel">
        <div className="console-panel-header">
          <h2 className="console-panel-title">QUERY_PARAMS</h2>
        </div>

        <form className="pred-form-h" onSubmit={handlePredict}>
          {/* Row 1: FROM | TO | DATE | AIRLINE */}
          <div className="pred-h-grid">

            <div className="pred-field">
              <label className="pred-label">FROM</label>
              <select className="pred-select" value={sourceCity}
                onChange={(e) => setSourceCity(e.target.value)}>
                {CITIES.map((c) => <option key={c} value={c}>{CITY_CODE[c]}</option>)}
              </select>
            </div>

            <div className="pred-field">
              <label className="pred-label">TO</label>
              <select className="pred-select" value={destCity}
                onChange={(e) => setDestCity(e.target.value)}>
                {CITIES.filter((c) => c !== sourceCity).map((c) =>
                  <option key={c} value={c}>{CITY_CODE[c]}</option>)}
              </select>
            </div>

            <div className="pred-field">
              <label className="pred-label">DEPART_DATE</label>
              <input type="date" className="pred-input pred-date"
                value={departDate}
                min={todayPlusDays(1)} max={todayPlusDays(49)}
                onChange={(e) => setDepartDate(e.target.value)} />
            </div>

            <div className="pred-field">
              <label className="pred-label">AIRLINE</label>
              <select className="pred-select" value={airline}
                onChange={(e) => setAirline(e.target.value)}>
                {AIRLINES.map((a) => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
              </select>
            </div>

            <div className="pred-field">
              <label className="pred-label">DEPART_TIME</label>
              <select className="pred-select" value={departTime}
                onChange={(e) => setDepartTime(e.target.value)}>
                {TIMES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>

            <div className="pred-field">
              <label className="pred-label">ARRIVAL_TIME</label>
              <select className="pred-select" value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}>
                {TIMES.filter((t) => t !== departTime).map((t) =>
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>

            {/* STOPS toggle */}
            <div className="pred-field">
              <label className="pred-label">STOPS</label>
              <div className="pred-btn-group">
                {STOPS.map((s) => (
                  <button key={s} type="button"
                    className={`pred-toggle-btn ${stops === s ? 'active' : ''}`}
                    onClick={() => setStops(s)}>
                    {s === 'zero' ? '0' : s === 'one' ? '1' : '2+'}
                  </button>
                ))}
              </div>
            </div>

            {/* CABIN toggle */}
            <div className="pred-field">
              <label className="pred-label">CABIN</label>
              <div className="pred-btn-group">
                {[['Economy', 'ECO'], ['Business', 'BIZ']].map(([val, lbl]) => (
                  <button key={val} type="button"
                    className={`pred-toggle-btn ${cabin === val ? 'active' : ''}`}
                    onClick={() => setCabin(val)}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Error + submit on same row */}
          <div className="pred-form-footer">
            {error && <p className="pred-error">{error}</p>}
            <button type="submit" className="pred-run-btn" disabled={loading}>
              {loading ? 'RUNNING...' : 'RUN_PREDICTION'}
            </button>
          </div>
        </form>
      </div>

      {/* ── FORECAST PANEL — full-width below form ── */}
      <div className="pred-result-panel console-panel">
        <div className="pred-result-inner">

          {/* IDLE state — show decorative chart */}
          {!result && !loading && (
            <div className="pred-empty">
              <div className="pred-empty-top">
                <span className="pred-forecast-label">FORECAST</span>
                <span className="pred-empty-hint">
                  Configure parameters above and run a prediction to see the price forecast.
                </span>
              </div>
              <div className="pred-chart-area">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={Array.from({ length: 25 }, (_, i) => ({
                    d: 49 - i * 2,
                    price: 9000 + Math.sin(i * 0.65) * 3000 + i * 180,
                  }))} margin={{ top: 15, right: 20, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="idleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.1} />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(109,94,245,0.06)" vertical={false} />
                    <XAxis dataKey="d" tick={{ fill: '#3a3560', fontSize: 11, fontFamily: "'Space Grotesk'" }}
                      tickLine={false} axisLine={false} label={{ value: 'Days to departure', fill: '#3a3560', fontSize: 11, position: 'insideBottom', offset: -2, fontFamily: "'Space Grotesk'" }} />
                    <YAxis hide />
                    <Area type="monotone" dataKey="price"
                      stroke="rgba(34,211,238,0.18)" strokeWidth={1.5}
                      fill="url(#idleGrad)" dot={false} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* LOADING */}
          {loading && (
            <div className="pred-loading">
              <div className="pred-loading-spinner" />
              <span>Running XGBoost inference...</span>
            </div>
          )}

          {/* RESULT */}
          {result && !loading && (
            <>
              {/* Header row: route info + big price */}
              <div className="pred-result-header">
                <div className="pred-forecast-meta">
                  <span className="pred-forecast-label">FORECAST</span>
                  <div className="pred-route-display">
                    <span className="pred-route-city">{CITY_CODE[sourceCity]}</span>
                    <span className="pred-route-arrow">→</span>
                    <span className="pred-route-city">{CITY_CODE[destCity]}</span>
                  </div>
                  <div className="pred-route-sub">
                    {cabin === 'Economy' ? 'ECO' : 'BIZ'} · {airline.replace(/_/g, ' ')} · {stops === 'zero' ? '0 stops' : stops === 'one' ? '1 stop' : '2+ stops'}
                  </div>
                </div>

                <div className="pred-price-block">
                  <span className="pred-predicted-label">PREDICTED</span>
                  <div className="pred-price-value">₹{formatINR(result.predicted_price)}</div>
                  <div className="pred-confidence-row">
                    {result.out_of_distribution && <span className="pred-ood-badge">OOD</span>}
                    <span className="pred-confidence-text">
                      ₹{formatINR(result.confidence_low)} – ₹{formatINR(result.confidence_high)} band
                    </span>
                  </div>
                </div>
              </div>

              {/* Chart: price vs days to departure */}
              <div className="pred-chart-area">
                <div className="pred-chart-label">PRICE vs. DAYS TO DEPARTURE</div>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={forecastData}
                    margin={{ top: 12, right: 24, left: 10, bottom: 8 }}
                  >
                    <defs>
                      <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6d5ef5" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#6d5ef5" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(109,94,245,0.08)" vertical={false} />

                    <XAxis
                      dataKey="daysLeft"
                      tick={{ fill: '#635d8a', fontSize: 11, fontFamily: "'Space Grotesk'" }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(109,94,245,0.12)' }}
                      label={{ value: 'Days to departure', fill: '#635d8a', fontSize: 11,
                        position: 'insideBottom', offset: -4, fontFamily: "'Space Grotesk'" }}
                      reversed
                    />
                    <YAxis
                      tick={{ fill: '#635d8a', fontSize: 11, fontFamily: "'Space Grotesk'" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `₹${formatINR(v)}`}
                      width={72}
                      domain={['dataMin - 1000', 'dataMax + 1000']}
                    />

                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(34,211,238,0.3)', strokeWidth: 1 }} />

                    {/* Confidence band — high area (transparent) */}
                    <Area
                      type="monotone"
                      dataKey="high"
                      stroke="none"
                      fill="url(#bandGrad)"
                      dot={false}
                      isAnimationActive={false}
                      legendType="none"
                    />
                    {/* Confidence band — low area fills on top to create band effect */}
                    <Area
                      type="monotone"
                      dataKey="low"
                      stroke="none"
                      fill="#080613"
                      dot={false}
                      isAnimationActive={false}
                      legendType="none"
                    />

                    {/* Reference line at predicted price */}
                    <ReferenceLine
                      y={result.predicted_price}
                      stroke="rgba(34,211,238,0.35)"
                      strokeDasharray="5 4"
                      label={{
                        value: `₹${formatINR(result.predicted_price)}`,
                        fill: '#22d3ee',
                        fontSize: 11,
                        fontFamily: "'Space Grotesk'",
                        fontWeight: 700,
                        position: 'insideTopRight',
                      }}
                    />

                    {/* Main price line */}
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#22d3ee"
                      strokeWidth={2.5}
                      fill="url(#predGrad)"
                      dot={{ r: 3, fill: '#080613', stroke: '#22d3ee', strokeWidth: 1.5 }}
                      activeDot={{ r: 5, stroke: '#22d3ee', strokeWidth: 2, fill: '#080613' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Stat strip */}
              <div className="pred-stat-strip">
                <StatCard label="MODEL"    value={result.model_version} />
                <StatCard label="FEATURES" value={featureCount} />
                <StatCard label="LATENCY"  value={latencyMs != null ? `${latencyMs}ms` : '—'} />
                <StatCard label="TRAINED"  value={trainedDate} />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
