const db = require('../../../config/database');
const logger = require('../../../config/logger');

class ServicesService {
    async getServicesPerEntityCount(entityUuid) {
        logger.info(`[SERVICE] getServicesPerEntityCount - Starting database query for entity UUID: ${entityUuid}`);
        try {
            // First check if the entity exists
            const checkEntityQuery = `
                SELECT uuid FROM configuration.entities WHERE uuid = $1
            `;
            const entityResult = await db.query(checkEntityQuery, [entityUuid]);
            
            if (entityResult.rows.length === 0) {
                logger.warn(`[SERVICE] getServicesPerEntityCount - Entity with UUID ${entityUuid} not found`);
                return null; // Entity not found
            }
            
            // Count services owned by the entity
            const query = `
                SELECT COUNT(uuid) as count
                FROM data.services
                WHERE owning_entity_uuid = $1`;

            const result = await db.query(query, [entityUuid]);
            logger.info(`[SERVICE] getServicesPerEntityCount - Query executed successfully, found ${result.rows[0].count} services for entity`);
            
            return {
                entity_uuid: entityUuid,
                services_count: parseInt(result.rows[0].count)
            };
        } catch (error) {
            logger.error(`[SERVICE] getServicesPerEntityCount - Database error: ${error.message}`);
            throw error;
        }
    }

    async getAllServices(lang = 'en') {
        logger.info(`[SERVICE] getAllServices - Starting database query with language: ${lang}`);
        try {
            const query = `
                SELECT 
                    s.uuid, 
                    s.name,
                    s.description,
                    s.owning_entity_uuid,
                    e.name as owning_entity_name,
                    s.owned_by_uuid,
                    CASE 
                        WHEN s.owned_by_uuid IS NULL THEN NULL 
                        ELSE CONCAT(p_owner.first_name, ' ', p_owner.last_name) 
                    END as owned_by_name,
                    s.managed_by_uuid,
                    CASE 
                        WHEN s.managed_by_uuid IS NULL THEN NULL 
                        ELSE CONCAT(p_manager.first_name, ' ', p_manager.last_name) 
                    END as managed_by_name,
                    s.business_criticality,
                    s.lifecycle_status,
                    s.version,
                    s.operational,
                    s.legal_regulatory,
                    s.reputational,
                    s.financial,
                    s.comments,
                    s.cab_uuid,
                    g.group_name as cab_name,
                    s.parent_uuid,
                    parent.name as parent_service_name,
                    s.created_at,
                    s.updated_at
                FROM data.services s
                LEFT JOIN configuration.entities e ON s.owning_entity_uuid = e.uuid
                LEFT JOIN configuration.persons p_owner ON s.owned_by_uuid = p_owner.uuid
                LEFT JOIN configuration.persons p_manager ON s.managed_by_uuid = p_manager.uuid
                LEFT JOIN configuration.groups g ON s.cab_uuid = g.uuid
                LEFT JOIN data.services parent ON s.parent_uuid = parent.uuid
                ORDER BY s.name ASC`;
            
            const result = await db.query(query);
            logger.info(`[SERVICE] getAllServices - Query executed successfully, found ${result.rows.length} services`);
            
            // Si la langue demandée est différente de l'anglais, on pourrait chercher des traductions
            // Pour l'instant, on retourne simplement les données en anglais
            return result.rows;
        } catch (error) {
            logger.error(`[SERVICE] getAllServices - Database error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new ServicesService();
