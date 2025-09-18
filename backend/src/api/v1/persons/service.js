const db = require('../../../config/database');
const logger = require('../../../config/logger');

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
            ORDER BY p.last_name, p.first_name
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

module.exports = {
    getAllPersons,
    getPersonByUuid,
    getPersonGroups,
    updatePerson,
    createPerson
};
