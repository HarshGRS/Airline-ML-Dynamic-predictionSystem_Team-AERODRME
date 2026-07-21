import React from 'react';
import {
  BrainCircuit,
  Plane,
  TrendingUp,
  Database,
  Layers,
  Cpu,
  Server,
  Target,
} from 'lucide-react';

const developers = [
  { name: 'Dolly', image: '/Doly_dev.jpeg', position: 'center 15%', role: 'ML Developer' },
  { name: 'Sharad Kumar', image: '/Sharad_dev.jpeg', position: 'center 30%', role: 'AIML & Full-Stack Developer' },
  { name: 'Sumit Kumar', image: '/sumit_dev.jpg', position: 'center 15%', role: 'AIML & Full-Stack Developer' },
    { name: 'Harsh Raj Singh', image: '/Harsh_dev.jpeg', position: 'center 10%', role: 'AIML & Full-Stack Developer' },
  { name: 'Ayushi Dubey', image: '/Ayushi_dev.jpeg', position: 'center 10%', role: 'Frontend Developer' },
  { name: 'Nitin Khulbe', image: '/Nitin_dev.jpeg', position: 'center 20%', role: 'Frontend Developer' },
  { name: 'Vaibhav', image: '/vaibhav_dev.jpeg', position: 'center 25%', role: 'Frontend Developer' },
];

const aboutHighlights = [
  { icon: Plane, label: 'Flight search', text: 'Route-level fare comparison across Indian domestic airlines.' },
  { icon: TrendingUp, label: 'Price forecasting', text: '6-month trend tracking to time your booking window.' },
  { icon: BrainCircuit, label: 'ML prediction', text: 'An XGBoost model trained on historical fare + demand data.' },
];

const pipelineSteps = [
  {
    icon: Database,
    title: 'Dataset',
    text: '300,153 real domestic fare records (Kaggle Flight Price Prediction) covering 6 airlines, 6 cities and every cabin class.',
  },
  {
    icon: Layers,
    title: 'Feature engineering',
    text: 'Airline, route, stops, cabin class, departure/arrival window, duration and days-left-to-departure are encoded into a shared pipeline used at both train and serve time.',
  },
  {
    icon: Cpu,
    title: 'Model training',
    text: 'An XGBoost Regressor (300 trees, max depth 6, learning rate 0.08) is trained on a 240,122 / 60,031 train-test split.',
  },
  {
    icon: Server,
    title: 'Serving',
    text: 'The trained model is loaded once at FastAPI startup and served behind a rate-limited /predict endpoint with sub-100ms inference.',
  },
];

const modelStats = [
  { label: 'Rows trained on', value: '300,153' },
  { label: 'R² score', value: '0.973' },
  { label: 'Mean abs. error', value: '₹2,137' },
  { label: 'RMSE', value: '₹3,742' },
];

const techStack = [
  {
    group: 'Frontend',
    items: ['React 19', 'Vite', 'React Router', 'Recharts', 'React Leaflet', 'Google OAuth'],
  },
  {
    group: 'Backend',
    items: ['FastAPI', 'SQLAlchemy + Alembic', 'PostgreSQL (Supabase)', 'JWT auth (python-jose)', 'slowapi rate limiting'],
  },
  {
    group: 'Machine learning',
    items: ['XGBoost', 'scikit-learn', 'pandas', 'joblib model artifacts'],
  },
];

export default function MeetTheDevsPage() {
  return (
    <section className="devs-page">
      <div className="devs-container">
        {/* ── Hero ── */}
        <div className="devs-header">
          <span className="eyebrow">About</span>
          <h1 className="devs-title">About AERODROME</h1>
          <p className="devs-subtitle">
            AERODROME is a machine-learning powered flight pricing platform that helps travelers
            decide whether to book now or wait, by forecasting fare movement instead of showing
            just a single live price.
          </p>
        </div>

        <div className="about-highlights">
          {aboutHighlights.map((item) => (
            <div key={item.label} className="about-highlight-card">
              <item.icon size={18} strokeWidth={2.2} />
              <strong>{item.label}</strong>
              <p>{item.text}</p>
            </div>
          ))}
        </div>

        {/* ── How it works ── */}
        <div className="devs-header devs-header--team">
          <span className="eyebrow">How it works</span>
          <h2 className="devs-title devs-title--sub">From raw fares to a live prediction</h2>
          <p className="devs-subtitle">
            The same pipeline that trained the model runs the request you send from the search form.
          </p>
        </div>

        <div className="about-pipeline">
          {pipelineSteps.map((step, i) => (
            <div key={step.title} className="about-pipeline-step">
              <div className="about-pipeline-icon">
                <step.icon size={18} strokeWidth={2.2} />
              </div>
              <div className="about-pipeline-body">
                <span className="about-pipeline-num">{String(i + 1).padStart(2, '0')}</span>
                <strong>{step.title}</strong>
                <p>{step.text}</p>
              </div>
              {i < pipelineSteps.length - 1 && <div className="about-pipeline-connector" />}
            </div>
          ))}
        </div>

        {/* ── Model performance ── */}
        <div className="about-stats-card">
          <div className="about-stats-heading">
            <Target size={16} strokeWidth={2.2} />
            <span>Model performance &mdash; XGBoost Regressor v1.0.0</span>
          </div>
          <div className="about-stats-grid">
            {modelStats.map((stat) => (
              <div key={stat.label} className="about-stat">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tech stack ── */}
        <div className="devs-header devs-header--team">
          <span className="eyebrow">Under the hood</span>
          <h2 className="devs-title devs-title--sub">Tech stack</h2>
        </div>

        <div className="about-stack-grid">
          {techStack.map((group) => (
            <div key={group.group} className="about-stack-card">
              <strong>{group.group}</strong>
              <div className="about-stack-tags">
                {group.items.map((item) => (
                  <span key={item} className="about-stack-tag">{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── Team ── */}
        <div className="devs-header devs-header--team">
          <span className="eyebrow">The people</span>
          <h2 className="devs-title devs-title--sub">Meet the Developers</h2>
          <p className="devs-subtitle">
            The talented team behind AERODROME's flight pricing intelligence.
          </p>
        </div>

        <div className="devs-grid">
          {developers.map((dev, index) => (
            <div
              key={index}
              className="dev-card"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className="dev-image-wrapper">
                <img src={dev.image} alt={`${dev.name}`} className="dev-image" style={{ objectPosition: dev.position || 'center' }} />
                <span className="dev-image-shine" />
              </div>
              <h3 className="dev-name">{dev.name}</h3>
              <span className="dev-role">{dev.role}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
