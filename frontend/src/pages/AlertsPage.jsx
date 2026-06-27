import { useEffect, useState, useMemo } from 'react'
import { api } from '../services/api'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('ALL')

  useEffect(() => {
    document.title = 'Alerts — AERODROME Console'
    
    api.getAlerts()
      .then(data => {
        setAlerts(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  // Calculate filter counts
  const filters = useMemo(() => {
    const counts = { ALL: alerts.length }
    alerts.forEach(a => {
      counts[a.type] = (counts[a.type] || 0) + 1
    })
    return counts
  }, [alerts])

  const filteredAlerts = activeFilter === 'ALL' 
    ? alerts 
    : alerts.filter(a => a.type === activeFilter)

  function getBadgeClass(type) {
    if (type.includes('DROP')) return 'alert-badge-red'
    return 'alert-badge-cyan'
  }

  function getValueClass(type) {
    if (type.includes('DROP')) return 'alert-val-red'
    return 'alert-val-cyan'
  }

  return (
    <div className="alert-page">
      {/* HEADER */}
      <div className="alert-header">
        <h1 className="alert-title">Alerts Center</h1>
        <p className="alert-subtitle">Anomaly detection feed from the scheduled GitHub Actions job.</p>
      </div>

      {/* FILTERS */}
      <div className="alert-filters">
        {Object.entries(filters).map(([type, count]) => (
          <button
            key={type}
            className={`alert-filter-btn ${activeFilter === type ? 'active' : ''}`}
            onClick={() => setActiveFilter(type)}
          >
            {type} ({count})
          </button>
        ))}
      </div>

      {error && <div className="alert-error">Error: {error}</div>}
      
      {loading ? (
        <div className="alert-loading">
          <div className="alert-spinner" />
          <span>Fetching alerts...</span>
        </div>
      ) : (
        <div className="alert-grid">
          {filteredAlerts.map(alert => (
            <div key={alert.id} className="alert-card">
              <div className="alert-card-header">
                <span className={`alert-badge ${getBadgeClass(alert.type)}`}>
                  {alert.type}
                </span>
                <span className="alert-time">{alert.timestamp}</span>
              </div>
              
              <div className="alert-card-body">
                <div className="alert-route">
                  {alert.source} <span className="alert-arrow">→</span> {alert.destination}
                </div>
                <div className="alert-desc">{alert.description}</div>
              </div>
              
              <div className="alert-card-footer">
                <span className={`alert-value ${getValueClass(alert.type)}`}>
                  {alert.value}
                </span>
                <button className="alert-investigate-btn">
                  INVESTIGATE <span>→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
