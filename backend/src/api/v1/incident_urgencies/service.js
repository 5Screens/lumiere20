const db = require('../../../config/database');
const logger = require('../../../config/logger');

const getIncidentUrgencies = async (lang) => {
    logger.info('[SERVICE] Getting incident urgencies');
    
    try {
        const query = `
            SELECT 
                iu.uuid,
                iu.code,
                iu.value,
                COALESCE(iul.label, iu.code) as label
            FROM configuration.incident_urgencies iu
            LEFT JOIN translations.incident_urgencies_labels iul 
                ON iu.code = iul.rel_incident_urgency_code 
                AND iul.language = $1
            INNER JOIN translations.languages l 
                ON l.code = $1 
                AND l.is_active = true
            ORDER BY iu.value ASC;
        `;

        const result = await db.query(query, [lang]);
        
        logger.info(`[SERVICE] Found ${result.rows.length} incident urgencies`);
        return result.rows;
    } catch (error) {
        logger.error(`[SERVICE] Error getting incident urgencies: ${error.message}`);
        throw error;
    }
};

module.exports = {
    getIncidentUrgencies
};
