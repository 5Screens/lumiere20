const { pool } = require('../../../config/database');
const logger = require('../../../config/logger');

class SymptomsTranslationsService {
    async updateSymptomTranslation(uuid, libelle) {
        logger.info(`[SERVICE] updateSymptomTranslation - Starting update for translation with UUID: ${uuid}`);
        try {
            const query = `
                UPDATE translations.symptoms_translation
                SET libelle = $1, updated_at = CURRENT_TIMESTAMP
                WHERE uuid = $2
                RETURNING *
            `;
            
            const result = await pool.query(query, [libelle, uuid]);
            
            if (result.rows.length === 0) {
                logger.info(`[SERVICE] updateSymptomTranslation - No translation found with UUID: ${uuid}`);
                return null;
            }
            
            logger.info(`[SERVICE] updateSymptomTranslation - Translation updated successfully for UUID: ${uuid}`);
            return result.rows[0];
        } catch (error) {
            logger.error(`[SERVICE] updateSymptomTranslation - Database error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new SymptomsTranslationsService();
