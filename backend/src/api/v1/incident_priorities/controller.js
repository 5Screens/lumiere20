const { getIncidentPriority } = require('./service');
const logger = require('../../../config/logger');

const getIncidentPriorityByUrgencyAndImpact = async (req, res) => {
    logger.info('[CONTROLLER] Processing get incident priority request');
    
    try {
        // Use resolved query parameters from validation middleware
        const { incident_urgencies, incident_impacts } = req.resolvedQuery || req.query;
        const priority = await getIncidentPriority(incident_urgencies, incident_impacts);
        
        if (!priority) {
            logger.warn('[CONTROLLER] No priority found for given urgency and impact');
            return res.status(404).json({ error: 'No priority found for given urgency and impact combination' });
        }
        
        logger.info('[CONTROLLER] Successfully retrieved incident priority');
        res.json(priority);
    } catch (error) {
        logger.error(`[CONTROLLER] Error retrieving incident priority: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getIncidentPriorityByUrgencyAndImpact
};
