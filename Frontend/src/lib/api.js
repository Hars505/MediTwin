/**
 * Medi Twin API client — wires the React app to the Django backend.
 * Uses fetch + JWT in localStorage (avoids adding axios as a dep here).
 */

const API_BASE = '/api';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

function getRefreshToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
}

function setTokens({ access, refresh }) {
  if (access) localStorage.setItem('access_token', access);
  if (refresh) localStorage.setItem('refresh_token', refresh);
}

function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) {
      clearTokens();
      return null;
    }
    const data = await res.json();
    setTokens({ access: data.access, refresh: data.refresh });
    return data.access;
  } catch {
    return null;
  }
}

async function request(path, options = {}, retry = true) {
  const { auth = true, ...fetchOptions } = options;
  const headers = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers || {}),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });

  // Only attempt token refresh + redirect for authenticated endpoints.
  // Login/register pass auth:false so a 401 simply throws to the caller.
  if (res.status === 401 && retry && auth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request(path, options, false);
    }
    clearTokens();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new ApiError(401, { detail: 'Session expired' });
  }

  if (!res.ok) {
    let data = null;
    try { data = await res.json(); } catch { /* not JSON */ }
    throw new ApiError(res.status, data);
  }
  if (res.status === 204) return null;
  return res.json();
}

export class ApiError extends Error {
  constructor(status, data) {
    super(data?.detail || `HTTP ${status}`);
    this.status = status;
    this.data = data;
  }
}

// ══════════════════════════════════════════════════════════════════════
// Auth API
// ══════════════════════════════════════════════════════════════════════

export const authAPI = {
  login: (data) => request('/auth/login/', { method: 'POST', body: JSON.stringify(data), auth: false }),
  register: (data) => request('/auth/register/', { method: 'POST', body: JSON.stringify(data), auth: false }),
  googleLogin: (credential) => request('/auth/google/', { method: 'POST', body: JSON.stringify({ credential }), auth: false }),
  refresh: (data) => request('/auth/token/refresh/', { method: 'POST', body: JSON.stringify(data) }),
  profile: () => request('/auth/profile/'),
  updateProfile: (data) => request('/auth/profile/', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (data) => request('/auth/change-password/', { method: 'POST', body: JSON.stringify(data) }),
};

// ══════════════════════════════════════════════════════════════════════
// Patient API
// ══════════════════════════════════════════════════════════════════════

export const patientAPI = {
  getProfile: () => request('/patient/profile/'),
  saveProfile: (data) => request('/patient/profile/', { method: 'POST', body: JSON.stringify(data) }),
  getVitals: (limit = 50) => request(`/patient/vitals/?limit=${limit}`),
  recordVitals: (data) => request('/patient/vitals/', { method: 'POST', body: JSON.stringify(data) }),
  getLatestVitals: () => request('/patient/vitals/latest/'),
  getLifestyle: (limit = 30) => request(`/patient/lifestyle/?limit=${limit}`),
  logLifestyle: (data) => request('/patient/lifestyle/', { method: 'POST', body: JSON.stringify(data) }),
};

// ══════════════════════════════════════════════════════════════════════
// ML / Risk Scores API
// ══════════════════════════════════════════════════════════════════════

export const mlAPI = {
  getRiskScores: () => request('/ml/risk-scores/'),
  calculateRisk: () => request('/ml/risk-scores/calculate/', { method: 'POST' }),
  getRiskHistory: (limit = 20) => request(`/ml/risk-scores/history/?limit=${limit}`),
  whatIf: (data) => request('/ml/what-if/', { method: 'POST', body: JSON.stringify(data) }),
  getModelMetrics: (model) => request(`/ml/model-metrics/${model ? `?model=${model}` : ''}`),
};

// ══════════════════════════════════════════════════════════════════════
// Chatbot API
// ══════════════════════════════════════════════════════════════════════

export const chatbotAPI = {
  startSession: () => request('/chatbot/session/', { method: 'POST' }),
  sendMessage: (data) => request('/chatbot/message/', { method: 'POST', body: JSON.stringify(data) }),
  getHistory: (limit = 5) => request(`/chatbot/history/?limit=${limit}`),
  getSymptoms: () => request('/chatbot/symptoms/'),
  getDatasetStats: () => request('/chatbot/dataset-stats/'),
};

// ══════════════════════════════════════════════════════════════════════
// Reports API
// ══════════════════════════════════════════════════════════════════════

export const reportsAPI = {
  list: () => request('/reports/'),
  generate: (data) => request('/reports/generate/', { method: 'POST', body: JSON.stringify(data) }),
  downloadUrl: (filename) => `${API_BASE}/reports/download/${filename}/`,
  reportUrl: (filename, download = false) => {
    const token = getToken();
    const base = `${API_BASE}/reports/download/${filename}/?token=${encodeURIComponent(token || "")}`;
    return download ? `${base}&download=1` : base;
  },
};

// ══════════════════════════════════════════════════════════════════════
// Notifications API
// ══════════════════════════════════════════════════════════════════════

export const notificationsAPI = {
  getAll: (limit = 50) => request(`/auth/notifications/?limit=${limit}`),
  getUnread: (limit = 50) => request(`/auth/notifications/?limit=${limit}&unread=true`),
  markRead: (notificationId) => request('/auth/notifications/read/', {
    method: 'POST',
    body: JSON.stringify({ notification_id: notificationId }),
  }),
  markAllRead: () => request('/auth/notifications/read/', {
    method: 'POST',
    body: JSON.stringify({ all: true }),
  }),
};

// ══════════════════════════════════════════════════════════════════════
// Doctor API
// ══════════════════════════════════════════════════════════════════════

export const doctorAPI = {
  getProfile: () => request('/auth/doctor-profile/'),
  updateProfile: (data) => request('/auth/doctor-profile/', { method: 'PUT', body: JSON.stringify(data) }),
  listDoctors: () => request('/auth/doctors/'),
  getPatients: () => request('/auth/doctor-patients/'),
};

export { setTokens, clearTokens, getToken, getRefreshToken };
