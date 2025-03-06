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
}

module.exports = new ServicesService();
