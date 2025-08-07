const incidentSetupLabelsService = require('./service');
const logger = require('../../../config/logger');

/**
 * Crée un nouveau label pour incident_setup
 */
async function createIncidentSetupLabel(req, res) {
    try {
        const { label, parent_uuid, lang_code } = req.body;
        logger.info(`[CONTROLLER] createIncidentSetupLabel - Request received for parent_uuid: ${parent_uuid}, lang_code: ${lang_code}`);
        
        const createdLabel = await incidentSetupLabelsService.createIncidentSetupLabel({
            parent_uuid,
            label,
            lang_code
        });
        
        logger.info(`[CONTROLLER] createIncidentSetupLabel - Successfully created label with UUID: ${createdLabel.uuid}`);
        res.status(201).json(createdLabel);
    } catch (error) {
        logger.error(`[CONTROLLER] createIncidentSetupLabel - Error: ${error.message}`);
        
        if (error.code === '23505') { // Code d'erreur PostgreSQL pour violation de contrainte unique
            return res.status(409).json({
                success: false,
                message: 'Un label avec cette langue existe déjà pour cette configuration d\'incident'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du label de configuration d\'incident'
        });
    }
}

/**
 * Met à jour un label d'incident_setup
 */
async function patchIncidentSetupLabel(req, res) {
    try {
        const { uuid } = req.params;
        const labelData = req.body;
        logger.info(`[CONTROLLER] patchIncidentSetupLabel - Request received for UUID: ${uuid}`);
        
        const updatedLabel = await incidentSetupLabelsService.patchIncidentSetupLabel(uuid, labelData);
        
        if (!updatedLabel) {
            logger.info(`[CONTROLLER] patchIncidentSetupLabel - Label not found for UUID: ${uuid}`);
            return res.status(404).json({
                success: false,
                message: 'Label de configuration d\'incident non trouvé'
            });
        }
        
        logger.info(`[CONTROLLER] patchIncidentSetupLabel - Successfully updated label for UUID: ${uuid}`);
        res.status(200).json(updatedLabel);
    } catch (error) {
        logger.error(`[CONTROLLER] patchIncidentSetupLabel - Error: ${error.message}`);
        
        if (error.code === '23505') { // Code d'erreur PostgreSQL pour violation de contrainte unique
            return res.status(409).json({
                success: false,
                message: 'Un label avec cette langue existe déjà pour cette configuration d\'incident'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du label de configuration d\'incident'
        });
    }
}

module.exports = {
    createIncidentSetupLabel,
    patchIncidentSetupLabel
};
