const express = require('express');
const router = express.Router();
const locationController = require('./controller');
const logger = require('../../../config/logger');

// GET /api/v1/locations
router.get('/', (req, res, next) => {
    logger.info('[ROUTES] GET /api/v1/locations - Route handler started');
    
    if (req.query.uuid) {
        logger.info(`[ROUTES] GET /api/v1/locations - UUID parameter detected: ${req.query.uuid}`);
        return locationController.getLocationByUuid(req, res);
    }
    
    if (req.query.active !== undefined) {
        if (req.query.active.toLowerCase() === 'yes') {
            logger.info('[ROUTES] GET /api/v1/locations - Active=yes parameter detected, filtering active locations');
            return locationController.getActiveLocations(req, res);
        } else {
            logger.warn(`[ROUTES] GET /api/v1/locations - Invalid active parameter value: ${req.query.active}`);
            return res.status(400).json({
                error: 'Invalid value for active parameter. Use "yes" to filter active locations.'
            });
        }
    }
    
    next();
}, locationController.getAllLocations.bind(locationController));

// GET /api/v1/locations/getChildLocations/count
router.get('/getChildLocations/count', (req, res) => {
    logger.info('[ROUTES] GET /api/v1/locations/getChildLocations/count - Route handler started');
    return locationController.getChildLocationsCount(req, res);
});

// GET /api/v1/locations/getEntityLocations/count
router.get('/getEntityLocations/count', (req, res) => {
    logger.info('[ROUTES] GET /api/v1/locations/getEntityLocations/count - Route handler started');
    return locationController.getEntityLocationsCount(req, res);
});

module.exports = router;
