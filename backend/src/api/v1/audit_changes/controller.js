const auditChangesService = require('./service');
const logger = require('../../../config/logger');

async function getAuditChangesByObjectUuid(req, res) {
    try {
        const { uuid } = req.query;
        logger.info(`[CONTROLLER] getAuditChangesByObjectUuid - Processing request for object UUID: ${uuid}`);
        
        const result = await auditChangesService.getAuditChangesByObjectUuid(uuid);
        
        logger.info(`[CONTROLLER] getAuditChangesByObjectUuid - Successfully retrieved audit changes for object UUID: ${uuid}`);
        return res.json(result);
    } catch (error) {
        logger.error(`[CONTROLLER] getAuditChangesByObjectUuid - Error: ${error.message}`);
        
        // Specific handling for UUID format errors
        if (error.message.includes('uuid')) {
            return res.status(400).json({
                error: `Invalid UUID format: "${req.query.uuid}". The following error occurred: ${error.message}`
            });
        }
        
        return res.status(500).json({
            error: 'Error while retrieving audit changes',
            details: error.message
        });
    }
}

module.exports = {
    getAuditChangesByObjectUuid
};
