import { useMemo, useState } from 'react'
import './App.css'

const featuredFlights = [
  {
    id: 1,
    from: 'Delhi',
    to: 'Mumbai',
    airline: 'Indigo',
    departure_time: 'Morning',
    arrival_time: 'Morning',
    stops: 'zero',
    flight_class: 'Economy',
    duration: '2.2',
    days_left: 14,
    departure: '07:15',
    arrival: '09:25',
    price: 5890,
    status: 'Best value',
  },
  {
    id: 2,
    from: 'Delhi',
    to: 'Bangalore',
    airline: 'Air_India',
    departure_time: 'Afternoon',
    arrival_time: 'Evening',
    stops: 'zero',
    flight_class: 'Economy',
    duration: '2.4',
    days_left: 10,
    departure: '10:35',
    arrival: '13:00',
    price: 7465,
    status: 'Low fare',
  },
  {
    id: 3,
    from: 'Delhi',
    to: 'Dubai',
    airline: 'Vistara',
    departure_time: 'Night',
    arrival_time: 'Late_Night',
    stops: 'one',
    flight_class: 'Business',
    duration: '3.1',
    days_left: 21,
    departure: '22:10',
    arrival: '00:45',
    price: 18750,
    status: 'Popular route',
  },
]

const airlines = ['AirAsia', 'Air_India', 'GO_FIRST', 'Indigo', 'SpiceJet', 'Vistara']
const cities = ['Bangalore', 'Chennai', 'Delhi', 'Hyderabad', 'Kolkata', 'Mumbai']
const timeBands = ['Early_Morning', 'Morning', 'Afternoon', 'Evening', 'Night', 'Late_Night']
const stopOptions = ['zero', 'one', 'two_or_more']
const classOptions = ['Economy', 'Business']
const modelFeatures = [
  'Historical booking patterns',
  'Route demand and seasonality',
  'Market price movement',
  'Travel date and lead time',
  'Passenger demand forecast',
  'Price anomaly alerts',
]

const modelSignals = [
  { label: 'Prediction engine', value: 'XGBoost fare model' },
  { label: 'Data source', value: 'Bookings + market data' },
  { label: 'Output', value: 'Price forecast + confidence' },
  { label: 'Refresh', value: 'Near real time' },
]

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)
}

