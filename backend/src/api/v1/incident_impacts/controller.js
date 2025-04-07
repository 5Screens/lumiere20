const { getIncidentImpacts } = require('./service');
const logger = require('../../../config/logger');

const getAllIncidentImpacts = async (req, res) => {
    logger.info('[CONTROLLER] Processing get all incident impacts request');
    
    try {
        const { lang } = req.query;
        const impacts = await getIncidentImpacts(lang);
        
        logger.info('[CONTROLLER] Successfully retrieved incident impacts');
        res.json(impacts);
    } catch (error) {
        logger.error(`[CONTROLLER] Error retrieving incident impacts: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getAllIncidentImpacts
};
