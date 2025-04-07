const { getIncidentUrgencies } = require('./service');
const logger = require('../../../config/logger');

const getAllIncidentUrgencies = async (req, res) => {
    logger.info('[CONTROLLER] Processing get all incident urgencies request');
    
    try {
        const { lang } = req.query;
        const urgencies = await getIncidentUrgencies(lang);
        
        logger.info('[CONTROLLER] Successfully retrieved incident urgencies');
        res.json(urgencies);
    } catch (error) {
        logger.error(`[CONTROLLER] Error retrieving incident urgencies: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getAllIncidentUrgencies
};
