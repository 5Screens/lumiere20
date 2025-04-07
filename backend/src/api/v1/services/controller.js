const servicesService = require('./service');
const logger = require('../../../config/logger');

async function getServicesPerEntityCount(req, res) {
    try {
        const { uuid } = req.query;
        logger.info(`[CONTROLLER] getServicesPerEntityCount - Processing request for entity UUID: ${uuid}`);
        
        const result = await servicesService.getServicesPerEntityCount(uuid);
        
        if (result === null) {
            logger.warn(`[CONTROLLER] getServicesPerEntityCount - Entity not found with UUID: ${uuid}`);
            return res.status(404).json({
                error: 'Entity not found'
            });
        }
        
        logger.info(`[CONTROLLER] getServicesPerEntityCount - Successfully retrieved services count for entity UUID: ${uuid}`);
        return res.json(result);
    } catch (error) {
        logger.error(`[CONTROLLER] getServicesPerEntityCount - Error: ${error.message}`);
        
        // Specific handling for UUID format errors
        if (error.message.includes('uuid')) {
            return res.status(400).json({
                error: `Invalid UUID format: "${req.query.uuid}". The following error occurred: ${error.message}`
            });
        }
        
        return res.status(500).json({
            error: 'Error while counting services per entity',
            details: error.message
        });
    }
}

async function getAllServices(req, res) {
    try {
        const { lang } = req.query;
        logger.info(`[CONTROLLER] getAllServices - Processing request with language: ${lang || 'en'}`);
        
        const services = await servicesService.getAllServices(lang || 'en');
        
        logger.info(`[CONTROLLER] getAllServices - Successfully retrieved ${services.length} services`);
        return res.json(services);
    } catch (error) {
        logger.error(`[CONTROLLER] getAllServices - Error: ${error.message}`);
        
        return res.status(500).json({
            error: 'Error while retrieving services',
            details: error.message
        });
    }
}

module.exports = {
    getServicesPerEntityCount,
    getAllServices
};
