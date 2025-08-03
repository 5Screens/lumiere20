const changeSetupLabelsService = require('./service');
const logger = require('../../../config/logger');

/**
 * Crée un nouveau change_setup_label
 */
const createChangeSetupLabel = async (req, res) => {
    logger.info('[CONTROLLER] createChangeSetupLabel - Starting to process request');
    
    const translationData = req.body;
    
    try {
        const createdLabel = await changeSetupLabelsService.createChangeSetupLabel(translationData);
        
        logger.info(`[CONTROLLER] createChangeSetupLabel - Successfully created change setup label`);
        res.status(201).json(createdLabel);
    } catch (error) {
        logger.error(`[CONTROLLER] createChangeSetupLabel - Error creating change setup label: ${error.message}`);
        
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: 'Configuration de changement parent non trouvée'
            });
        }
        
        if (error.code === '23505') { // Code d'erreur PostgreSQL pour violation de contrainte unique
            return res.status(409).json({
                success: false,
                message: 'Un label avec cette langue existe déjà pour cette configuration de changement'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du label'
        });
    }
};

/**
 * Met à jour un change_setup_label
 */
const patchChangeSetupLabel = async (req, res) => {
    logger.info(`[CONTROLLER] patchChangeSetupLabel - Starting to process request for UUID: ${req.params.uuid}`);
    
    const { uuid } = req.params;
    const updateData = req.body;
    
    try {
        const updatedLabel = await changeSetupLabelsService.patchChangeSetupLabel(uuid, updateData);
        
        logger.info(`[CONTROLLER] patchChangeSetupLabel - Successfully updated change setup label with UUID: ${uuid}`);
        res.json(updatedLabel);
    } catch (error) {
        logger.error(`[CONTROLLER] patchChangeSetupLabel - Error updating change setup label: ${error.message}`);
        
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: 'Label de configuration de changement non trouvé'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du label'
        });
    }
};

module.exports = {
    createChangeSetupLabel,
    patchChangeSetupLabel
};
