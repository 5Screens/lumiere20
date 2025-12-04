import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 seconds timeout
})

// Connection store will be set after Pinia is initialized
let connectionStore = null

export function setConnectionStore(store) {
  connectionStore = store
}

// Helper to detect network/server errors
function isNetworkError(error) {
  // No response at all (network error, ECONNREFUSED, ECONNRESET)
  if (!error.response) {
    return true
  }
  // Server errors (5xx) that indicate backend issues
  if (error.response.status >= 500 && error.response.status < 600) {
    return true
  }
  return false
}

// Request interceptor for auth token and locale
api.interceptors.request.use(
  (config) => {
    // Add auth token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Add locale for dynamic translations
    const locale = localStorage.getItem('locale') || 'fr'
    config.headers['Accept-Language'] = locale
    
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Connection restored if we get a successful response
    if (connectionStore && !connectionStore.isConnected) {
      connectionStore.setConnected()
    }
    return response
  },
  (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      // Redirect to login if needed
    }
    
    // Handle network/server connection errors
    if (isNetworkError(error) && connectionStore) {
      const errorInfo = {
        code: error.code || (error.response ? `HTTP_${error.response.status}` : 'NETWORK_ERROR'),
        message: error.message || 'Connection to server failed'
      }
      connectionStore.setDisconnected(errorInfo)
      connectionStore.startRetrying()
    }
    
    return Promise.reject(error)
  }
)

export default api
