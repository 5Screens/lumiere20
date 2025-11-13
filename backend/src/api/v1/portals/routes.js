const express = require('express');
const router = express.Router();
const portalsController = require('./controller');
const validate = require('../../../middleware/validate');
const portalsValidation = require('./validation');
const logger = require('../../../config/logger');

// Route to get all portal models
// GET /api/v1/portals/models
router.get(
    '/models',
    (req, res, next) => {
        logger.info('[ROUTES] GET /api/v1/portals/models - Route handler started');
        next();
    },
    portalsController.listModels
);

// Route to get all portal actions (not linked to a specific portal)
// GET /api/v1/portals/actions
router.get(
    '/actions',
    (req, res, next) => {
        logger.info('[ROUTES] GET /api/v1/portals/actions - Route handler started');
        next();
    },
    portalsController.listAllActions
);

// Route to get all portal alerts (not linked to a specific portal)
// GET /api/v1/portals/alerts
router.get(
    '/alerts',
    (req, res, next) => {
        logger.info('[ROUTES] GET /api/v1/portals/alerts - Route handler started');
        next();
    },
    portalsController.listAllAlerts
);

// Route to get all portal widgets (not linked to a specific portal)
// GET /api/v1/portals/widgets
router.get(
    '/widgets',
    (req, res, next) => {
        logger.info('[ROUTES] GET /api/v1/portals/widgets - Route handler started');
        next();
    },
    portalsController.listAllWidgets
);

// Route to check code uniqueness
// GET /api/v1/portals/check-code?code=xxx&exclude_uuid=yyy
router.get(
    '/check-code',
    (req, res, next) => {
        logger.info(`[ROUTES] GET /api/v1/portals/check-code - Route handler started with code=${req.query.code}`);
        next();
    },
    validate(portalsValidation.checkCodeSchema),
    portalsController.checkCodeUniqueness
);

// Route to list all portals with optional filters
// GET /api/v1/portals
// GET /api/v1/portals?is_active=true&q=hello
router.get(
    '/',
    (req, res, next) => {
        logger.info(`[ROUTES] GET /api/v1/portals - Route handler started with is_active=${req.query.is_active}, q=${req.query.q}`);
        next();
    },
    validate(portalsValidation.listQuerySchema),
    portalsController.list
);

// Route to get a portal by UUID
// GET /api/v1/portals/uuid/:uuid
router.get(
    '/uuid/:uuid',
    (req, res, next) => {
        logger.info(`[ROUTES] GET /api/v1/portals/uuid/:uuid - Route handler started with uuid=${req.params.uuid}`);
        next();
    },
    validate(portalsValidation.getByUuidSchema),
    portalsController.getByUuid
);

// Route to get full portal configuration (v1) with actions, alerts, and widgets
// GET /api/v1/portals/:code
router.get(
    '/:code',
    (req, res, next) => {
        logger.info(`[ROUTES] GET /api/v1/portals/:code - Route handler started with code=${req.params.code}`);
        next();
    },
    portalsController.getFull
);

// Route to create a new portal
// POST /api/v1/portals
router.post(
    '/',
    (req, res, next) => {
        logger.info('[ROUTES] POST /api/v1/portals - Route handler started');
        next();
    },
    validate(portalsValidation.createSchema),
    portalsController.create
);

// Route to update a portal
// PUT /api/v1/portals/:uuid
router.put(
    '/:uuid',
    (req, res, next) => {
        logger.info(`[ROUTES] PUT /api/v1/portals/:uuid - Route handler started with uuid=${req.params.uuid}`);
        next();
    },
    validate(portalsValidation.updateSchema),
    portalsController.update
);

// Route to activate or deactivate a portal
// PATCH /api/v1/portals/:uuid/activate
router.patch(
    '/:uuid/activate',
    (req, res, next) => {
        logger.info(`[ROUTES] PATCH /api/v1/portals/:uuid/activate - Route handler started with uuid=${req.params.uuid}`);
        next();
    },
    validate(portalsValidation.activateSchema),
    portalsController.activate
);

// Route to list actions for a specific portal
// GET /api/v1/portals/:uuid/actions
router.get(
    '/:uuid/actions',
    (req, res, next) => {
        logger.info(`[ROUTES] GET /api/v1/portals/:uuid/actions - Route handler started with uuid=${req.params.uuid}`);
        next();
    },
    validate(portalsValidation.getActionsSchema),
    portalsController.listActions
);

module.exports = router;
