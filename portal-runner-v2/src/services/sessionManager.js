/**
 * Session Manager - Handles session expiration and redirects
 * This module provides a centralized way to handle 401 errors and session expiration
 */

let isHandlingExpiration = false
let router = null
let i18n = null

/**
 * Initialize the session manager with router and i18n instances
 * @param {Object} routerInstance - Vue Router instance
 * @param {Object} i18nInstance - Vue i18n instance
 */
export const initSessionManager = (routerInstance, i18nInstance) => {
  router = routerInstance
  i18n = i18nInstance
}

/**
 * Handle session expiration - show message and redirect to login
 * Uses a flag to prevent multiple simultaneous redirects
 */
export const handleSessionExpired = async () => {
  // Prevent multiple simultaneous handling
  if (isHandlingExpiration) return
  isHandlingExpiration = true

  try {
    // Clear token from localStorage
    localStorage.removeItem('portal_token')

    // Get current portal code from URL if available
    const currentPath = window.location.pathname
    const portalMatch = currentPath.match(/^\/([^/]+)/)
    const portalCode = portalMatch ? portalMatch[1] : null

    // Redirect to login with session expired flag
    if (router) {
      await router.push({
        name: 'login',
        query: {
          sessionExpired: 'true',
          portal: portalCode !== 'login' ? portalCode : null
        }
      })
    } else {
      // Fallback if router not initialized
      const params = new URLSearchParams()
      params.set('sessionExpired', 'true')
      if (portalCode && portalCode !== 'login') {
        params.set('portal', portalCode)
      }
      window.location.href = `/login?${params.toString()}`
    }
  } finally {
    // Reset flag after a short delay to allow the redirect to complete
    setTimeout(() => {
      isHandlingExpiration = false
    }, 1000)
  }
}

/**
 * Check if we're currently handling an expiration
 * @returns {boolean}
 */
export const isSessionExpirationInProgress = () => isHandlingExpiration

export default {
  initSessionManager,
  handleSessionExpired,
  isSessionExpirationInProgress
}
