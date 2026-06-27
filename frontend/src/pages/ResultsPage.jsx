import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)
}

// Generate 7-day price trend data seeded from route params
function buildTrendData(seed) {
  const base = 6800 + (seed % 1200)
  return Array.from({ length: 7 }, (_, i) => {
    const day = i === 6 ? 'Today' : `${6 - i}d ago`
    const noise = Math.sin(i * 1.3 + seed * 0.01) * 220
    const observed = Math.round(base + noise + i * 28)
    const forecast = Math.round(base + noise * 0.6 + i * 12 - 180)
    return { day, observed, forecast }
  })
}

export default function ResultsPage({ onAddToWatchlist, watchlist }) {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [addedToast, setAddedToast] = useState(false)

  // If the user refreshes /results with no state, redirect home
  useEffect(() => {
    document.title = 'Price trends and booking decision — AERODROME'
  }, [])

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

  const {
    from,
    to,
    airline,
    tripType,
    travelClass,
    stops,
    departDate,
    returnDate,
    departureTime,
    arrivalTime,
    duration,
    daysLeft,
  } = state

  // Deterministic price from params
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const priceContext = useMemo(() => {
    const base = 7480
    const routeModifier = Math.abs((from?.charCodeAt(0) ?? 0) - (to?.charCodeAt(0) ?? 0)) * 18
    const classModifier = travelClass === 'Business' ? 4200 : 0
    const stopModifier = stops === 'Non-stop' ? 380 : stops === '1 Stop' ? -120 : -320
    const leadModifier = Math.max(0, (49 - (daysLeft ?? 18)) * 38)
    return Math.max(3120, base + routeModifier + classModifier + stopModifier + leadModifier)
  }, [from, to, travelClass, stops, daysLeft])

  const seed = (from?.charCodeAt(0) ?? 65) + (to?.charCodeAt(0) ?? 77) + (airline?.charCodeAt(0) ?? 73)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const priceTrendData = useMemo(() => buildTrendData(seed), [seed])

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const trendInsight = useMemo(() => {
    const latest = priceTrendData[priceTrendData.length - 1].forecast
    const earliest = priceTrendData[0].observed
    const delta = latest - earliest
    if (delta < -300) return { text: 'Strong downward movement detected. Waiting could improve the fare.', dir: 'down' }
    if (delta < 150) return { text: 'Prices are fairly stable. This is a reasonable time to book.', dir: 'stable' }
    return { text: 'Prices are rising. Consider booking soon to avoid a higher fare.', dir: 'up' }
  }, [priceTrendData])

  const verdict = priceContext < 7600 ? 'Book now' : 'Wait and watch'

  const isOnWatchlist = watchlist.some(
    (f) => f.from === from && f.to === to && f.airline === airline && f.departDate === departDate
  )

  const handleAddToWatchlist = () => {
    onAddToWatchlist({
      from, to, airline, tripType, travelClass, stops,
      departDate, returnDate, departureTime, arrivalTime,
      duration, daysLeft, priceContext, verdict,
      trendDir: trendInsight.dir,
    })
    setAddedToast(true)
    setTimeout(() => setAddedToast(false), 3000)
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
            The search is complete. Use the historical fare movement and the prediction summary to decide when to book.
          </p>
          <div className="decision-metrics">
            <article>
              <span>Route</span>
              <strong>{from} → {to}</strong>
            </article>
            <article>
              <span>Fare context</span>
              <strong>{formatPrice(priceContext)}</strong>
            </article>
            <article>
              <span>Trip type</span>
              <strong>{tripType}</strong>
            </article>
            <article>
              <span>Decision</span>
              <strong>{verdict}</strong>
            </article>
          </div>

          {/* Action buttons */}
          <div className="results-actions">
            <button type="button" className="results-back-btn" onClick={() => navigate('/')}>
              <ArrowLeft size={14} strokeWidth={2.2} />
              Modify search
            </button>
            <button
              type="button"
              className={`watchlist-btn ${isOnWatchlist ? 'watchlist-btn--saved' : ''}`}
              onClick={handleAddToWatchlist}
              disabled={isOnWatchlist}
            >
              {isOnWatchlist ? (
                <><BookmarkCheck size={15} strokeWidth={2.2} /> Saved to watchlist</>
              ) : (
                <><Bookmark size={15} strokeWidth={2.2} /> Add to watchlist</>
              )}
            </button>
          </div>
        </div>

        <article className="decision-card decision-outcome">
          <span className="card-label">Model verdict</span>
          <h2>{verdict}</h2>
          <p>
            The latest fare is likely {priceContext < 7600 ? 'below' : 'above'} the recent average. Review the chart before confirming the ticket.
          </p>
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
              <span>Return</span>
              <strong>{tripType === 'One Way' ? 'Not selected' : returnDate}</strong>
            </div>
          </div>
        </article>
      </header>

      <section className="trend-grid">
        <article className="decision-card chart-card">
          <div className="chart-heading">
            <div>
              <span className="eyebrow">Price history</span>
              <h2>Fare trend before booking</h2>
              <p>Historical prices and the model forecast are shown together so travelers can compare the likely booking window.</p>
            </div>
            <div className="price-callout">
              <span>Estimated fare</span>
              <strong>{formatPrice(priceContext)}</strong>
            </div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={priceTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="observedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6ea8fe" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#6ea8fe" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7df1c5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7df1c5" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#aeb7c2', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#aeb7c2', fontSize: 12 }} axisLine={false} tickLine={false} width={42} />
                <Tooltip
                  contentStyle={{
                    background: '#0d1523',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '14px',
                    color: '#f5f7fa',
                  }}
                  formatter={(value) => formatPrice(value)}
                />
                <Area type="monotone" dataKey="observed" stroke="#6ea8fe" fillOpacity={1} fill="url(#observedFill)" strokeWidth={2} />
                <Area type="monotone" dataKey="forecast" stroke="#7df1c5" fillOpacity={1} fill="url(#forecastFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart legend */}
          <div className="chart-legend">
            <span><span className="legend-dot" style={{ background: '#6ea8fe' }} />Observed price</span>
            <span><span className="legend-dot" style={{ background: '#7df1c5' }} />ML Forecast</span>
          </div>
        </article>

        <div className="chart-side">
          <article className="insight-card">
            <span className="eyebrow">Recommendation</span>
            <div className="insight-trend-header">
              {trendInsight.dir === 'down'
                ? <TrendingDown size={20} className="trend-icon trend-icon--down" />
                : trendInsight.dir === 'up'
                  ? <TrendingUp size={20} className="trend-icon trend-icon--up" />
                  : <TrendingUp size={20} className="trend-icon trend-icon--stable" />
              }
              <h3>{trendInsight.text}</h3>
            </div>
            <p>
              Based on the selected route and preferences, the platform estimates whether fares are likely to improve or move upward.
            </p>
          </article>

          <article className="insight-card">
            <span className="eyebrow">Decision support</span>
            <h3>Choose with context, not guesswork</h3>
            <p>
              You can compare your own booking timing against the trend line and decide if booking now or waiting makes more sense.
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
              disabled={isOnWatchlist}
            >
              {isOnWatchlist
                ? <><BookmarkCheck size={15} /> Saved to watchlist</>
                : <><Bookmark size={15} /> Add to watchlist</>
              }
            </button>
          </article>
        </div>
      </section>

      <section className="decision-breakdown">
        <article className="breakdown-card">
          <span className="eyebrow">Why the model says this</span>
          <div className="breakdown-list">
            <div>
              <p>Route demand</p>
              <strong>Moderate to high</strong>
            </div>
            <div>
              <p>Lead time</p>
              <strong>Within prediction window</strong>
            </div>
            <div>
              <p>Fare movement</p>
              <strong>Softening over recent days</strong>
            </div>
          </div>
        </article>

        <article className="breakdown-card callout-card">
          <span className="eyebrow">Next step</span>
          <h3>Search another route or refine your preferences to compare a different trend profile.</h3>
          <button type="button" className="search-button" onClick={() => navigate('/')}>
            Modify search
          </button>
        </article>
      </section>
    </section>
  )
}
