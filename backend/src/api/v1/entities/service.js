const { pool } = require('../../../config/database');
const logger = require('../../../config/logger');

class EntityService {
    async getAllEntities() {
        logger.info('[SERVICE] getAllEntities - Starting database query');
        try {
            const query = `
                SELECT 
                    uuid, name, entity_id, external_id, entity_type,
                    budget_approver_uuid, headquarters_location,
                    is_active, parent_uuid
                FROM configuration.entities
                ORDER BY name ASC`;
            
            const result = await pool.query(query);
            logger.info(`[SERVICE] getAllEntities - Query executed successfully, found ${result.rows.length} records`);
            return result.rows;
        } catch (error) {
            logger.error(`[SERVICE] getAllEntities - Database error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new EntityService();
