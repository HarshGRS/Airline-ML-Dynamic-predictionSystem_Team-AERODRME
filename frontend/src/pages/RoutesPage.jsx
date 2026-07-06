import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { Link } from 'react-router-dom'

const formatINR = (val) => new Intl.NumberFormat('en-IN').format(val)

export default function RoutesPage() {
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    document.title = 'All Routes — AERODROME Console'
    api.getDashboardRoutes()
      .then((data) => {
        setRoutes(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const filteredRoutes = routes.filter(r => 
    r.from.toLowerCase().includes(search.toLowerCase()) || 
    r.to.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div style={{ display: 'grid', placeItems: 'center', height: '50vh', color: 'var(--text-muted)' }}>Loading all routes...</div>
  if (error) return <div style={{ display: 'grid', placeItems: 'center', height: '50vh', color: '#f87171' }}>{error}</div>

  return (
    <>
      <div className="console-page-header">
        <h1>All Routes</h1>
        <p>Comprehensive predictions across all tracked city pairs.</p>
        <div style={{ marginTop: '1.5rem' }}>
          <input 
            type="text" 
            placeholder="Search routes (e.g., Delhi)..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              padding: '0.6rem 1rem', 
              width: '100%', 
              maxWidth: '400px',
              borderRadius: '8px', 
              border: '1px solid rgba(109, 94, 245, 0.3)', 
              background: 'var(--surface)', 
              color: 'var(--text-white)',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
          />
        </div>
      </div>

      <div className="console-panel" style={{ marginTop: '2rem' }}>
        <table className="routes-table">
          <thead>
            <tr>
              <th>Route</th>
              <th>Current Price</th>
              <th>7D Prediction</th>
              <th>Delta</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoutes.map((r, i) => (
              <tr key={i}>
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
        {filteredRoutes.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No routes match your search.
          </div>
        )}
      </div>
    </>
  )
}
