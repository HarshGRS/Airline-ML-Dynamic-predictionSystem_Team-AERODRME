/**
 * Frontend API client
 */

// Use the environment variable if provided (for production), otherwise fallback to the relative path (for local dev proxy)
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

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

  // Auth
  auth: {
    login: (payload) => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
    signup: (payload) => fetchApi('/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
    googleLogin: (payload) => fetchApi('/auth/google', { method: 'POST', body: JSON.stringify(payload) }),
    getMe: () => fetchApi('/auth/me'),
  },

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

  // Saved Searches
  getSavedSearches: () => fetchApi('/saved-searches'),
  createSavedSearch: (payload) =>
    fetchApi('/saved-searches', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteSavedSearch: (id) =>
    fetchApi(`/saved-searches/${id}`, { method: 'DELETE' }).catch(() => null),

  // Dashboard additions
  getDashboardRoutes: () => fetchApi('/dashboard/routes'),
  getDashboardAnomalies: () => fetchApi('/dashboard/anomalies'),
}
