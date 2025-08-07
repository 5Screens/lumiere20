const incidentSetupService = require('./service');
const logger = require('../../../config/logger');

/**
 * Récupère tous les incident_setup_codes avec leurs traductions
 */
async function getAllIncidentSetup(req, res) {
    try {
        const { lang = 'fr', metadata } = req.query;
        logger.info(`[CONTROLLER] getAllIncidentSetup - Request received with lang: ${lang}, metadata: ${metadata}`);
        
        const incidentSetups = await incidentSetupService.getAllIncidentSetup(lang, metadata);
        
        logger.info(`[CONTROLLER] getAllIncidentSetup - Successfully retrieved ${incidentSetups.length} incident setups`);
        res.status(200).json(incidentSetups);
    } catch (error) {
        logger.error(`[CONTROLLER] getAllIncidentSetup - Error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des configurations d\'incident'
        });
    }
}

/**
 * Récupère un incident_setup_code par UUID
 */
async function getIncidentSetupByUuid(req, res) {
    try {
        const { uuid } = req.params;
        const { lang } = req.query;
        logger.info(`[CONTROLLER] getIncidentSetupByUuid - Request received for UUID: ${uuid}, lang: ${lang}`);
        
        const incidentSetup = await incidentSetupService.getIncidentSetupByUuid(uuid, lang);
        
        if (!incidentSetup) {
            logger.info(`[CONTROLLER] getIncidentSetupByUuid - Incident setup not found for UUID: ${uuid}`);
            return res.status(404).json({
                success: false,
                message: 'Configuration d\'incident non trouvée'
            });
        }
        
        logger.info(`[CONTROLLER] getIncidentSetupByUuid - Successfully retrieved incident setup for UUID: ${uuid}`);
        res.status(200).json(incidentSetup);
    } catch (error) {
        logger.error(`[CONTROLLER] getIncidentSetupByUuid - Error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la configuration d\'incident'
        });
    }
}

/**
 * Met à jour un incident_setup_code
 */
async function updateIncidentSetup(req, res) {
    try {
        const { uuid } = req.params;
        const incidentSetupData = req.body;
        logger.info(`[CONTROLLER] updateIncidentSetup - Request received for UUID: ${uuid}`);
        
        const updatedIncidentSetup = await incidentSetupService.updateIncidentSetup(uuid, incidentSetupData);
        
        logger.info(`[CONTROLLER] updateIncidentSetup - Successfully updated incident setup for UUID: ${uuid}`);
        res.status(200).json(updatedIncidentSetup);
    } catch (error) {
        logger.error(`[CONTROLLER] updateIncidentSetup - Error: ${error.message}`);
        
        if (error.code === '23505') { // Code d'erreur PostgreSQL pour violation de contrainte unique
            return res.status(409).json({
                success: false,
                message: 'Une configuration d\'incident avec ce code existe déjà'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de la configuration d\'incident'
        });
    }
}

/**
 * Crée un nouveau incident_setup_code
 */
async function createIncidentSetup(req, res) {
    try {
        const incidentSetupData = req.body;
        logger.info(`[CONTROLLER] createIncidentSetup - Request received for code: ${incidentSetupData.code}`);
        
        const createdIncidentSetup = await incidentSetupService.createIncidentSetup(incidentSetupData);
        
        logger.info(`[CONTROLLER] createIncidentSetup - Successfully created incident setup with code: ${incidentSetupData.code}`);
        res.status(201).json(createdIncidentSetup);
    } catch (error) {
        logger.error(`[CONTROLLER] createIncidentSetup - Error: ${error.message}`);
        
        if (error.code === '23505') { // Code d'erreur PostgreSQL pour violation de contrainte unique
            return res.status(409).json({
                success: false,
                message: 'Une configuration d\'incident avec ce code existe déjà'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la configuration d\'incident'
        });
    }
}

/**
 * Fonction legacy pour compatibilité
 */
async function getIncidentSetup(req, res) {
    logger.info(`[CONTROLLER] getIncidentSetup (legacy) - Redirecting to getAllIncidentSetup`);
    return await getAllIncidentSetup(req, res);
}

module.exports = {
    getAllIncidentSetup,
    getIncidentSetupByUuid,
    updateIncidentSetup,
    createIncidentSetup,
    getIncidentSetup // Fonction legacy
};
