const { pool } = require('../../../config/database');
const logger = require('../../../config/logger');

class LanguageService {
    async getActiveLanguages() {
        logger.info('[SERVICE] getActiveLanguages - Starting database query');
        try {
            const query = `
                SELECT DISTINCT locale, locale as value, native_name as label, code
                FROM translations.languages
                WHERE is_active = true
                ORDER BY locale ASC`;
            
            const result = await pool.query(query);
            logger.info(`[SERVICE] getActiveLanguages - Query executed successfully, found ${result.rows.length} records`);
            return result.rows;
        } catch (error) {
            logger.error(`[SERVICE] getActiveLanguages - Database error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new LanguageService();
