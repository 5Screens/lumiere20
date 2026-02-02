const portalsService = require('./service');
const logger = require('../../../config/logger');
const { resizeImage, deleteOldImage, getImageUrl } = require('../../../middleware/portalImageUpload');

/**
 * Get portal by UUID
 * GET /api/v1/portals/uuid/:uuid
 */
const getByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    logger.info(`[PORTALS] GET /uuid/${uuid}`);

    const portal = await portalsService.getByUuid(uuid);

    if (!portal) {
      return res.status(404).json({ message: 'Portal not found' });
    }

    res.json(portal);
  } catch (error) {
    logger.error(`[PORTALS] Error getting portal by uuid: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get full portal by UUID
 * GET /api/v1/portals/uuid/:uuid/full
 */
const getFullByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    logger.info(`[PORTALS] GET /uuid/${uuid}/full`);

    const portal = await portalsService.getFullByUuid(uuid);

    if (!portal) {
      return res.status(404).json({ message: 'Portal not found' });
    }

    res.json(portal);
  } catch (error) {
    logger.error(`[PORTALS] Error getting full portal by uuid: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get full portal configuration by code
 * GET /api/v1/portals/:code/full
 */
const getFull = async (req, res) => {
  try {
    const { code } = req.params;
    logger.info(`[PORTALS] GET /${code}/full`);

    const portal = await portalsService.getFullByCode(code);

    if (!portal) {
      return res.status(404).json({ message: 'Portal not found' });
    }

    res.json(portal);
  } catch (error) {
    logger.error(`[PORTALS] Error getting full portal: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get portal by code
 * GET /api/v1/portals/:code
 */
const getByCode = async (req, res) => {
  try {
    const { code } = req.params;
    logger.info(`[PORTALS] GET /${code}`);

    const portal = await portalsService.getByCode(code);

    if (!portal) {
      return res.status(404).json({ message: 'Portal not found' });
    }

    res.json(portal);
  } catch (error) {
    logger.error(`[PORTALS] Error getting portal: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * List all portals
 * GET /api/v1/portals
 */
const list = async (req, res) => {
  try {
    logger.info('[PORTALS] GET /');

    const filters = {};
    if (req.query.is_active !== undefined) {
      filters.is_active = req.query.is_active === 'true';
    }

    const portals = await portalsService.list(filters);
    res.json(portals);
  } catch (error) {
    logger.error(`[PORTALS] Error listing portals: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update a portal
 * PUT /api/v1/portals/:uuid
 */
const update = async (req, res) => {
  try {
    const { uuid } = req.params;
    logger.info(`[PORTALS] PUT /${uuid}`);

    const portal = await portalsService.update(uuid, req.body);
    res.json(portal);
  } catch (error) {
    logger.error(`[PORTALS] Error updating portal: ${error.message}`);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Portal not found' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Toggle portal active state
 * PATCH /api/v1/portals/:uuid/toggle
 */
const toggleActive = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { is_active } = req.body;
    logger.info(`[PORTALS] PATCH /${uuid}/toggle to ${is_active}`);

    const portal = await portalsService.toggleActive(uuid, is_active);
    res.json(portal);
  } catch (error) {
    logger.error(`[PORTALS] Error toggling portal: ${error.message}`);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Portal not found' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * List all portal actions
 * GET /api/v1/portals/actions
 */
const listActions = async (req, res) => {
  try {
    logger.info('[PORTALS] GET /actions');
    const actions = await portalsService.listActions();
    res.json(actions);
  } catch (error) {
    logger.error(`[PORTALS] Error listing actions: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * List all portal alerts
 * GET /api/v1/portals/alerts
 */
const listAlerts = async (req, res) => {
  try {
    logger.info('[PORTALS] GET /alerts');
    const alerts = await portalsService.listAlerts();
    res.json(alerts);
  } catch (error) {
    logger.error(`[PORTALS] Error listing alerts: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * List all portal widgets
 * GET /api/v1/portals/widgets
 */
const listWidgets = async (req, res) => {
  try {
    logger.info('[PORTALS] GET /widgets');
    const widgets = await portalsService.listWidgets();
    res.json(widgets);
  } catch (error) {
    logger.error(`[PORTALS] Error listing widgets: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Upload portal logo
 * POST /api/v1/portals/:uuid/logo
 */
const uploadLogo = async (req, res) => {
  try {
    const { uuid } = req.params;
    logger.info(`[PORTALS] POST /${uuid}/logo`);

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Get current portal to delete old image
    const currentPortal = await portalsService.getByUuid(uuid);
    if (!currentPortal) {
      return res.status(404).json({ message: 'Portal not found' });
    }

    // Delete old logo if exists
    deleteOldImage(currentPortal.logo_url);

    // Resize image
    await resizeImage(req.file.path, 'logo');

    // Get public URL
    const logoUrl = getImageUrl(req.file.filename);

    // Update portal with new logo URL
    await portalsService.update(uuid, { logo_url: logoUrl });

    logger.info(`[PORTALS] Logo uploaded for portal ${uuid}: ${logoUrl}`);
    res.json({ logo_url: logoUrl });
  } catch (error) {
    logger.error(`[PORTALS] Error uploading logo: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete portal logo
 * DELETE /api/v1/portals/:uuid/logo
 */
const deleteLogo = async (req, res) => {
  try {
    const { uuid } = req.params;
    logger.info(`[PORTALS] DELETE /${uuid}/logo`);

    const currentPortal = await portalsService.getByUuid(uuid);
    if (!currentPortal) {
      return res.status(404).json({ message: 'Portal not found' });
    }

    // Delete old logo if exists
    deleteOldImage(currentPortal.logo_url);

    // Update portal to remove logo URL
    await portalsService.update(uuid, { logo_url: null });

    logger.info(`[PORTALS] Logo deleted for portal ${uuid}`);
    res.json({ message: 'Logo deleted' });
  } catch (error) {
    logger.error(`[PORTALS] Error deleting logo: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ============================================
// PORTAL ACTIONS CRUD
// ============================================

/**
 * Get action by UUID
 * GET /api/v1/portals/actions/:uuid
 */
const getActionByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    logger.info(`[PORTALS] GET /actions/${uuid}`);

    const action = await portalsService.getActionByUuid(uuid);

    if (!action) {
      return res.status(404).json({ message: 'Action not found' });
    }

    res.json(action);
  } catch (error) {
    logger.error(`[PORTALS] Error getting action: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new portal action
 * POST /api/v1/portals/actions
 */
const createAction = async (req, res) => {
  try {
    logger.info('[PORTALS] POST /actions');

    const action = await portalsService.createAction(req.body);
    res.status(201).json(action);
  } catch (error) {
    logger.error(`[PORTALS] Error creating action: ${error.message}`);
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Action code already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update a portal action
 * PUT /api/v1/portals/actions/:uuid
 */
const updateAction = async (req, res) => {
  try {
    const { uuid } = req.params;
    logger.info(`[PORTALS] PUT /actions/${uuid}`);

    const action = await portalsService.updateAction(uuid, req.body);
    res.json(action);
  } catch (error) {
    logger.error(`[PORTALS] Error updating action: ${error.message}`);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Action not found' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Action code already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete a portal action
 * DELETE /api/v1/portals/actions/:uuid
 */
const deleteAction = async (req, res) => {
  try {
    const { uuid } = req.params;
    logger.info(`[PORTALS] DELETE /actions/${uuid}`);

    await portalsService.deleteAction(uuid);
    res.status(204).send();
  } catch (error) {
    logger.error(`[PORTALS] Error deleting action: ${error.message}`);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Action not found' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ============================================
// PORTAL ALERTS CRUD
// ============================================

/**
 * Get alert by UUID
 * GET /api/v1/portals/alerts/:uuid
 */
const getAlertByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    logger.info(`[PORTALS] GET /alerts/${uuid}`);

    const alert = await portalsService.getAlertByUuid(uuid);

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    logger.error(`[PORTALS] Error getting alert: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new portal alert
 * POST /api/v1/portals/alerts
 */
const createAlert = async (req, res) => {
  try {
    logger.info('[PORTALS] POST /alerts');

    const alert = await portalsService.createAlert(req.body);
    res.status(201).json(alert);
  } catch (error) {
    logger.error(`[PORTALS] Error creating alert: ${error.message}`);
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Alert code already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update a portal alert
 * PUT /api/v1/portals/alerts/:uuid
 */
const updateAlert = async (req, res) => {
  try {
    const { uuid } = req.params;
    logger.info(`[PORTALS] PUT /alerts/${uuid}`);

    const alert = await portalsService.updateAlert(uuid, req.body);
    res.json(alert);
  } catch (error) {
    logger.error(`[PORTALS] Error updating alert: ${error.message}`);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Alert not found' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Alert code already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete a portal alert
 * DELETE /api/v1/portals/alerts/:uuid
 */
const deleteAlert = async (req, res) => {
  try {
    const { uuid } = req.params;
    logger.info(`[PORTALS] DELETE /alerts/${uuid}`);

    await portalsService.deleteAlert(uuid);
    res.status(204).send();
  } catch (error) {
    logger.error(`[PORTALS] Error deleting alert: ${error.message}`);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Alert not found' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ============================================
// PORTAL WIDGETS CRUD
// ============================================

/**
 * Get widget by UUID
 * GET /api/v1/portals/widgets/:uuid
 */
const getWidgetByUuid = async (req, res) => {
  try {
    const { uuid } = req.params;
    logger.info(`[PORTALS] GET /widgets/${uuid}`);

    const widget = await portalsService.getWidgetByUuid(uuid);

    if (!widget) {
      return res.status(404).json({ message: 'Widget not found' });
    }

    res.json(widget);
  } catch (error) {
    logger.error(`[PORTALS] Error getting widget: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new portal widget
 * POST /api/v1/portals/widgets
 */
const createWidget = async (req, res) => {
  try {
    logger.info('[PORTALS] POST /widgets');

    const widget = await portalsService.createWidget(req.body);
    res.status(201).json(widget);
  } catch (error) {
    logger.error(`[PORTALS] Error creating widget: ${error.message}`);
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Widget code already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update a portal widget
 * PUT /api/v1/portals/widgets/:uuid
 */
const updateWidget = async (req, res) => {
  try {
    const { uuid } = req.params;
    logger.info(`[PORTALS] PUT /widgets/${uuid}`);

    const widget = await portalsService.updateWidget(uuid, req.body);
    res.json(widget);
  } catch (error) {
    logger.error(`[PORTALS] Error updating widget: ${error.message}`);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Widget not found' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Widget code already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete a portal widget
 * DELETE /api/v1/portals/widgets/:uuid
 */
const deleteWidget = async (req, res) => {
  try {
    const { uuid } = req.params;
    logger.info(`[PORTALS] DELETE /widgets/${uuid}`);

    await portalsService.deleteWidget(uuid);
    res.status(204).send();
  } catch (error) {
    logger.error(`[PORTALS] Error deleting widget: ${error.message}`);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Widget not found' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getFull,
  getByCode,
  getByUuid,
  getFullByUuid,
  list,
  update,
  toggleActive,
  listActions,
  listAlerts,
  listWidgets,
  uploadLogo,
  deleteLogo,
  // Actions CRUD
  getActionByUuid,
  createAction,
  updateAction,
  deleteAction,
  // Alerts CRUD
  getAlertByUuid,
  createAlert,
  updateAlert,
  deleteAlert,
  // Widgets CRUD
  getWidgetByUuid,
  createWidget,
  updateWidget,
  deleteWidget
};
