const express = require('express');
const router = express.Router();
const portalsController = require('./controller');
const logger = require('../../../config/logger');
const { portalImageUpload } = require('../../../middleware/portalImageUpload');

// GET /api/v1/portals - List all portals
router.get('/', (req, res, next) => {
  logger.info('[ROUTES] GET /api/v1/portals');
  next();
}, portalsController.list);

// ============================================
// PORTAL ACTIONS CRUD
// ============================================

// GET /api/v1/portals/actions - List all portal actions
router.get('/actions', (req, res, next) => {
  logger.info('[ROUTES] GET /api/v1/portals/actions');
  next();
}, portalsController.listActions);

// GET /api/v1/portals/actions/:uuid - Get action by UUID
router.get('/actions/:uuid', (req, res, next) => {
  logger.info(`[ROUTES] GET /api/v1/portals/actions/${req.params.uuid}`);
  next();
}, portalsController.getActionByUuid);

// POST /api/v1/portals/actions - Create a new action
router.post('/actions', (req, res, next) => {
  logger.info('[ROUTES] POST /api/v1/portals/actions');
  next();
}, portalsController.createAction);

// PUT /api/v1/portals/actions/:uuid - Update an action
router.put('/actions/:uuid', (req, res, next) => {
  logger.info(`[ROUTES] PUT /api/v1/portals/actions/${req.params.uuid}`);
  next();
}, portalsController.updateAction);

// DELETE /api/v1/portals/actions/:uuid - Delete an action
router.delete('/actions/:uuid', (req, res, next) => {
  logger.info(`[ROUTES] DELETE /api/v1/portals/actions/${req.params.uuid}`);
  next();
}, portalsController.deleteAction);

// ============================================
// PORTAL ALERTS CRUD
// ============================================

// GET /api/v1/portals/alerts - List all portal alerts
router.get('/alerts', (req, res, next) => {
  logger.info('[ROUTES] GET /api/v1/portals/alerts');
  next();
}, portalsController.listAlerts);

// GET /api/v1/portals/alerts/:uuid - Get alert by UUID
router.get('/alerts/:uuid', (req, res, next) => {
  logger.info(`[ROUTES] GET /api/v1/portals/alerts/${req.params.uuid}`);
  next();
}, portalsController.getAlertByUuid);

// POST /api/v1/portals/alerts - Create a new alert
router.post('/alerts', (req, res, next) => {
  logger.info('[ROUTES] POST /api/v1/portals/alerts');
  next();
}, portalsController.createAlert);

// PUT /api/v1/portals/alerts/:uuid - Update an alert
router.put('/alerts/:uuid', (req, res, next) => {
  logger.info(`[ROUTES] PUT /api/v1/portals/alerts/${req.params.uuid}`);
  next();
}, portalsController.updateAlert);

// DELETE /api/v1/portals/alerts/:uuid - Delete an alert
router.delete('/alerts/:uuid', (req, res, next) => {
  logger.info(`[ROUTES] DELETE /api/v1/portals/alerts/${req.params.uuid}`);
  next();
}, portalsController.deleteAlert);

// ============================================
// PORTAL WIDGETS CRUD
// ============================================

// GET /api/v1/portals/widgets - List all portal widgets
router.get('/widgets', (req, res, next) => {
  logger.info('[ROUTES] GET /api/v1/portals/widgets');
  next();
}, portalsController.listWidgets);

// GET /api/v1/portals/widgets/:uuid - Get widget by UUID
router.get('/widgets/:uuid', (req, res, next) => {
  logger.info(`[ROUTES] GET /api/v1/portals/widgets/${req.params.uuid}`);
  next();
}, portalsController.getWidgetByUuid);

// POST /api/v1/portals/widgets - Create a new widget
router.post('/widgets', (req, res, next) => {
  logger.info('[ROUTES] POST /api/v1/portals/widgets');
  next();
}, portalsController.createWidget);

// PUT /api/v1/portals/widgets/:uuid - Update a widget
router.put('/widgets/:uuid', (req, res, next) => {
  logger.info(`[ROUTES] PUT /api/v1/portals/widgets/${req.params.uuid}`);
  next();
}, portalsController.updateWidget);

// DELETE /api/v1/portals/widgets/:uuid - Delete a widget
router.delete('/widgets/:uuid', (req, res, next) => {
  logger.info(`[ROUTES] DELETE /api/v1/portals/widgets/${req.params.uuid}`);
  next();
}, portalsController.deleteWidget);

// GET /api/v1/portals/uuid/:uuid - Get portal by UUID
router.get('/uuid/:uuid', (req, res, next) => {
  logger.info(`[ROUTES] GET /api/v1/portals/uuid/${req.params.uuid}`);
  next();
}, portalsController.getByUuid);

// GET /api/v1/portals/uuid/:uuid/full - Get full portal by UUID
router.get('/uuid/:uuid/full', (req, res, next) => {
  logger.info(`[ROUTES] GET /api/v1/portals/uuid/${req.params.uuid}/full`);
  next();
}, portalsController.getFullByUuid);

// PUT /api/v1/portals/:uuid - Update portal
router.put('/:uuid', (req, res, next) => {
  logger.info(`[ROUTES] PUT /api/v1/portals/${req.params.uuid}`);
  next();
}, portalsController.update);

// PATCH /api/v1/portals/:uuid/toggle - Toggle portal active state
router.patch('/:uuid/toggle', (req, res, next) => {
  logger.info(`[ROUTES] PATCH /api/v1/portals/${req.params.uuid}/toggle`);
  next();
}, portalsController.toggleActive);

// GET /api/v1/portals/:code/full - Get full portal with actions, alerts, widgets
router.get('/:code/full', (req, res, next) => {
  logger.info(`[ROUTES] GET /api/v1/portals/${req.params.code}/full`);
  next();
}, portalsController.getFull);

// GET /api/v1/portals/:code - Get portal by code
router.get('/:code', (req, res, next) => {
  logger.info(`[ROUTES] GET /api/v1/portals/${req.params.code}`);
  next();
}, portalsController.getByCode);

// POST /api/v1/portals/:uuid/logo - Upload portal logo
router.post('/:uuid/logo', (req, res, next) => {
  logger.info(`[ROUTES] POST /api/v1/portals/${req.params.uuid}/logo`);
  next();
}, portalImageUpload.single('image'), portalsController.uploadLogo);

// DELETE /api/v1/portals/:uuid/logo - Delete portal logo
router.delete('/:uuid/logo', (req, res, next) => {
  logger.info(`[ROUTES] DELETE /api/v1/portals/${req.params.uuid}/logo`);
  next();
}, portalsController.deleteLogo);

module.exports = router;
