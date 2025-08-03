const { pool } = require('../../../config/database');
const logger = require('../../../config/logger');

class ContactTypesLabelsService {
    async createContactTypeLabel(data) {
        logger.info(`[SERVICE] createContactTypeLabel - Starting creation for parent_uuid: ${data.parent_uuid}, lang_code: ${data.lang_code}`);
        try {
            const { label, parent_uuid, lang_code } = data;
            
            // Aller chercher le code avec l'aide du parent_uuid
            const query = `
                SELECT code
                FROM configuration.contact_types
                WHERE uuid = $1
            `;
            const result = await pool.query(query, [parent_uuid]);
            
            if (result.rows.length === 0) {
                throw new Error(`Contact type not found for UUID: ${parent_uuid}`);
            }
            
            const rel_contact_type_code = result.rows[0].code;
            
            // Insérer le label avec le rel_contact_type_code
            const query2 = `
                INSERT INTO translations.contact_types_labels 
                (rel_contact_type_code, language, label)
                VALUES ($1, $2, $3)
                RETURNING *
            `;
            
            const result2 = await pool.query(query2, [rel_contact_type_code, lang_code, label]);
            
            if (result2.rows.length === 0) {
                throw new Error('Failed to create contact type label');
            }
            
            const createdLabel = result2.rows[0];
            logger.info(`[SERVICE] createContactTypeLabel - Label created successfully with UUID: ${createdLabel.uuid}`);
            
            return createdLabel;
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
