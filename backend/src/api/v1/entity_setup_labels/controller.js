const entitySetupLabelsService = require('./service');
const logger = require('../../../config/logger');

/**
 * Crée un nouveau entity_setup_label
 */
async function createEntitySetupLabel(req, res) {
    try {
        const { parent_uuid, label, lang_code } = req.body;
        logger.info(`[CONTROLLER] createEntitySetupLabel - Request received for parent_uuid: ${parent_uuid}, lang: ${lang_code}`);
        
        const createdLabel = await entitySetupLabelsService.createEntitySetupLabel({
            parent_uuid,
            label,
            lang_code
        });
        
        logger.info(`[CONTROLLER] createEntitySetupLabel - Successfully created entity setup label with UUID: ${createdLabel.uuid}`);
        res.status(201).json(createdLabel);
    } catch (error) {
        logger.error(`[CONTROLLER] createEntitySetupLabel - Error: ${error.message}`);
        
        if (error.code === '23505') { // Code d'erreur PostgreSQL pour violation de contrainte unique
            return res.status(409).json({
                success: false,
                message: 'Un label avec cette langue existe déjà pour ce entity setup'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du label'
        });
    }
}

/**
 * Met à jour un entity_setup_label
 */
async function patchEntitySetupLabel(req, res) {
    try {
        const { uuid } = req.params;
        const { label } = req.body;
        logger.info(`[CONTROLLER] patchEntitySetupLabel - Request received for UUID: ${uuid}`);
        
        const updatedLabel = await entitySetupLabelsService.patchEntitySetupLabel(uuid, { label });
        
        if (!updatedLabel) {
            logger.info(`[CONTROLLER] patchEntitySetupLabel - Entity setup label not found for UUID: ${uuid}`);
            return res.status(404).json({
                success: false,
                message: 'Label non trouvé'
            });
        }
        
        logger.info(`[CONTROLLER] patchEntitySetupLabel - Successfully updated entity setup label for UUID: ${uuid}`);
        res.json(updatedLabel);
    } catch (error) {
        logger.error(`[CONTROLLER] patchEntitySetupLabel - Error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du label'
        });
    }
}

module.exports = {
    createEntitySetupLabel,
    patchEntitySetupLabel
};
