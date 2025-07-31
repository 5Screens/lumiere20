const { pool } = require('../../../config/database');
const logger = require('../../../config/logger');

class SymptomsTranslationsService {
    async patchSymptomTranslation(uuid, label) {
        logger.info(`[SERVICE] patchSymptomTranslation - Starting patch for translation with UUID: ${uuid}`);
        try {
            const query = `
                UPDATE translations.symptoms_translation
                SET libelle = $1, updated_at = CURRENT_TIMESTAMP
                WHERE uuid = $2
                RETURNING *
            `;
            
            const result = await pool.query(query, [label, uuid]);
            
            if (result.rows.length === 0) {
                logger.info(`[SERVICE] patchSymptomTranslation - No translation found with UUID: ${uuid}`);
                return null;
            }
            
            logger.info(`[SERVICE] patchSymptomTranslation - Translation patched successfully for UUID: ${uuid}`);
            return result.rows[0];
        } catch (error) {
            logger.error(`[SERVICE] patchSymptomTranslation - Database error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new SymptomsTranslationsService();
