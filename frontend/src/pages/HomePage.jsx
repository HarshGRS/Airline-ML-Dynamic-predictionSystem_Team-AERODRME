import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftRight, ArrowRight, BrainCircuit, Lock, Plane, TrendingUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import HomeMap from '../components/HomeMap'

const mlCities = ['Bangalore', 'Chennai', 'Delhi', 'Hyderabad', 'Kolkata', 'Mumbai']
const airlines = ['AirAsia', 'Air India', 'GO FIRST', 'Indigo', 'SpiceJet', 'Vistara']
const tripOptions = ['Round Trip', 'One Way']
const cabinOptions = ['Economy', 'Business']
const timeOptions = ['Early Morning', 'Morning', 'Afternoon', 'Evening', 'Night', 'Late Night']
const stopOptions = ['Non-stop', '1 Stop', '2+ Stops']

const faqItems = [
  {
    question: 'How does the price prediction work?',
    answer:
      'We combine historical booking patterns, route demand, seasonality, lead time, and market movement to estimate where fares are likely to go next.',
  },
  {
    question: 'Why is machine learning useful here?',
    answer:
      'Flight pricing changes constantly. The model helps travelers compare trends instead of guessing from a single live price snapshot.',
  },
  {
    question: 'What data drives the model?',
    answer:
      'Route-level demand, booking pace, travel dates, fare classes, and observed price movement are used to learn likely fare behavior.',
  },
  {
    question: 'How should I use the trend chart?',
    answer:
      'Use the trend line to see whether the fare is cooling down or rising, then decide whether to buy now or wait for a better window.',
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [tripType, setTripType] = useState('Round Trip')
  const [travelClass, setTravelClass] = useState('Economy')
  const [from, setFrom] = useState('Delhi')
  const [to, setTo] = useState('Mumbai')
  const [airline, setAirline] = useState('Indigo')
  const [departDate, setDepartDate] = useState('2026-07-15')
  const [returnDate, setReturnDate] = useState('2026-07-22')
  const [departureTime, setDepartureTime] = useState('Morning')
  const [arrivalTime, setArrivalTime] = useState('Evening')
  const [stops, setStops] = useState('Non-stop')
  const [duration, setDuration] = useState(2.0)
  const [daysLeft, setDaysLeft] = useState(18)
  const [showFaq, setShowFaq] = useState(faqItems[0].question)

  // Carousel
  const carouselSlides = [
    { src: '/feature_route_search.png', alt: 'Smart route search', label: 'Smart Search', sub: 'Filter routes by stops, class & time' },
    { src: '/feature_price_trend.png', alt: 'Price trend chart', label: 'Price Trends', sub: 'Track 6-month fare movement' },
    { src: '/feature_ml_model.png', alt: 'ML neural network', label: 'ML Forecast', sub: 'AI-powered fare prediction engine' },
    { src: '/feature_booking_decision.png', alt: 'Booking decision', label: 'Book Decision', sub: 'Know exactly when to buy' },
  ]
  const [carouselIndex, setCarouselIndex] = useState(0)
  const carouselPaused = useRef(false)
  const carouselTimer = useRef(null)

  const startCarousel = useCallback(() => {
    clearInterval(carouselTimer.current)
    carouselTimer.current = setInterval(() => {
      if (!carouselPaused.current) {
        setCarouselIndex((i) => (i + 1) % carouselSlides.length)
      }
    }, 3200)
  }, [carouselSlides.length])

  useEffect(() => {
    startCarousel()
    return () => clearInterval(carouselTimer.current)
  }, [startCarousel])

  useEffect(() => {
    document.title = 'AERODROME | Flight booking'
  }, [])

  const handleSwapRoute = () => {
    setFrom(to)
    setTo(from)
  }

  const handleSearch = (event) => {
    event.preventDefault()

    // Guests must be logged in to run predictions
    if (!user) {
      navigate('/login', { state: { next: '/results', searchParams: { from, to, airline, tripType, travelClass, stops, departDate, returnDate, departureTime, arrivalTime, duration, daysLeft } } })
      return
    }

    navigate('/results', {
      state: {
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
      },
    })
  }

  const selectedFaq = faqItems.find((item) => item.question === showFaq) ?? faqItems[0]

  return (
    <>
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">ML-powered flight intelligence</span>
          <h1>Compare fares before you commit.</h1>
          <p className="hero-tagline">
            AERODROME uses machine learning to forecast where flight prices are headed — so you know whether to book today or wait for a better fare.
          </p>
          <div className="hero-badges">
            <span className="hero-badge"><Plane size={13} strokeWidth={2.2} /> Flight search</span>
            <span className="hero-badge"><TrendingUp size={13} strokeWidth={2.2} /> Price forecasting</span>
            <span className="hero-badge"><BrainCircuit size={13} strokeWidth={2.2} /> ML prediction</span>
          </div>
        </div>

        <aside className="hero-panel-card">
          <span className="eyebrow">What you get</span>

          <div
            className="hero-carousel"
            onMouseEnter={() => { carouselPaused.current = true }}
            onMouseLeave={() => { carouselPaused.current = false }}
          >
            {/* Slides */}
            <div className="hero-carousel-track">
              {carouselSlides.map((slide, i) => (
                <div
                  key={slide.src}
                  className={`hero-carousel-slide ${i === carouselIndex ? 'active' : ''}`}
                >
                  <img src={slide.src} alt={slide.alt} />
                </div>
              ))}
            </div>

            {/* Caption overlay */}
            <div key={carouselIndex} className="hero-carousel-caption">
              <strong>{carouselSlides[carouselIndex].label}</strong>
              <span>{carouselSlides[carouselIndex].sub}</span>
            </div>

            {/* Dot nav */}
            <div className="hero-carousel-dots" role="tablist" aria-label="Feature slides">
              {carouselSlides.map((slide, i) => (
                <button
                  key={slide.src}
                  type="button"
                  role="tab"
                  aria-selected={i === carouselIndex}
                  className={`hero-carousel-dot ${i === carouselIndex ? 'active' : ''}`}
                  onClick={() => { setCarouselIndex(i); startCarousel() }}
                  aria-label={slide.label}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* ── Predict form overlapping the hero bottom ── */}
        <div className="hero-form-float" id="search">
          <div className="predict-form-card">
            {/* Top bar: trip type + class */}
            <div className="predict-toolbar">
              <div className="predict-pill-group">
                {tripOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`predict-pill ${tripType === option ? 'active' : ''}`}
                    onClick={() => setTripType(option)}
                  >
                    {option.toUpperCase().replace(' ', '_')}
                  </button>
                ))}
              </div>

              <div className="predict-sep" />

              <div className="predict-pill-group">
                {cabinOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`predict-pill ${travelClass === option ? 'active' : ''}`}
                    onClick={() => setTravelClass(option)}
                  >
                    {option.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="predict-sep" />

              <div className="predict-pill-group">
                {stopOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`predict-pill ${stops === option ? 'active' : ''}`}
                    onClick={() => setStops(option)}
                  >
                    {option.replace(' ', '_').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Route + inputs */}
            <form className="predict-route-row" onSubmit={handleSearch}>
              <div className="predict-field">
                <label htmlFor="pf-from">FROM</label>
                <select id="pf-from" value={from} onChange={(e) => setFrom(e.target.value)}>
                  {mlCities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <button type="button" className="predict-swap" aria-label="Swap" onClick={handleSwapRoute}>
                <ArrowLeftRight size={15} strokeWidth={2.2} />
              </button>

              <div className="predict-field">
                <label htmlFor="pf-to">TO</label>
                <select id="pf-to" value={to} onChange={(e) => setTo(e.target.value)}>
                  {mlCities.filter(c => c !== from).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="predict-field">
                <label htmlFor="pf-depart">DEPART</label>
                <input id="pf-depart" type="date" value={departDate} onChange={(e) => setDepartDate(e.target.value)} />
              </div>

              <div className={`predict-field ${tripType === 'One Way' ? 'predict-field--dim' : ''}`}>
                <label htmlFor="pf-return">RETURN</label>
                <input
                  id="pf-return"
                  type="date"
                  value={returnDate}
                  disabled={tripType === 'One Way'}
                  onChange={(e) => setReturnDate(e.target.value)}
                />
              </div>

              <div className="predict-field">
                <label htmlFor="pf-airline">AIRLINE</label>
                <select id="pf-airline" value={airline} onChange={(e) => setAirline(e.target.value)}>
                  {airlines.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div className="predict-field">
                <label htmlFor="pf-dep-time">DEP. TIME</label>
                <select id="pf-dep-time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)}>
                  {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="predict-field">
                <label htmlFor="pf-arr-time">ARR. TIME</label>
                <select id="pf-arr-time" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)}>
                  {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="predict-field">
                <label htmlFor="pf-duration">DURATION (h)</label>
                <input
                  id="pf-duration"
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  value={duration}
                  onChange={(e) => setDuration(parseFloat(e.target.value))}
                />
              </div>

              <div className="predict-field">
                <label htmlFor="pf-days">DAYS OUT</label>
                <input
                  id="pf-days"
                  type="number"
                  min="1"
                  max="49"
                  value={daysLeft}
                  onChange={(e) => setDaysLeft(parseInt(e.target.value, 10))}
                />
              </div>

              {/* Footer bar: model note + CTA */}
              <div className="predict-footer-bar">
                <span className="predict-model-note">
                  <span className="predict-model-dot" />
                  XGBoost model · trained on Indian domestic routes · {daysLeft}d booking window
                </span>
                <button type="submit" className="predict-cta">
                  {user ? (
                    <>
                      SEARCH + PREDICT <ArrowRight size={14} strokeWidth={2.5} />
                    </>
                  ) : (
                    <>
                      <Lock size={13} strokeWidth={2.5} /> SIGN IN TO PREDICT
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <HomeMap />

      <section className="features-section" id="features">
        <div className="section-heading">
          <span className="eyebrow">Machine learning</span>
          <h2>Questions travelers ask before trusting the forecast</h2>
          <p>
            Understand the model behind your fare estimates — plain answers to the questions that matter most.
          </p>
        </div>

        <div className="faq-grid">
          <div className="faq-list">
            {faqItems.map((item) => (
              <button
                key={item.question}
                type="button"
                className={`faq-item ${showFaq === item.question ? 'active' : ''}`}
                onClick={() => setShowFaq(item.question)}
              >
                <span>{item.question}</span>
                <strong>{showFaq === item.question ? '−' : '+'}</strong>
              </button>
            ))}
          </div>

          <article className="faq-answer">
            <span className="card-label">Answer</span>
            <h3>{selectedFaq.question}</h3>
            <p>{selectedFaq.answer}</p>
            <div className="faq-highlights">
              <div>
                <span>Data source</span>
                <strong>Historic fares + demand signals</strong>
              </div>
              <div>
                <span>ML output</span>
                <strong>Trend direction and recommendation</strong>
              </div>
              <div>
                <span>UX goal</span>
                <strong>Simple decision making</strong>
              </div>
            </div>
          </article>
        </div>
      </section>
    </>
  )
}
