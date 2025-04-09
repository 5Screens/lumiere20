const { getIncidentPriority } = require('./service');
const logger = require('../../../config/logger');

const getIncidentPriorityByUrgencyAndImpact = async (req, res) => {
    logger.info('[CONTROLLER] Processing get incident priority request');
    
    try {
        // Use resolved query parameters from validation middleware
        const { incident_urgencies, incident_impacts } = req.resolvedQuery || req.query;
        const priorities = await getIncidentPriority(incident_urgencies, incident_impacts);
        
        if (!priorities || priorities.length === 0) {
            logger.warn('[CONTROLLER] No priorities found for given urgency and impact');
            return res.status(404).json({ error: 'No priorities found for given urgency and impact combination' });
        }
        
        logger.info('[CONTROLLER] Successfully retrieved incident priorities');
        res.json(priorities);
    } catch (error) {
        logger.error(`[CONTROLLER] Error retrieving incident priorities: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getIncidentPriorityByUrgencyAndImpact
};