function App() {
  const [tripType, setTripType] = useState('Round trip')
  const [passengers, setPassengers] = useState(1)
  const [airline, setAirline] = useState('Indigo')
  const [sourceCity, setSourceCity] = useState('Delhi')
  const [destinationCity, setDestinationCity] = useState('Mumbai')
  const [departureTime, setDepartureTime] = useState('Morning')
  const [arrivalTime, setArrivalTime] = useState('Morning')
  const [stops, setStops] = useState('zero')
  const [flightClass, setFlightClass] = useState('Economy')
  const [duration, setDuration] = useState('2.2')
  const [daysLeft, setDaysLeft] = useState('14')
  const [selectedFlight, setSelectedFlight] = useState(featuredFlights[0])
  const [searchSummary, setSearchSummary] = useState('Search flights to compare live prices and book quickly.')
  const [bookingMessage, setBookingMessage] = useState('Choose a flight to reserve your seat.')

  const searchResults = useMemo(
    () =>
      featuredFlights
        .filter((flight) => flight.airline !== airline || flight.from !== sourceCity || flight.to !== destinationCity)
        .concat(featuredFlights)
        .slice(0, 3)
        .map((flight, index) => ({
          ...flight,
          price: flight.price + index * 1200,
        })),
    [airline, sourceCity, destinationCity],
  )

  const handleSearch = (event) => {
    event.preventDefault()
    setSearchSummary(
      `Searching ${tripType.toLowerCase()} for ${passengers} passenger${passengers > 1 ? 's' : ''} on ${airline} from ${sourceCity} to ${destinationCity} with ${flightClass} fares, ${stops} stops, ${departureTime} departure, ${arrivalTime} arrival, ${duration} hours duration, and ${daysLeft} days left.`,
    )
    setSelectedFlight(searchResults[0])
    setBookingMessage('Search updated. Select a flight below to continue booking.')
  }

  const handleBook = (flight) => {
    setSelectedFlight(flight)
    setBookingMessage(
      `Booking ready for ${flight.from} to ${flight.to} on ${flight.airline}. Review the summary and confirm the trip.`,
    )
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <div className="brand-mark">
          <span className="brand-icon">✦</span>
          <div>
            <strong>AERODROME</strong>
            <p>Book flights with price predictions</p>
          </div>
        </div>
        <nav className="topnav" aria-label="Primary">
          <a href="#book">Book</a>
          <a href="#results">Flights</a>
          <a href="#model">Model</a>
          <a href="#features">Features</a>
        </nav>
      </header>

      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">Flight booking platform</span>
          <h1>Flights, priced before you book.</h1>
          <p className="lede">
            Search routes, compare fares, and reserve the seat you want with price guidance built into the booking flow.
          </p>
          <div className="hero-actions">
            <a className="primary-cta" href="#book">Search flights</a>
            <a className="secondary-cta" href="#results">View offers</a>
          </div>
          <div className="signal-strip">
            {modelSignals.map((item) => (
              <div className="signal-pill" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <aside className="hero-visual" aria-label="Flight booking preview">
          <div className="hero-card hero-card-main">
            <span>Today&apos;s best fare</span>
            <strong>{formatPrice(5890)}</strong>
            <p>Delhi to Mumbai • Nonstop • 2h 10m</p>
          </div>
          <div className="hero-card hero-card-side hero-card-top">
            <span>Price move</span>
            <strong>Down 12%</strong>
          </div>
          <div className="hero-card hero-card-side hero-card-bottom">
            <span>Booking status</span>
            <strong>Seats available now</strong>
          </div>
        </aside>
      </section>

      <section className="booking-panel" id="book">
        <div className="panel-heading">
          <span className="eyebrow">Book a flight</span>
          <h2>Search and book in one place</h2>
          <p>{searchSummary}</p>
        </div>

        <form className="booking-form" onSubmit={handleSearch}>
          <div className="control-bar">
            <div className="toggle-group" role="tablist" aria-label="Trip type">
              {['Round trip', 'One way', 'Multi city'].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`toggle-pill ${tripType === item ? 'active' : ''}`}
                  onClick={() => setTripType(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="stepper-group" aria-label="Passenger count">
              <span>Passengers</span>
              <div className="stepper">
                <button type="button" onClick={() => setPassengers((value) => Math.max(1, value - 1))}>
                  −
                </button>
                <strong>{passengers}</strong>
                <button type="button" onClick={() => setPassengers((value) => Math.min(9, value + 1))}>
                  +
                </button>
              </div>
            </div>

            <div className="toggle-group toggle-group-compact" role="tablist" aria-label="Flight class">
              {classOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`toggle-pill ${flightClass === item ? 'active' : ''}`}
                  onClick={() => setFlightClass(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="route-row">
            <div className="field">
              <label htmlFor="sourceCity">From</label>
              <select id="sourceCity" value={sourceCity} onChange={(event) => setSourceCity(event.target.value)}>
                {cities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="swap-button"
              aria-label="Swap route"
              onClick={() => {
                const nextSource = destinationCity
                const nextDestination = sourceCity
                setSourceCity(nextSource)
                setDestinationCity(nextDestination)
              }}
            >
              ⇄
            </button>

            <div className="field">
              <label htmlFor="destinationCity">To</label>
              <select id="destinationCity" value={destinationCity} onChange={(event) => setDestinationCity(event.target.value)}>
                {cities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="departDate">Depart</label>
              <input id="departDate" type="date" value="2026-07-15" readOnly />
            </div>

            <div className={tripType === 'One way' ? 'field muted' : 'field'}>
              <label htmlFor="returnDate">Return</label>
              <input
                id="returnDate"
                type="date"
                value="2026-07-22"
                readOnly={tripType !== 'One way'}
                aria-disabled={tripType === 'One way'}
              />
            </div>

            <button className="search-button" type="submit">
              Search + Predict →
            </button>
          </div>

          <div className="advanced-grid">
            <div className="field field-wide">
              <label htmlFor="airline">Airline</label>
              <select id="airline" value={airline} onChange={(event) => setAirline(event.target.value)}>
                {airlines.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="departureTime">Departure time</label>
              <select id="departureTime" value={departureTime} onChange={(event) => setDepartureTime(event.target.value)}>
                {timeBands.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="arrivalTime">Arrival time</label>
              <select id="arrivalTime" value={arrivalTime} onChange={(event) => setArrivalTime(event.target.value)}>
                {timeBands.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="stops">Stops</label>
              <select id="stops" value={stops} onChange={(event) => setStops(event.target.value)}>
                {stopOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="duration">Duration (hours)</label>
              <input
                id="duration"
                type="number"
                min="0.1"
                step="0.1"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="daysLeft">Days left</label>
              <input
                id="daysLeft"
                type="number"
                min="1"
                max="49"
                value={daysLeft}
                onChange={(event) => setDaysLeft(event.target.value)}
              />
            </div>
          </div>
        </form>
      </section>

      <section className="results-section" id="results">
        <div className="section-heading">
          <span className="eyebrow">Available flights</span>
          <h2>Choose the offer that fits your trip</h2>
        </div>

        <div className="results-grid">
          {searchResults.map((flight) => (
            <article className={`result-card ${selectedFlight.id === flight.id ? 'selected' : ''}`} key={flight.id}>
              <div className="result-topline">
                <strong>{flight.from} → {flight.to}</strong>
                <span>{flight.status}</span>
              </div>
              <div className="result-meta">
                <div>
                  <p>Airline</p>
                  <strong>{flight.airline}</strong>
                </div>
                <div>
                  <p>Departure</p>
                  <strong>{flight.departure}</strong>
                </div>
                <div>
                  <p>Arrival</p>
                  <strong>{flight.arrival}</strong>
                </div>
                <div>
                  <p>Stops</p>
                  <strong>{flight.stops}</strong>
                </div>
              </div>
              <div className="result-footer">
                <div>
                  <p>From</p>
                  <strong>{formatPrice(flight.price)}</strong>
                </div>
                <button type="button" onClick={() => handleBook(flight)}>
                  Book flight
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="booking-summary">
        <div>
          <span className="eyebrow">Booking summary</span>
          <h2>{selectedFlight.from} to {selectedFlight.to}</h2>
          <p>{bookingMessage}</p>
        </div>
        <div className="summary-card">
          <div>
            <p>Selected flight</p>
            <strong>{selectedFlight.airline}</strong>
          </div>
          <div>
            <p>Total estimate</p>
            <strong>{formatPrice(selectedFlight.price)}</strong>
          </div>
          <button
            type="button"
            className="search-button secondary"
            onClick={() => setBookingMessage('Flight reserved locally for demo purposes.')}
          >
            Confirm booking
          </button>
        </div>
      </section>

      <section className="bottom-grid" id="model">
        <div className="bottom-card">
          <span className="eyebrow">Model</span>
          <h2>How the price prediction works</h2>
          <p>
            The model uses booking history, route demand, market movement, and lead time to estimate
            fare direction before you buy.
          </p>
        </div>
        <div className="bottom-card chips-card" id="features">
          <span className="eyebrow">Features</span>
          <h2>What the platform gives travelers</h2>
          <div className="feature-chip-grid">
            {modelFeatures.map((feature) => (
              <span className="chip" key={feature}>{feature}</span>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
