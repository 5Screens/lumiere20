const { pool } = require('../../../config/database');
const logger = require('../../../config/logger');

const getResolutionCodes = async (lang , toSelect) => {
    logger.info(`[SERVICE] Getting incident resolution codes for language: ${lang}`);
    
    try {
        const query = `
            SELECT 
                rc.uuid, 
                rc.code, 
                COALESCE(rcl.label, rc.code) as label
            FROM configuration.incident_resolution_codes rc
            LEFT JOIN translations.incident_resolution_codes_labels rcl 
                ON rc.code = rcl.rel_incident_resolution_code 
                AND rcl.language = $1
            INNER JOIN translations.languages l 
                ON l.code = $1 
                AND l.is_active = true;`
        
        const result = await pool.query(query, [lang]);
        
        logger.info(`[SERVICE] Found ${result.rows.length} incident resolution codes`);
        
        // If toSelect=yes, transform the data to value/label pairs
        if (toSelect === 'yes') {
            logger.info('[SERVICE] Transforming data to value/label format for select component');
            return result.rows.map(code => ({
                value: code.code,
                label: code.label
            }));
        }
        
        return result.rows;
    } catch (error) {
        logger.error(`[SERVICE] Error getting incident resolution codes: ${error.message}`);
        throw error;
    }
};

const getResolutionCodeByUuid = async (uuid, lang) => {
    logger.info(`[SERVICE] Getting incident resolution code by UUID: ${uuid}, language: ${lang}`);
    
    try {
        const query = `
            SELECT 
                rc.uuid, 
                rc.code, 
                rc.value,
                COALESCE(rcl.label, rc.code) as label
            FROM configuration.incident_resolution_codes rc
            LEFT JOIN translations.incident_resolution_codes_labels rcl 
                ON rc.code = rcl.rel_incident_resolution_code 
                AND rcl.language = $1
            INNER JOIN translations.languages l 
                ON l.code = $1 
                AND l.is_active = true
            WHERE rc.uuid = $2`;
        
        const result = await pool.query(query, [lang, uuid]);
        
        if (result.rows.length === 0) {
            logger.warn(`[SERVICE] No resolution code found with UUID: ${uuid}`);
            return null;
        }
        
        logger.info(`[SERVICE] Successfully retrieved resolution code with UUID: ${uuid}`);
        return result.rows[0];
    } catch (error) {
        logger.error(`[SERVICE] Error getting incident resolution code by UUID: ${error.message}`);
        throw error;
    }
};

module.exports = {
    getResolutionCodes,
    getResolutionCodeByUuid
};
