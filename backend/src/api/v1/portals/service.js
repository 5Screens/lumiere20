const prisma = require('../../../config/prisma');
const logger = require('../../../config/logger');

/**
 * Get portal by UUID
 */
const getByUuid = async (uuid) => {
  logger.info(`[PORTALS] Getting portal by uuid: ${uuid}`);

  return prisma.portals.findUnique({
    where: { uuid }
  });
};

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

/**
 * Update a portal by UUID
 */
const update = async (uuid, data) => {
  logger.info(`[PORTALS] Updating portal: ${uuid}`);

  const { selected_actions, selected_alerts, selected_widgets, ...portalData } = data;

  // Update portal basic data
  const updatedPortal = await prisma.portals.update({
    where: { uuid },
    data: portalData
  });

  // Update actions if provided
  if (selected_actions !== undefined) {
    // Delete existing links
    await prisma.portal_portal_actions.deleteMany({
      where: { rel_portal: uuid }
    });
    // Create new links
    if (selected_actions && selected_actions.length > 0) {
      await prisma.portal_portal_actions.createMany({
        data: selected_actions.map((actionUuid, index) => ({
          rel_portal: uuid,
          rel_portal_action: actionUuid,
          display_order: index + 1
        }))
      });
    }
  }

  // Update alerts if provided
  if (selected_alerts !== undefined) {
    await prisma.portal_portal_alerts.deleteMany({
      where: { rel_portal: uuid }
    });
    if (selected_alerts && selected_alerts.length > 0) {
      await prisma.portal_portal_alerts.createMany({
        data: selected_alerts.map((alertUuid, index) => ({
          rel_portal: uuid,
          rel_portal_alert: alertUuid,
          display_order: index + 1
        }))
      });
    }
  }

  // Update widgets if provided
  if (selected_widgets !== undefined) {
    await prisma.portal_portal_widgets.deleteMany({
      where: { rel_portal: uuid }
    });
    if (selected_widgets && selected_widgets.length > 0) {
      await prisma.portal_portal_widgets.createMany({
        data: selected_widgets.map((widgetUuid, index) => ({
          rel_portal: uuid,
          rel_portal_widget: widgetUuid,
          display_order: index + 1
        }))
      });
    }
  }

  return updatedPortal;
};

/**
 * Toggle portal active state
 */
const toggleActive = async (uuid, isActive) => {
  logger.info(`[PORTALS] Toggling portal ${uuid} to ${isActive}`);

  return prisma.portals.update({
    where: { uuid },
    data: { is_active: isActive }
  });
};

/**
 * List all portal actions
 */
const listActions = async () => {
  logger.info('[PORTALS] Listing all portal actions');

  return prisma.portal_actions.findMany({
    orderBy: { label: 'asc' }
  });
};

/**
 * List all portal alerts
 */
const listAlerts = async () => {
  logger.info('[PORTALS] Listing all portal alerts');

  return prisma.portal_alerts.findMany({
    orderBy: { message: 'asc' }
  });
};

/**
 * List all portal widgets
 */
const listWidgets = async () => {
  logger.info('[PORTALS] Listing all portal widgets');

  return prisma.portal_widgets.findMany({
    orderBy: { title: 'asc' }
  });
};

/**
 * Get full portal by UUID (with actions, alerts, widgets)
 */
