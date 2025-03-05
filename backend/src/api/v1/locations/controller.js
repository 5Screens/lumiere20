const locationService = require('./service');
const logger = require('../../../config/logger');

class LocationController {
    async getAllLocations(req, res) {
        logger.info('[CONTROLLER] getAllLocations - Starting to process request');
        try {
            const locations = await locationService.getAllLocations();
            logger.info(`[CONTROLLER] getAllLocations - Successfully retrieved ${locations.length} locations`);
            res.json(locations);
        } catch (error) {
            logger.error(`[CONTROLLER] getAllLocations - Error: ${error.message}`);
            res.status(500).json({ 
                error: 'Une erreur est survenue lors de la récupération des emplacements' 
            });
        }
    }

    async getLocationByUuid(req, res) {
        const uuid = req.query.uuid;
        logger.info(`[CONTROLLER] getLocationByUuid - Processing request for UUID: ${uuid}`);
        try {
            const location = await locationService.getLocationByUuid(uuid);
            
            if (!location) {
                logger.warn(`[CONTROLLER] getLocationByUuid - Location not found with UUID: ${uuid}`);
                return res.status(404).json({
                    error: 'Emplacement non trouvé'
                });
            }
            
            logger.info(`[CONTROLLER] getLocationByUuid - Successfully retrieved location with UUID: ${uuid}`);
            return res.json(location);
        } catch (error) {
            logger.error(`[CONTROLLER] getLocationByUuid - Error: ${error.message}`);
            return res.status(500).json({
                error: 'Erreur lors de la récupération de l\'emplacement'
            });
        }
    }

    async getActiveLocations(req, res) {
        logger.info('[CONTROLLER] getActiveLocations - Starting to process request');
        try {
            const activeLocations = await locationService.getActiveLocations();
            logger.info(`[CONTROLLER] getActiveLocations - Successfully retrieved ${activeLocations.length} active locations`);
            res.json(activeLocations);
        } catch (error) {
            logger.error(`[CONTROLLER] getActiveLocations - Error: ${error.message}`);
            res.status(500).json({ 
                error: 'Une erreur est survenue lors de la récupération des emplacements actifs' 
            });
        }
    }
}

module.exports = new LocationController();
