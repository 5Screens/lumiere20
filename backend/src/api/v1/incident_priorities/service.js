const db = require('../../../config/database');
const logger = require('../../../config/logger');

const getIncidentPriority = async (urgencyCode, impactCode) => {
    logger.info('[SERVICE] Getting incident priority');
    
    try {
        const query = `
            SELECT 
                uuid,
                code as label,
                priority_level as value
            FROM configuration.incident_priorities
            WHERE rel_incident_urgency_code = $1
            AND rel_incident_impact_code = $2;
        `;

        const result = await db.query(query, [urgencyCode, impactCode]);
        
        logger.info(`[SERVICE] Found incident priority for urgency ${urgencyCode} and impact ${impactCode}`);
        return result.rows || [];
    } catch (error) {
        logger.error(`[SERVICE] Error getting incident priority: ${error.message}`);
        throw error;
    }
};

/**
 * Get all unique priority values
 * @param {string} lang - Language code for translations
 * @returns {Promise<Array>} - List of unique priorities
 */
const getAllPriorities = async (lang = 'en') => {
    logger.info(`[SERVICE] Getting all unique priorities with language: ${lang}`);
    
    try {
        const query = `
            SELECT DISTINCT
                priority_level as priority,
                priority_level as value,
                priority_level::text as label
            FROM configuration.incident_priorities
            ORDER BY priority_level ASC;
        `;

        const result = await db.query(query);
        
        logger.info(`[SERVICE] Found ${result.rows.length} unique priorities`);
        return result.rows || [];
    } catch (error) {
        logger.error(`[SERVICE] Error getting all priorities: ${error.message}`);
        throw error;
    }
};

module.exports = {
    getIncidentPriority,
    getAllPriorities
};
