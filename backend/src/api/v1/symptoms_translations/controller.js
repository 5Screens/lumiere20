const symptomsTranslationsService = require('./service');
const logger = require('../../../config/logger');

class SymptomsTranslationsController {
    async updateSymptomTranslation(req, res) {
        logger.info('[CONTROLLER] updateSymptomTranslation - Starting to process request');
        try {
            const { uuid } = req.params;
            const { libelle } = req.body;
            
            logger.info(`[CONTROLLER] updateSymptomTranslation - Updating translation with UUID: ${uuid}`);
            
            const updatedTranslation = await symptomsTranslationsService.updateSymptomTranslation(uuid, libelle);
            
            if (!updatedTranslation) {
                logger.info(`[CONTROLLER] updateSymptomTranslation - No translation found with UUID: ${uuid}`);
                return res.status(404).json({
                    success: false,
                    message: `Aucune traduction trouvée avec l'UUID: ${uuid}`
                });
            }
            
            logger.info(`[CONTROLLER] updateSymptomTranslation - Translation updated successfully for UUID: ${uuid}`);
            return res.status(200).json({
                success: true,
                message: 'Traduction mise à jour avec succès'
            });
        } catch (error) {
            logger.error(`[CONTROLLER] updateSymptomTranslation - Error: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: 'Une erreur est survenue lors de la mise à jour de la traduction'
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
