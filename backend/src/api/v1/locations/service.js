const { pool } = require('../../../config/database');
const logger = require('../../../config/logger');

class LocationService {
    async getAllLocations(lang = 'fr') {
        logger.info(`[SERVICE] getAllLocations - Starting database query with language: ${lang}`);
        try {
            const query = `
                SELECT 
                    l.uuid, 
                    l.name, 
                    l.site_id,
                    l.type,
                    l.rel_status_uuid,
                    ts.code as status_code,
                    tst.label as status_label,
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
                    g.group_name as field_service_group_name,
                    COALESCE(occupants.occupants_count, 0) as occupants_count,
                    l.created_at,
                    l.updated_at
                FROM configuration.locations l
                LEFT JOIN configuration.locations parent ON l.parent_uuid = parent.uuid
                LEFT JOIN configuration.entities entity ON l.primary_entity_uuid = entity.uuid
                LEFT JOIN configuration.groups g ON l.field_service_group_uuid = g.uuid
                LEFT JOIN configuration.ticket_status ts ON l.rel_status_uuid = ts.uuid
                LEFT JOIN translations.ticket_status_translation tst ON ts.uuid = tst.ticket_status_uuid AND tst.lang = $1
                LEFT JOIN (
                    SELECT 
                        ref_location_uuid,
                        COUNT(*) as occupants_count
                    FROM configuration.persons 
                    WHERE ref_location_uuid IS NOT NULL
                    GROUP BY ref_location_uuid
                ) occupants ON l.uuid = occupants.ref_location_uuid
                ORDER BY l.name ASC`;
            
            const result = await pool.query(query, [lang]);
            logger.info(`[SERVICE] getAllLocations - Query executed successfully, found ${result.rows.length} records`);
            return result.rows;
        } catch (error) {
            logger.error(`[SERVICE] getAllLocations - Database error: ${error.message}`);
            throw error;
        }
    }

    async getLocationByUuid(uuid, lang = 'fr') {
        logger.info(`[SERVICE] getLocationByUuid - Starting database query for UUID: ${uuid} with language: ${lang}`);
        try {
            const query = `
                SELECT 
                    l.uuid, 
                    l.name, 
                    l.site_id,
                    l.type,
                    l.rel_status_uuid,
                    ts.code as status_code,
                    tst.label as status_label,
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
                    g.group_name as field_service_group_name,
                    l.created_at,
                    l.updated_at,
                    -- Liste des occupants de la localisation
                    (
                        SELECT json_agg(json_build_object(
                            'uuid', p.uuid,
                            'person_name', p.first_name || ' ' || p.last_name,
                            'first_name', p.first_name,
                            'last_name', p.last_name,
                            'job_role', p.job_role,
                            'email', p.email,
                            'business_phone', p.business_phone,
                            'business_mobile_phone', p.business_mobile_phone
                        ))
                        FROM configuration.persons p
                        WHERE p.ref_location_uuid = l.uuid
                    ) as occupants_list
                FROM configuration.locations l
                LEFT JOIN configuration.locations parent ON l.parent_uuid = parent.uuid
                LEFT JOIN configuration.entities entity ON l.primary_entity_uuid = entity.uuid
                LEFT JOIN configuration.groups g ON l.field_service_group_uuid = g.uuid
                LEFT JOIN configuration.ticket_status ts ON l.rel_status_uuid = ts.uuid
                LEFT JOIN translations.ticket_status_translation tst ON ts.uuid = tst.ticket_status_uuid AND tst.lang = $2
                WHERE l.uuid = $1`;
            
            const result = await pool.query(query, [uuid, lang]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return result.rows[0];
        } catch (error) {
            logger.error(`[SERVICE] getLocationByUuid - Error: ${error.message}`);
            throw error;
        }
    }

    async getActiveLocations(lang = 'fr') {
        logger.info(`[SERVICE] getActiveLocations - Starting database query with language: ${lang}`);
        try {
            const query = `
                SELECT 
                    l.uuid, 
                    l.name, 
                    l.site_id,
                    l.type,
                    l.rel_status_uuid,
                    ts.code as status_code,
                    tst.label as status_label,
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
                    g.group_name as field_service_group_name,
                    l.created_at,
                    l.updated_at
                FROM configuration.locations l
                LEFT JOIN configuration.locations parent ON l.parent_uuid = parent.uuid
                LEFT JOIN configuration.entities entity ON l.primary_entity_uuid = entity.uuid
                LEFT JOIN configuration.groups g ON l.field_service_group_uuid = g.uuid
                LEFT JOIN configuration.ticket_status ts ON l.rel_status_uuid = ts.uuid
                LEFT JOIN translations.ticket_status_translation tst ON ts.uuid = tst.ticket_status_uuid AND tst.lang = $1
                WHERE ts.code = 'ACTIVE' AND ts.rel_ticket_type = 'LOCATION'
                ORDER BY l.name ASC`;
            
            const result = await pool.query(query, [lang]);
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
