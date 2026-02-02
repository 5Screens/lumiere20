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
  deleteLogo
};
