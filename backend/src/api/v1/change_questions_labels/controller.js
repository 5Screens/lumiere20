const changeQuestionLabelsService = require('./service');
const logger = require('../../../config/logger');

/**
 * Crée un nouveau change_questions_label
 */
const createChangeQuestionLabel = async (req, res) => {
    logger.info('[CONTROLLER] createChangeQuestionLabel - Starting to process request');
    
    const translationData = req.body;
    
    try {
        const createdLabel = await changeQuestionLabelsService.createChangeQuestionLabel(translationData);
        
        logger.info(`[CONTROLLER] createChangeQuestionLabel - Successfully created change question label`);
        res.status(201).json(createdLabel);
    } catch (error) {
        logger.error(`[CONTROLLER] createChangeQuestionLabel - Error creating change question label: ${error.message}`);
        
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: 'Question de changement parent non trouvée'
            });
        }
        
        if (error.code === '23505') { // Code d'erreur PostgreSQL pour violation de contrainte unique
            return res.status(409).json({
                success: false,
                message: 'Un label avec cette langue existe déjà pour cette question de changement'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du label'
        });
    }
};

/**
 * Met à jour un change_questions_label
 */
const patchChangeQuestionLabel = async (req, res) => {
    logger.info(`[CONTROLLER] patchChangeQuestionLabel - Starting to process request for UUID: ${req.params.uuid}`);
    
    const { uuid } = req.params;
    const updateData = req.body;
    
    try {
        const updatedLabel = await changeQuestionLabelsService.patchChangeQuestionLabel(uuid, updateData);
        
        if (!updatedLabel) {
            logger.info(`[CONTROLLER] patchChangeQuestionLabel - Change question label not found with UUID: ${uuid}`);
            return res.status(404).json({
                success: false,
                message: 'Label de question de changement non trouvé'
            });
        }
        
        logger.info(`[CONTROLLER] patchChangeQuestionLabel - Successfully updated change question label with UUID: ${uuid}`);
        res.json(updatedLabel);
    } catch (error) {
        logger.error(`[CONTROLLER] patchChangeQuestionLabel - Error updating change question label: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du label'
        });
    }
};

module.exports = {
    createChangeQuestionLabel,
    patchChangeQuestionLabel
};
