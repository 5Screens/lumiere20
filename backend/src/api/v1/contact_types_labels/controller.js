const contactTypesLabelsService = require('./service');
const logger = require('../../../config/logger');

class ContactTypesLabelsController {

    async patchContactTypeLabel(req, res) {
        logger.info('[CONTROLLER] patchContactTypeLabel - Starting to process request');
        try {
            const { uuid } = req.params;
            const { label } = req.body;
            
            logger.info(`[CONTROLLER] patchContactTypeLabel - Patching label with UUID: ${uuid}`);
            
            const patchedLabel = await contactTypesLabelsService.patchContactTypeLabel(uuid, label);
            
            if (!patchedLabel) {
                logger.info(`[CONTROLLER] patchContactTypeLabel - No label found with UUID: ${uuid}`);
                return res.status(404).json({
                    success: false,
                    message: `No label found with UUID: ${uuid}`
                });
            }
            
            logger.info(`[CONTROLLER] patchContactTypeLabel - Label patched successfully for UUID: ${uuid}`);
            return res.status(200).json({
                success: true,
                message: 'Label updated successfully',
                data: patchedLabel
            });
        } catch (error) {
            logger.error(`[CONTROLLER] patchContactTypeLabel - Error: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: 'An error occurred while updating the label'
            });
        }
    }
}

module.exports = new ContactTypesLabelsController();
