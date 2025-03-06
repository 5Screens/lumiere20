const db = require('../../../config/database');
const logger = require('../../../config/logger');

class AuditChangesService {
    async getAuditChangesByObjectUuid(objectUuid) {
        logger.info(`[SERVICE] getAuditChangesByObjectUuid - Starting database query for object UUID: ${objectUuid}`);
        try {
            // Query to get all audit changes for a specific object UUID
            const query = `
                SELECT 
                    id,
                    object_type,
                    object_uuid,
                    event_type,
                    attribute_name,
                    old_value,
                    new_value,
                    user_id,
                    event_date
                FROM 
                    audit.audit_changes
                WHERE 
                    object_uuid = $1
                ORDER BY 
                    event_date DESC
            `;

            const result = await db.query(query, [objectUuid]);
            
            if (result.rows.length === 0) {
                logger.info(`[SERVICE] getAuditChangesByObjectUuid - No audit records found for object UUID: ${objectUuid}`);
                return [];
            }
            
            logger.info(`[SERVICE] getAuditChangesByObjectUuid - Successfully retrieved ${result.rows.length} audit records for object UUID: ${objectUuid}`);
            return result.rows;
        } catch (error) {
            logger.error(`[SERVICE] getAuditChangesByObjectUuid - Database error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new AuditChangesService();
