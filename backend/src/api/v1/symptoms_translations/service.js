const { pool } = require('../../../config/database');
const logger = require('../../../config/logger');

class SymptomsTranslationsService {
    async createSymptomTranslation(translationData) {
        logger.info('[SERVICE] createSymptomTranslation - Starting database operation');
        try {
            const { label, parent_uuid, lang_code } = translationData;
            
            logger.info(`[SERVICE] createSymptomTranslation - Creating translation for parent_uuid: ${parent_uuid}, lang: ${lang_code}`);
            
            // Aller chercher le code avec l'aide du parent_uuid
            const query = `
                SELECT code
                FROM configuration.symptoms
                WHERE uuid = $1
            `;
            const result = await pool.query(query, [parent_uuid]);
            
            if (result.rows.length === 0) {
                throw new Error(`Symptom not found for UUID: ${parent_uuid}`);
            }
            
            const symptom_code = result.rows[0].code;
            
            // Insérer la traduction avec le symptom_code
            const query2 = `
                INSERT INTO translations.symptoms_translation (symptom_code, langue, libelle)
                VALUES ($1, $2, $3)
                RETURNING uuid, symptom_code, langue, libelle, created_at, updated_at
            `;
            
            const result2 = await pool.query(query2, [symptom_code, lang_code, label]);
            
            if (result2.rows.length === 0) {
                throw new Error('Failed to create symptom translation');
            }
            
            const createdTranslation = result2.rows[0];
            logger.info(`[SERVICE] createSymptomTranslation - Translation created successfully with UUID: ${createdTranslation.uuid}`);
            
            return createdTranslation;
        } catch (error) {
            logger.error(`[SERVICE] createSymptomTranslation - Database error: ${error.message}`);
            throw error;
        }
    }

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
