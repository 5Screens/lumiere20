const db = require('../../../config/database');
const logger = require('../../../config/logger');

class TicketTypeService {
    async getTicketTypes(lang) {
        try {
            const query = `
                SELECT 
                    tt.uuid,
                    tt.code,
                    COALESCE(ttt.label, tt.code) as label
                FROM configuration.ticket_types tt
                LEFT JOIN translations.ticket_types_translation ttt 
                    ON tt.uuid = ttt.ticket_type_uuid 
                    AND ttt.lang = $1
                ORDER BY tt.code`;

            const result = await db.query(query, [lang]);
            logger.info(`[SERVICE] Retrieved ${result.rows.length} ticket types for language ${lang}`);
            return result.rows;
        } catch (error) {
            logger.error('[SERVICE] Error while retrieving ticket types:', error);
            throw error;
        }
    }
}

module.exports = new TicketTypeService();
