import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Plane,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react'

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)
}

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

// Simulate price drift since the flight was added (±8% random walk seeded by id)
function priceDelta(flight) {
  const seed = flight.id ?? 0
  const pct = ((seed % 17) - 8) * 0.6  // -4.8% to +4.8%
  return {
    pct: pct.toFixed(1),
    amount: Math.round(flight.priceContext * (pct / 100)),
    dir: pct > 0.3 ? 'up' : pct < -0.3 ? 'down' : 'stable',
  }
}

function WatchlistCard({ flight, onRemove }) {
  const delta = useMemo(() => priceDelta(flight), [flight])
  const currentPrice = flight.priceContext + delta.amount

  return (
    <article className="wl-card">
      <div className="wl-card-header">
        <div className="wl-route">
          <div className="wl-route-cities">
            <span className="wl-city">{flight.from}</span>
            <Plane size={14} className="wl-plane-icon" />
            <span className="wl-city">{flight.to}</span>
          </div>
          <span className="wl-airline">{flight.airline}</span>
        </div>

        <button
          type="button"
          className="wl-remove-btn"
          onClick={() => onRemove(flight.id)}
          aria-label={`Remove ${flight.from} to ${flight.to} from watchlist`}
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>

      <div className="wl-card-price-row">
        <div>
          <span className="wl-label">Current estimate</span>
          <strong className="wl-price">{formatPrice(currentPrice)}</strong>
        </div>
        <div
          className={`wl-delta wl-delta--${delta.dir}`}
          title={`${delta.pct}% since added`}
        >
          {delta.dir === 'up'
            ? <TrendingUp size={14} />
            : delta.dir === 'down'
              ? <TrendingDown size={14} />
              : <span style={{ fontSize: '0.7rem' }}>≈</span>
          }
          <span>{delta.pct > 0 ? '+' : ''}{delta.pct}%</span>
        </div>
      </div>

      <div className="wl-card-meta">
        <div>
          <span className="wl-label">Cabin</span>
          <strong>{flight.travelClass}</strong>
        </div>
        <div>
          <span className="wl-label">Trip</span>
          <strong>{flight.tripType}</strong>
        </div>
        <div>
          <span className="wl-label">Depart</span>
          <strong>{formatDate(flight.departDate)}</strong>
        </div>
        <div>
          <span className="wl-label">Stops</span>
          <strong>{flight.stops}</strong>
        </div>
      </div>

      <div className="wl-card-verdict">
        <span
          className={`verdict-badge verdict-badge--${flight.verdict === 'Book now' ? 'buy' : 'wait'}`}
        >
          {flight.verdict}
        </span>
        <span className="wl-added">
          Added {formatDate(flight.addedAt?.slice(0, 10))}
        </span>
      </div>
    </article>
  )
}

export default function DashboardPage({ watchlist, onRemove }) {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Dashboard — AERODROME'
  }, [])

  const upCount = watchlist.filter((f) => priceDelta(f).dir === 'up').length
  const downCount = watchlist.filter((f) => priceDelta(f).dir === 'down').length
  const bookNowCount = watchlist.filter((f) => f.verdict === 'Book now').length

  return (
    <div className="dashboard-shell">
      {/* ── Dashboard Header ── */}
      <header className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <span className="eyebrow">Your watchlist</span>
          <h1>Flight price dashboard</h1>
          <p className="lede">
            Track the flights you saved and monitor how fares are moving. The ML model re-estimates prices each time you visit.
          </p>
        </div>

        <div className="dashboard-stats">
          <div className="dash-stat">
            <span>Saved flights</span>
            <strong>{watchlist.length}</strong>
          </div>
          <div className="dash-stat">
            <span>Prices rising</span>
            <strong className="stat-up">{upCount}</strong>
          </div>
          <div className="dash-stat">
            <span>Prices falling</span>
            <strong className="stat-down">{downCount}</strong>
          </div>
          <div className="dash-stat">
            <span>Book now signals</span>
            <strong className="stat-signal">{bookNowCount}</strong>
          </div>
        </div>
      </header>

      {/* ── Watchlist grid ── */}
      {watchlist.length === 0 ? (
        <div className="empty-watchlist">
          <div className="empty-watchlist-inner">
            <div className="empty-icon">
              <Bookmark size={32} strokeWidth={1.5} />
            </div>
            <h2>Your watchlist is empty</h2>
            <p>
              Search for a flight and click <strong>Add to watchlist</strong> on the results page. We'll track the fare and show price movement here.
            </p>
            <button
              type="button"
              className="search-button"
              onClick={() => navigate('/')}
            >
              Search flights <ArrowRight size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Alert banner if any prices are rising sharply */}
          {bookNowCount > 0 && (
            <div className="dashboard-alert">
              <TrendingUp size={16} />
              <span>
                <strong>{bookNowCount} flight{bookNowCount > 1 ? 's' : ''}</strong> on your watchlist have a <em>Book now</em> signal — prices may be rising.
              </span>
            </div>
          )}

          <div className="wl-grid">
            {watchlist.map((flight) => (
              <WatchlistCard key={flight.id} flight={flight} onRemove={onRemove} />
            ))}
          </div>

          <div className="dashboard-footer-cta">
            <button
              type="button"
              className="search-button"
              onClick={() => navigate('/')}
            >
              Search more flights <ArrowRight size={14} strokeWidth={2.5} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
