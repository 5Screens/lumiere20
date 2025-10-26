const { getIncidentPriority, getAllPriorities } = require('./service');
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

/**
 * Get all unique priority values
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const getAllIncidentPriorities = async (req, res) => {
    logger.info('[CONTROLLER] Processing get all incident priorities request');
    
    try {
        const { lang = 'en' } = req.query;
        const priorities = await getAllPriorities(lang);
        
        logger.info(`[CONTROLLER] Successfully retrieved ${priorities.length} unique priorities`);
        res.json(priorities);
    } catch (error) {
        logger.error(`[CONTROLLER] Error retrieving all priorities: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getIncidentPriorityByUrgencyAndImpact,
    getAllIncidentPriorities
};
