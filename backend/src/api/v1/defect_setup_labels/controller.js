const defectSetupLabelsService = require('./service');
const logger = require('../../../config/logger');

class DefectSetupLabelsController {

    async createDefectSetupLabel(req, res) {
        logger.info('[CONTROLLER] createDefectSetupLabel - Starting to process request');
        try {
            const { label, parent_code, lang_code } = req.body;
            
            logger.info(`[CONTROLLER] createDefectSetupLabel - Creating label for parent_code: ${parent_code}, lang_code: ${lang_code}`);
            
            const createdLabel = await defectSetupLabelsService.createDefectSetupLabel({
                label,
                parent_code,
                lang_code
            });
            
            logger.info(`[CONTROLLER] createDefectSetupLabel - Label created successfully with UUID: ${createdLabel.uuid}`);
            return res.status(201).json({
                success: true,
                message: 'Label created successfully',
                data: createdLabel
            });
        } catch (error) {
            logger.error(`[CONTROLLER] createDefectSetupLabel - Error: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: 'An error occurred while creating the label'
            });
        }
    }

    async patchDefectSetupLabel(req, res) {
        logger.info('[CONTROLLER] patchDefectSetupLabel - Starting to process request');
        try {
            const { uuid } = req.params;
            const { label } = req.body;
            
            logger.info(`[CONTROLLER] patchDefectSetupLabel - Patching label with UUID: ${uuid}`);
            
            const patchedLabel = await defectSetupLabelsService.patchDefectSetupLabel(uuid, label);
            
            if (!patchedLabel) {
                logger.info(`[CONTROLLER] patchDefectSetupLabel - No label found with UUID: ${uuid}`);
                return res.status(404).json({
                    success: false,
                    message: `No label found with UUID: ${uuid}`
                });
            }
            
            logger.info(`[CONTROLLER] patchDefectSetupLabel - Label patched successfully`);
            return res.status(200).json({
                success: true,
                message: 'Label updated successfully',
                data: patchedLabel
            });
        } catch (error) {
            logger.error(`[CONTROLLER] patchDefectSetupLabel - Error: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: 'An error occurred while updating the label'
            });
        }
    }
}

module.exports = new DefectSetupLabelsController();
