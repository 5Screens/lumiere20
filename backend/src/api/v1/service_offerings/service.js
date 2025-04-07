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

    async getAllServices() {
        try {
            logger.info('[SERVICE] Getting all services');
            const query = `
                SELECT 
                    s.uuid,
                    s.name,
                    s.description,
                    s.business_criticality,
                    s.lifecycle_status,
                    s.version,
                    s.operational,
                    s.legal_regulatory,
                    s.reputational,
                    s.financial,
                    s.comments,
                    s.date_creation,
                    s.date_modification,
                    e.name as owning_entity_name,
                    p1.first_name || ' ' || p1.last_name as owned_by_name,
                    p2.first_name || ' ' || p2.last_name as managed_by_name,
                    g.groupe_name as cab_name,
                    parent.name as parent_service_name
                FROM data.services s
                LEFT JOIN configuration.entities e ON s.owning_entity_uuid = e.uuid
                LEFT JOIN configuration.persons p1 ON s.owned_by_uuid = p1.uuid
                LEFT JOIN configuration.persons p2 ON s.managed_by_uuid = p2.uuid
                LEFT JOIN configuration.groups g ON s.cab_uuid = g.uuid
                LEFT JOIN data.services parent ON s.parent_uuid = parent.uuid
                ORDER BY s.name ASC`;

            const result = await db.query(query);
            return result.rows;
        } catch (error) {
            logger.error('[SERVICE] Error getting all services:', error);
            throw error;
        }
    }
}

module.exports = new ServiceOfferingsService();
