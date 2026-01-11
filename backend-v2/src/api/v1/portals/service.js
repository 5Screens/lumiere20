const prisma = require('../../../config/prisma');
const logger = require('../../../config/logger');

/**
 * Get full portal configuration by code
 * Includes actions, alerts, and widgets
 */
const getFullByCode = async (code) => {
  logger.info(`[PORTALS] Getting full portal by code: ${code}`);

  const portal = await prisma.portals.findUnique({
    where: { code },
    include: {
      portal_actions: {
        orderBy: { display_order: 'asc' },
        include: {
          action: true
        }
      },
      portal_alerts: {
        orderBy: { display_order: 'asc' },
        include: {
          alert: true
        }
      },
      portal_widgets: {
        orderBy: { display_order: 'asc' },
        include: {
          widget: true
        }
      }
    }
  });

  if (!portal) {
    return null;
  }

  // Transform to flat structure expected by frontend
  return {
    ...portal,
    quick_actions: portal.portal_actions
      .map(pa => pa.action)
      .filter(a => a.is_active),
    alerts: portal.portal_alerts
      .map(pa => pa.alert)
      .filter(a => a.is_active),
    widgets: portal.portal_widgets
      .map(pw => pw.widget)
      .filter(w => w.is_active),
    // Remove junction table data
    portal_actions: undefined,
    portal_alerts: undefined,
    portal_widgets: undefined
  };
};

/**
 * Get portal by code (basic info)
 */
const getByCode = async (code) => {
  logger.info(`[PORTALS] Getting portal by code: ${code}`);

  return prisma.portals.findUnique({
    where: { code }
  });
};

/**
 * List all portals
 */
const list = async (filters = {}) => {
  logger.info('[PORTALS] Listing portals');

  const where = {};
  if (filters.is_active !== undefined) {
    where.is_active = filters.is_active;
  }

  return prisma.portals.findMany({
    where,
    orderBy: { created_at: 'desc' }
  });
};

module.exports = {
  getFullByCode,
  getByCode,
  list
};
