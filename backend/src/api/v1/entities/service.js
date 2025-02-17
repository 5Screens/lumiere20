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

    async getEntityByUuid(uuid) {
        logger.info(`[SERVICE] getEntityByUuid - Starting database query for UUID: ${uuid}`);
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
                LEFT JOIN configuration.entities parent ON e.parent_uuid = parent.uuid
                LEFT JOIN configuration.persons p ON e.budget_approver_uuid = p.uuid
                WHERE e.uuid = $1`;
            
            const result = await pool.query(query, [uuid]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return result.rows[0];
        } catch (error) {
            logger.error(`[SERVICE] getEntityByUuid - Error: ${error.message}`);
            throw error;
        }
    }

    async getEntityByEntityId(entityId) {
        logger.info(`[SERVICE] getEntityByEntityId - Starting database query for entity_id: ${entityId}`);
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
                LEFT JOIN configuration.entities parent ON e.parent_uuid = parent.uuid
                LEFT JOIN configuration.persons p ON e.budget_approver_uuid = p.uuid
                WHERE e.entity_id = $1`;
            
            const result = await pool.query(query, [entityId]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return result.rows[0];
        } catch (error) {
            logger.error(`[SERVICE] getEntityByEntityId - Error: ${error.message}`);
            throw error;
        }
    }

    async getChildEntities(parentEntityId) {
        logger.info(`[SERVICE] getChildEntities - Starting database query for parent entity_id: ${parentEntityId}`);
        try {
            // D'abord, on récupère l'UUID de l'entité parent
            const parentQuery = `
                SELECT uuid 
                FROM configuration.entities 
                WHERE entity_id = $1`;
            
            const parentResult = await pool.query(parentQuery, [parentEntityId]);
            
            if (parentResult.rows.length === 0) {
                return null; // Parent non trouvé
            }
            
            const parentUuid = parentResult.rows[0].uuid;
            
            // Ensuite, on récupère toutes les entités enfants
            const childrenQuery = `
                SELECT 
                    e.uuid, 
                    e.entity_id,
                    e.name, 
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
                WHERE e.parent_uuid = $1
                ORDER BY e.name ASC`;
            
            const childrenResult = await pool.query(childrenQuery, [parentUuid]);
            
            return {
                parent_entity_id: parentEntityId,
                children: childrenResult.rows
            };
        } catch (error) {
            logger.error(`[SERVICE] getChildEntities - Error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new EntityService();
