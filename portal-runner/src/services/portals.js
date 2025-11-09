import api from './api'

/**
 * Get full portal configuration (v1) with actions, alerts, and widgets
 * @param {string} code - Portal code
 * @returns {Promise<Object>} Complete portal configuration
 */
export const getFullPortal = async (code) => {
  const { data } = await api.get(`/api/v1/portals/${code}`)
  return data
}

/**
 * Execute a widget API call to get dynamic data
 * @param {Object} widget - Widget configuration
 * @returns {Promise<any>} Widget data
 */
export const executeWidgetApi = async (widget) => {
  const { api_method, api_endpoint, api_params } = widget
  
  if (api_method === 'POST') {
    const { data } = await api.post(api_endpoint, api_params)
    return data
  } else {
    const { data } = await api.get(api_endpoint, { params: api_params })
    return data
  }
}
