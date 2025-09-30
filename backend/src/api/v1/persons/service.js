const db = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Map table name to schema for SQL queries
 * @param {string} tableName - Simple table name
 * @returns {string} Table name with schema
 */
function getTableWithSchema(tableName) {
  const schemaMap = {
    'persons': 'configuration.persons',
    'entities': 'configuration.entities',
    'groups': 'configuration.groups',
    'tickets': 'core.tickets',
    'symptoms': 'configuration.symptoms',
    'services': 'data.services',
    'service_offerings': 'data.service_offerings',
    'configuration_items': 'data.configuration_items'
  };
  
  return schemaMap[tableName] || `configuration.${tableName}`;
}

/**
 * Get all persons from the database with additional statistics
 * @param {string} [lang] - Optional language parameter for localization
 * @returns {Promise<Array>} Array of persons with person_name field and statistics
 */
const getAllPersons = async (lang) => {
    try {
        logger.info('[SERVICE] - Getting all persons with statistics');
        const query = `
            SELECT p.*, 
                   p.first_name || ' ' || p.last_name AS person_name,
                   
                   -- Informations de l'entité de référence
                   e.name as ref_entity_name,
                   
                   -- Informations de la localisation
                   l.name as ref_location_name,
                   
                   -- Informations du manager approbateur
                   manager.first_name || ' ' || manager.last_name as ref_approving_manager_name,
                   
                   -- Nombre de tickets enregistrés (requested_for_uuid)
                   (SELECT COUNT(*) 
                    FROM core.tickets t 
                    WHERE t.requested_for_uuid = p.uuid) AS raised_tickets_count,
                   
                   -- Nombre de groupes dont la personne est membre
                   (SELECT COUNT(*) 
                    FROM configuration.rel_persons_groups rpg 
                    WHERE rpg.rel_member = p.uuid) AS member_of_group_count,
                   
                   -- Nombre de tickets assignés à la personne
                   (SELECT COUNT(*) 
                    FROM core.rel_tickets_groups_persons rtgp 
                    WHERE rtgp.rel_assigned_to_person = p.uuid 
                      AND rtgp.type = 'ASSIGNED'
                      AND rtgp.ended_at IS NULL) AS assigned_tickets_count,
                   
                   -- Nombre de tickets observés par la personne
                   (SELECT COUNT(*) 
                    FROM core.rel_tickets_groups_persons rtgp 
                    WHERE rtgp.rel_assigned_to_person = p.uuid 
                      AND rtgp.type = 'WATCHER'
                      AND rtgp.ended_at IS NULL) AS watched_tickets_count,
                   
                   -- Nombre d'entités pour lesquelles la personne est approbateur budgétaire
                   (SELECT COUNT(*) 
                    FROM configuration.entities e 
                    WHERE e.budget_approver_uuid = p.uuid) AS budget_approver_count
                   
            FROM configuration.persons p
            LEFT JOIN configuration.entities e ON p.ref_entity_uuid = e.uuid
            LEFT JOIN configuration.locations l ON p.ref_location_uuid = l.uuid
            LEFT JOIN configuration.persons manager ON p.ref_approving_manager_uuid = manager.uuid
            ORDER BY p.updated_at DESC
            LIMIT 100
        `;
        const { rows } = await db.query(query);
        logger.info(`[SERVICE] - Retrieved ${rows.length} persons with statistics`);
        return rows;
    } catch (error) {
        logger.error('[SERVICE] - Error getting persons with statistics:', error);
        throw error;
    }
};

/**
 * Get persons with pagination support for infinite scroll
 * @param {Object} options - Pagination and filtering options
 * @param {number} [options.offset=0] - Number of records to skip
 * @param {number} [options.limit=50] - Number of records to return
 * @param {string} [options.sortBy='updated_at'] - Column to sort by
 * @param {string} [options.sortDirection='desc'] - Sort direction (asc/desc)
 * @param {Object} [options.filters={}] - Filters to apply
 * @param {string} [options.search=''] - Global search term
 * @param {string} [lang] - Optional language parameter for localization
 * @returns {Promise<Object>} Object with data, total, hasMore, and pagination info
 */
