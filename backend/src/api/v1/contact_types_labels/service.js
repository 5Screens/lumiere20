const { pool } = require('../../../config/database');
const logger = require('../../../config/logger');

class ContactTypesLabelsService {
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
