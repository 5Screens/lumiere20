const projectSetupService = require('./service');
const logger = require('../../../config/logger');

/**
 * Récupère tous les project setup avec leurs traductions
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getAllProjectSetup = async (req, res) => {
    logger.info('[CONTROLLER] getAllProjectSetup - Starting request processing');
    
    try {
        const { lang } = req.query;
        
        const projectSetupData = await projectSetupService.getAllProjectSetup(lang);
        
        logger.info(`[CONTROLLER] getAllProjectSetup - Successfully retrieved ${projectSetupData.length} project setup records`);
        
        res.json(projectSetupData);
    } catch (error) {
        logger.error(`[CONTROLLER] getAllProjectSetup - Error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'An error occurred while retrieving project setup data' 
        });
    }
};

/**
 * Récupère un project setup par son UUID
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const getProjectSetupByUuid = async (req, res) => {
    logger.info(`[CONTROLLER] getProjectSetupByUuid - Starting request processing for UUID: ${req.params.uuid}`);
    
    try {
        const { uuid } = req.params;
        const { lang } = req.query;
        
        const projectSetup = await projectSetupService.getProjectSetupByUuid(uuid, lang);
        
        if (!projectSetup) {
            logger.info(`[CONTROLLER] getProjectSetupByUuid - Project setup not found with UUID: ${uuid}`);
            return res.status(404).json({ 
                success: false,
                message: 'Project setup not found' 
            });
        }
        
        logger.info(`[CONTROLLER] getProjectSetupByUuid - Successfully retrieved project setup`);
        
        res.json(projectSetup);
    } catch (error) {
        logger.error(`[CONTROLLER] getProjectSetupByUuid - Error: ${error.message}`);
        res.status(500).json({ 
            success: false,
            message: 'An error occurred while retrieving project setup' 
        });
    }
};

/**
 * Met à jour un project setup
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const updateProjectSetup = async (req, res) => {
    logger.info(`[CONTROLLER] updateProjectSetup - Starting request processing for UUID: ${req.params.uuid}`);
    
    try {
        const { uuid } = req.params;
        const updateData = req.body;
        
        logger.info(`[CONTROLLER] updateProjectSetup - Update data received: ${JSON.stringify(updateData)}`);
        
        const updatedProjectSetup = await projectSetupService.updateProjectSetup(uuid, updateData);
        
        logger.info(`[CONTROLLER] updateProjectSetup - Successfully updated project setup`);
        
        res.json({
            success: true,
            message: 'Project setup updated successfully',
            data: updatedProjectSetup
        });
    } catch (error) {
        logger.error(`[CONTROLLER] updateProjectSetup - Error: ${error.message}`);
        
        if (error.message.includes('not found')) {
            return res.status(404).json({ 
                success: false,
                message: 'Project setup not found' 
            });
        }
        
        res.status(500).json({ 
            success: false,
            message: 'An error occurred while updating project setup' 
        });
    }
};

/**
 * Crée un nouveau project setup
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const createProjectSetup = async (req, res) => {
    logger.info('[CONTROLLER] createProjectSetup - Starting request processing');
    
    try {
        const projectSetupData = req.body;
        
        logger.info(`[CONTROLLER] createProjectSetup - Creation data received: ${JSON.stringify(projectSetupData)}`);
        
        const createdProjectSetup = await projectSetupService.createProjectSetup(projectSetupData);
        
        logger.info(`[CONTROLLER] createProjectSetup - Successfully created project setup with code: ${projectSetupData.code}`);
        
        res.status(201).json({
            success: true,
            message: 'Project setup created successfully',
            data: createdProjectSetup
        });
    } catch (error) {
        logger.error(`[CONTROLLER] createProjectSetup - Error: ${error.message}`);
        
        // Gestion de l'erreur de code dupliqué
        if (error.code === '23505') { // Code d'erreur PostgreSQL pour violation de contrainte unique
            return res.status(409).json({
                success: false,
                message: 'Un project setup avec ce code existe déjà'
            });
        }
        
        res.status(500).json({ 
            success: false,
            message: 'An error occurred while creating project setup' 
        });
    }
};

/**
 * Récupère les données de configuration des projets (fonction legacy)
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} - Données de configuration des projets
 */
const getProjectSetup = async (req, res) => {
    logger.info('[CONTROLLER] Starting to process getProjectSetup request');
    
    try {
        const { lang, metadata, toSelect } = req.query;
        
        const projectSetupData = await projectSetupService.getProjectSetup(lang, metadata, toSelect);
        
        logger.info(`[CONTROLLER] Successfully retrieved project setup data`);
        
        res.json(projectSetupData);
    } catch (error) {
        logger.error(`[CONTROLLER] Error: ${error.message}`);
        res.status(500).json({ 
            error: 'An error occurred while retrieving project setup data' 
        });
    }
};

module.exports = {
    getAllProjectSetup,
    getProjectSetupByUuid,
    updateProjectSetup,
    createProjectSetup,
    getProjectSetup
};
