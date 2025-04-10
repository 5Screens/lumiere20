const db = require('../../../config/database');
const logger = require('../../../config/logger');

const getIncidentImpacts = async (lang, toSelect) => {
    logger.info('[SERVICE] Getting incident impacts');
    
    try {
        const query = `
            SELECT 
                ii.uuid,
                ii.code,
                ii.value,
                COALESCE(iil.label, ii.code) as label
            FROM configuration.incident_impacts ii
            LEFT JOIN translations.incident_impacts_labels iil 
                ON ii.code = iil.rel_incident_impact_code 
                AND iil.language = $1
            INNER JOIN translations.languages l 
                ON l.code = $1 
                AND l.is_active = true
            ORDER BY ii.value ASC;
        `;

        const result = await db.query(query, [lang]);
        
        logger.info(`[SERVICE] Found ${result.rows.length} incident impacts`);
        
        // If toSelect=yes, transform the data to value/label pairs
        if (toSelect === 'yes') {
            logger.info('[SERVICE] Transforming data to value/label format for select component');
            return result.rows.map(impact => ({
                value: impact.code,
                label: impact.label
            }));
        }
        
        return result.rows;
    } catch (error) {
        logger.error(`[SERVICE] Error getting incident impacts: ${error.message}`);
        throw error;
    }
};

module.exports = {
    getIncidentImpacts
};
