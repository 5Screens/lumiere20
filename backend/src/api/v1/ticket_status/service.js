const db = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Get all ticket statuses with translations for a specific language
 * @param {string} lang - Language code
 * @param {Object} options - Additional options
 * @param {string} [options.toSelect] - If 'yes', returns data in value/label format
 * @returns {Promise<Array>} Array of ticket statuses with translations
 */
const getAllTicketStatus = async (lang, options = {}) => {
    logger.info(`[SERVICE] Fetching all ticket statuses with translations for language: ${lang}`);
    
    try {
        let query;
        if (options.toSelect === 'yes') {
            query = `
                SELECT 
                    ts.code as value,
                    COALESCE(tst.label, ts.code) as label
                FROM configuration.ticket_status ts
                LEFT JOIN translations.ticket_status_translation tst 
                    ON ts.uuid = tst.ticket_status_uuid 
                    AND tst.lang = $1
                ORDER BY ts.code ASC;
            `;
        } else {
            query = `
                SELECT 
                    ts.uuid,
                    ts.code,
                    COALESCE(tst.label, ts.code) as label,
                    ts.date_creation,
                    ts.date_modification
                FROM configuration.ticket_status ts
                LEFT JOIN translations.ticket_status_translation tst 
                    ON ts.uuid = tst.ticket_status_uuid 
                    AND tst.lang = $1
                ORDER BY ts.code ASC;
            `;
        }
        
        const result = await db.query(query, [lang]);
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
