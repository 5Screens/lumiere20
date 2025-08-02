const knowledgeSetupLabelsService = require('./service');
const logger = require('../../../config/logger');

class KnowledgeSetupLabelsController {

    async createKnowledgeSetupLabel(req, res) {
        logger.info('[CONTROLLER] createKnowledgeSetupLabel - Starting to process request');
        try {
            const { label, parent_code, lang_code } = req.body;
            
            logger.info(`[CONTROLLER] createKnowledgeSetupLabel - Creating label for parent_code: ${parent_code}, lang_code: ${lang_code}`);
            
            const createdLabel = await knowledgeSetupLabelsService.createKnowledgeSetupLabel({
                label,
                parent_code,
                lang_code
            });
            
            logger.info(`[CONTROLLER] createKnowledgeSetupLabel - Label created successfully with UUID: ${createdLabel.uuid}`);
            return res.status(201).json({
                success: true,
                message: 'Knowledge setup label created successfully',
                data: createdLabel
            });
        } catch (error) {
            logger.error(`[CONTROLLER] createKnowledgeSetupLabel - Error: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: 'An error occurred while creating the knowledge setup label'
            });
        }
    }

    async patchKnowledgeSetupLabel(req, res) {
        logger.info('[CONTROLLER] patchKnowledgeSetupLabel - Starting to process request');
        try {
            const { uuid } = req.params;
            const { label } = req.body;
            
            logger.info(`[CONTROLLER] patchKnowledgeSetupLabel - Patching label with UUID: ${uuid}`);
            
            const patchedLabel = await knowledgeSetupLabelsService.patchKnowledgeSetupLabel(uuid, label);
            
            if (!patchedLabel) {
                logger.info(`[CONTROLLER] patchKnowledgeSetupLabel - No label found with UUID: ${uuid}`);
                return res.status(404).json({
                    success: false,
                    message: `No knowledge setup label found with UUID: ${uuid}`
                });
            }
            
            logger.info(`[CONTROLLER] patchKnowledgeSetupLabel - Label patched successfully with UUID: ${uuid}`);
            return res.status(200).json({
                success: true,
                message: 'Knowledge setup label updated successfully',
                data: patchedLabel
            });
        } catch (error) {
            logger.error(`[CONTROLLER] patchKnowledgeSetupLabel - Error: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: 'An error occurred while updating the knowledge setup label'
            });
        }
    }
}

module.exports = new KnowledgeSetupLabelsController();
