const db = require('../../../config/database');
const logger = require('../../../config/logger');

const getIncidentCauseCodes = async (lang, toSelect) => {
    logger.info('[SERVICE] Getting incident cause codes with translations');
    
    try {
        const query = `
            SELECT 
                icc.uuid,
                icc.code,
                COALESCE(iccl.label, icc.code) as label
            FROM 
                configuration.incident_cause_codes icc
            LEFT JOIN 
                translations.incident_cause_codes_labels iccl 
                ON icc.code = iccl.rel_incident_cause_code_code 
                AND iccl.language = $1
            ORDER BY 
                icc.code ASC;
        `;

        const result = await db.query(query, [lang]);
        logger.info('[SERVICE] Successfully retrieved incident cause codes');
        
        // If toSelect=yes, transform the data to value/label pairs
        if (toSelect === 'yes') {
            logger.info('[SERVICE] Transforming incident cause codes to select format');
            return result.rows.map(causeCode => ({
                value: causeCode.code,
                label: causeCode.label
            }));
        }
        
        return result.rows;
    } catch (error) {
        logger.error(`[SERVICE] Error getting incident cause codes: ${error.message}`);
        throw error;
    }
};

module.exports = {
    getIncidentCauseCodes
};
