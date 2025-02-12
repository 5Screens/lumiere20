const entityService = require('./service');
const logger = require('../../../config/logger');

class EntityController {
    async getAllEntities(req, res) {
        logger.info('[CONTROLLER] getAllEntities - Starting to process request');
        try {
            const entities = await entityService.getAllEntities();
            logger.info(`[CONTROLLER] getAllEntities - Successfully retrieved ${entities.length} entities`);
            res.json(entities);
        } catch (error) {
            logger.error(`[CONTROLLER] getAllEntities - Error: ${error.message}`);
            res.status(500).json({ 
                error: 'Une erreur est survenue lors de la récupération des entités' 
            });
        }
    }
}

module.exports = new EntityController();
