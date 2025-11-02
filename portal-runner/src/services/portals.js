import api from './api'

/**
 * Resolve portal configuration by code or host
 * @param {Object} params - { code?: string, host?: string }
 * @returns {Promise<Object>} Portal configuration with actions
 */
export const resolvePortal = async ({ code, host }) => {
  const params = {}
  if (code) params.code = code
  if (host) params.host = host
  
  const { data } = await api.get('/api/v1/portals/resolve', { params })
  return data // { uuid, code, name, is_active, base_url, actions:[...] }
}
