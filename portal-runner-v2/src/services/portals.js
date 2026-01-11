import api from './api'

/**
 * Get full portal data by code
 */
export const getFullPortal = async (portalCode) => {
  return api.get(`/portals/${portalCode}/full`)
}

/**
 * Get portal by code (basic info)
 */
export const getPortal = async (portalCode) => {
  return api.get(`/portals/${portalCode}`)
}

export default {
  getFullPortal,
  getPortal
}
