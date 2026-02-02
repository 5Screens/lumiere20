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

// ============================================
// PORTAL ACTIONS CRUD
// ============================================

/**
 * List all portal actions
 */
export const listActions = async () => {
  const response = await api.get(`${BASE_URL}/actions`)
  return response.data
}

/**
 * Get action by UUID
 * @param {string} uuid - Action UUID
 */
export const getActionByUuid = async (uuid) => {
  const response = await api.get(`${BASE_URL}/actions/${uuid}`)
  return response.data
}

/**
 * Create a new portal action
 * @param {Object} data - Action data
 */
export const createAction = async (data) => {
  const response = await api.post(`${BASE_URL}/actions`, data)
  return response.data
}

/**
 * Update a portal action
 * @param {string} uuid - Action UUID
 * @param {Object} data - Action data to update
 */
export const updateAction = async (uuid, data) => {
  const response = await api.put(`${BASE_URL}/actions/${uuid}`, data)
  return response.data
}

/**
 * Delete a portal action
 * @param {string} uuid - Action UUID
 */
export const deleteAction = async (uuid) => {
  const response = await api.delete(`${BASE_URL}/actions/${uuid}`)
  return response.data
}

// ============================================
// PORTAL ALERTS CRUD
// ============================================

/**
 * List all portal alerts
 */
export const listAlerts = async () => {
  const response = await api.get(`${BASE_URL}/alerts`)
  return response.data
}

/**
 * Get alert by UUID
 * @param {string} uuid - Alert UUID
 */
export const getAlertByUuid = async (uuid) => {
  const response = await api.get(`${BASE_URL}/alerts/${uuid}`)
  return response.data
}

/**
 * Create a new portal alert
 * @param {Object} data - Alert data
 */
export const createAlert = async (data) => {
  const response = await api.post(`${BASE_URL}/alerts`, data)
  return response.data
}

/**
 * Update a portal alert
 * @param {string} uuid - Alert UUID
 * @param {Object} data - Alert data to update
 */
export const updateAlert = async (uuid, data) => {
  const response = await api.put(`${BASE_URL}/alerts/${uuid}`, data)
  return response.data
}

/**
 * Delete a portal alert
 * @param {string} uuid - Alert UUID
 */
export const deleteAlert = async (uuid) => {
  const response = await api.delete(`${BASE_URL}/alerts/${uuid}`)
  return response.data
}

// ============================================
// PORTAL WIDGETS CRUD
// ============================================

/**
 * List all portal widgets
 */
export const listWidgets = async () => {
  const response = await api.get(`${BASE_URL}/widgets`)
  return response.data
}

/**
 * Get widget by UUID
 * @param {string} uuid - Widget UUID
 */
export const getWidgetByUuid = async (uuid) => {
  const response = await api.get(`${BASE_URL}/widgets/${uuid}`)
  return response.data
}

/**
 * Create a new portal widget
 * @param {Object} data - Widget data
 */
export const createWidget = async (data) => {
  const response = await api.post(`${BASE_URL}/widgets`, data)
  return response.data
}

/**
 * Update a portal widget
 * @param {string} uuid - Widget UUID
 * @param {Object} data - Widget data to update
 */
export const updateWidget = async (uuid, data) => {
  const response = await api.put(`${BASE_URL}/widgets/${uuid}`, data)
  return response.data
}

/**
 * Delete a portal widget
 * @param {string} uuid - Widget UUID
 */
export const deleteWidget = async (uuid) => {
  const response = await api.delete(`${BASE_URL}/widgets/${uuid}`)
  return response.data
}

/**
 * Upload portal logo
 * @param {string} uuid - Portal UUID
 * @param {File} file - Image file
 */
export const uploadLogo = async (uuid, file) => {
  const formData = new FormData()
  formData.append('image', file)
  const response = await api.post(`${BASE_URL}/${uuid}/logo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

/**
 * Delete portal logo
 * @param {string} uuid - Portal UUID
 */
export const deleteLogo = async (uuid) => {
  const response = await api.delete(`${BASE_URL}/${uuid}/logo`)
  return response.data
}

export default {
  listPortals,
  getByUuid,
  getFullByUuid,
  updatePortal,
  toggleActive,
  // Actions CRUD
  listActions,
  getActionByUuid,
  createAction,
  updateAction,
  deleteAction,
  // Alerts CRUD
  listAlerts,
  getAlertByUuid,
  createAlert,
  updateAlert,
  deleteAlert,
  // Widgets CRUD
  listWidgets,
  getWidgetByUuid,
  createWidget,
  updateWidget,
  deleteWidget,
  // Images
  uploadLogo,
  deleteLogo
}
