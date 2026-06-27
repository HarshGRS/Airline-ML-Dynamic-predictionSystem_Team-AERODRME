/**
 * Frontend API client
 */

const API_BASE = '/api/v1'

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // If we had JWT tokens stored somewhere (e.g. localStorage), we'd attach them here
  const token = localStorage.getItem('aerodrome_auth_token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, { ...options, headers })
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}))
      throw new ApiError(errBody.detail || `API Error: ${response.status}`, response.status)
    }
    return response.json()
  } catch (err) {
    if (err instanceof ApiError) throw err
    throw new Error('Network error. Is the backend running?')
  }
}

export const api = {
  getHealth: () => fetchApi('/health'),
  getModelInfo: () => fetchApi('/model/info'),
  getDashboard: () => fetchApi('/dashboard'),

  // Prediction
  predict: (payload) =>
    fetchApi('/predict', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  predictBatch: (payloads) =>
    fetchApi('/predict/batch', {
      method: 'POST',
      body: JSON.stringify(payloads),
    }),

  // Watchlist
  getWatchlists: () => fetchApi('/watchlists'),
  createWatchlist: (payload) =>
    fetchApi('/watchlists', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteWatchlist: (id) =>
    fetchApi(`/watchlists/${id}`, { method: 'DELETE' }).catch(() => null),

  // Alerts
  getAlerts: () => fetchApi('/alerts'),

  // Admin
  getAdmin: () => fetchApi('/admin'),
  triggerRetrain: () => fetchApi('/admin/retrain', { method: 'POST' }),
  runCronJob: (jobName) => fetchApi(`/admin/cron/${jobName}/run`, { method: 'POST' }),
}
