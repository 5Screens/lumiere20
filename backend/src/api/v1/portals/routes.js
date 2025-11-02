const express = require('express');
const router = express.Router();
const portalsController = require('./controller');
const validate = require('../../../middleware/validate');
const portalsValidation = require('./validation');
const logger = require('../../../config/logger');

// Route to resolve a portal by code or host
// GET /api/v1/portals/resolve?code=hello-portal
// GET /api/v1/portals/resolve?host=client-a.local
router.get(
    '/resolve',
    (req, res, next) => {
        logger.info(`[ROUTES] GET /api/v1/portals/resolve - Route handler started with code=${req.query.code}, host=${req.query.host}`);
        next();
    },
    validate(portalsValidation.resolveQuerySchema),
    portalsController.resolve
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
