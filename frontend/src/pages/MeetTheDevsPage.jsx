import { useEffect } from 'react'
import { BrainCircuit, Server, Layers, TrendingUp, Globe, Shield } from 'lucide-react'

const TEAM = [
  { name: 'Harsh Raj Singh',   role: 'Backend Developer',   image: '/Harsh_dev.jpeg',    position: 'center 10%', tag: 'BE', tagColor: '#6d5ef5' },
  { name: 'Sharad Kumar',      role: 'Backend Developer',   image: '/Sharad_dev.jpeg',   position: 'center 30%', tag: 'BE', tagColor: '#6d5ef5' },
  { name: 'Sumit Kumar Singh', role: 'Backend Developer',   image: '/sumit_dev.jpg',     position: 'center 15%', tag: 'BE', tagColor: '#6d5ef5' },
  { name: 'Dolly',             role: 'AI / ML Developer',   image: '/Doly_dev.jpeg',     position: 'center 15%', tag: 'ML', tagColor: '#22d3ee' },
  { name: 'Ayushi',            role: 'Frontend Developer',  image: '/Ayushi_dev.jpeg',   position: 'center 10%', tag: 'FE', tagColor: '#7df1c5' },
  { name: 'Nitin Khulbe',      role: 'Frontend Developer',  image: '/Nitin_dev.jpeg',    position: 'center 20%', tag: 'FE', tagColor: '#7df1c5' },
  { name: 'Vaibhav',           role: 'Frontend Developer',  image: '/vaibhav_dev.jpeg',  position: 'center 25%', tag: 'FE', tagColor: '#7df1c5' },
]

const PLATFORM_FEATURES = [
  { icon: BrainCircuit, title: 'ML-Powered Predictions',  color: '#6d5ef5', desc: 'XGBoost model trained on Indian domestic flight data delivers real-time fare forecasts with confidence bands.' },
  { icon: TrendingUp,   title: 'Price Trend Analysis',    color: '#22d3ee', desc: 'Track how fares evolve from 49 days out to departure day and identify the optimal booking window.' },
  { icon: Globe,        title: 'Interactive Route Map',   color: '#7df1c5', desc: 'Visualise all major Indian domestic routes on a live map and instantly get estimated fair prices.' },
  { icon: Server,       title: 'FastAPI Backend',         color: '#f59e0b', desc: 'High-performance Python backend with RESTful API, JWT auth, and real-time ML inference endpoints.' },
  { icon: Layers,       title: 'Saved Searches & Alerts', color: '#a78bfa', desc: 'Save routes, monitor price movements, and receive trend signals to never miss a low-fare window.' },
  { icon: Shield,       title: 'Secure & Scalable',       color: '#34d399', desc: 'Google OAuth + email auth, role-based access, and a modular architecture built for production scale.' },
]

const STATS = [
  { value: '6',       label: 'Indian Cities' },
  { value: '6',       label: 'Airlines Covered' },
  { value: 'XGBoost', label: 'ML Model' },
  { value: '7',       label: 'Team Members' },
  { value: '49d',     label: 'Forecast Horizon' },
  { value: '< 30ms',  label: 'Avg Inference' },
]

export default function MeetTheDevsPage() {
  useEffect(() => { document.title = 'About Us — AERODROME' }, [])

  return (
    <div className="about-page">

      {/* SECTION 1: Platform overview */}
      <section className="about-hero">
        <div className="about-hero-inner">
          <span className="eyebrow" style={{ color: '#22d3ee' }}>Built by Team AERODROME</span>
          <h1 className="about-hero-title">Flight pricing intelligence,<br />powered by machine learning.</h1>
          <p className="about-hero-body">
            AERODROME is a full-stack flight fare prediction platform designed for Indian domestic routes.
            We combine real-world booking data, demand signals, and an XGBoost regression model to help
            travelers understand where prices are headed — so they can book smarter, not harder.
          </p>
          <div className="about-features-grid">
            {PLATFORM_FEATURES.map((f) => (
              <div key={f.title} className="about-feature-card">
                <div className="about-feature-icon" style={{ color: f.color, background: f.color + '18' }}>
                  <f.icon size={20} strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="about-feature-title">{f.title}</h3>
                  <p className="about-feature-desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: Team */}
      <section className="about-team-section">
        <div className="about-section-inner">
          <div className="about-section-heading">
            <span className="eyebrow">The People</span>
            <h2>Meet the Team</h2>
            <p>Seven developers across backend, frontend, and machine learning — building the future of fare intelligence.</p>
          </div>
          <div className="about-team-grid">
            {TEAM.map((dev) => (
              <div key={dev.name} className="about-dev-card">
                <div className="about-dev-photo-wrap">
                  <img src={dev.image} alt={dev.name} className="about-dev-photo" style={{ objectPosition: dev.position }} />
                  <span className="about-dev-tag" style={{ background: dev.tagColor, color: '#080613' }}>{dev.tag}</span>
                </div>
                <div className="about-dev-info">
                  <h3 className="about-dev-name">{dev.name}</h3>
                  <p className="about-dev-role" style={{ color: dev.tagColor }}>{dev.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: Stats */}
      <section className="about-stats-section">
        <div className="about-section-inner">
          <div className="about-stats-grid">
            {STATS.map((s) => (
              <div key={s.label} className="about-stat-card">
                <span className="about-stat-value">{s.value}</span>
                <span className="about-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