const getFullByUuid = async (uuid) => {
  logger.info(`[PORTALS] Getting full portal by uuid: ${uuid}`);

  const portal = await prisma.portals.findUnique({
    where: { uuid },
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

  // Transform to flat structure
  return {
    ...portal,
    quick_actions: portal.portal_actions.map(pa => pa.action),
    alerts: portal.portal_alerts.map(pa => pa.alert),
    widgets: portal.portal_widgets.map(pw => pw.widget),
    portal_actions: undefined,
    portal_alerts: undefined,
    portal_widgets: undefined
  };
};

// ============================================
// PORTAL ACTIONS CRUD
// ============================================

/**
 * Get action by UUID
 */
const getActionByUuid = async (uuid) => {
  logger.info(`[PORTALS] Getting action by uuid: ${uuid}`);
  return prisma.portal_actions.findUnique({
    where: { uuid }
  });
};

/**
 * Create a new portal action
 */
const createAction = async (data) => {
  logger.info('[PORTALS] Creating new portal action');
  return prisma.portal_actions.create({
    data: {
      code: data.code,
      label: data.label,
      description: data.description || null,
      icon: data.icon || null,
      action_type: data.action_type || null,
      action_url: data.action_url || null,
      is_active: data.is_active !== undefined ? data.is_active : true
    }
  });
};

/**
 * Update a portal action
 */
const updateAction = async (uuid, data) => {
  logger.info(`[PORTALS] Updating action: ${uuid}`);
  return prisma.portal_actions.update({
    where: { uuid },
    data: {
      code: data.code,
      label: data.label,
      description: data.description,
      icon: data.icon,
      action_type: data.action_type,
      action_url: data.action_url,
      is_active: data.is_active
    }
  });
};

/**
 * Delete a portal action
 */
const deleteAction = async (uuid) => {
  logger.info(`[PORTALS] Deleting action: ${uuid}`);
  return prisma.portal_actions.delete({
    where: { uuid }
  });
};

// ============================================
// PORTAL ALERTS CRUD
// ============================================

/**
 * Get alert by UUID
 */
const getAlertByUuid = async (uuid) => {
  logger.info(`[PORTALS] Getting alert by uuid: ${uuid}`);
  return prisma.portal_alerts.findUnique({
    where: { uuid }
  });
};

/**
 * Create a new portal alert
 */
const createAlert = async (data) => {
  logger.info('[PORTALS] Creating new portal alert');
  return prisma.portal_alerts.create({
    data: {
      code: data.code,
      message: data.message,
      severity: data.severity || null,
      icon: data.icon || null,
      is_active: data.is_active !== undefined ? data.is_active : true,
      start_date: data.start_date || null,
      end_date: data.end_date || null
    }
  });
};

/**
 * Update a portal alert
 */
const updateAlert = async (uuid, data) => {
  logger.info(`[PORTALS] Updating alert: ${uuid}`);
  return prisma.portal_alerts.update({
    where: { uuid },
    data: {
      code: data.code,
      message: data.message,
      severity: data.severity,
      icon: data.icon,
      is_active: data.is_active,
      start_date: data.start_date,
      end_date: data.end_date
    }
  });
};

/**
 * Delete a portal alert
 */
const deleteAlert = async (uuid) => {
  logger.info(`[PORTALS] Deleting alert: ${uuid}`);
  return prisma.portal_alerts.delete({
    where: { uuid }
  });
};

// ============================================
// PORTAL WIDGETS CRUD
// ============================================

/**
 * Get widget by UUID
 */
const getWidgetByUuid = async (uuid) => {
  logger.info(`[PORTALS] Getting widget by uuid: ${uuid}`);
  return prisma.portal_widgets.findUnique({
    where: { uuid }
  });
};

/**
 * Create a new portal widget
 */
const createWidget = async (data) => {
  logger.info('[PORTALS] Creating new portal widget');
  return prisma.portal_widgets.create({
    data: {
      code: data.code,
      title: data.title,
      description: data.description || null,
      icon: data.icon || null,
      widget_type: data.widget_type || null,
      config: data.config || null,
      is_active: data.is_active !== undefined ? data.is_active : true
    }
  });
};

/**
 * Update a portal widget
 */
const updateWidget = async (uuid, data) => {
  logger.info(`[PORTALS] Updating widget: ${uuid}`);
  return prisma.portal_widgets.update({
    where: { uuid },
    data: {
      code: data.code,
      title: data.title,
      description: data.description,
      icon: data.icon,
      widget_type: data.widget_type,
      config: data.config,
      is_active: data.is_active
    }
  });
};

/**
 * Delete a portal widget
 */
const deleteWidget = async (uuid) => {
  logger.info(`[PORTALS] Deleting widget: ${uuid}`);
  return prisma.portal_widgets.delete({
    where: { uuid }
  });
};

module.exports = {
  getFullByCode,
  getByCode,
  getByUuid,
  getFullByUuid,
  list,
  update,
  toggleActive,
  listActions,
  listAlerts,
  listWidgets,
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
