const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function getApiBaseUrl() {
  return API_BASE_URL;
}

async function request(endpoint, options = {}) {
  const baseUrl = await getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);
  
  if (!response.ok) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch (e) {
      // Not JSON
    }
    const message = errorData?.message || `Request failed with status ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.data = errorData;
    throw err;
  }

  return response.json();
}

export const api = {
  auth: {
    login: (body) => request('/api/auth/login', { method: 'POST', body }),
    register: (body) => request('/api/auth/register', { method: 'POST', body }),
    getUsers: () => request('/api/auth/users'),
    getUserById: (id) => request(`/api/auth/users/${id}`),
    updateUser: (id, body) => request(`/api/auth/users/${id}`, { method: 'PUT', body }),
    deleteUser: (id) => request(`/api/auth/users/${id}`, { method: 'DELETE' })
  },
  projects: {
    getAll: () => request('/api/projects'),
    save: (body) => request('/api/projects', { method: 'POST', body }),
    delete: (id) => request(`/api/projects/${id}`, { method: 'DELETE' })
  },
  sites: {
    getAll: () => request('/api/sites'),
    save: (body) => request('/api/sites', { method: 'POST', body }),
    delete: (id) => request(`/api/sites/${id}`, { method: 'DELETE' })
  },
  monitoring: {
    getAll: () => request('/api/monitoring'),
    save: (body) => request('/api/monitoring', { method: 'POST', body }),
    delete: (id) => request(`/api/monitoring/${id}`, { method: 'DELETE' })
  },
  milestones: {
    getAll: () => request('/api/milestones'),
    save: (body) => request('/api/milestones', { method: 'POST', body }),
    delete: (id) => request(`/api/milestones/${id}`, { method: 'DELETE' })
  },
  drones: {
    getAll: () => request('/api/drones'),
    save: (body) => request('/api/drones', { method: 'POST', body }),
    delete: (id) => request(`/api/drones/${id}`, { method: 'DELETE' })
  },
  weather: {
    getHistory: (projectId) => request(`/api/weather/history/${projectId}`),
    save: (body) => request('/api/weather', { method: 'POST', body })
  },
  reports: {
    getAll: () => request('/api/reports'),
    create: (body) => request('/api/reports', { method: 'POST', body }),
    update: (id, body) => request(`/api/reports/${id}`, { method: 'PUT', body }),
    generate: (body) => request('/api/reports/generate', { method: 'POST', body })
  },
  alerts: {
    getAll: () => request('/api/alerts'),
    save: (body) => request('/api/alerts', { method: 'POST', body }),
    delete: (id) => request(`/api/alerts/${id}`, { method: 'DELETE' })
  }
};
