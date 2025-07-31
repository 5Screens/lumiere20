const symptomsTranslationsService = require('./service');
const logger = require('../../../config/logger');

class SymptomsTranslationsController {

    async patchSymptomTranslation(req, res) {
        logger.info('[CONTROLLER] patchSymptomTranslation - Starting to process request');
        try {
            const { uuid } = req.params;
            const { label } = req.body;
            
            logger.info(`[CONTROLLER] patchSymptomTranslation - Patching translation with UUID: ${uuid}`);
            
            const patchedTranslation = await symptomsTranslationsService.patchSymptomTranslation(uuid, label);
            
            if (!patchedTranslation) {
                logger.info(`[CONTROLLER] patchSymptomTranslation - No translation found with UUID: ${uuid}`);
                return res.status(404).json({
                    success: false,
                    message: `No translation found with UUID: ${uuid}`
                });
            }
            
            logger.info(`[CONTROLLER] patchSymptomTranslation - Translation patched successfully for UUID: ${uuid}`);
            return res.status(200).json({
                success: true,
                message: 'Translation updated successfully',
                data: patchedTranslation
            });
        } catch (error) {
            logger.error(`[CONTROLLER] patchSymptomTranslation - Error: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: 'An error occurred while updating the translation'
            });
        }
    }
}

module.exports = new SymptomsTranslationsController();
