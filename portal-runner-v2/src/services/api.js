const API_BASE = '/api/v1'

/**
 * Generic fetch wrapper with error handling
 */
const fetchApi = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`
  const token = localStorage.getItem('portal_token')
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  }

  const response = await fetch(url, config)
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

export const api = {
  get: (endpoint) => fetchApi(endpoint),
  post: (endpoint, data) => fetchApi(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint, data) => fetchApi(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (endpoint, data) => fetchApi(endpoint, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (endpoint) => fetchApi(endpoint, { method: 'DELETE' })
}

export default api
