const serviceOfferingsService = require('./service');
const logger = require('../../../config/logger');

class ServiceOfferingsController {
    async getSubscribedOfferingsCount(req, res) {
        try {
            const { uuid } = req.query;
            logger.info(`[CONTROLLER] getSubscribedOfferingsCount - Processing request for entity UUID: ${uuid}`);
            
            const result = await serviceOfferingsService.getSubscribedOfferingsCount(uuid);
            
            if (result === null) {
                logger.warn(`[CONTROLLER] getSubscribedOfferingsCount - Entity not found with UUID: ${uuid}`);
                return res.status(404).json({
                    error: 'Entity not found'
                });
            }
            
            logger.info(`[CONTROLLER] getSubscribedOfferingsCount - Successfully retrieved offerings count for entity UUID: ${uuid}`);
            return res.json(result);
        } catch (error) {
            logger.error(`[CONTROLLER] getSubscribedOfferingsCount - Error: ${error.message}`);
            
            // Specific handling for UUID format errors
            if (error.message.includes('uuid')) {
                return res.status(400).json({
                    error: `Invalid UUID format: "${uuid}". The following error occurred: ${error.message}`
                });
            }
            
            return res.status(500).json({
                error: 'Error while counting subscribed offerings',
                details: error.message
            });
        }
    }

    async getAllServices(req, res) {
        try {
            logger.info('[CONTROLLER] Getting all services');
            const services = await serviceOfferingsService.getAllServices();
            res.json(services);
        } catch (error) {
            logger.error('[CONTROLLER] Error getting all services:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'An error occurred while retrieving services'
            });
        }
    }
}

module.exports = new ServiceOfferingsController();
