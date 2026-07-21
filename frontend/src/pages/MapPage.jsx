import { useCallback, useEffect, useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Polyline, Tooltip as LeafletTooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import { ArrowRight, Plane, Loader2, RefreshCw } from 'lucide-react'
import { api } from '../services/api'
import 'leaflet/dist/leaflet.css'
import '../styles/MapPage.css' // We'll create this next

function MapSizeFixer() {
  const map = useMap()
  useEffect(() => {
    // Leaflet often computes a 0x0 size on initial mount in flex/grid layouts.
    // Invalidate size after a short delay to allow CSS layouts to resolve.
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 100)
    return () => clearTimeout(timer)
  }, [map])
  return null
}

// City coordinates mapping
const CITIES = {
  Bangalore: [12.9716, 77.5946],
  Chennai: [13.0827, 80.2707],
  Delhi: [28.7041, 77.1025],
  Hyderabad: [17.3850, 78.4867],
  Kolkata: [22.5726, 88.3639],
  Mumbai: [19.0760, 72.8777],
}

const CITY_NAMES = Object.keys(CITIES)

// Create a custom icon for the cities using a divIcon to match the dark aesthetic
const createCityIcon = (isActive, isTarget) => {
  return L.divIcon({
    className: `custom-city-marker ${isActive ? 'active' : ''} ${isTarget ? 'target' : ''}`,
    html: `<div class="marker-dot"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)
}

export default function MapPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [sourceCity, setSourceCity] = useState(location.state?.preselectFrom || null)
  const [destCity, setDestCity] = useState(location.state?.preselectTo || null)
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    document.title = 'Route Map — AERODROME'
  }, [])

  // Auto-fetch prediction when both cities are selected
  useEffect(() => {
    if (sourceCity && destCity) {
      const fetchFairPrice = async () => {
        setLoading(true)
        setError(null)
        try {
          const payload = {
            airline: 'Indigo',
            source_city: sourceCity,
            destination_city: destCity,
            departure_time: 'Morning',
            arrival_time: 'Evening',
            stops: 'zero',
            class: 'Economy',
            duration: 2.5,
            days_left: 14,
          }
          const result = await api.predict(payload)
          setPrediction(result)
        } catch (err) {
          console.error(err)
          setError(err.message || 'Failed to fetch prediction')
        } finally {
          setLoading(false)
        }
      }
      fetchFairPrice()
    } else {
      setPrediction(null)
    }
  }, [sourceCity, destCity])

  const handleCityClick = (city) => {
    if (!sourceCity) {
      setSourceCity(city)
    } else if (sourceCity === city) {
      // Clicked source again, deselect
      setSourceCity(null)
      setDestCity(null)
    } else if (!destCity) {
      // Select destination
      setDestCity(city)
    } else {
      // Reset and select new source
      setSourceCity(city)
      setDestCity(null)
    }
  }

  const handleSearchRoute = () => {
    if (!sourceCity || !destCity) return
    navigate('/results', {
      state: {
        from: sourceCity,
        to: destCity,
        airline: 'Indigo',
        tripType: 'One Way',
        travelClass: 'Economy',
        stops: 'Non-stop',
        departDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], // 14 days out
        returnDate: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
        departureTime: 'Morning',
        arrivalTime: 'Evening',
        duration: 2.5,
        daysLeft: 14,
      }
    })
  }

  const routePositions = useMemo(() => {
    if (sourceCity && destCity) {
      return [CITIES[sourceCity], CITIES[destCity]]
    }
    return null
  }, [sourceCity, destCity])

  const centerOfIndia = [22.5937, 78.9629]

  return (
    <section className="map-page-container">
      <div className="map-sidebar">
        <span className="eyebrow">Interactive Route Map</span>
        <h1>Explore Fare Prices</h1>
        
        <div className="map-instructions">
          <div className={`step-item ${!sourceCity ? 'active' : 'completed'}`}>
            <div className="step-num">1</div>
            <p>Select a <strong>departure</strong> city</p>
          </div>
          <div className="step-divider" />
          <div className={`step-item ${sourceCity && !destCity ? 'active' : destCity ? 'completed' : ''}`}>
            <div className="step-num">2</div>
            <p>Select a <strong>destination</strong> city</p>
          </div>
        </div>

        {sourceCity && destCity && (
          <div className="route-panel">
            <div className="route-header">
              <h3>{sourceCity}</h3>
              <Plane size={16} strokeWidth={2} className="route-plane" />
              <h3>{destCity}</h3>
            </div>
            
            <div className="route-prediction">
              <span className="pred-label">ESTIMATED FAIR PRICE</span>
              {loading ? (
                <div className="pred-loading">
                  <Loader2 size={18} className="spin-icon" />
                  <span>Calculating ML forecast...</span>
                </div>
              ) : error ? (
                <span className="pred-error">Unavailable</span>
              ) : prediction ? (
                <>
                  <div className="pred-price">{formatPrice(prediction.predicted_price)}</div>
                  <div className="pred-details">
                    Economy · Non-stop · 14 days out
                  </div>
                </>
              ) : null}
            </div>
            
            <button 
              className="map-search-btn" 
              onClick={handleSearchRoute}
              disabled={loading}
            >
              Analyze full trend <ArrowRight size={16} />
            </button>
            <button 
              className="map-reset-btn" 
              onClick={() => { setSourceCity(null); setDestCity(null); }}
            >
              <RefreshCw size={14} /> Clear Selection
            </button>
          </div>
        )}
      </div>

      <div className="map-wrapper">
        <MapContainer 
          center={centerOfIndia} 
          zoom={5} 
          scrollWheelZoom={true}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: '#0b081e', borderRadius: '24px', zIndex: 1 }}
          zoomControl={true}
          attributionControl={false}
        >
          <MapSizeFixer />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
          />
          
          {CITY_NAMES.map((city) => {
            const isSource = sourceCity === city
            const isDest = destCity === city
            
            return (
              <Marker 
                key={city}
                position={CITIES[city]}
                icon={createCityIcon(isSource, isDest)}
                eventHandlers={{
                  click: () => handleCityClick(city)
                }}
              >
                <LeafletTooltip direction="top" offset={[0, -10]} permanent={false} className="custom-map-tooltip">
                  {city}
                </LeafletTooltip>
              </Marker>
            )
          })}

          {routePositions && (
            <Polyline 
              positions={routePositions} 
              pathOptions={{ 
                color: '#6d5ef5', 
                weight: 3,
                opacity: 0.6,
                dashArray: '8, 8',
                lineJoin: 'round'
              }} 
            />
          )}
        </MapContainer>
        <div className="map-vignette"></div>
      </div>
    </section>
  )
}
