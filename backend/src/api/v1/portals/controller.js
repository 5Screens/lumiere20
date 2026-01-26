const portalsService = require('./service');
const logger = require('../../../config/logger');

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

module.exports = {
  getFull,
  getByCode,
  list
};
