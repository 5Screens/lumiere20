const resolutionCodeService = require('./service');
const logger = require('../../../config/logger');

const getResolutionCodes = async (req, res) => {
    logger.info('[CONTROLLER] Starting to process getResolutionCodes request');
    
    try {
        const resolutionCodes = await resolutionCodeService.getResolutionCodes(req.query.lang, req.query.toSelect);
        logger.info(`[CONTROLLER] Successfully retrieved ${resolutionCodes.length} resolution codes`);
        res.json(resolutionCodes);
    } catch (error) {
        logger.error(`[CONTROLLER] Error: ${error.message}`);
        res.status(500).json({ 
            error: 'An error occurred while retrieving resolution codes' 
        });
    }
};

const getResolutionCodeByUuid = async (req, res) => {
    const uuid = req.params.uuid;
    const lang = req.query.lang || 'en';
    
    logger.info(`[CONTROLLER] Processing request for UUID: ${uuid}, language: ${lang}`);
    
    try {
        const resolutionCode = await resolutionCodeService.getResolutionCodeByUuid(uuid, lang);
        
        if (!resolutionCode) {
            logger.warn(`[CONTROLLER] Resolution code not found with UUID: ${uuid}`);
            return res.status(404).json({
                error: 'Resolution code not found'
            });
        }
        
        logger.info(`[CONTROLLER] Successfully retrieved resolution code with UUID: ${uuid}`);
        return res.json(resolutionCode);
    } catch (error) {
        logger.error(`[CONTROLLER] Error: ${error.message}`);
        return res.status(500).json({
            error: 'Error while retrieving resolution code'
        });
    }
};

module.exports = {
    getResolutionCodes,
    getResolutionCodeByUuid
};
