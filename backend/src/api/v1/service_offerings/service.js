const db = require('../../../config/database');
const logger = require('../../../config/logger');

class ServiceOfferingsService {
    async getSubscribedOfferingsCount(entityUuid) {
        logger.info(`[SERVICE] getSubscribedOfferingsCount - Starting database query for entity UUID: ${entityUuid}`);
        try {
            // First check if the entity exists
            const checkEntityQuery = `
                SELECT uuid FROM configuration.entities WHERE uuid = $1
            `;
            const entityResult = await db.query(checkEntityQuery, [entityUuid]);
            
            if (entityResult.rows.length === 0) {
                logger.warn(`[SERVICE] getSubscribedOfferingsCount - Entity with UUID ${entityUuid} not found`);
                return null; // Entity not found
            }
            
            // Count subscribed offerings
            const query = `
                SELECT COUNT(DISTINCT so.uuid) as count
                FROM data.rel_subscribers_serviceofferings rss
                JOIN data.service_offerings so ON rss.service_offering_uuid = so.uuid
                WHERE rss.subscriber_uuid = $1`;

            const result = await db.query(query, [entityUuid]);
            logger.info(`[SERVICE] getSubscribedOfferingsCount - Query executed successfully, found ${result.rows[0].count} subscribed offerings for entity`);
            
            return {
                entity_uuid: entityUuid,
                offerings_count: parseInt(result.rows[0].count)
            };
        } catch (error) {
            logger.error(`[SERVICE] getSubscribedOfferingsCount - Database error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new ServiceOfferingsService();