const getPersonsPaginated = async (options = {}, lang) => {
    try {
        const {
            offset = 0,
            limit = 50,
            sortBy = 'updated_at',
            sortDirection = 'desc',
            filters = {},
            search = ''
        } = options;

        logger.info(`[SERVICE] - Getting persons paginated - offset: ${offset}, limit: ${limit}, sortBy: ${sortBy}, sortDirection: ${sortDirection}`);

        // Validate sort direction
        const validSortDirection = ['asc', 'desc'].includes(sortDirection.toLowerCase()) ? sortDirection.toLowerCase() : 'desc';
        
        // Validate sort column (prevent SQL injection)
        const validSortColumns = [
            'updated_at', 'created_at', 'first_name', 'last_name', 'person_name', 
            'email', 'job_role', 'active', 'ref_entity_name', 'ref_location_name',
            'raised_tickets_count', 'assigned_tickets_count', 'watched_tickets_count'
        ];
        const validSortBy = validSortColumns.includes(sortBy) ? sortBy : 'updated_at';

        // Build WHERE clause for filters and search
        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;

        // Global search across multiple fields
        if (search && search.trim()) {
            whereConditions.push(`(
                LOWER(p.first_name || ' ' || p.last_name) LIKE LOWER($${paramIndex}) OR
                LOWER(p.email) LIKE LOWER($${paramIndex}) OR
                LOWER(p.job_role) LIKE LOWER($${paramIndex}) OR
                LOWER(e.name) LIKE LOWER($${paramIndex}) OR
                LOWER(l.name) LIKE LOWER($${paramIndex})
            )`);
            queryParams.push(`%${search.trim()}%`);
            paramIndex++;
        }

        // Column-specific filters (supports simple strings and advanced JSON payloads)
        Object.keys(filters).forEach(key => {
            const rawValue = filters[key];
            if (rawValue === null || rawValue === undefined || rawValue === '') return;

            // Special-case boolean exact match when explicitly boolean (kept for backward compatibility)
            if (key === 'active' && typeof rawValue === 'boolean') {
                whereConditions.push(`p.${key} = $${paramIndex}`);
                queryParams.push(rawValue);
                paramIndex++;
                return;
            }

            // Try to parse advanced filter JSON: { blanks: boolean, values: string[] }
            let parsed = null;
            if (typeof rawValue === 'string') {
                try {
                    parsed = JSON.parse(rawValue);
                } catch (_) {
                    parsed = null;
                }
            }

            if (parsed && (parsed.blanks || (Array.isArray(parsed.values) && parsed.values.length > 0))) {
                const parts = [];
                // Include explicit values (case-insensitive equality)
                if (Array.isArray(parsed.values) && parsed.values.length > 0) {
                    const valuesArray = parsed.values
                        .filter(v => v !== null && v !== undefined && v !== '')
                        .map(v => String(v).toLowerCase());
                    if (valuesArray.length > 0) {
                        parts.push(`LOWER(p.${key}::text) = ANY($${paramIndex})`);
                        queryParams.push(valuesArray);
                        paramIndex++;
                    }
                }
                // Include blanks (NULL or empty string)
                if (parsed.blanks) {
                    parts.push(`(p.${key} IS NULL OR p.${key}::text = '')`);
                }
                if (parts.length > 0) {
                    whereConditions.push(`(${parts.join(' OR ')})`);
                }
            } else if (typeof rawValue === 'string') {
                // Fallback: simple LIKE filter
                whereConditions.push(`LOWER(p.${key}::text) LIKE LOWER($${paramIndex})`);
                queryParams.push(`%${rawValue}%`);
                paramIndex++;
            }
        });

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Count total records
        const countQuery = `
            SELECT COUNT(*) as total
            FROM configuration.persons p
            LEFT JOIN configuration.entities e ON p.ref_entity_uuid = e.uuid
            LEFT JOIN configuration.locations l ON p.ref_location_uuid = l.uuid
            ${whereClause}
        `;
        
        const countResult = await db.query(countQuery, queryParams);
        const total = parseInt(countResult.rows[0].total);

        // Main data query with pagination
        const dataQuery = `
            SELECT p.*, 
                   p.first_name || ' ' || p.last_name AS person_name,
                   
                   -- Informations de l'entité de référence
                   e.name as ref_entity_name,
                   
                   -- Informations de la localisation
                   l.name as ref_location_name,
                   
                   -- Informations du manager approbateur
                   manager.first_name || ' ' || manager.last_name as ref_approving_manager_name,
                   
                   -- Nombre de tickets enregistrés (requested_for_uuid)
                   (SELECT COUNT(*) 
                    FROM core.tickets t 
                    WHERE t.requested_for_uuid = p.uuid) AS raised_tickets_count,
                   
                   -- Nombre de groupes dont la personne est membre
                   (SELECT COUNT(*) 
                    FROM configuration.rel_persons_groups rpg 
                    WHERE rpg.rel_member = p.uuid) AS member_of_group_count,
                   
                   -- Nombre de tickets assignés à la personne
                   (SELECT COUNT(*) 
                    FROM core.rel_tickets_groups_persons rtgp 
                    WHERE rtgp.rel_assigned_to_person = p.uuid 
                      AND rtgp.type = 'ASSIGNED'
                      AND rtgp.ended_at IS NULL) AS assigned_tickets_count,
                   
                   -- Nombre de tickets observés par la personne
                   (SELECT COUNT(*) 
                    FROM core.rel_tickets_groups_persons rtgp 
                    WHERE rtgp.rel_assigned_to_person = p.uuid 
                      AND rtgp.type = 'WATCHER'
                      AND rtgp.ended_at IS NULL) AS watched_tickets_count,
                   
                   -- Nombre d'entités pour lesquelles la personne est approbateur budgétaire
                   (SELECT COUNT(*) 
                    FROM configuration.entities e 
                    WHERE e.budget_approver_uuid = p.uuid) AS budget_approver_count
                   
            FROM configuration.persons p
            LEFT JOIN configuration.entities e ON p.ref_entity_uuid = e.uuid
            LEFT JOIN configuration.locations l ON p.ref_location_uuid = l.uuid
            LEFT JOIN configuration.persons manager ON p.ref_approving_manager_uuid = manager.uuid
            ${whereClause}
            ORDER BY ${validSortBy === 'person_name' ? 'p.first_name || \' \' || p.last_name' : 'p.' + validSortBy} ${validSortDirection.toUpperCase()}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        queryParams.push(limit, offset);
        const dataResult = await db.query(dataQuery, queryParams);
        
        const hasMore = offset + limit < total;
        const currentPage = Math.floor(offset / limit) + 1;
        const totalPages = Math.ceil(total / limit);

        logger.info(`[SERVICE] - Retrieved ${dataResult.rows.length} persons (${offset + 1}-${offset + dataResult.rows.length} of ${total})`);
        
        return {
            data: dataResult.rows,
            total,
            hasMore,
            pagination: {
                offset,
                limit,
                currentPage,
                totalPages,
                sortBy: validSortBy,
                sortDirection: validSortDirection
            }
        };
    } catch (error) {
        logger.error('[SERVICE] - Error getting persons paginated:', error);
        throw error;
    }
};

/**
 * Get a person by UUID with related data
 * @param {string} uuid - UUID of the person
 * @param {string} [lang] - Optional language parameter for localization
 * @returns {Promise<Object|null>} Person object with related data or null if not found
 */
const getPersonByUuid = async (uuid, lang = 'fr') => {
    try {
        logger.info(`[SERVICE] - Getting person by UUID: ${uuid} with language: ${lang}`);
        const query = `
            SELECT p.*,
                   p.first_name || ' ' || p.last_name AS person_name,
                   
                   -- Informations de l'entité de référence
                   e.name as ref_entity_name,
                   
                   -- Informations de la localisation
                   l.name as ref_location_name,
                   l.city as ref_location_city,
                   l.country as ref_location_country,
                   
                   -- Informations du manager approbateur
                   manager.first_name || ' ' || manager.last_name as approving_manager_name,
                   
                   -- Liste des tickets enregistrés (requested_for_uuid)
                   (
                       SELECT json_agg(json_build_object(
                           'uuid', t.uuid,
                           'title', t.title,
                           'ticket_type_code', t.ticket_type_code,
                           'ticket_status_code', t.ticket_status_code,
                           'created_at', t.created_at,
                           'writer_uuid', t.writer_uuid,
                           'writer_name', writer.first_name || ' ' || writer.last_name
                       ))
                       FROM core.tickets t
                       LEFT JOIN configuration.persons writer ON t.writer_uuid = writer.uuid
                       WHERE t.requested_for_uuid = p.uuid
                   ) as raised_tickets_list,
                   
                   -- Liste des groupes dont la personne est membre
                   (
                       SELECT json_agg(json_build_object(
                           'uuid', g.uuid,
                           'group_name', g.group_name,
                           'description', g.description,
                           'support_level', g.support_level,
                           'email', g.email,
                           'phone', g.phone
                       ))
                       FROM configuration.groups g
                       JOIN configuration.rel_persons_groups rpg ON g.uuid = rpg.rel_group
                       WHERE rpg.rel_member = p.uuid
                   ) as member_of_group_list,
                   
                   -- Liste des tickets assignés à la personne
                   (
                       SELECT json_agg(json_build_object(
                           'uuid', t.uuid,
                           'title', t.title,
                           'ticket_type_code', t.ticket_type_code,
                           'ticket_status_code', t.ticket_status_code,
                           'created_at', t.created_at,
                           'assigned_at', rtgp.created_at,
                           'assigned_group_name', ag.group_name
                       ))
                       FROM core.rel_tickets_groups_persons rtgp
                       JOIN core.tickets t ON rtgp.rel_ticket = t.uuid
                       LEFT JOIN configuration.groups ag ON rtgp.rel_assigned_to_group = ag.uuid
                       WHERE rtgp.rel_assigned_to_person = p.uuid 
                         AND rtgp.type = 'ASSIGNED'
                         AND rtgp.ended_at IS NULL
                   ) as assigned_tickets_list,
                   
                   -- Liste des tickets observés par la personne
                   (
                       SELECT json_agg(json_build_object(
                           'uuid', t.uuid,
                           'title', t.title,
                           'ticket_type_code', t.ticket_type_code,
                           'ticket_status_code', t.ticket_status_code,
                           'created_at', t.created_at,
                           'watched_at', rtgp.created_at
                       ))
                       FROM core.rel_tickets_groups_persons rtgp
                       JOIN core.tickets t ON rtgp.rel_ticket = t.uuid
                       WHERE rtgp.rel_assigned_to_person = p.uuid 
                         AND rtgp.type = 'WATCHER'
                         AND rtgp.ended_at IS NULL
                   ) as watched_tickets_list,
                   
                   -- Liste des entités pour lesquelles la personne est approbateur budgétaire
                   (
                       SELECT json_agg(json_build_object(
                           'uuid', ent.uuid,
                           'name', ent.name,
                           'entity_id', ent.entity_id,
                           'entity_type', ent.entity_type,
                           'rel_headquarters_location', ent.rel_headquarters_location,
                           'is_active', ent.is_active
                       ))
                       FROM configuration.entities ent
                       WHERE ent.budget_approver_uuid = p.uuid
                   ) as budget_approver_list
                   
            FROM configuration.persons p
            LEFT JOIN configuration.entities e ON p.ref_entity_uuid = e.uuid
            LEFT JOIN configuration.locations l ON p.ref_location_uuid = l.uuid
            LEFT JOIN configuration.persons manager ON p.ref_approving_manager_uuid = manager.uuid
            WHERE p.uuid = $1
        `;
        
        const { rows } = await db.query(query, [uuid]);
        
        if (rows.length === 0) {
            logger.info(`[SERVICE] - Person not found with UUID: ${uuid}`);
            return null;
        }
        
        logger.info(`[SERVICE] - Successfully retrieved person with UUID: ${uuid}`);
        return rows[0];
    } catch (error) {
        logger.error(`[SERVICE] - Error getting person by UUID: ${uuid}:`, error);
        throw error;
    }
};

/**
 * Get all groups for a specific person
 * @param {string} personUuid - UUID of the person
 * @returns {Promise<Array>} Array of groups the person belongs to
 */
const getPersonGroups = async (personUuid) => {
    try {
        logger.info(`Service - Getting groups for person with UUID: ${personUuid}`);
        const query = `
            SELECT g.*
            FROM configuration.groups g
            JOIN configuration.rel_persons_groups rpg ON g.uuid = rpg.rel_group
            WHERE rpg.rel_member = $1
            ORDER BY g.group_name
        `;
        const { rows } = await db.query(query, [personUuid]);
        logger.info(`Service - Retrieved ${rows.length} groups for person with UUID: ${personUuid}`);
        return rows;
    } catch (error) {
        logger.error(`Service - Error getting groups for person with UUID: ${personUuid}:`, error);
        throw error;
    }
};

/**
 * Update a person by UUID
 * @param {string} uuid - UUID of the person to update
 * @param {Object} personData - Data to update
 * @returns {Promise<Object|null>} Updated person object or null if not found
 */
const updatePerson = async (uuid, personData) => {
    try {
        logger.info(`[SERVICE] - Updating person with UUID: ${uuid}`);
        
        // Extraire groups si présent pour traitement séparé
        const { groups, ...personFields } = personData;
        
        // Construire la requête dynamiquement en fonction des champs fournis
        const fields = Object.keys(personFields);
        const values = Object.values(personFields);
        
        // Ajouter l'UUID à la fin des valeurs
        values.push(uuid);
        
        // Construire la partie SET de la requête
        const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
        
        const query = `
            UPDATE configuration.persons
            SET ${setClause}, updated_at = CURRENT_TIMESTAMP
            WHERE uuid = $${values.length}
            RETURNING 
                uuid,
                first_name,
                last_name,
                first_name || ' ' || last_name AS person_name,
                job_role,
                ref_entity_uuid,
                password_needs_reset,
                locked_out,
                active,
                critical_user,
                external_user,
                date_format,
                internal_id,
                email,
                notification,
                time_zone,
                ref_location_uuid,
                floor,
                room,
                ref_approving_manager_uuid,
                business_phone,
                business_mobile_phone,
                personal_mobile_phone,
                language,
                roles,
                photo,
                created_at,
                updated_at`;
        
        const result = await db.query(query, values);
        
        if (result.rows.length === 0) {
            logger.info(`[SERVICE] - Person not found with UUID: ${uuid}`);
            return null;
        }
        
        // Gérer les groupes si fournis
        if (groups && Array.isArray(groups)) {
            await updatePersonGroups(uuid, groups);
        }
        
        logger.info(`[SERVICE] - Person updated successfully: ${uuid}`);
        return result.rows[0];
    } catch (error) {
        logger.error(`[SERVICE] - Error updating person with UUID: ${uuid}:`, error);
        throw error;
    }
};

/**
 * Update person groups relationships
 * @param {string} personUuid - UUID of the person
 * @param {Array} groupUuids - Array of group UUIDs
 */
const updatePersonGroups = async (personUuid, groupUuids) => {
    try {
        logger.info(`[SERVICE] - Updating groups for person: ${personUuid}`);
        
        // Supprimer toutes les relations existantes
        await db.query(
            'DELETE FROM configuration.rel_persons_groups WHERE rel_member = $1',
            [personUuid]
        );
        
        // Ajouter les nouvelles relations
        if (groupUuids.length > 0) {
            const insertPromises = groupUuids.map(groupUuid => 
                db.query(
                    'INSERT INTO configuration.rel_persons_groups (rel_member, rel_group) VALUES ($1, $2)',
                    [personUuid, groupUuid]
                )
            );
            
            await Promise.all(insertPromises);
            logger.info(`[SERVICE] - Added ${groupUuids.length} group relationships for person: ${personUuid}`);
        }
    } catch (error) {
        logger.error(`[SERVICE] - Error updating person groups: ${error.message}`);
        throw error;
    }
};

/**
 * Create a new person
 * @param {Object} personData - Person data to create
 * @returns {Promise<Object>} Created person object
 */
const createPerson = async (personData) => {
    try {
        logger.info('[SERVICE] - Creating new person');
        
        // Extraire groups si présent pour traitement séparé
        const { groups, ...personFields } = personData;
        
        // Construire la requête d'insertion
        const fields = Object.keys(personFields);
        const values = Object.values(personFields);
        const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
        
        const query = `
            INSERT INTO configuration.persons (${fields.join(', ')})
            VALUES (${placeholders})
            RETURNING 
                uuid,
                first_name,
                last_name,
                first_name || ' ' || last_name AS person_name,
                job_role,
                ref_entity_uuid,
                password_needs_reset,
                locked_out,
                active,
                critical_user,
                external_user,
                date_format,
                internal_id,
                email,
                notification,
                time_zone,
                ref_location_uuid,
                floor,
                room,
                ref_approving_manager_uuid,
                business_phone,
                business_mobile_phone,
                personal_mobile_phone,
                language,
                roles,
                photo,
                created_at,
                updated_at`;
        
        const result = await db.query(query, values);
        const newPerson = result.rows[0];
        
        // Ajouter les groupes si fournis
        if (groups && Array.isArray(groups) && groups.length > 0) {
            await updatePersonGroups(newPerson.uuid, groups);
        }
        
        logger.info(`[SERVICE] - Person created successfully: ${newPerson.uuid}`);
        return newPerson;
    } catch (error) {
        logger.error(`[SERVICE] - Error creating person: ${error.message}`);
        throw error;
    }
};

/**
 * Add groups to a person
 * @param {string} personUuid - UUID of the person
 * @param {Array<string>} groupUuids - Array of group UUIDs to add
 * @returns {Promise<Object>} Result of the operation
 */
const addPersonGroups = async (personUuid, groupUuids) => {
    try {
        logger.info(`[SERVICE] - Adding ${groupUuids.length} groups to person: ${personUuid}`);
        
        // Vérifier que la personne existe
        const personCheck = await db.query('SELECT uuid FROM configuration.persons WHERE uuid = $1', [personUuid]);
        if (personCheck.rows.length === 0) {
            throw new Error('Person not found');
        }
        
        // Vérifier que tous les groupes existent
        const groupsCheck = await db.query(
            'SELECT uuid FROM configuration.groups WHERE uuid = ANY($1)',
            [groupUuids]
        );
        
        if (groupsCheck.rows.length !== groupUuids.length) {
            const foundGroupUuids = groupsCheck.rows.map(row => row.uuid);
            const missingGroups = groupUuids.filter(uuid => !foundGroupUuids.includes(uuid));
            throw new Error(`Groups not found: ${missingGroups.join(', ')}`);
        }
        
        // Préparer les valeurs pour l'insertion
        const values = [];
        const placeholders = [];
        let paramIndex = 1;
        
        groupUuids.forEach(groupUuid => {
            values.push(personUuid, groupUuid);
            placeholders.push(`($${paramIndex}, $${paramIndex + 1})`);
            paramIndex += 2;
        });
        
        // Insérer les relations (ON CONFLICT DO NOTHING pour éviter les doublons)
        const insertQuery = `
            INSERT INTO configuration.rel_persons_groups (rel_member, rel_group)
            VALUES ${placeholders.join(', ')}
            ON CONFLICT (rel_member, rel_group) DO NOTHING
            RETURNING rel_member, rel_group`;
        
        const result = await db.query(insertQuery, values);
        
        logger.info(`[SERVICE] - Successfully added ${result.rows.length} new group relations for person: ${personUuid}`);
        
        return {
            success: true,
            personUuid,
            addedGroups: result.rows.length,
            totalRequested: groupUuids.length,
            message: `Added ${result.rows.length} new group relations (${groupUuids.length - result.rows.length} were already existing)`
        };
        
    } catch (error) {
        logger.error(`[SERVICE] - Error adding groups to person ${personUuid}: ${error.message}`);
        throw error;
    }
};

/**
 * Remove a group from a person
 * @param {string} personUuid - UUID of the person
 * @param {string} groupUuid - UUID of the group to remove
 * @returns {Promise<Object>} Result of the operation
 */
const removePersonGroup = async (personUuid, groupUuid) => {
    try {
        logger.info(`[SERVICE] - Removing group ${groupUuid} from person: ${personUuid}`);
        
        // Vérifier que la personne existe
        const personCheck = await db.query('SELECT uuid FROM configuration.persons WHERE uuid = $1', [personUuid]);
        if (personCheck.rows.length === 0) {
            throw new Error('Person not found');
        }
        
        // Vérifier que le groupe existe
        const groupCheck = await db.query('SELECT uuid FROM configuration.groups WHERE uuid = $1', [groupUuid]);
        if (groupCheck.rows.length === 0) {
            throw new Error('Group not found');
        }
        
        // Supprimer la relation
        const deleteQuery = `
            DELETE FROM configuration.rel_persons_groups 
            WHERE rel_member = $1 AND rel_group = $2
            RETURNING rel_member, rel_group`;
        
        const result = await db.query(deleteQuery, [personUuid, groupUuid]);
        
        if (result.rows.length === 0) {
            logger.info(`[SERVICE] - No relation found between person ${personUuid} and group ${groupUuid}`);
            return {
                success: false,
                personUuid,
                groupUuid,
                message: 'No relation found between person and group'
            };
        }
        
        logger.info(`[SERVICE] - Successfully removed group ${groupUuid} from person: ${personUuid}`);
        
        return {
            success: true,
            personUuid,
            groupUuid,
            message: 'Group relation removed successfully'
        };
        
    } catch (error) {
        logger.error(`[SERVICE] - Error removing group ${groupUuid} from person ${personUuid}: ${error.message}`);
        throw error;
    }
};

/**
 * Add approver entities to a person (set person as budget approver for entities)
 * @param {string} personUuid - UUID of the person
 * @param {Array<string>} entityUuids - Array of entity UUIDs to set as approver for
 * @returns {Promise<Object>} Result of the operation
 */
const addApproverEntities = async (personUuid, entityUuids) => {
    try {
        logger.info(`[SERVICE] - Setting person ${personUuid} as budget approver for ${entityUuids.length} entities`);
        
        // Vérifier que la personne existe
        const personCheck = await db.query('SELECT uuid FROM configuration.persons WHERE uuid = $1', [personUuid]);
        if (personCheck.rows.length === 0) {
            throw new Error('Person not found');
        }
        
        // Vérifier que toutes les entités existent
        const entitiesCheck = await db.query(
            'SELECT uuid FROM configuration.entities WHERE uuid = ANY($1)',
            [entityUuids]
        );
        
        if (entitiesCheck.rows.length !== entityUuids.length) {
            const foundEntityUuids = entitiesCheck.rows.map(row => row.uuid);
            const missingEntities = entityUuids.filter(uuid => !foundEntityUuids.includes(uuid));
            throw new Error(`Entities not found: ${missingEntities.join(', ')}`);
        }
        
        // Mettre à jour les entités pour définir la personne comme approbateur budgétaire
        const updateQuery = `
            UPDATE configuration.entities 
            SET budget_approver_uuid = $1, updated_at = CURRENT_TIMESTAMP
            WHERE uuid = ANY($2)
            RETURNING uuid, name`;
        
        const result = await db.query(updateQuery, [personUuid, entityUuids]);
        
        logger.info(`[SERVICE] - Successfully set person ${personUuid} as budget approver for ${result.rows.length} entities`);
        
        return {
            success: true,
            personUuid,
            updatedEntities: result.rows.length,
            totalRequested: entityUuids.length,
            entities: result.rows,
            message: `Person set as budget approver for ${result.rows.length} entities`
        };
        
    } catch (error) {
        logger.error(`[SERVICE] - Error setting person ${personUuid} as budget approver: ${error.message}`);
        throw error;
    }
};

/**
 * Remove a person as budget approver from an entity
 * @param {string} personUuid - UUID of the person
 * @param {string} entityUuid - UUID of the entity to remove approval from
 * @returns {Promise<Object>} Result of the operation
 */
const removeApproverEntity = async (personUuid, entityUuid) => {
    try {
        logger.info(`[SERVICE] - Removing person ${personUuid} as budget approver from entity: ${entityUuid}`);
        
        // Vérifier que la personne existe
        const personCheck = await db.query('SELECT uuid FROM configuration.persons WHERE uuid = $1', [personUuid]);
        if (personCheck.rows.length === 0) {
            throw new Error('Person not found');
        }
        
        // Vérifier que l'entité existe
        const entityCheck = await db.query('SELECT uuid, name FROM configuration.entities WHERE uuid = $1', [entityUuid]);
        if (entityCheck.rows.length === 0) {
            throw new Error('Entity not found');
        }
        
        // Vérifier que la personne est bien l'approbateur budgétaire de cette entité
        const approverCheck = await db.query(
            'SELECT uuid FROM configuration.entities WHERE uuid = $1 AND budget_approver_uuid = $2',
            [entityUuid, personUuid]
        );
        
        if (approverCheck.rows.length === 0) {
            logger.info(`[SERVICE] - Person ${personUuid} is not the budget approver for entity ${entityUuid}`);
            return {
                success: false,
                personUuid,
                entityUuid,
                message: 'Person is not the budget approver for this entity'
            };
        }
        
        // Supprimer la relation (mettre budget_approver_uuid à NULL)
        const updateQuery = `
            UPDATE configuration.entities 
            SET budget_approver_uuid = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE uuid = $1 AND budget_approver_uuid = $2
            RETURNING uuid, name`;
        
        const result = await db.query(updateQuery, [entityUuid, personUuid]);
        
        logger.info(`[SERVICE] - Successfully removed person ${personUuid} as budget approver from entity: ${entityUuid}`);
        
        return {
            success: true,
            personUuid,
            entityUuid,
            entity: result.rows[0],
            message: 'Person removed as budget approver from entity'
        };
        
    } catch (error) {
        logger.error(`[SERVICE] - Error removing person ${personUuid} as budget approver from entity ${entityUuid}: ${error.message}`);
        throw error;
    }
};

/**
 * Build a single filter condition based on column type and operator
 * @param {string} column - Column name
 * @param {Object} filterDef - Filter definition with operator and value(s)
 * @param {string} dataType - Column data type (text, number, date, boolean)
 * @param {Array} queryParams - Array to push parameters into
 * @param {number} paramIndex - Current parameter index
 * @returns {Object} { condition: string, newParamIndex: number }
 */
const buildFilterCondition = (column, filterDef, dataType, queryParams, paramIndex) => {
  const { operator, value, value2, empty_string_is_null } = filterDef;
  let condition = '';
  
  // Handle NULL checks
  if (operator === 'is_null') {
    if (empty_string_is_null && (dataType === 'text' || dataType === 'string')) {
      condition = `(p.${column} IS NULL OR p.${column} = '')`;
    } else {
      condition = `p.${column} IS NULL`;
    }
    return { condition, newParamIndex: paramIndex };
  }
  
  if (operator === 'is_not_null') {
    if (empty_string_is_null && (dataType === 'text' || dataType === 'string')) {
      condition = `(p.${column} IS NOT NULL AND p.${column} != '')`;
    } else {
      condition = `p.${column} IS NOT NULL`;
    }
    return { condition, newParamIndex: paramIndex };
  }
  
  // Handle TEXT/STRING type
  if (dataType === 'text' || dataType === 'string') {
    if (operator === 'contains') {
      // Support array of values with OR
      if (Array.isArray(value)) {
        const conditions = value.map((val, index) => {
          const cond = `LOWER(CAST(p.${column} AS TEXT)) LIKE LOWER($${paramIndex++})`;
          queryParams.push(`%${val}%`);
          return cond;
        });
        condition = `(${conditions.join(' OR ')})`;
        logger.info(`[BUILD FILTER] TEXT contains array: column=${column}, values=[${value.join(', ')}], condition=${condition}`);
      } else {
        condition = `LOWER(CAST(p.${column} AS TEXT)) LIKE LOWER($${paramIndex++})`;
        queryParams.push(`%${value}%`);
        logger.info(`[BUILD FILTER] TEXT contains single: column=${column}, value=${value}, condition=${condition}`);
      }
    } else if (operator === 'equals' || operator === 'is') {
      // Support array of values with IN
      if (Array.isArray(value)) {
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
        condition = `p.${column} IN (${placeholders})`;
        queryParams.push(...value);
        logger.info(`[BUILD FILTER] TEXT equals array: column=${column}, values=[${value.join(', ')}], condition=${condition}`);
      } else {
        condition = `p.${column} = $${paramIndex++}`;
        queryParams.push(value);
        logger.info(`[BUILD FILTER] TEXT equals single: column=${column}, value=${value}, condition=${condition}`);
      }
    }
  }
  
  // Handle NUMBER type
  else if (dataType === 'number' || dataType === 'integer' || dataType === 'numeric') {
    if (operator === 'equals') {
      // Support array of numbers with IN
      if (Array.isArray(value)) {
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
        condition = `p.${column} IN (${placeholders})`;
        queryParams.push(...value);
      } else {
        condition = `p.${column} = $${paramIndex++}`;
        queryParams.push(value);
      }
    } else if (operator === 'lt') {
      condition = `p.${column} < $${paramIndex++}`;
      queryParams.push(value);
    } else if (operator === 'lte') {
      condition = `p.${column} <= $${paramIndex++}`;
      queryParams.push(value);
    } else if (operator === 'gt') {
      condition = `p.${column} > $${paramIndex++}`;
      queryParams.push(value);
    } else if (operator === 'gte') {
      condition = `p.${column} >= $${paramIndex++}`;
      queryParams.push(value);
    } else if (operator === 'between') {
      condition = `p.${column} BETWEEN $${paramIndex++} AND $${paramIndex++}`;
      queryParams.push(value, value2);
    }
  }
  
  // Handle DATE type
  else if (dataType === 'date' || dataType === 'timestamp' || dataType === 'datetime') {
    if (operator === 'after') {
      condition = `p.${column} > $${paramIndex++}`;
      queryParams.push(value);
    } else if (operator === 'on_or_after') {
      condition = `p.${column} >= $${paramIndex++}`;
      queryParams.push(value);
    } else if (operator === 'before') {
      condition = `p.${column} < $${paramIndex++}`;
      queryParams.push(value);
    } else if (operator === 'on_or_before') {
      condition = `p.${column} <= $${paramIndex++}`;
      queryParams.push(value);
    } else if (operator === 'between') {
      condition = `p.${column} BETWEEN $${paramIndex++} AND $${paramIndex++}`;
      queryParams.push(value, value2);
    } else if (operator === 'on' || operator === 'equals') {
      condition = `DATE(p.${column}) = DATE($${paramIndex++})`;
      queryParams.push(value);
    }
  }
  
  // Handle BOOLEAN type
  else if (dataType === 'boolean' || dataType === 'bool') {
    if (operator === 'is_true') {
      condition = `p.${column} = true`;
    } else if (operator === 'is_false') {
      condition = `p.${column} = false`;
    } else if (operator === 'any') {
      condition = '1=1'; // Always true, no filtering
    }
  }
  
  return { condition, newParamIndex: paramIndex };
};

/**
 * Search persons with advanced filters, sorting and pagination
 * @param {Object} searchParams - Search parameters including filters, sort, and pagination
 * @returns {Object} Search results with data and metadata in frontend format
 * 
 * Expected format for advanced filters:
 * {
 *   "filters": {
 *     "mode": "include" | "exclude",  // Include or exclude matching rows
 *     "operator": "AND" | "OR",       // Logical operator between filters
 *     "conditions": [
 *       {
 *         "column": "first_name",
 *         "operator": "contains",       // TEXT: contains, equals/is
 *         "value": "Marc"
 *       },
 *       {
 *         "column": "age",
 *         "operator": "between",        // NUMBER: equals, lt, lte, gt, gte, between
 *         "value": 25,
 *         "value2": 50
 *       },
 *       {
 *         "column": "created_at",
 *         "operator": "after",          // DATE: after, on_or_after, before, on_or_before, between, on
 *         "value": "2024-01-01"
 *       },
 *       {
 *         "column": "active",
 *         "operator": "is_true",        // BOOLEAN: is_true, is_false, any
 *       },
 *       {
 *         "column": "email",
 *         "operator": "is_not_null",    // NULL: is_null, is_not_null
 *         "empty_string_is_null": true  // Optional: treat empty string as null
 *       }
 *     ]
 *   },
 *   "sort": { "by": "last_name", "direction": "asc" },
 *   "pagination": { "page": 1, "limit": 20 }
 * }
 */
const searchPersons = async (searchParams) => {
  try {
    logger.info('[PERSONS SERVICE] Searching persons with advanced filters:', JSON.stringify(searchParams, null, 2));
    
    const { filters = {}, sort = {}, pagination = {} } = searchParams;
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;
    const { by: sortBy = 'created_at', direction: sortDirection = 'desc' } = sort;
    
    // Build WHERE clause from advanced filters
    const queryParams = [];
    let paramIndex = 1;
    let whereClause = '';
    
    // Validate filter format - only accept new format with conditions array
    if (Object.keys(filters).length > 0) {
      // Check if using old format (direct column names in filters)
      const hasDirectColumnFilters = Object.keys(filters).some(key => 
        key !== 'mode' && key !== 'operator' && key !== 'conditions'
      );
      
      if (hasDirectColumnFilters) {
        const error = new Error(
          'Invalid filter format. Please use the new advanced filter format with filters.conditions array. ' +
          'Example: { "filters": { "mode": "include", "operator": "AND", "conditions": [{ "column": "first_name", "operator": "contains", "value": "Marc" }] } }'
        );
        logger.error('[PERSONS SERVICE] Old filter format detected:', filters);
        throw error;
      }
      
      // Process new format with conditions array
      if (!filters.conditions || !Array.isArray(filters.conditions)) {
        const error = new Error(
          'Invalid filter format. filters.conditions must be an array. ' +
          'Example: { "filters": { "conditions": [{ "column": "first_name", "operator": "contains", "value": "Marc" }] } }'
        );
        logger.error('[PERSONS SERVICE] Missing or invalid filters.conditions');
        throw error;
      }
      
      if (filters.conditions.length > 0) {
        const mode = filters.mode || 'include'; // include or exclude
        const operator = (filters.operator || 'AND').toUpperCase(); // AND or OR
        
        logger.info(`[PERSONS SERVICE] Processing ${filters.conditions.length} advanced filter(s) with mode=${mode}, operator=${operator}`);
        
        const filterConditions = [];
        
        // Process each filter condition
        for (const filterDef of filters.conditions) {
          const { column } = filterDef;
          
          logger.info(`[PERSONS SERVICE] Processing filter condition:`, JSON.stringify(filterDef));
          
          if (!column) {
            logger.warn('[PERSONS SERVICE] Filter condition missing column, skipping');
            continue;
          }
          
          // Get column metadata to determine data type
          const metadataQuery = `
            SELECT data_type 
            FROM administration.table_metadata 
            WHERE table_name = $1 AND column_name = $2
          `;
          const metadataResult = await db.query(metadataQuery, ['persons', column]);
          
          logger.info(`[PERSONS SERVICE] Metadata query result for column ${column}:`, metadataResult.rows);
          
          if (metadataResult.rows.length === 0) {
            logger.warn(`[PERSONS SERVICE] No metadata for column ${column}, skipping filter`);
            continue;
          }
          
          const { data_type } = metadataResult.rows[0];
          logger.info(`[PERSONS SERVICE] Column ${column} has data_type: ${data_type}`);
          
          // Build the condition for this filter
          const { condition, newParamIndex } = buildFilterCondition(
            column,
            filterDef,
            data_type,
            queryParams,
            paramIndex
          );
          
          logger.info(`[PERSONS SERVICE] buildFilterCondition returned: condition="${condition}", newParamIndex=${newParamIndex}, queryParams length=${queryParams.length}`);
          
          if (condition) {
            filterConditions.push(condition);
            paramIndex = newParamIndex;
            logger.info(`[PERSONS SERVICE] Added filter: ${condition}`);
          } else {
            logger.warn(`[PERSONS SERVICE] buildFilterCondition returned empty condition for column ${column}`);
          }
        }
        
        // Combine all filter conditions
        if (filterConditions.length > 0) {
          const combinedConditions = filterConditions.join(` ${operator} `);
          
          // Apply mode: include (keep matching rows) or exclude (remove matching rows)
          if (mode === 'exclude') {
            whereClause = `WHERE NOT (${combinedConditions})`;
          } else {
            whereClause = `WHERE ${combinedConditions}`;
          }
          
          logger.info(`[PERSONS SERVICE] Final WHERE clause: ${whereClause}`);
          logger.info(`[PERSONS SERVICE] Query parameters: ${JSON.stringify(queryParams)}`);
        } else {
          logger.warn('[PERSONS SERVICE] No filter conditions generated despite having conditions array');
        }
      }
    }
    
    // Count total results
    const countQuery = `
      SELECT COUNT(*) as total
      FROM configuration.persons p
      ${whereClause}
    `;
    
    logger.info(`[PERSONS SERVICE] Count query: ${countQuery}`);
    logger.info(`[PERSONS SERVICE] Count query params: ${JSON.stringify(queryParams)}`);
    
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);
    
    // Get paginated results with all the data that frontend expects
    const dataQuery = `
      SELECT 
        p.uuid,
        p.first_name,
        p.last_name,
        p.first_name || ' ' || p.last_name AS person_name,
        p.email,
        p.job_role,
        p.active,
        p.critical_user,
        p.external_user,
        p.business_phone,
        p.business_mobile_phone,
        p.personal_mobile_phone,
        p.language,
        p.notification,
        p.time_zone,
        p.date_format,
        p.internal_id,
        p.floor,
        p.room,
        p.locked_out,
        p.password_needs_reset,
        p.roles,
        p.photo,
        p.created_at,
        p.updated_at,
        p.ref_entity_uuid,
        p.ref_location_uuid,
        p.ref_approving_manager_uuid,
        
        -- Informations de l'entité de référence
        e.name as ref_entity_name,
        
        -- Informations de la localisation
        l.name as ref_location_name,
        
        -- Informations du manager approbateur
        m.first_name || ' ' || m.last_name as ref_approving_manager_name,
        
        -- Nombre de tickets enregistrés (requested_for_uuid)
        (SELECT COUNT(*) 
         FROM core.tickets t 
         WHERE t.requested_for_uuid = p.uuid) AS raised_tickets_count,
        
        -- Nombre de groupes dont la personne est membre
        (SELECT COUNT(*) 
         FROM configuration.rel_persons_groups rpg 
         WHERE rpg.rel_member = p.uuid) AS member_of_group_count,
        
        -- Nombre de tickets assignés à la personne
        (SELECT COUNT(*) 
         FROM core.rel_tickets_groups_persons rtgp 
         WHERE rtgp.rel_assigned_to_person = p.uuid 
           AND rtgp.type = 'ASSIGNED'
           AND rtgp.ended_at IS NULL) AS assigned_tickets_count,
        
        -- Nombre de tickets observés par la personne
        (SELECT COUNT(*) 
         FROM core.rel_tickets_groups_persons rtgp 
         WHERE rtgp.rel_assigned_to_person = p.uuid 
           AND rtgp.type = 'WATCHER'
           AND rtgp.ended_at IS NULL) AS watched_tickets_count,
        
        -- Nombre d'entités pour lesquelles la personne est approbateur budgétaire
        (SELECT COUNT(*) 
         FROM configuration.entities ent 
         WHERE ent.budget_approver_uuid = p.uuid) AS budget_approver_count
         
      FROM configuration.persons p
      LEFT JOIN configuration.entities e ON p.ref_entity_uuid = e.uuid
      LEFT JOIN configuration.locations l ON p.ref_location_uuid = l.uuid
      LEFT JOIN configuration.persons m ON p.ref_approving_manager_uuid = m.uuid
      ${whereClause}
      ORDER BY p.${sortBy} ${sortDirection.toUpperCase()}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    queryParams.push(limit, offset);
    const dataResult = await db.query(dataQuery, queryParams);
    
    // Calculate pagination metadata in frontend format
    const currentPage = page;
    const totalPages = Math.ceil(total / limit);
    const hasMore = offset + limit < total;
    
    logger.info(`[PERSONS SERVICE] Found ${dataResult.rows.length} persons (total: ${total})`);
    
    // Return in the format expected by frontend
    return {
      data: dataResult.rows,
      total: total,
      hasMore: hasMore,
      pagination: {
        offset: offset,
        limit: limit,
        currentPage: currentPage,
        totalPages: totalPages,
        sortBy: sortBy,
        sortDirection: sortDirection
      }
    };
    
  } catch (error) {
    logger.error('[PERSONS SERVICE] Error searching persons:', error);
    throw error;
  }
};

