const { getIncidentCauseCodes } = require('./service');
const logger = require('../../../config/logger');

const getIncidentCauseCodesController = async (req, res) => {
    logger.info('[CONTROLLER] Processing get incident cause codes request');
    
    try {
        const { lang, toSelect } = req.query;
        const incidentCauseCodes = await getIncidentCauseCodes(lang, toSelect);
        
        logger.info('[CONTROLLER] Successfully retrieved incident cause codes');
        res.json(incidentCauseCodes);
    } catch (error) {
        logger.error(`[CONTROLLER] Error in get incident cause codes controller: ${error.message}`);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error while retrieving incident cause codes'
        });
    }
};

module.exports = {
    getIncidentCauseCodesController
};
