const db = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Get all ticket statuses with translations for a specific language
 * @param {string} lang - Language code
 * @param {Object} options - Additional options
 * @param {string} [options.toSelect] - If 'yes', returns data in value/label format
 * @param {string} [options.ticket_type] - Filter statuses by ticket type
 * @returns {Promise<Array>} Array of ticket statuses with translations
 */
const getAllTicketStatus = async (lang, options = {}) => {
    logger.info(`[SERVICE] Fetching ticket statuses with translations for language: ${lang}`);
    
    try {
        let query;
        let params = [lang];
        
        // Base WHERE clause
        let whereClause = '';
        
        // Add ticket_type filter if provided
        if (options.ticket_type) {
            logger.info(`[SERVICE] Filtering by ticket type: ${options.ticket_type}`);
            whereClause = `WHERE ts.rel_ticket_type = $2`;
            params.push(options.ticket_type);
        }
        
        if (options.toSelect === 'yes') {
            query = `
                SELECT 
                    ts.code as value,
                    COALESCE(tst.label, ts.code) as label
                FROM configuration.ticket_status ts
                LEFT JOIN translations.ticket_status_translation tst 
                    ON ts.uuid = tst.ticket_status_uuid 
                    AND tst.lang = $1
                ${whereClause}
                ORDER BY ts.code ASC;
            `;
        } else {
            query = `
                SELECT 
                    ts.uuid,
                    ts.code,
                    ts.rel_ticket_type as ticket_type,
                    COALESCE(tst.label, ts.code) as label,
                    ts.date_creation,
                    ts.date_modification
                FROM configuration.ticket_status ts
                LEFT JOIN translations.ticket_status_translation tst 
                    ON ts.uuid = tst.ticket_status_uuid 
                    AND tst.lang = $1
                ${whereClause}
                ORDER BY ts.code ASC;
            `;
        }
        
        const result = await db.query(query, params);
        logger.info(`[SERVICE] Successfully retrieved ${result.rows.length} ticket statuses`);
        return result.rows;
    } catch (error) {
        logger.error('[SERVICE] Error while fetching ticket statuses:', error);
        throw error;
    }
};

module.exports = {
    getAllTicketStatus
};
