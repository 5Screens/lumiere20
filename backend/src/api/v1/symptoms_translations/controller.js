const symptomsTranslationsService = require('./service');
const logger = require('../../../config/logger');

class SymptomsTranslationsController {

    async createSymptomTranslation(req, res) {
        logger.info('[CONTROLLER] createSymptomTranslation - Starting to process request');
        try {
            const { label, parent_uuid, lang_code } = req.body;
            
            logger.info(`[CONTROLLER] createSymptomTranslation - Creating translation for parent_uuid: ${parent_uuid}, lang: ${lang_code}`);
            
            const createdTranslation = await symptomsTranslationsService.createSymptomTranslation({ label, parent_uuid, lang_code });
            
            logger.info(`[CONTROLLER] createSymptomTranslation - Translation created successfully with UUID: ${createdTranslation.uuid}`);
            return res.status(201).json({
                success: true,
                message: 'Translation created successfully',
                data: createdTranslation
            });
        } catch (error) {
            logger.error(`[CONTROLLER] createSymptomTranslation - Error: ${error.message}`);
            
            // Gestion spécifique des erreurs de contrainte unique (code 23505)
            if (error.code === '23505') {
                return res.status(409).json({
                    success: false,
                    message: 'A translation already exists for this symptom and language'
                });
            }
            
            return res.status(500).json({
                success: false,
                message: 'An error occurred while creating the translation'
            });
        }
    }

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
