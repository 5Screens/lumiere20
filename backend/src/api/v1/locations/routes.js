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
                error: 'Valeur invalide pour le paramètre active. Utilisez "yes" pour filtrer les locations actives.'
            });
        }
    }
    
    next();
}, locationController.getAllLocations.bind(locationController));

module.exports = router;
