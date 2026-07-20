import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import '../styles/HomeMap.css'

function MapSizeFixer() {
  const map = useMap()
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 100)
    return () => clearTimeout(timer)
  }, [map])
  return null
}

const HUBS = {
  BLR: [12.9716, 77.5946], // Bangalore
  MAA: [13.0827, 80.2707], // Chennai
  DEL: [28.7041, 77.1025], // Delhi
  HYD: [17.3850, 78.4867], // Hyderabad
  CCU: [22.5726, 88.3639], // Kolkata
  BOM: [19.0760, 72.8777], // Mumbai
}

const CODE_TO_NAME = {
  BLR: 'Bangalore',
  MAA: 'Chennai',
  DEL: 'Delhi',
  HYD: 'Hyderabad',
  CCU: 'Kolkata',
  BOM: 'Mumbai'
}

// Generate quadratic bezier curve points
function generateCurve(p1, p2, offset = 0.15, numPoints = 30) {
  const [lat1, lng1] = p1
  const [lat2, lng2] = p2
  const midLat = (lat1 + lat2) / 2
  const midLng = (lng1 + lng2) / 2
  
  const dLat = lat2 - lat1
  const dLng = lng2 - lng1
  
  const ctrlLat = midLat - dLng * offset
  const ctrlLng = midLng + dLat * offset

  const points = []
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints
    const u = 1 - t
    const lat = u * u * lat1 + 2 * u * t * ctrlLat + t * t * lat2
    const lng = u * u * lng1 + 2 * u * t * ctrlLng + t * t * lng2
    points.push([lat, lng])
  }
  return points
}

const ROUTES = [
  { from: 'DEL', to: 'BOM', offset: -0.1 },
  { from: 'DEL', to: 'BLR', offset: -0.15 },
  { from: 'DEL', to: 'CCU', offset: 0.1 },
  { from: 'BOM', to: 'BLR', offset: 0.1 },
  { from: 'BOM', to: 'HYD', offset: -0.05 },
  { from: 'BOM', to: 'MAA', offset: -0.1 },
  { from: 'BLR', to: 'CCU', offset: 0.15 },
  { from: 'BLR', to: 'HYD', offset: 0.05 },
  { from: 'CCU', to: 'MAA', offset: 0.1 },
  { from: 'HYD', to: 'MAA', offset: 0.05 },
  { from: 'HYD', to: 'DEL', offset: 0.08 },
  { from: 'MAA', to: 'BLR', offset: -0.05 },
]

const createHubIcon = () => {
  return L.divIcon({
    className: 'hub-marker',
    html: `<div class="hub-dot"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })
}

export default function HomeMap() {
  const navigate = useNavigate()
  const center = [21.5, 78.5] // Centered around India

  const curves = useMemo(() => {
    return ROUTES.map((route, i) => {
      let p1 = HUBS[route.from]
      let p2 = HUBS[route.to]
      
      const path = generateCurve(p1, p2, route.offset)
      return { id: i, path, from: route.from, to: route.to }
    })
  }, [])

  const handleRouteClick = (fromCode, toCode) => {
    navigate('/map', {
      state: {
        preselectFrom: CODE_TO_NAME[fromCode],
        preselectTo: CODE_TO_NAME[toCode]
      }
    })
  }

  return (
    <section className="hm-section">
      <div className="hm-container">
        
        {/* Overlays mimicking the provided design */}
        <div className="hm-overlay-top">
          <div className="hm-header">
            <span className="hm-eyebrow">// LIVE_NETWORK</span>
            <h2>Interactive route map</h2>
            <p>Hover any arc to see live + predicted prices. Click to forecast.</p>
          </div>
          <div className="hm-action">
            <a href="/map">OPEN_FULL_MAP &rarr;</a>
          </div>
        </div>

        <div className="hm-overlay-bottom">
          <span>6 HUBS &middot; 30 TRACKED ROUTES</span>
        </div>

        {/* Leaflet Map */}
        <div className="hm-map-wrapper">
          <MapContainer 
            center={center} 
            zoom={4.5} 
            scrollWheelZoom={false}
            doubleClickZoom={false}
            dragging={false}
            zoomControl={false}
            attributionControl={false}
            style={{ width: '100%', height: '100%', background: '#070a14' }}
          >
            <MapSizeFixer />
            
            {/* Dark map tiles */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
              opacity={0.4}
            />
            
            {/* Arcs */}
            {curves.map((curve) => (
              <Polyline 
                key={curve.id}
                positions={curve.path} 
                eventHandlers={{
                  click: () => handleRouteClick(curve.from, curve.to)
                }}
                pathOptions={{ 
                  color: '#6d5ef5', 
                  weight: 1.5,
                  opacity: 0.4,
                  className: 'hub-arc interactive-arc'
                }} 
              />
            ))}

            {/* Hub markers */}
            {Object.entries(HUBS).map(([code, coords]) => (
              <Marker 
                key={code}
                position={coords}
                icon={createHubIcon()}
              >
                <Tooltip direction="right" offset={[8, 0]} permanent className="hub-tooltip">
                  {code}
                </Tooltip>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </section>
  )
}
