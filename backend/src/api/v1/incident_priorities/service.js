const db = require('../../../config/database');
const logger = require('../../../config/logger');

const getIncidentPriority = async (urgencyCode, impactCode) => {
    logger.info('[SERVICE] Getting incident priority');
    
    try {
        const query = `
            SELECT 
                uuid,
                code,
                priority_level as level
            FROM configuration.incident_priorities
            WHERE rel_incident_urgency_code = $1
            AND rel_incident_impact_code = $2;
        `;

        const result = await db.query(query, [urgencyCode, impactCode]);
        
        logger.info(`[SERVICE] Found incident priority for urgency ${urgencyCode} and impact ${impactCode}`);
        return result.rows[0] || null;
    } catch (error) {
        logger.error(`[SERVICE] Error getting incident priority: ${error.message}`);
        throw error;
    }
};

module.exports = {
    getIncidentPriority
};
