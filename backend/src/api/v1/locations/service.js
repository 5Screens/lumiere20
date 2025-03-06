const { pool } = require('../../../config/database');
const logger = require('../../../config/logger');

class LocationService {
    async getAllLocations() {
        logger.info('[SERVICE] getAllLocations - Starting database query');
        try {
            const query = `
                SELECT 
                    l.uuid, 
                    l.name, 
                    l.site_id,
                    l.type,
                    l.status,
                    l.business_criticality,
                    l.opening_hours,
                    l.time_zone,
                    l.street,
                    l.city,
                    l.state_province,
                    l.country,
                    l.postal_code,
                    l.phone,
                    l.comments,
                    l.site_created_on,
                    l.alternative_site_reference,
                    l.wan_design,
                    l.network_telecom_service,
                    parent.name as parent_location_name,
                    entity.name as primary_entity_name,
                    g.name as field_service_group_name,
                    l.date_creation,
                    l.date_modification
                FROM configuration.locations l
                LEFT JOIN configuration.locations parent ON l.parent_uuid = parent.uuid
                LEFT JOIN configuration.entities entity ON l.primary_entity_uuid = entity.uuid
                LEFT JOIN configuration.groups g ON l.field_service_group_uuid = g.uuid
                ORDER BY l.name ASC`;
            
            const result = await pool.query(query);
            logger.info(`[SERVICE] getAllLocations - Query executed successfully, found ${result.rows.length} records`);
            return result.rows;
        } catch (error) {
            logger.error(`[SERVICE] getAllLocations - Database error: ${error.message}`);
            throw error;
        }
    }

    async getLocationByUuid(uuid) {
        logger.info(`[SERVICE] getLocationByUuid - Starting database query for UUID: ${uuid}`);
        try {
            const query = `
                SELECT 
                    l.uuid, 
                    l.name, 
                    l.site_id,
                    l.type,
                    l.status,
                    l.business_criticality,
                    l.opening_hours,
                    l.time_zone,
                    l.street,
                    l.city,
                    l.state_province,
                    l.country,
                    l.postal_code,
                    l.phone,
                    l.comments,
                    l.site_created_on,
                    l.alternative_site_reference,
                    l.wan_design,
                    l.network_telecom_service,
                    l.parent_uuid,
                    parent.name as parent_location_name,
                    l.primary_entity_uuid,
                    entity.name as primary_entity_name,
                    l.field_service_group_uuid,
                    g.name as field_service_group_name,
                    l.date_creation,
                    l.date_modification
                FROM configuration.locations l
                LEFT JOIN configuration.locations parent ON l.parent_uuid = parent.uuid
                LEFT JOIN configuration.entities entity ON l.primary_entity_uuid = entity.uuid
                LEFT JOIN configuration.groups g ON l.field_service_group_uuid = g.uuid
                WHERE l.uuid = $1`;
            
            const result = await pool.query(query, [uuid]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return result.rows[0];
        } catch (error) {
            logger.error(`[SERVICE] getLocationByUuid - Error: ${error.message}`);
            throw error;
        }
    }

    async getActiveLocations() {
        logger.info('[SERVICE] getActiveLocations - Starting database query');
        try {
            const query = `
                SELECT 
                    l.uuid, 
                    l.name, 
                    l.site_id,
                    l.type,
                    l.status,
                    l.business_criticality,
                    l.opening_hours,
                    l.time_zone,
                    l.street,
                    l.city,
                    l.state_province,
                    l.country,
                    l.postal_code,
                    l.phone,
                    l.comments,
                    l.site_created_on,
                    l.alternative_site_reference,
                    l.wan_design,
                    l.network_telecom_service,
                    parent.name as parent_location_name,
                    entity.name as primary_entity_name,
                    g.name as field_service_group_name,
                    l.date_creation,
                    l.date_modification
                FROM configuration.locations l
                LEFT JOIN configuration.locations parent ON l.parent_uuid = parent.uuid
                LEFT JOIN configuration.entities entity ON l.primary_entity_uuid = entity.uuid
                LEFT JOIN configuration.groups g ON l.field_service_group_uuid = g.uuid
                WHERE UPPER(l.status) = 'ACTIVE'
                ORDER BY l.name ASC`;
            
            const result = await pool.query(query);
            logger.info(`[SERVICE] getActiveLocations - Query executed successfully, found ${result.rows.length} active records`);
            return result.rows;
        } catch (error) {
            logger.error(`[SERVICE] getActiveLocations - Database error: ${error.message}`);
            throw error;
        }
    }

    async getChildLocationsCount(uuid) {
        logger.info(`[SERVICE] getChildLocationsCount - Starting database query for UUID: ${uuid}`);
        try {
            // First check if the parent location exists
            const checkParentQuery = `
                SELECT uuid FROM configuration.locations WHERE uuid = $1
            `;
            const parentResult = await pool.query(checkParentQuery, [uuid]);
            
            if (parentResult.rows.length === 0) {
                return null; // Parent location not found
            }
            
            // Count child locations
            const countQuery = `
                SELECT COUNT(*) as child_count
                FROM configuration.locations
                WHERE parent_uuid = $1
            `;
            
            const countResult = await pool.query(countQuery, [uuid]);
            logger.info(`[SERVICE] getChildLocationsCount - Query executed successfully, found ${countResult.rows[0].child_count} child locations`);
            
            return {
                location_uuid: uuid,
                child_count: parseInt(countResult.rows[0].child_count)
            };
        } catch (error) {
            logger.error(`[SERVICE] getChildLocationsCount - Database error: ${error.message}`);
            throw error;
        }
    }

    async getEntityLocationsCount(entityUuid) {
        logger.info(`[SERVICE] getEntityLocationsCount - Starting database query for entity UUID: ${entityUuid}`);
        try {
            // First check if the entity exists
            const checkEntityQuery = `
                SELECT uuid FROM configuration.entities WHERE uuid = $1
            `;
            const entityResult = await pool.query(checkEntityQuery, [entityUuid]);
            
            if (entityResult.rows.length === 0) {
                return null; // Entity not found
            }
            
            // Count locations associated with the entity
            const countQuery = `
                SELECT COUNT(*) as locations_count
                FROM configuration.rel_entities_locations
                WHERE entity_uuid = $1
            `;
            
            const countResult = await pool.query(countQuery, [entityUuid]);
            logger.info(`[SERVICE] getEntityLocationsCount - Query executed successfully, found ${countResult.rows[0].locations_count} locations for entity`);
            
            return {
                entity_uuid: entityUuid,
                locations_count: parseInt(countResult.rows[0].locations_count)
            };
        } catch (error) {
            logger.error(`[SERVICE] getEntityLocationsCount - Database error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new LocationService();
