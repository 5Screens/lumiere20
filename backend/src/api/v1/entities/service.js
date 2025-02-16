const { pool } = require('../../../config/database');
const logger = require('../../../config/logger');

class EntityService {
    async getAllEntities() {
        logger.info('[SERVICE] getAllEntities - Starting database query');
        try {
            const query = `
                SELECT 
                    e.uuid, 
                    e.entity_id,
                    e.name, 
                    parent.name as parent_entity_name,
                    e.external_id, 
                    e.entity_type,
                    e.headquarters_location,
                    e.is_active,
                    CASE 
                        WHEN e.budget_approver_uuid IS NULL THEN NULL 
                        ELSE CONCAT(p.first_name, ' ', p.last_name) 
                    END as budget_approver_name,
                    e.date_creation,
                    e.date_modification
                FROM configuration.entities e
                LEFT JOIN configuration.persons p ON e.budget_approver_uuid = p.uuid
                LEFT JOIN configuration.entities parent ON e.parent_uuid = parent.uuid
                ORDER BY e.name ASC`;
            
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
