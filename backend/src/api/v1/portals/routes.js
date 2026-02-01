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

// GET /api/v1/portals/actions - List all portal actions
router.get('/actions', (req, res, next) => {
  logger.info('[ROUTES] GET /api/v1/portals/actions');
  next();
}, portalsController.listActions);

// GET /api/v1/portals/alerts - List all portal alerts
router.get('/alerts', (req, res, next) => {
  logger.info('[ROUTES] GET /api/v1/portals/alerts');
  next();
}, portalsController.listAlerts);

// GET /api/v1/portals/widgets - List all portal widgets
router.get('/widgets', (req, res, next) => {
  logger.info('[ROUTES] GET /api/v1/portals/widgets');
  next();
}, portalsController.listWidgets);

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

// POST /api/v1/portals/:uuid/thumbnail - Upload portal thumbnail
router.post('/:uuid/thumbnail', (req, res, next) => {
  logger.info(`[ROUTES] POST /api/v1/portals/${req.params.uuid}/thumbnail`);
  next();
}, portalImageUpload.single('image'), portalsController.uploadThumbnail);

// DELETE /api/v1/portals/:uuid/logo - Delete portal logo
router.delete('/:uuid/logo', (req, res, next) => {
  logger.info(`[ROUTES] DELETE /api/v1/portals/${req.params.uuid}/logo`);
  next();
}, portalsController.deleteLogo);

// DELETE /api/v1/portals/:uuid/thumbnail - Delete portal thumbnail
router.delete('/:uuid/thumbnail', (req, res, next) => {
  logger.info(`[ROUTES] DELETE /api/v1/portals/${req.params.uuid}/thumbnail`);
  next();
}, portalsController.deleteThumbnail);

module.exports = router;
