const projectSetupLabelService = require('./service');
const logger = require('../../../config/logger');

/**
 * Crée un nouveau project setup label
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const createProjectSetupLabel = async (req, res) => {
    logger.info('[CONTROLLER] createProjectSetupLabel - Starting request processing');
    
    try {
        const translationData = req.body;
        
        logger.info(`[CONTROLLER] createProjectSetupLabel - Creation data received: ${JSON.stringify(translationData)}`);
        
        const createdLabel = await projectSetupLabelService.createProjectSetupLabel(translationData);
        
        logger.info(`[CONTROLLER] createProjectSetupLabel - Successfully created project setup label`);
        
        res.status(201).json({
            success: true,
            message: 'Project setup label created successfully',
            data: createdLabel
        });
    } catch (error) {
        logger.error(`[CONTROLLER] createProjectSetupLabel - Error: ${error.message}`);
        
        // Gestion de l'erreur de contrainte unique
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'Un label pour cette langue existe déjà pour ce project setup'
            });
        }
        
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: 'Project setup parent not found'
            });
        }
        
        res.status(500).json({ 
            success: false,
            message: 'An error occurred while creating project setup label' 
        });
    }
};

/**
 * Met à jour un project setup label
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const patchProjectSetupLabel = async (req, res) => {
    logger.info(`[CONTROLLER] patchProjectSetupLabel - Starting request processing for UUID: ${req.params.uuid}`);
    
    try {
        const { uuid } = req.params;
        const updateData = req.body;
        
        logger.info(`[CONTROLLER] patchProjectSetupLabel - Update data received: ${JSON.stringify(updateData)}`);
        
        const updatedLabel = await projectSetupLabelService.patchProjectSetupLabel(uuid, updateData);
        
        if (!updatedLabel) {
            logger.info(`[CONTROLLER] patchProjectSetupLabel - Project setup label not found with UUID: ${uuid}`);
            return res.status(404).json({ 
                success: false,
                message: 'Project setup label not found' 
            });
        }
        
        logger.info(`[CONTROLLER] patchProjectSetupLabel - Successfully updated project setup label`);
        
        res.json({
            success: true,
            message: 'Project setup label updated successfully',
            data: updatedLabel
        });
    } catch (error) {
        logger.error(`[CONTROLLER] patchProjectSetupLabel - Error: ${error.message}`);
        
        if (error.message.includes('No fields to update')) {
            return res.status(400).json({ 
                success: false,
                message: 'No fields provided for update' 
            });
        }
        
        res.status(500).json({ 
            success: false,
            message: 'An error occurred while updating project setup label' 
        });
    }
};

module.exports = {
    createProjectSetupLabel,
    patchProjectSetupLabel
};
