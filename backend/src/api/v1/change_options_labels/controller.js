const changeOptionLabelsService = require('./service');
const logger = require('../../../config/logger');

/**
 * Crée un nouveau change_options_label
 */
const createChangeOptionLabel = async (req, res) => {
    logger.info('[CONTROLLER] createChangeOptionLabel - Starting to process request');
    
    const translationData = req.body;
    
    try {
        const createdLabel = await changeOptionLabelsService.createChangeOptionLabel(translationData);
        
        logger.info(`[CONTROLLER] createChangeOptionLabel - Successfully created change option label`);
        res.status(201).json(createdLabel);
    } catch (error) {
        logger.error(`[CONTROLLER] createChangeOptionLabel - Error creating change option label: ${error.message}`);
        
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: 'Option de changement parent non trouvée'
            });
        }
        
        if (error.code === '23505') { // Code d'erreur PostgreSQL pour violation de contrainte unique
            return res.status(409).json({
                success: false,
                message: 'Un label avec cette langue existe déjà pour cette option de changement'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du label'
        });
    }
};

/**
 * Met à jour un change_options_label
 */
const patchChangeOptionLabel = async (req, res) => {
    logger.info(`[CONTROLLER] patchChangeOptionLabel - Starting to process request for UUID: ${req.params.uuid}`);
    
    const { uuid } = req.params;
    const updateData = req.body;
    
    try {
        const updatedLabel = await changeOptionLabelsService.patchChangeOptionLabel(uuid, updateData);
        
        if (!updatedLabel) {
            logger.info(`[CONTROLLER] patchChangeOptionLabel - Change option label not found with UUID: ${uuid}`);
            return res.status(404).json({
                success: false,
                message: 'Label non trouvé'
            });
        }
        
        logger.info(`[CONTROLLER] patchChangeOptionLabel - Successfully updated change option label`);
        res.json(updatedLabel);
    } catch (error) {
        logger.error(`[CONTROLLER] patchChangeOptionLabel - Error updating change option label: ${error.message}`);
        
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du label'
        });
    }
};

module.exports = {
    createChangeOptionLabel,
    patchChangeOptionLabel
};
