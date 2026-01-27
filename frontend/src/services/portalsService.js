import api from './api'

const BASE_URL = '/portals'

/**
 * List all portals
 * @param {Object} params - Query parameters (is_active, q)
 */
export const listPortals = async (params = {}) => {
  const response = await api.get(BASE_URL, { params })
  return response.data
}

/**
 * Get portal by UUID
 * @param {string} uuid - Portal UUID
 */
export const getByUuid = async (uuid) => {
  const response = await api.get(`${BASE_URL}/uuid/${uuid}`)
  return response.data
}

/**
 * Get full portal by UUID (with actions, alerts, widgets)
 * @param {string} uuid - Portal UUID
 */
export const getFullByUuid = async (uuid) => {
  const response = await api.get(`${BASE_URL}/uuid/${uuid}/full`)
  return response.data
}

/**
 * Update a portal
 * @param {string} uuid - Portal UUID
 * @param {Object} data - Portal data to update
 */
export const updatePortal = async (uuid, data) => {
  const response = await api.put(`${BASE_URL}/${uuid}`, data)
  return response.data
}

/**
 * Toggle portal active state
 * @param {string} uuid - Portal UUID
 * @param {boolean} isActive - New active state
 */
export const toggleActive = async (uuid, isActive) => {
  const response = await api.patch(`${BASE_URL}/${uuid}/toggle`, { is_active: isActive })
  return response.data
}

/**
 * List all portal actions
 */
export const listActions = async () => {
  const response = await api.get(`${BASE_URL}/actions`)
  return response.data
}

/**
 * List all portal alerts
 */
export const listAlerts = async () => {
  const response = await api.get(`${BASE_URL}/alerts`)
  return response.data
}

/**
 * List all portal widgets
 */
export const listWidgets = async () => {
  const response = await api.get(`${BASE_URL}/widgets`)
  return response.data
}

export default {
  listPortals,
  getByUuid,
  getFullByUuid,
  updatePortal,
  toggleActive,
  listActions,
  listAlerts,
  listWidgets
}
