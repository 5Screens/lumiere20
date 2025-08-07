const entitySetupService = require('./service');
const logger = require('../../../config/logger');

/**
 * Récupère tous les entity_setup_codes avec leurs traductions
 */
async function getAllEntitySetup(req, res) {
    try {
        const { lang = 'en' } = req.query;
        logger.info(`[CONTROLLER] getAllEntitySetup - Request received for language: ${lang}`);
        
        const entitySetups = await entitySetupService.getAllEntitySetup(lang);
        
        logger.info(`[CONTROLLER] getAllEntitySetup - Successfully retrieved ${entitySetups.length} entity setups`);
        res.json({
            success: true,
            data: entitySetups
        });
    } catch (error) {
        logger.error(`[CONTROLLER] getAllEntitySetup - Error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des entity setups'
        });
    }
}

/**
 * Récupère un entity_setup_code par UUID
 */
async function getEntitySetupByUuid(req, res) {
    try {
        const { uuid } = req.params;
        logger.info(`[CONTROLLER] getEntitySetupByUuid - Request received for UUID: ${uuid}`);
        
        const entitySetup = await entitySetupService.getEntitySetupByUuid(uuid);
        
        if (!entitySetup) {
            logger.info(`[CONTROLLER] getEntitySetupByUuid - Entity setup not found for UUID: ${uuid}`);
            return res.status(404).json({
                success: false,
                message: 'Entity setup non trouvé'
            });
        }
        
        logger.info(`[CONTROLLER] getEntitySetupByUuid - Successfully retrieved entity setup for UUID: ${uuid}`);
        res.json({
            success: true,
            data: entitySetup
        });
    } catch (error) {
        logger.error(`[CONTROLLER] getEntitySetupByUuid - Error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du entity setup'
        });
    }
}

/**
 * Met à jour un entity_setup_code
 */
async function updateEntitySetup(req, res) {
    try {
        const { uuid } = req.params;
        const entitySetupData = req.body;
        logger.info(`[CONTROLLER] updateEntitySetup - Request received for UUID: ${uuid}`);
        
        const updatedEntitySetup = await entitySetupService.updateEntitySetup(uuid, entitySetupData);
        
        logger.info(`[CONTROLLER] updateEntitySetup - Successfully updated entity setup for UUID: ${uuid}`);
        res.json({
            success: true,
            data: updatedEntitySetup
        });
    } catch (error) {
        logger.error(`[CONTROLLER] updateEntitySetup - Error: ${error.message}`);
        
        if (error.code === '23505') { // Code d'erreur PostgreSQL pour violation de contrainte unique
            return res.status(409).json({
                success: false,
                message: 'Un entity setup avec ce code existe déjà'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du entity setup'
        });
    }
}

/**
 * Crée un nouveau entity_setup_code
 */
async function createEntitySetup(req, res) {
    try {
        const entitySetupData = req.body;
        logger.info(`[CONTROLLER] createEntitySetup - Request received for code: ${entitySetupData.code}`);
        
        const createdEntitySetup = await entitySetupService.createEntitySetup(entitySetupData);
        
        logger.info(`[CONTROLLER] createEntitySetup - Successfully created entity setup with UUID: ${createdEntitySetup.uuid}`);
        res.status(201).json({
            success: true,
            data: createdEntitySetup
        });
    } catch (error) {
        logger.error(`[CONTROLLER] createEntitySetup - Error: ${error.message}`);
        
        if (error.code === '23505') { // Code d'erreur PostgreSQL pour violation de contrainte unique
            return res.status(409).json({
                success: false,
                message: 'Un entity setup avec ce code existe déjà'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du entity setup'
        });
    }
}

module.exports = {
    getAllEntitySetup,
    getEntitySetupByUuid,
    updateEntitySetup,
    createEntitySetup
};