/**
 * Get filter values for a specific column in persons table
 * @param {string} columnName - Name of the column
 * @param {string} searchQuery - Optional search query for dynamic filters
 * @returns {Object} Filter values
 */
const getPersonsFilterValues = async (columnName, searchQuery = null) => {
  try {
    logger.info(`[PERSONS SERVICE] Getting filter values for persons.${columnName}`);
    
    // First, get the metadata for this column
    const metadataQuery = `
      SELECT 
        filter_type,
        filter_options,
        is_foreign_key,
        related_table,
        related_column
      FROM administration.table_metadata
      WHERE table_name = $1 AND column_name = $2
    `;
    
    const metadataResult = await db.query(metadataQuery, ['persons', columnName]);
    
    if (metadataResult.rows.length === 0) {
      throw new Error(`No metadata found for persons.${columnName}`);
    }
    
    const metadata = metadataResult.rows[0];
    let values = [];
    
    // Handle different filter types
    switch (metadata.filter_type) {
      case 'checkbox':
        // Get distinct values for checkbox filter
        if (metadata.is_foreign_key && metadata.related_table) {
          // If it's a foreign key, get values from related table
          const fkQuery = `
            SELECT DISTINCT
              r.uuid as value,
              r.name as label
            FROM ${metadata.related_table} r
            INNER JOIN ${getTableWithSchema('persons')} t ON t.${columnName} = r.${metadata.related_column || 'uuid'}
            WHERE r.name IS NOT NULL
            ORDER BY r.name
          `;
          const fkResult = await db.query(fkQuery);
          values = fkResult.rows;
        } else {
          // Get distinct values from the column itself
          const distinctQuery = `
            SELECT DISTINCT ${columnName} as value
            FROM ${getTableWithSchema('persons')}
            WHERE ${columnName} IS NOT NULL
            ORDER BY ${columnName}
          `;
          const distinctResult = await db.query(distinctQuery);
          values = distinctResult.rows.map(row => ({
            value: row.value,
            label: row.value
          }));
        }
        break;
        
      case 'search':
        if (searchQuery) {
          // Dynamic search based on query
          if (metadata.is_foreign_key && metadata.related_table) {
            // Search in related table
            const searchFkQuery = `
              SELECT DISTINCT
                r.uuid as value,
                r.name as label
              FROM ${metadata.related_table} r
              WHERE LOWER(r.name) LIKE LOWER($1)
              ORDER BY r.name
              LIMIT 20
            `;
            const searchFkResult = await db.query(searchFkQuery, [`%${searchQuery}%`]);
            values = searchFkResult.rows;
          } else {
            // Search in the column itself
            const searchColumnQuery = `
              SELECT DISTINCT ${columnName} as value
              FROM ${getTableWithSchema('persons')}
              WHERE LOWER(CAST(${columnName} AS TEXT)) LIKE LOWER($1)
                AND ${columnName} IS NOT NULL
              ORDER BY ${columnName}
              LIMIT 20
            `;
            const searchColumnResult = await db.query(searchColumnQuery, [`%${searchQuery}%`]);
            values = searchColumnResult.rows.map(row => ({
              value: row.value,
              label: row.value
            }));
          }
        }
        break;
        
      case 'select':
        // Get all possible values for select filter
        if (metadata.filter_options && metadata.filter_options.options) {
          // Static options from metadata
          values = metadata.filter_options.options.map(option => ({
            value: option,
            label: option
          }));
        } else if (metadata.is_foreign_key && metadata.related_table) {
          // Dynamic options from related table
          const selectQuery = `
            SELECT DISTINCT
              uuid as value,
              name as label
            FROM ${metadata.related_table}
            WHERE name IS NOT NULL
            ORDER BY name
          `;
          const selectResult = await db.query(selectQuery);
          values = selectResult.rows;
        }
        break;
        
      case 'date_range':
        // Return min and max dates
        const dateRangeQuery = `
          SELECT 
            MIN(${columnName}) as min_date,
            MAX(${columnName}) as max_date
          FROM ${getTableWithSchema('persons')}
          WHERE ${columnName} IS NOT NULL
        `;
        const dateRangeResult = await db.query(dateRangeQuery);
        return {
          min: dateRangeResult.rows[0].min_date,
          max: dateRangeResult.rows[0].max_date
        };
        
      default:
        logger.warn(`[PERSONS SERVICE] Unknown filter type: ${metadata.filter_type}`);
        break;
    }
    
    logger.info(`[PERSONS SERVICE] Found ${values.length} values for ${columnName}`);
    return values;
    
  } catch (error) {
    logger.error('[PERSONS SERVICE] Error getting filter values:', error);
    throw error;
  }
};

module.exports = {
    getAllPersons,
    getPersonsPaginated,
    getPersonByUuid,
    getPersonGroups,
    updatePerson,
    createPerson,
    addPersonGroups,
    removePersonGroup,
    addApproverEntities,
    removeApproverEntity,
    searchPersons,
    getPersonsFilterValues
};
