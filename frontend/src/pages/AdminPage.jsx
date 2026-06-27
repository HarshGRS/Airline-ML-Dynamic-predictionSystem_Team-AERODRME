import { useEffect, useState } from 'react'
import { RefreshCw, Play, RotateCcw, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react'
import { api } from '../services/api'

/* ── Status dot helpers ───────────────────────────── */
function StatusDot({ status }) {
  const map = {
    ok:       { color: '#22c55e', shadow: '0 0 8px rgba(34,197,94,0.5)' },
    degraded: { color: '#f97316', shadow: '0 0 8px rgba(249,115,22,0.45)' },
    running:  { color: '#22d3ee', shadow: '0 0 8px rgba(34,211,238,0.45)' },
    offline:  { color: '#ef4444', shadow: '0 0 8px rgba(239,68,68,0.4)' },
  }
  const s = map[status] ?? map.ok
  return (
    <span
      className="adm-dot"
      style={{ background: s.color, boxShadow: s.shadow }}
    />
  )
}

function StatusBadge({ status }) {
  const map = {
    ok:       { label: 'OK',       color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)' },
    degraded: { label: 'DEGRADED', color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)' },
    running:  { label: 'RUNNING',  color: '#22d3ee', bg: 'rgba(34,211,238,0.1)',  border: 'rgba(34,211,238,0.25)' },
    offline:  { label: 'OFFLINE',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)' },
  }
  const s = map[status] ?? map.ok
  return (
    <span
      className="adm-status-badge"
      style={{ color: s.color, background: s.bg, borderColor: s.border }}
    >
      {s.label}
    </span>
  )
}

/* ── Log level icon ───────────────────────────────── */
function LogIcon({ level }) {
  if (level === 'error') return <XCircle size={12} strokeWidth={2.5} style={{ color: '#ef4444', flexShrink: 0 }} />
  if (level === 'warn')  return <AlertTriangle size={12} strokeWidth={2.5} style={{ color: '#f97316', flexShrink: 0 }} />
  return <CheckCircle size={12} strokeWidth={2.5} style={{ color: '#22c55e', flexShrink: 0 }} />
}

/* ── Service Health row ───────────────────────────── */
function ServiceRow({ svc }) {
  return (
    <div className="adm-svc-row">
      <StatusDot status={svc.status} />
      <div className="adm-svc-info">
        <span className="adm-svc-name">{svc.name}</span>
        <span className="adm-svc-host">{svc.host}</span>
      </div>
      <div className="adm-svc-right">
        {svc.latency_ms != null ? (
          <span className="adm-svc-latency">{svc.latency_ms}ms</span>
        ) : (
          <span className="adm-svc-latency adm-svc-latency-dash">—</span>
        )}
        <StatusBadge status={svc.status} />
      </div>
    </div>
  )
}

/* ── Cron Job row ─────────────────────────────────── */
function CronRow({ job }) {
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  function handleRun() {
    if (running) return
    setRunning(true)
    api.runCronJob(job.name)
      .then(() => {
        setRunning(false)
        setDone(true)
        setTimeout(() => setDone(false), 3000)
      })
      .catch(() => {
        setRunning(false)
      })
  }

  return (
    <div className="adm-cron-row">
      <div className="adm-cron-info">
        <span className="adm-cron-name">{job.name}</span>
        <span className="adm-cron-schedule">{job.schedule}</span>
      </div>
      <div className="adm-cron-right">
        <span className="adm-cron-ago">
          <Clock size={11} strokeWidth={2} style={{ marginRight: 4 }} />
          {job.last_run_ago}
        </span>
        <StatusBadge status={job.status} />
        <button
          type="button"
          className={`adm-run-btn ${running ? 'adm-run-busy' : ''} ${done ? 'adm-run-done' : ''}`}
          onClick={handleRun}
          disabled={running}
          title={`Run ${job.name} now`}
        >
          {running ? <RotateCcw size={11} strokeWidth={2.5} className="adm-spin" /> : <Play size={11} strokeWidth={2.5} />}
          {running ? 'RUNNING' : done ? 'DONE' : 'RUN'}
        </button>
      </div>
    </div>
  )
}

/* ── Model Ops Log entry ──────────────────────────── */
function LogEntry({ entry }) {
  const colorMap = { error: '#ef4444', warn: '#f97316', info: '#22d3ee' }
  const color = colorMap[entry.level] ?? '#22d3ee'
  return (
    <div className="adm-log-entry">
      <LogIcon level={entry.level} />
      <span className="adm-log-ts" style={{ color }}>[{entry.timestamp}]</span>
      <span className="adm-log-msg" style={{ color }}>{entry.message}</span>
    </div>
  )
}

/* ── Main Page ────────────────────────────────────── */
export default function AdminPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retraining, setRetraining] = useState(false)
  const [retrained, setRetrained] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    document.title = 'Admin — AERODROME Console'
    fetchData()
  }, [])

  function fetchData() {
    setLoading(true)
    setError(null)
    api.getAdmin()
      .then((d) => { setData(d); setLoading(false) })
      .catch((err) => { setError(err.message); setLoading(false) })
  }

  function handleRefresh() {
    setRefreshing(true)
    api.getAdmin()
      .then((d) => { setData(d); setRefreshing(false) })
      .catch(() => setRefreshing(false))
  }

  function handleRetrain() {
    if (retraining) return
    setRetraining(true)
    api.triggerRetrain()
      .then(() => {
        setRetraining(false)
        setRetrained(true)
        setTimeout(() => setRetrained(false), 4000)
      })
      .catch(() => setRetraining(false))
  }

  /* ── Render ─────────────────────────────────────── */
  return (
    <>
      {/* Page header */}
      <div className="console-page-header">
        <div className="adm-header-row">
          <div>
            <h1>Admin</h1>
            <p>Service health, scheduled jobs, and model operations.</p>
          </div>
          <button
            type="button"
            className={`ac-refresh-btn ${refreshing ? 'ac-refreshing' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            <RefreshCw size={13} strokeWidth={2.5} />
            {refreshing ? 'REFRESHING' : 'REFRESH'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="ac-state">
          <div className="ac-spinner" />
          <p>Loading admin data…</p>
        </div>
      ) : error ? (
        <div className="ac-state ac-state-error">
          <AlertTriangle size={28} strokeWidth={1.5} />
          <p>{error}</p>
          <button type="button" className="ac-retry-btn" onClick={fetchData}>RETRY</button>
        </div>
      ) : (
        <>
          {/* ── Top two-column grid ─────────────────── */}
          <div className="adm-top-grid">
            {/* SERVICE_HEALTH */}
            <div className="console-panel adm-panel">
              <div className="console-panel-header">
                <h2 className="console-panel-title">SERVICE_HEALTH</h2>
              </div>
              <div className="adm-svc-list">
                {data.service_health.map((svc) => (
                  <ServiceRow key={svc.name} svc={svc} />
                ))}
              </div>
            </div>

            {/* CRON_JOBS */}
            <div className="console-panel adm-panel">
              <div className="console-panel-header">
                <h2 className="console-panel-title">CRON_JOBS</h2>
              </div>
              <div className="adm-cron-list">
                {data.cron_jobs.map((job) => (
                  <CronRow key={job.name} job={job} />
                ))}
              </div>
            </div>
          </div>

          {/* ── MODEL_OPS panel ─────────────────────── */}
          <div className="console-panel adm-ops-panel">
            <div className="console-panel-header">
              <h2 className="console-panel-title">MODEL_OPS</h2>
              <div className="adm-ops-header-right">
                <span className="adm-model-version">{data.model_version}</span>
                <button
                  type="button"
                  className={`adm-retrain-btn ${retraining ? 'adm-retrain-busy' : ''} ${retrained ? 'adm-retrain-done' : ''}`}
                  onClick={handleRetrain}
                  disabled={retraining}
                >
                  {retraining
                    ? <><RotateCcw size={12} strokeWidth={2.5} className="adm-spin" /> QUEUING…</>
                    : retrained
                    ? <><CheckCircle size={12} strokeWidth={2.5} /> QUEUED ✓</>
                    : 'TRIGGER_RETRAIN'}
                </button>
              </div>
            </div>

            {/* Log terminal */}
            <div className="adm-log-terminal">
              {data.model_ops_logs.map((entry, i) => (
                <LogEntry key={i} entry={entry} />
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}
