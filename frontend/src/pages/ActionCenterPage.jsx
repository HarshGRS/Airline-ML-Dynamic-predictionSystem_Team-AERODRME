import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { useNavigate } from 'react-router-dom'

const mapTagClass = (tag) => {
  if (tag === 'PRICE_SPIKE') return 'spike'
  if (tag === 'PRICE_DROP') return 'drop'
  if (tag === 'VOLATILITY') return 'volatility'
  if (tag === 'DEMAND_SURGE') return 'demand'
  return 'drop'
}

export default function ActionCenterPage() {
  const [anomalies, setAnomalies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Action Center — AERODROME Console'
    api.getDashboardAnomalies()
      .then((data) => {
        setAnomalies(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) return <div style={{ display: 'grid', placeItems: 'center', height: '50vh', color: 'var(--text-muted)' }}>Scanning all routes for anomalies...</div>
  if (error) return <div style={{ display: 'grid', placeItems: 'center', height: '50vh', color: '#f87171' }}>{error}</div>

  return (
    <>
      <div className="console-page-header">
        <h1>Action Center</h1>
        <p>Live anomaly detection across all routes based on ML models.</p>
      </div>

      <div className="console-panel" style={{ marginTop: '2rem' }}>
        <div className="anomaly-list">
          {anomalies.length > 0 ? anomalies.map((a, i) => (
            <div className="anomaly-row" key={i} style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span className={`anomaly-tag ${mapTagClass(a.tag)}`}>{a.tag}</span>
              <div className="anomaly-info" style={{ flex: 1, marginLeft: '1.5rem' }}>
                <span className="anomaly-route" style={{ display: 'block', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{a.route}</span>
                <span className="anomaly-desc" style={{ color: 'var(--text-soft)' }}>{a.desc}</span>
              </div>
              <div className="anomaly-meta" style={{ textAlign: 'right', minWidth: '100px' }}>
                <span className={`anomaly-pct ${a.pct >= 0 ? 'positive' : 'negative'}`} style={{ display: 'block', fontSize: '1.25rem', fontWeight: 700 }}>
                  {a.pct >= 0 ? '+' : ''}{a.pct}%
                </span>
                <span className="anomaly-time" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{a.time}</span>
              </div>
              <div style={{ marginLeft: '2.5rem' }}>
                <button
                  onClick={() => navigate('/dashboard/predict', {
                    state: {
                      source_city: a.source,
                      destination_city: a.destination,
                      from_action_center: true,
                    }
                  })}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(109, 94, 245, 0.1)',
                    color: '#a78bfa',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    border: '1px solid rgba(109, 94, 245, 0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(109, 94, 245, 0.2)'; e.currentTarget.style.borderColor = 'rgba(109, 94, 245, 0.6)' }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(109, 94, 245, 0.1)'; e.currentTarget.style.borderColor = 'rgba(109, 94, 245, 0.3)' }}
                >
                  INVESTIGATE →
                </button>
              </div>
            </div>
          )) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No significant anomalies detected in current model run.
            </div>
          )}
        </div>
      </div>
    </>
  )
}
