const { pool } = require('../../../config/database');
const logger = require('../../../config/logger');

class ContactTypesLabelsService {
    async createContactTypeLabel(data) {
        logger.info(`[SERVICE] createContactTypeLabel - Starting creation for parent_code: ${data.parent_code}, lang_code: ${data.lang_code}`);
        try {
            const query = `
                INSERT INTO translations.contact_types_labels 
                (uuid, rel_contact_type_code, language, label, created_at, updated_at)
                VALUES (uuid_generate_v4(), $1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING *
            `;
            
            const result = await pool.query(query, [data.parent_code, data.lang_code, data.label]);
            
            logger.info(`[SERVICE] createContactTypeLabel - Label created successfully with UUID: ${result.rows[0].uuid}`);
            return result.rows[0];
        } catch (error) {
            logger.error(`[SERVICE] createContactTypeLabel - Database error: ${error.message}`);
            throw error;
        }
    }

    async patchContactTypeLabel(uuid, label) {
        logger.info(`[SERVICE] patchContactTypeLabel - Starting patch for label with UUID: ${uuid}`);
        try {
            const query = `
                UPDATE translations.contact_types_labels
                SET label = $1, updated_at = CURRENT_TIMESTAMP
                WHERE uuid = $2
                RETURNING *
            `;
            
            const result = await pool.query(query, [label, uuid]);
            
            if (result.rows.length === 0) {
                logger.info(`[SERVICE] patchContactTypeLabel - No label found with UUID: ${uuid}`);
                return null;
            }
            
            logger.info(`[SERVICE] patchContactTypeLabel - Label patched successfully for UUID: ${uuid}`);
            return result.rows[0];
        } catch (error) {
            logger.error(`[SERVICE] patchContactTypeLabel - Database error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new ContactTypesLabelsService();
