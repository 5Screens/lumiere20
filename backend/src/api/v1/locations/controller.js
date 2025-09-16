const locationService = require('./service');
const logger = require('../../../config/logger');

class LocationController {
    async getAllLocations(req, res) {
        logger.info('[CONTROLLER] getAllLocations - Starting to process request');
        
        const lang = req.query.lang;
        if (!lang) {
            logger.warn('[CONTROLLER] getAllLocations - Missing lang parameter');
            return res.status(400).json({
                error: 'lang parameter is required (e.g., ?lang=fr)'
            });
        }
        
        try {
            const locations = await locationService.getAllLocations(lang);
            logger.info(`[CONTROLLER] getAllLocations - Successfully retrieved ${locations.length} locations`);
            res.json(locations);
        } catch (error) {
            logger.error(`[CONTROLLER] getAllLocations - Error: ${error.message}`);
            res.status(500).json({ 
                error: 'An error occurred while retrieving locations' 
            });
        }
    }

    async getLocationByUuid(req, res) {
        const uuid = req.query.uuid;
        const lang = req.query.lang;
        
        if (!lang) {
            logger.warn('[CONTROLLER] getLocationByUuid - Missing lang parameter');
            return res.status(400).json({
                error: 'lang parameter is required (e.g., ?lang=fr)'
            });
        }
        
        logger.info(`[CONTROLLER] getLocationByUuid - Processing request for UUID: ${uuid} with language: ${lang}`);
        try {
            const location = await locationService.getLocationByUuid(uuid, lang);
            
            if (!location) {
                logger.warn(`[CONTROLLER] getLocationByUuid - Location not found with UUID: ${uuid}`);
                return res.status(404).json({
                    error: 'Location not found'
                });
            }
            
            logger.info(`[CONTROLLER] getLocationByUuid - Successfully retrieved location with UUID: ${uuid}`);
            return res.json(location);
        } catch (error) {
            logger.error(`[CONTROLLER] getLocationByUuid - Error: ${error.message}`);
            return res.status(500).json({
                error: 'Error while retrieving location'
            });
        }
    }

    async getActiveLocations(req, res) {
        logger.info('[CONTROLLER] getActiveLocations - Starting to process request');
        
        const lang = req.query.lang;
        if (!lang) {
            logger.warn('[CONTROLLER] getActiveLocations - Missing lang parameter');
            return res.status(400).json({
                error: 'lang parameter is required (e.g., ?lang=fr)'
            });
        }
        
        try {
            const activeLocations = await locationService.getActiveLocations(lang);
            logger.info(`[CONTROLLER] getActiveLocations - Successfully retrieved ${activeLocations.length} active locations`);
            res.json(activeLocations);
        } catch (error) {
            logger.error(`[CONTROLLER] getActiveLocations - Error: ${error.message}`);
            res.status(500).json({ 
                error: 'An error occurred while retrieving active locations' 
            });
        }
    }

    async getChildLocationsCount(req, res) {
        const uuid = req.query.uuid;
        
        if (!uuid) {
            logger.warn('[CONTROLLER] getChildLocationsCount - Missing UUID parameter');
            return res.status(400).json({
                error: 'UUID parameter is required'
            });
        }
        
        // UUID format validation
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(uuid)) {
            logger.warn(`[CONTROLLER] getChildLocationsCount - Invalid UUID format: ${uuid}`);
            return res.status(400).json({
                error: `Invalid UUID format: "${uuid}". UUID must be in the format of 8-4-4-4-12 hexadecimal characters.`
            });
        }
        
        logger.info(`[CONTROLLER] getChildLocationsCount - Processing request for UUID: ${uuid}`);
        try {
            const result = await locationService.getChildLocationsCount(uuid);
            
            if (result === null) {
                logger.warn(`[CONTROLLER] getChildLocationsCount - Location not found with UUID: ${uuid}`);
                return res.status(404).json({
                    error: 'Location not found'
                });
            }
            
            logger.info(`[CONTROLLER] getChildLocationsCount - Successfully retrieved child count for location UUID: ${uuid}`);
            return res.json(result);
        } catch (error) {
            logger.error(`[CONTROLLER] getChildLocationsCount - Error: ${error.message}`);
            
            // Specific handling for UUID format errors
            if (error.message.includes('uuid')) {
                return res.status(400).json({
                    error: `Invalid UUID format: "${uuid}". The following error occurred: ${error.message}`
                });
            }
            
            return res.status(500).json({
                error: 'Error while counting child locations',
                details: error.message
            });
        }
    }

    async getEntityLocationsCount(req, res) {
        const entityUuid = req.query.entityUuid;
        
        if (!entityUuid) {
            logger.warn('[CONTROLLER] getEntityLocationsCount - Missing entityUuid parameter');
            return res.status(400).json({
                error: 'entityUuid parameter is required'
            });
        }
        
        // UUID format validation
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(entityUuid)) {
            logger.warn(`[CONTROLLER] getEntityLocationsCount - Invalid UUID format: ${entityUuid}`);
            return res.status(400).json({
                error: `Invalid UUID format: "${entityUuid}". UUID must be in the format of 8-4-4-4-12 hexadecimal characters.`
            });
        }
        
        logger.info(`[CONTROLLER] getEntityLocationsCount - Processing request for entity UUID: ${entityUuid}`);
        try {
            const result = await locationService.getEntityLocationsCount(entityUuid);
            
            if (result === null) {
                logger.warn(`[CONTROLLER] getEntityLocationsCount - Entity not found with UUID: ${entityUuid}`);
                return res.status(404).json({
                    error: 'Entity not found'
                });
            }
            
            logger.info(`[CONTROLLER] getEntityLocationsCount - Successfully retrieved locations count for entity UUID: ${entityUuid}`);
            return res.json(result);
        } catch (error) {
            logger.error(`[CONTROLLER] getEntityLocationsCount - Error: ${error.message}`);
            
            // Specific handling for UUID format errors
            if (error.message.includes('uuid')) {
                return res.status(400).json({
                    error: `Invalid UUID format: "${entityUuid}". The following error occurred: ${error.message}`
                });
            }
            
            return res.status(500).json({
                error: 'Error while counting entity locations',
                details: error.message
            });
        }
    }
}

module.exports = new LocationController();
