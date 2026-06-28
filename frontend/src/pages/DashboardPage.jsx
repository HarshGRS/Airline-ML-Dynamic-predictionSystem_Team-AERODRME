import { useEffect, useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { api } from '../services/api'

/* ─────────────────────────────────────────────────────
   KPI CARD with mini Sparkline
───────────────────────────────────────────────────── */
function KpiCard({ label, value, delta, deltaType, sparkline }) {
  return (
    <div className="kpi-card">
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      <span className={`kpi-delta ${deltaType}`}>{delta}</span>
      <div className="kpi-sparkline">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkline} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke="#22d3ee"
              strokeWidth={1.5}
              fill={`url(#spark-${label})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────
   CUSTOM TOOLTIP for price trend chart
───────────────────────────────────────────────────── */
function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: 'rgba(12, 9, 32, 0.95)',
        border: '1px solid rgba(34, 211, 238, 0.3)',
        borderRadius: '10px',
        padding: '0.55rem 0.85rem',
        fontSize: '0.78rem',
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      <div style={{ color: '#9993c2', marginBottom: '0.2rem' }}>{label}</div>
      <div style={{ color: '#22d3ee', fontWeight: 700, fontSize: '1rem' }}>
        ₹{payload[0].value.toLocaleString('en-IN')}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────
   FORMATTERS
───────────────────────────────────────────────────── */
const formatINR = (val) => new Intl.NumberFormat('en-IN').format(val)

const generateSparklineFromTrend = (trendData) => {
  // Take last 14 days and extract price
  const subset = trendData.slice(-14)
  return subset.map((t) => ({ v: t.price }))
}

const mapTagClass = (tag) => {
  if (tag === 'PRICE_SPIKE') return 'spike'
  if (tag === 'PRICE_DROP') return 'drop'
  if (tag === 'VOLATILITY') return 'volatility'
  if (tag === 'DEMAND_SURGE') return 'demand'
  return 'drop'
}

/* ─────────────────────────────────────────────────────
   DASHBOARD PAGE
───────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    document.title = 'Dashboard — AERODROME Console'

    api.getDashboard()
      .then((res) => {
        setData(res)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Dashboard fetch error:", err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '50vh', color: 'var(--text-muted)' }}>
        Loading dashboard data...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '50vh', color: '#f87171' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Failed to load dashboard</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  // Build the KPI array from the backend response
  const kpiData = [
    {
      label: 'AVG PRICE',
      value: `₹${formatINR(data.kpi.avg_price)}`,
      delta: `${data.kpi.avg_price_delta > 0 ? '+' : ''}${data.kpi.avg_price_delta}%`,
      deltaType: data.kpi.avg_price_delta > 0 ? 'positive' : 'negative',
      sparkline: generateSparklineFromTrend(data.price_trend),
    },
    {
      label: 'VOLATILITY',
      value: `${data.kpi.volatility}%`,
      delta: `${data.kpi.volatility_delta > 0 ? '+' : ''}${data.kpi.volatility_delta}pp`,
      deltaType: data.kpi.volatility_delta > 0 ? 'negative' : 'positive',
      sparkline: generateSparklineFromTrend(data.price_trend).reverse(), // just visually different
    },
    {
      label: 'ROUTES UP',
      value: formatINR(data.kpi.routes_up),
      delta: `${data.kpi.routes_up_pct}%`,
      deltaType: 'positive',
      sparkline: generateSparklineFromTrend(data.price_trend),
    },
    {
      label: 'ROUTES DOWN',
      value: formatINR(data.kpi.routes_down),
      delta: `${data.kpi.routes_down_pct}%`,
      deltaType: 'negative',
      sparkline: generateSparklineFromTrend(data.price_trend).reverse(),
    },
    {
      label: 'HIGH DEMAND',
      value: formatINR(data.kpi.high_demand),
      delta: `${data.kpi.high_demand_pct}%`,
      deltaType: 'positive',
      sparkline: generateSparklineFromTrend(data.price_trend),
    },
    {
      label: 'ANOMALIES',
      value: data.kpi.anomalies.toString(),
      delta: `+${data.kpi.anomalies_delta}`,
      deltaType: 'negative', // anomalies are generally bad
      sparkline: generateSparklineFromTrend(data.price_trend),
    },
  ]

  return (
    <>
      {/* Page header */}
      <div className="console-page-header">
        <h1>Dashboard</h1>
        <p>Real-time airline pricing analytics and market intelligence.</p>
      </div>

      {/* KPI strip */}
      <div className="kpi-strip">
        {kpiData.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Middle row: Top Routes + Anomaly Feed */}
      <div className="console-middle-row">
        {/* Top Routes */}
        <div className="console-panel">
          <div className="console-panel-header">
            <h2 className="console-panel-title">TOP_ROUTES</h2>
            <a href="#" className="console-panel-link">VIEW_ALL →</a>
          </div>
          <table className="routes-table">
            <thead>
              <tr>
                <th>Route</th>
                <th>Price</th>
                <th>7D_Pred</th>
                <th>Δ</th>
              </tr>
            </thead>
            <tbody>
              {data.top_routes.map((r) => (
                <tr key={`${r.from}-${r.to}`}>
                  <td>
                    <span className="route-name">{r.from}</span>
                    <span className="route-arrow">→</span>
                    <span className="route-name">{r.to}</span>
                  </td>
                  <td className="route-price">₹{formatINR(r.price)}</td>
                  <td className="route-pred">₹{formatINR(r.predicted)}</td>
                  <td className={`route-delta ${r.delta >= 0 ? 'positive' : 'negative'}`}>
                    {r.delta >= 0 ? '+' : ''}{r.delta}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Anomaly Feed */}
        <div className="console-panel">
          <div className="console-panel-header">
            <h2 className="console-panel-title">ANOMALY_FEED</h2>
            <a href="#" className="console-panel-link">OPEN_CENTER →</a>
          </div>
          <div className="anomaly-list">
            {data.anomalies.length > 0 ? data.anomalies.map((a, i) => (
              <div className="anomaly-row" key={i}>
                <span className={`anomaly-tag ${mapTagClass(a.tag)}`}>{a.tag}</span>
                <div className="anomaly-info">
                  <span className="anomaly-route">{a.route}</span>
                  <span className="anomaly-desc">{a.desc}</span>
                </div>
                <div className="anomaly-meta">
                  <span className={`anomaly-pct ${a.pct >= 0 ? 'positive' : 'negative'}`}>
                    {a.pct >= 0 ? '+' : ''}{a.pct}%
                  </span>
                  <span className="anomaly-time">{a.time}</span>
                </div>
              </div>
            )) : (
              <div style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No significant anomalies detected in current model run.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Price Trend Chart */}
      <div className="console-chart-panel">
        <div className="console-chart-header">
          <h2 className="console-chart-title">
            PRICE_TREND
            <span className="chart-dot" />
            {data.spotlight_route}
            <span className="chart-dot" />
            30D
          </h2>
        </div>
        <div className="console-chart-body">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.price_trend} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="50%" stopColor="#22d3ee" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(109, 94, 245, 0.08)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fill: '#635d8a', fontSize: 11, fontFamily: "'Space Grotesk'" }}
                axisLine={{ stroke: 'rgba(109, 94, 245, 0.1)' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#635d8a', fontSize: 11, fontFamily: "'Space Grotesk'" }}
                axisLine={false}
                tickLine={false}
                domain={['dataMin - 500', 'dataMax + 500']}
                tickFormatter={(v) => `₹${formatINR(v)}`}
                width={70}
              />
              <Tooltip content={<TrendTooltip />} cursor={{ stroke: 'rgba(34, 211, 238, 0.3)' }} />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#22d3ee"
                strokeWidth={2}
                fill="url(#trendGradient)"
                dot={false}
                activeDot={{
                  r: 4,
                  stroke: '#22d3ee',
                  strokeWidth: 2,
                  fill: '#080613',
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  )
}
