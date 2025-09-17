const express = require('express');
const router = express.Router();
const locationController = require('./controller');
const logger = require('../../../config/logger');

// GET /api/v1/locations
router.get('/', (req, res, next) => {
    logger.info('[ROUTES] GET /api/v1/locations - Route handler started');
    
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

// GET /api/v1/locations/:uuid - Get location by UUID (route parameter)
router.get('/:uuid', (req, res) => {
    logger.info(`[ROUTES] GET /api/v1/locations/:uuid - Route handler started for UUID: ${req.params.uuid}`);
    return locationController.getLocationByUuid(req, res);
});

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

// POST /api/v1/locations
router.post('/', (req, res) => {
    logger.info('[ROUTES] POST /api/v1/locations - Route handler started');
    return locationController.createLocation(req, res);
});

// PATCH /api/v1/locations/:uuid
router.patch('/:uuid', (req, res) => {
    logger.info('[ROUTES] PATCH /api/v1/locations/:uuid - Route handler started');
    
    // Validate allowed fields in request body
    const allowedFields = [
        'name', 'site_id', 'type', 'rel_status_uuid', 'business_criticality', 
        'opening_hours', 'time_zone', 'street', 'city', 'state_province', 
        'country', 'postal_code', 'phone', 'comments', 'site_created_on',
        'alternative_site_reference', 'wan_design', 'network_telecom_service',
        'parent_uuid', 'primary_entity_uuid', 'field_service_group_uuid'
    ];
    const requestFields = Object.keys(req.body);
    
    const invalidFields = requestFields.filter(field => !allowedFields.includes(field));
    if (invalidFields.length > 0) {
        logger.warn(`[ROUTES] PATCH /api/v1/locations/:uuid - Invalid fields detected in request body: ${invalidFields.join(', ')}`);
        return res.status(400).json({
            error: 'Invalid fields in request body',
            invalidFields: invalidFields
        });
    }

    // Add UUID from URL params to the request
    req.locationUuid = req.params.uuid;
    
    return locationController.updateLocationField(req, res);
});

// POST /api/v1/locations/:location_uuid/occupants (ajout multiple)
router.post('/:location_uuid/occupants', (req, res) => {
    logger.info(`[ROUTES] POST /api/v1/locations/${req.params.location_uuid}/occupants - Route handler started for multiple occupants`);
    return locationController.addMultipleOccupantsToLocation(req, res);
});

// POST /api/v1/locations/:location_uuid/occupants/:user_uuid
router.post('/:location_uuid/occupants/:user_uuid', (req, res) => {
    logger.info(`[ROUTES] POST /api/v1/locations/${req.params.location_uuid}/occupants/${req.params.user_uuid} - Route handler started`);
    return locationController.addOccupantToLocation(req, res);
});

// DELETE /api/v1/locations/:location_uuid/occupants/:user_uuid
router.delete('/:location_uuid/occupants/:user_uuid', (req, res) => {
    logger.info(`[ROUTES] DELETE /api/v1/locations/${req.params.location_uuid}/occupants/${req.params.user_uuid} - Route handler started`);
    return locationController.removeOccupantFromLocation(req, res);
});

// POST /api/v1/locations/:location_uuid/locations (ajout multiple de localisations enfants)
router.post('/:location_uuid/locations', (req, res) => {
    logger.info(`[ROUTES] POST /api/v1/locations/${req.params.location_uuid}/locations - Route handler started for multiple child locations`);
    return locationController.addMultipleChildLocationsToLocation(req, res);
});

// DELETE /api/v1/locations/:location_uuid/locations/:child_location_uuid
router.delete('/:location_uuid/locations/:child_location_uuid', (req, res) => {
    logger.info(`[ROUTES] DELETE /api/v1/locations/${req.params.location_uuid}/locations/${req.params.child_location_uuid} - Route handler started`);
    return locationController.removeChildLocationFromLocation(req, res);
});

module.exports = router;
