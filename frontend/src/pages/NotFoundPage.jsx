import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'

export default function NotFoundPage() {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = '404 — AERODROME'
  }, [])

  return (
    <div className="results-no-data">
      <div className="results-no-data-inner">
        <span className="eyebrow">404</span>
        <h2>Page not found</h2>
        <p>The page you're looking for doesn't exist. Head back and search for a flight.</p>
        <button type="button" className="search-button" onClick={() => navigate('/')}>
          <ArrowLeft size={14} strokeWidth={2.2} /> Back to search
        </button>
      </div>
    </div>
  )
}
