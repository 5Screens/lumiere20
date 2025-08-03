const { createProblemCategoryLabel, patchProblemCategoryLabel } = require('./service');
const logger = require('../../../config/logger');

/**
 * Crée un nouveau problem_categories_label
 */
const createProblemCategoryLabelController = async (req, res) => {
    logger.info('[CONTROLLER] createProblemCategoryLabelController - Processing create problem category label request');
    
    try {
        const { parent_uuid, label, lang_code } = req.body;
        
        logger.info(`[CONTROLLER] createProblemCategoryLabelController - Creating label for parent_uuid: ${parent_uuid}, lang: ${lang_code}`);
        const createdLabel = await createProblemCategoryLabel({ parent_uuid, label, lang_code });
        
        logger.info('[CONTROLLER] createProblemCategoryLabelController - Successfully created problem category label');
        res.status(201).json(createdLabel);
    } catch (error) {
        logger.error(`[CONTROLLER] createProblemCategoryLabelController - Error creating problem category label: ${error.message}`);
        
        if (error.code === '23505') { // Code d'erreur PostgreSQL pour violation de contrainte unique
            return res.status(409).json({
                success: false,
                message: 'Un label avec cette langue existe déjà pour cette catégorie de problème'
            });
        }
        
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Met à jour un problem_categories_label
 */
const patchProblemCategoryLabelController = async (req, res) => {
    logger.info('[CONTROLLER] patchProblemCategoryLabelController - Processing patch problem category label request');
    
    try {
        const { uuid } = req.params;
        const updateData = req.body;
        
        logger.info(`[CONTROLLER] patchProblemCategoryLabelController - Updating label with UUID: ${uuid}`);
        const updatedLabel = await patchProblemCategoryLabel(uuid, updateData);
        
        if (!updatedLabel) {
            logger.info(`[CONTROLLER] patchProblemCategoryLabelController - Problem category label not found with UUID: ${uuid}`);
            return res.status(404).json({ error: 'Problem category label not found' });
        }
        
        logger.info('[CONTROLLER] patchProblemCategoryLabelController - Successfully updated problem category label');
        res.json(updatedLabel);
    } catch (error) {
        logger.error(`[CONTROLLER] patchProblemCategoryLabelController - Error updating problem category label: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createProblemCategoryLabelController,
    patchProblemCategoryLabelController
};
