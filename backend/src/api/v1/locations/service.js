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
}

module.exports = new LocationService();
