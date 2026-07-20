import { useEffect, useState, useMemo } from 'react'
import { api } from '../services/api'

const CITIES = ['Bangalore', 'Chennai', 'Delhi', 'Hyderabad', 'Kolkata', 'Mumbai']
const CITY_CODE = {
  Bangalore: 'BLR', Chennai: 'MAA', Delhi: 'DEL',
  Hyderabad: 'HYD', Kolkata: 'CCU', Mumbai: 'BOM',
}

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

const formatINR = (v) => new Intl.NumberFormat('en-IN').format(Math.round(v))

/* Generate next 35 days */
function getNext35Days() {
  return Array.from({ length: 35 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + 1 + i) // Start from tomorrow
    return d
  })
}

export default function CalendarPage() {
  const [sourceCity, setSourceCity] = useState('Delhi')
  const [destCity, setDestCity] = useState('Mumbai')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Array of 35 response objects parallel to the 35 dates
  const [predictions, setPredictions] = useState([])
  const [latencyMs, setLatencyMs] = useState(null)

  const dates = useMemo(() => getNext35Days(), [])
  const headers = useMemo(() => 
    dates.slice(0, 7).map(d => d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase())
  , [dates])

  // Automatically fetch on mount or when route changes
  useEffect(() => {
    document.title = 'Calendar — AERODROME Console'
    fetchCalendar(sourceCity, destCity)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceCity, destCity])

  async function fetchCalendar(src, dst) {
    if (src === dst) return
    setLoading(true)
    setError(null)

    const duration = getDuration(src, dst)
    const payloads = dates.map((d, i) => ({
      airline: 'Indigo',          // Using a fixed standard baseline for heatmap
      source_city: src,
      destination_city: dst,
      departure_time: 'Morning',
      arrival_time: 'Afternoon',
      stops: 'zero',
      class: 'Economy',
      duration,
      days_left: i + 1,          // 1 to 35
    }))

    const t0 = performance.now()
    try {
      const res = await api.predictBatch(payloads)
      setLatencyMs(Math.round(performance.now() - t0))
      setPredictions(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Calculate pricing thresholds for the heatmap
  const prices = predictions.map(p => p?.predicted_price).filter(Boolean)
  const minPrice = prices.length ? Math.min(...prices) : 0
  const maxPrice = prices.length ? Math.max(...prices) : 0
  
  // Use tertiles for categorization
  const sortedPrices = [...prices].sort((a, b) => a - b)
  const cheapThreshold = sortedPrices[Math.floor(sortedPrices.length * 0.33)] || 0
  const expThreshold = sortedPrices[Math.floor(sortedPrices.length * 0.66)] || 0

  function getCellClass(price) {
    if (!price) return ''
    if (price <= cheapThreshold) return 'cal-cell-cheap'
    if (price >= expThreshold) return 'cal-cell-exp'
    return 'cal-cell-avg'
  }

  return (
    <div className="cal-page">
      {/* HEADER */}
      <div className="cal-header-row">
        <div>
          <h1 className="cal-title">Cheapest Day Calendar</h1>
          <p className="cal-subtitle">Heatmap of predicted prices across the next 35 departure days.</p>
        </div>
        
        <div className="cal-route-selector">
          <select 
            className="cal-select" 
            value={sourceCity} 
            onChange={e => setSourceCity(e.target.value)}
          >
            {CITIES.map(c => <option key={c} value={c}>{CITY_CODE[c]}</option>)}
          </select>
          <span className="cal-route-arrow">→</span>
          <select 
            className="cal-select" 
            value={destCity} 
            onChange={e => setDestCity(e.target.value)}
          >
            {CITIES.map(c => (
              <option key={c} value={c} disabled={c === sourceCity}>
                {CITY_CODE[c]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="cal-error">Error: {error}</div>}

      {/* CALENDAR GRID */}
      <div className={`cal-grid-container ${loading ? 'cal-loading' : ''}`}>
        
        {/* Day of week headers */}
        <div className="cal-grid-headers">
          {headers.map((day, i) => (
            <div key={i} className="cal-grid-header">{day}</div>
          ))}
        </div>

        {/* 35 Days Grid */}
        <div className="cal-grid">
          {dates.map((date, i) => {
            const pred = predictions[i]
            const price = pred?.predicted_price
            
            const monthStr = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
            const dayStr = date.getDate().toString().padStart(2, '0')

            return (
              <div key={i} className={`cal-cell ${getCellClass(price)}`}>
                <div className="cal-cell-date">{monthStr} {dayStr}</div>
                {price ? (
                  <div className="cal-cell-price">₹{formatINR(price)}</div>
                ) : (
                  <div className="cal-cell-price-skeleton" />
                )}
              </div>
            )
          })}
        </div>
        
        {/* Loading overlay */}
        {loading && (
          <div className="cal-overlay">
            <div className="cal-spinner" />
            <div>Generating forecast...</div>
          </div>
        )}
      </div>

      {/* FOOTER LEGEND */}
      <div className="cal-footer">
        <div className="cal-legend">
          <span className="cal-legend-label">LEGEND:</span>
          <div className="cal-legend-item">
            <div className="cal-legend-box box-cheap" /> CHEAP
          </div>
          <div className="cal-legend-item">
            <div className="cal-legend-box box-avg" /> AVG
          </div>
          <div className="cal-legend-item">
            <div className="cal-legend-box box-exp" /> EXPENSIVE
          </div>
        </div>
        
        {predictions.length > 0 && !loading && (
          <div className="cal-footer-stats">
            <span style={{ color: '#2dd4bf', fontWeight: 800 }}>
              BEST DEAL: ₹{formatINR(minPrice)}
            </span>
            <span style={{ marginLeft: '1rem', color: '#635d8a' }}>
              LATENCY: {latencyMs}ms
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
