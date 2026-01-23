import { handleSessionExpired, isSessionExpirationInProgress } from './sessionManager'

const API_BASE = '/api/v1'

/**
 * Generic fetch wrapper with error handling
 * Includes automatic session expiration handling for 401 errors
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
    // Handle 401 Unauthorized - session expired
    if (response.status === 401 && !isSessionExpirationInProgress()) {
      // Don't handle 401 for login/logout endpoints
      if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/logout')) {
        handleSessionExpired()
        throw new Error('Invalid or expired token')
      }
    }
    
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
