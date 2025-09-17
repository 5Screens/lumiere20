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
                    COALESCE(child_locations.locations_count, 0) as locations_count,
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
                LEFT JOIN (
                    SELECT 
                        parent_uuid,
                        COUNT(*) as locations_count
                    FROM configuration.locations 
                    WHERE parent_uuid IS NOT NULL
                    GROUP BY parent_uuid
                ) child_locations ON l.uuid = child_locations.parent_uuid
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
                    ) as occupants_list,
                    -- Liste des localisations enfants
                    (
                        SELECT json_agg(json_build_object(
                            'uuid', child.uuid,
                            'name', child.name,
                            'site_id', child.site_id,
                            'type', child.type,
                            'city', child.city,
                            'country', child.country,
                            'business_criticality', child.business_criticality,
                            'status_code', child_ts.code,
                            'status_label', child_tst.label
                        ))
                        FROM configuration.locations child
                        LEFT JOIN configuration.ticket_status child_ts ON child.rel_status_uuid = child_ts.uuid
                        LEFT JOIN translations.ticket_status_translation child_tst ON child_ts.uuid = child_tst.ticket_status_uuid AND child_tst.lang = $2
                        WHERE child.parent_uuid = l.uuid
                    ) as locations_list
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

    async updateLocation(uuid, locationData) {
        logger.info(`[SERVICE] updateLocation - Starting database operation for UUID: ${uuid}`);
        try {
            // Construire la requête dynamiquement en fonction des champs fournis
            const fields = Object.keys(locationData);
            const values = Object.values(locationData);
            
            // Ajouter l'UUID à la fin des valeurs
            values.push(uuid);
            
            // Construire la partie SET de la requête
            const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
            
            const query = `
                UPDATE configuration.locations
                SET ${setClause}, updated_at = CURRENT_TIMESTAMP
                WHERE uuid = $${values.length}
                RETURNING 
                    uuid,
                    name,
                    site_id,
                    type,
                    rel_status_uuid,
                    business_criticality,
                    opening_hours,
                    time_zone,
                    street,
                    city,
                    state_province,
                    country,
                    postal_code,
                    phone,
                    comments,
                    site_created_on,
                    alternative_site_reference,
                    wan_design,
                    network_telecom_service,
                    parent_uuid,
                    primary_entity_uuid,
                    field_service_group_uuid,
                    created_at,
                    updated_at`;
            
            const result = await pool.query(query, values);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            logger.info(`[SERVICE] updateLocation - Location updated successfully: ${uuid}`);
            return result.rows[0];
        } catch (error) {
            logger.error(`[SERVICE] updateLocation - Error: ${error.message}`);
            throw error;
        }
    }

    async createLocation(locationData) {
        logger.info('[SERVICE] createLocation - Starting database operation');
        try {
            // Extraire occupants_list et locations_list s'ils existent
            const { occupants_list, locations_list, ...locationFields } = locationData;
            
            // Construire la requête d'insertion pour la location
            const fields = Object.keys(locationFields);
            const values = Object.values(locationFields);
            const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
            
            const query = `
                INSERT INTO configuration.locations (${fields.join(', ')})
                VALUES (${placeholders})
                RETURNING 
                    uuid,
                    name,
                    site_id,
                    type,
                    rel_status_uuid,
                    business_criticality,
                    opening_hours,
                    time_zone,
                    street,
                    city,
                    state_province,
                    country,
                    postal_code,
                    phone,
                    comments,
                    site_created_on,
                    alternative_site_reference,
                    wan_design,
                    network_telecom_service,
                    parent_uuid,
                    primary_entity_uuid,
                    field_service_group_uuid,
                    created_at,
                    updated_at`;
            
            const result = await pool.query(query, values);
            const newLocation = result.rows[0];
            
            // Si des occupants sont fournis, les ajouter
            if (occupants_list && Array.isArray(occupants_list) && occupants_list.length > 0) {
                await this.addOccupantsToLocation(newLocation.uuid, occupants_list);
            }
            
            // Si des localisations enfants sont fournies, les ajouter
            if (locations_list && Array.isArray(locations_list) && locations_list.length > 0) {
                await this.addChildLocationsToLocation(newLocation.uuid, locations_list);
            }
            
            logger.info(`[SERVICE] createLocation - Location created successfully: ${newLocation.uuid}`);
            return newLocation;
        } catch (error) {
            logger.error(`[SERVICE] createLocation - Error: ${error.message}`);
            throw error;
        }
    }

    async addOccupantToLocation(locationUuid, personUuid) {
        logger.info(`[SERVICE] addOccupantToLocation - Adding person ${personUuid} to location ${locationUuid}`);
        try {
            // Vérifier que la location existe
            const locationExists = await pool.query(
                'SELECT uuid FROM configuration.locations WHERE uuid = $1',
                [locationUuid]
            );
            
            if (locationExists.rows.length === 0) {
                throw new Error('Location not found');
            }
            
            // Vérifier que la personne existe
            const personExists = await pool.query(
                'SELECT uuid FROM configuration.persons WHERE uuid = $1',
                [personUuid]
            );
            
            if (personExists.rows.length === 0) {
                throw new Error('Person not found');
            }
            
            // Mettre à jour la personne pour l'assigner à cette location
            const query = `
                UPDATE configuration.persons 
                SET ref_location_uuid = $1, updated_at = CURRENT_TIMESTAMP
                WHERE uuid = $2
                RETURNING uuid, first_name, last_name`;
            
            const result = await pool.query(query, [locationUuid, personUuid]);
            
            logger.info(`[SERVICE] addOccupantToLocation - Person added successfully to location`);
            return result.rows[0];
        } catch (error) {
            logger.error(`[SERVICE] addOccupantToLocation - Error: ${error.message}`);
            throw error;
        }
    }

    async addOccupantsToLocation(locationUuid, personUuids) {
        logger.info(`[SERVICE] addOccupantsToLocation - Adding ${personUuids.length} persons to location ${locationUuid}`);
        try {
            // Vérifier que la location existe
            const locationExists = await pool.query(
                'SELECT uuid FROM configuration.locations WHERE uuid = $1',
                [locationUuid]
            );
            
            if (locationExists.rows.length === 0) {
                throw new Error('Location not found');
            }
            
            // Mettre à jour toutes les personnes en une seule requête
            const placeholders = personUuids.map((_, index) => `$${index + 2}`).join(', ');
            const query = `
                UPDATE configuration.persons 
                SET ref_location_uuid = $1, updated_at = CURRENT_TIMESTAMP
                WHERE uuid IN (${placeholders})
                RETURNING uuid, first_name, last_name`;
            
            const result = await pool.query(query, [locationUuid, ...personUuids]);
            
            logger.info(`[SERVICE] addOccupantsToLocation - ${result.rows.length} persons added successfully to location`);
            return result.rows;
        } catch (error) {
            logger.error(`[SERVICE] addOccupantsToLocation - Error: ${error.message}`);
            throw error;
        }
    }

    async removeOccupantFromLocation(locationUuid, personUuid) {
        logger.info(`[SERVICE] removeOccupantFromLocation - Removing person ${personUuid} from location ${locationUuid}`);
        try {
            // Vérifier que la personne est bien dans cette location
            const personInLocation = await pool.query(
                'SELECT uuid FROM configuration.persons WHERE uuid = $1 AND ref_location_uuid = $2',
                [personUuid, locationUuid]
            );
            
            if (personInLocation.rows.length === 0) {
                throw new Error('Person not found in this location');
            }
            
            // Retirer la personne de la location
            const query = `
                UPDATE configuration.persons 
                SET ref_location_uuid = NULL, updated_at = CURRENT_TIMESTAMP
                WHERE uuid = $1 AND ref_location_uuid = $2
                RETURNING uuid, first_name, last_name`;
            
            const result = await pool.query(query, [personUuid, locationUuid]);
            
            logger.info(`[SERVICE] removeOccupantFromLocation - Person removed successfully from location`);
            return result.rows[0];
        } catch (error) {
            logger.error(`[SERVICE] removeOccupantFromLocation - Error: ${error.message}`);
            throw error;
        }
    }

    async addChildLocationsToLocation(parentLocationUuid, childLocationUuids) {
        logger.info(`[SERVICE] addChildLocationsToLocation - Adding ${childLocationUuids.length} child locations to parent location ${parentLocationUuid}`);
        try {
            // Vérifier que la location parent existe
            const parentLocationExists = await pool.query(
                'SELECT uuid FROM configuration.locations WHERE uuid = $1',
                [parentLocationUuid]
            );
            
            if (parentLocationExists.rows.length === 0) {
                throw new Error('Parent location not found');
            }
            
            // Mettre à jour toutes les locations enfants en une seule requête
            const placeholders = childLocationUuids.map((_, index) => `$${index + 2}`).join(', ');
            const query = `
                UPDATE configuration.locations 
                SET parent_uuid = $1, updated_at = CURRENT_TIMESTAMP
                WHERE uuid IN (${placeholders})
                RETURNING uuid, name, site_id, type`;
            
            const result = await pool.query(query, [parentLocationUuid, ...childLocationUuids]);
            
            logger.info(`[SERVICE] addChildLocationsToLocation - ${result.rows.length} child locations added successfully to parent location`);
            return result.rows;
        } catch (error) {
            logger.error(`[SERVICE] addChildLocationsToLocation - Error: ${error.message}`);
            throw error;
        }
    }

    async removeChildLocationFromLocation(parentLocationUuid, childLocationUuid) {
        logger.info(`[SERVICE] removeChildLocationFromLocation - Removing child location ${childLocationUuid} from parent location ${parentLocationUuid}`);
        try {
            // Vérifier que la location enfant est bien dans cette location parent
            const childInParent = await pool.query(
                'SELECT uuid FROM configuration.locations WHERE uuid = $1 AND parent_uuid = $2',
                [childLocationUuid, parentLocationUuid]
            );
            
            if (childInParent.rows.length === 0) {
                throw new Error('Child location not found in this parent location');
            }
            
            // Retirer la location enfant de la location parent
            const query = `
                UPDATE configuration.locations 
                SET parent_uuid = NULL, updated_at = CURRENT_TIMESTAMP
                WHERE uuid = $1 AND parent_uuid = $2
                RETURNING uuid, name, site_id, type`;
            
            const result = await pool.query(query, [childLocationUuid, parentLocationUuid]);
            
            logger.info(`[SERVICE] removeChildLocationFromLocation - Child location removed successfully from parent location`);
            return result.rows[0];
        } catch (error) {
            logger.error(`[SERVICE] removeChildLocationFromLocation - Error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new LocationService();
