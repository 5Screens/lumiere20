const db = require('../../../config/database');
const logger = require('../../../config/logger');
const ticketService = require('./service');

/**
 * Récupère une user story par son UUID
 * @param {string} uuid - UUID de la user story
 * @param {string} lang - Code de langue pour les traductions (fr, en, etc.)
 * @returns {Promise<Object>} - Détails de la user story
 */
const getStoryById = async (uuid, lang = 'en') => {
    logger.info(`[STORY SERVICE] Fetching user story with UUID: ${uuid} and language: ${lang}`);
    
    try {
        // Requête SQL pour récupérer les détails de la user story avec les données d'assignation
        const query = `
            SELECT 
                t.uuid,
                t.title,
                t.description,
                t.requested_for_uuid,
                t.writer_uuid,
                t.ticket_type_code,
                t.ticket_status_code,
                t.created_at,
                t.updated_at,
                t.closed_at,
                p2.first_name || ' ' || p2.last_name as requested_for_name,
                p3.first_name || ' ' || p3.last_name as writer_name,
                COALESCE(ttt.label, tt.code) as ticket_type_label,
                COALESCE(tst.label, ts.code) as ticket_status_label,
                tt.code as ticket_type_code,
                ts.code as ticket_status_code,
                
                -- Informations sur l'équipe assignée
                g.uuid as assigned_to_group,
                g.group_name as assigned_group_name,
                
                -- Informations sur la personne assignée
                p4.uuid as rel_assigned_to_person,
                p4.first_name || ' ' || p4.last_name as assigned_person_name,
                
                -- Champs spécifiques aux user stories depuis core_extended_attributes
                t.core_extended_attributes->'tags' as tags,
                t.core_extended_attributes->>'priority' as priority,
                t.core_extended_attributes->>'story_points' as story_points,
                t.core_extended_attributes->>'acceptance_criteria' as acceptance_criteria,
                
                -- Récupération de l'UUID du sprint parent
                (
                    SELECT parent.uuid
                    FROM core.rel_parent_child_tickets rpc
                    JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid
                    WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'STORY' AND parent.ticket_type_code = 'SPRINT' AND rpc.ended_at IS NULL
                    LIMIT 1
                ) as sprint_id,
                
                -- Récupération de l'UUID de l'epic parent
                (
                    SELECT parent.uuid
                    FROM core.rel_parent_child_tickets rpc
                    JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid
                    WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'STORY' AND parent.ticket_type_code = 'EPIC' AND rpc.ended_at IS NULL
                    LIMIT 1
                ) as epic_id,
                
                -- Récupération de l'UUID du projet parent (deux cas possibles)
                COALESCE(
                    -- Cas 1: STORY >>> EPIC >>> PROJECT (story est fille d'une epic qui est fille d'un projet)
                    (
                        SELECT project.uuid
                        FROM core.rel_parent_child_tickets rpc1
                        JOIN core.tickets epic ON rpc1.rel_parent_ticket_uuid = epic.uuid
                        JOIN core.rel_parent_child_tickets rpc2 ON epic.uuid = rpc2.rel_child_ticket_uuid
                        JOIN core.tickets project ON rpc2.rel_parent_ticket_uuid = project.uuid
                        WHERE rpc1.rel_child_ticket_uuid = t.uuid 
                          AND rpc1.dependency_code = 'STORY' 
                          AND rpc1.ended_at IS NULL
                          AND rpc2.dependency_code = 'EPIC'
                          AND rpc2.ended_at IS NULL
                        LIMIT 1
                    ),
                    
                    -- Cas 2: STORY >>> PROJECT (story est directement fille d'un projet)
                    (
                        SELECT parent.uuid
                        FROM core.rel_parent_child_tickets rpc
                        JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid
                        WHERE rpc.rel_child_ticket_uuid = t.uuid 
                          AND rpc.dependency_code = 'STORY' 
                          AND parent.ticket_type_code = 'PROJECT'
                          AND rpc.ended_at IS NULL
                        LIMIT 1
                    )
                ) as project_id,
                
                -- Récupération du titre du projet parent (deux cas possibles)
                COALESCE(
                    -- Cas 1: STORY >>> EPIC >>> PROJECT (story est fille d'une epic qui est fille d'un projet)
                    (
                        SELECT project.title
                        FROM core.rel_parent_child_tickets rpc1
                        JOIN core.tickets epic ON rpc1.rel_parent_ticket_uuid = epic.uuid
                        JOIN core.rel_parent_child_tickets rpc2 ON epic.uuid = rpc2.rel_child_ticket_uuid
                        JOIN core.tickets project ON rpc2.rel_parent_ticket_uuid = project.uuid
                        WHERE rpc1.rel_child_ticket_uuid = t.uuid 
                          AND rpc1.dependency_code = 'STORY' 
                          AND rpc1.ended_at IS NULL
                          AND rpc2.dependency_code = 'EPIC'
                          AND rpc2.ended_at IS NULL
                        LIMIT 1
                    ),
                    
                    -- Cas 2: STORY >>> PROJECT (story est directement fille d'un projet)
                    (
                        SELECT parent.title
                        FROM core.rel_parent_child_tickets rpc
                        JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid
                        WHERE rpc.rel_child_ticket_uuid = t.uuid 
                          AND rpc.dependency_code = 'STORY' 
                          AND parent.ticket_type_code = 'PROJECT'
                          AND rpc.ended_at IS NULL
                        LIMIT 1
                    )
                ) as project_name
                
            FROM core.tickets t
            LEFT JOIN configuration.persons p2 ON t.requested_for_uuid = p2.uuid
            JOIN configuration.persons p3 ON t.writer_uuid = p3.uuid
            JOIN configuration.ticket_types tt ON t.ticket_type_code = tt.code
            JOIN configuration.ticket_status ts ON t.ticket_status_code = ts.code AND ts.rel_ticket_type = tt.code 
            LEFT JOIN translations.ticket_types_translation ttt ON tt.uuid = ttt.ticket_type_uuid 
                AND ttt.lang = $2
            LEFT JOIN translations.ticket_status_translation tst ON ts.uuid = tst.ticket_status_uuid 
                AND tst.lang = $2
                
            -- Jointure pour l'assignation (équipe et personne)
            LEFT JOIN (
                SELECT rel_ticket, rel_assigned_to_group, rel_assigned_to_person
                FROM core.rel_tickets_groups_persons
                WHERE type = 'ASSIGNED' AND (ended_at IS NULL OR ended_at > NOW())
            ) rtgp ON t.uuid = rtgp.rel_ticket
            LEFT JOIN configuration.groups g ON rtgp.rel_assigned_to_group = g.uuid
            LEFT JOIN configuration.persons p4 ON rtgp.rel_assigned_to_person = p4.uuid
            
            WHERE t.uuid = $1 AND t.ticket_type_code = 'USER_STORY'
        `;
        
        const result = await db.query(query, [uuid, lang]);
        
        if (result.rows.length === 0) {
            logger.warn(`[STORY SERVICE] No user story found with UUID: ${uuid}`);
            return null;
        }
        
        logger.info(`[STORY SERVICE] Successfully retrieved user story with UUID: ${uuid}`);
        
        const story = result.rows[0];
        /* Transformer les tags de format JSON string en tableau d'objets
        if (story.tags) {
            try {
                // Parse la chaîne JSON des tags
                const parsedTags = JSON.parse(story.tags);
                // Transformer chaque tag en objet avec propriété name
                story.tags = parsedTags.map(tag => ({ name: tag }));
            } catch (err) {
                logger.warn(`[STORY SERVICE] Error parsing tags for story ${uuid}:`, err);
                // En cas d'erreur, initialiser avec un tableau vide
                story.tags = [];
            }
        } else {
            story.tags = [];
        }*/
        
        return story;
    } catch (error) {
        logger.error(`[STORY SERVICE] Error fetching user story with UUID ${uuid}:`, error);
        throw error;
    }
};

/**
 * Récupère les user stories avec les attributs étendus spécifiques aux user stories
 * @param {string} lang - Code de langue pour les traductions
 * @returns {Promise<Array>} - Liste des user stories avec leurs attributs
 */
const getUserStories = async (lang) => {
    const servicePrefix = '[STORY SERVICE]';
    
    // Définition des attributs spécifiques aux user stories
    const baseQuery = `
        -- Extraction des attributs spécifiques aux user stories depuis le JSONB
        t.core_extended_attributes->'tags' as tags,
        t.core_extended_attributes->>'priority' as priority,
        t.core_extended_attributes->>'story_points' as story_points,
        t.core_extended_attributes->>'acceptance_criteria' as acceptance_criteria,
        
        -- Nombre de pièces jointes
        (
            SELECT COUNT(*)
            FROM core.attachments a
            WHERE a.object_uuid = t.uuid
        ) as attachments_count,
        
        -- Nombre de tickets liés
        (
            SELECT COUNT(*)
            FROM core.rel_parent_child_tickets rpc
            WHERE rpc.rel_parent_ticket_uuid = t.uuid
        ) as tieds_tickets_count,
        
        -- Récupération du titre du sprint parent
        (
            SELECT parent.title
            FROM core.rel_parent_child_tickets rpc
            JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid
            WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'STORY' AND parent.ticket_type_code = 'SPRINT' AND rpc.ended_at IS NULL
            LIMIT 1
        ) as sprint_title,
        
        -- Récupération du titre de l'epic parent
        (
            SELECT parent.title
            FROM core.rel_parent_child_tickets rpc
            JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid
            WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'STORY' AND parent.ticket_type_code = 'EPIC' AND rpc.ended_at IS NULL
            LIMIT 1
        ) as epic_title,
        
        -- Récupération du titre du projet parent (deux cas possibles)
        COALESCE(
            -- Cas 1: STORY >>> EPIC >>> PROJECT (story est fille d'une epic qui est fille d'un projet)
            (
                SELECT project.title
                FROM core.rel_parent_child_tickets rpc1
                JOIN core.tickets sprint ON rpc1.rel_parent_ticket_uuid = sprint.uuid
                JOIN core.rel_parent_child_tickets rpc2 ON sprint.uuid = rpc2.rel_child_ticket_uuid
                JOIN core.tickets project ON rpc2.rel_parent_ticket_uuid = project.uuid
                WHERE rpc1.rel_child_ticket_uuid = t.uuid 
                  AND rpc1.dependency_code = 'STORY' 
                  AND rpc1.ended_at IS NULL
                  AND rpc2.dependency_code = 'EPIC'
                  AND rpc2.ended_at IS NULL
                LIMIT 1
            ),
            
            -- Cas 2: STORY >>> PROJECT (story est directement fille d'un projet)
            (
                SELECT parent.title
                FROM core.rel_parent_child_tickets rpc
                JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid
                WHERE rpc.rel_child_ticket_uuid = t.uuid 
                  AND rpc.dependency_code = 'STORY' 
                  AND parent.ticket_type_code = 'PROJECT'
                  AND rpc.ended_at IS NULL
                LIMIT 1
            )
        ) as project_title,
        
        -- Nombre de tâches enfants
        (
            SELECT COUNT(*)
            FROM core.rel_parent_child_tickets rpc
            WHERE rpc.rel_parent_ticket_uuid = t.uuid 
              AND rpc.dependency_code = 'TASK' 
              AND rpc.ended_at IS NULL
        ) as tasks_count
    `;
    
    // Définition des jointures spécifiques aux user stories
    const additionalJoins = ``;
    
    // Utilisation de la fonction getTickets factorisée
    return ticketService.getTickets(lang, 'USER_STORY', baseQuery, additionalJoins, [], servicePrefix);
};

/**
 * Updates a user story partially by its UUID
 * @param {string} uuid - UUID of the user story to update
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated user story details
 */
const updateStory = async (uuid, updateData) => {
    // Define story-specific fields
    const standardFields = [
        'title', 'description', 'ticket_status_code',
        'ticket_type_code', 'requested_for_uuid', 'requested_by_uuid'
    ];
    
    const assignmentFields = [
        'assigned_to_person'
    ];
    
    const extendedAttributesFields = [
        'tags', 'priority', 'story_points', 'acceptance_criteria'
    ];
    
    // Use functions from service.js
    const { applyUpdate, addChildrenTickets, removeChildTicket } = require('./service');
    
    // Extract project ID, epic ID and sprint ID from updateData
    const projectId = updateData.project_id;
    const epicId = updateData.epic_id;
    const sprintId = updateData.sprint_id;
    
    // Update standard fields, assignment fields and extended attributes
    const updatedStory = await applyUpdate(
        uuid,
        updateData,
        'USER_STORY',
        standardFields,
        assignmentFields,
        extendedAttributesFields,
        getStoryById,
        '[STORY SERVICE]'
    );
    
    // Handle project relation if present
    if (projectId !== undefined) {
        logger.info(`[STORY SERVICE] Updating project relation for user story ${uuid}`);
        
        try {
            // 1. Récupérer d'abord les relations existantes pour ce type de dépendance
            const existingRelations = await db.query(
                `SELECT rel_parent_ticket_uuid FROM core.rel_parent_child_tickets 
                 WHERE rel_child_ticket_uuid = $1 AND dependency_code = $2 AND ended_at IS NULL`,
                [uuid, 'STORY']
            );
            
            // Logs pour débogage
            logger.info(`[STORY SERVICE] Found ${existingRelations.rowCount} existing project relations for user story ${uuid}`);
            logger.info(`[STORY SERVICE] Existing project relations: ${JSON.stringify(existingRelations.rows)}`);
            
            // 2. Supprimer chaque relation existante
            for (const row of existingRelations.rows) {
                await removeChildTicket(row.rel_parent_ticket_uuid, uuid);
                logger.info(`[STORY SERVICE] Removed project relation: ${row.rel_parent_ticket_uuid} -> ${uuid}`);
            }
            
            // 3. Ajouter la nouvelle relation si elle existe
            if (projectId) {
                await addChildrenTickets(projectId, 'STORY', [uuid]);
                logger.info(`[STORY SERVICE] Added new project relation: ${projectId} -> ${uuid}`);
            } else {
                logger.info(`[STORY SERVICE] No new project relation to add for user story ${uuid}`);
            }
        } catch (error) {
            logger.error(`[STORY SERVICE] Error managing project relation for user story ${uuid}:`, error);
        }
    }
    
    // Update parent epic if epic_id is present
    if (epicId) {
        await updateParentEpic(uuid, epicId);
        logger.info(`[STORY SERVICE] Updated parent epic for user story ${uuid} to epic ${epicId}`);
    }
    
    // Update parent sprint if sprint_id is present
    if (sprintId) {
        await updateParentSprint(uuid, sprintId);
        logger.info(`[STORY SERVICE] Updated parent sprint for user story ${uuid} to sprint ${sprintId}`);
    }
    
    return updatedStory;
};

/**
 * Updates the parent epic of a user story
 * @param {string} storyUUID - UUID of the user story
 * @param {string} parentEpicUUID - UUID of the new parent epic
 * @returns {Promise<Object>} - Result of the operation
 */
const updateParentEpic = async (storyUUID, parentEpicUUID) => {
    logger.info(`[STORY SERVICE] Updating parent epic for story ${storyUUID} to epic ${parentEpicUUID}`);
    
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        // Step 1: Find current parent of the story
        logger.info(`[STORY SERVICE] Searching for current parent of story ${storyUUID}`);
        const currentParentQuery = `
            SELECT rel_parent_ticket_uuid as parent_uuid
            FROM core.rel_parent_child_tickets
            WHERE rel_child_ticket_uuid = $1
            AND dependency_code = 'STORY'
            AND ended_at IS NULL
        `;
        
        const currentParentResult = await client.query(currentParentQuery, [storyUUID]);
        
        if (currentParentResult.rows.length > 0) {
            const currentParentUUID = currentParentResult.rows[0].parent_uuid;
            logger.info(`[STORY SERVICE] Found current parent: ${currentParentUUID}`);
            
            // Step 2: End current relationship
            logger.info(`[STORY SERVICE] Ending current relationship between parent ${currentParentUUID} and story ${storyUUID}`);
            const endRelationQuery = `
                UPDATE core.rel_parent_child_tickets
                SET ended_at = NOW(),
                    updated_at = NOW()
                WHERE rel_parent_ticket_uuid = $1
                AND rel_child_ticket_uuid = $2
                AND dependency_code = 'STORY'
                AND ended_at IS NULL
            `;
            
            const endResult = await client.query(endRelationQuery, [currentParentUUID, storyUUID]);
            logger.info(`[STORY SERVICE] Ended ${endResult.rowCount} relationship(s)`);
        } else {
            logger.info(`[STORY SERVICE] No current parent found for story ${storyUUID}`);
        }
        
        // Step 3: Create new relationship with the epic
        logger.info(`[STORY SERVICE] Creating new relationship between epic ${parentEpicUUID} and story ${storyUUID}`);
        const createRelationQuery = `
            INSERT INTO core.rel_parent_child_tickets (
                uuid,
                rel_parent_ticket_uuid,
                rel_child_ticket_uuid,
                dependency_code,
                created_at,
                updated_at
            ) VALUES (
                uuid_generate_v4(),
                $1,
                $2,
                'STORY',
                NOW(),
                NOW()
            )
        `;
        
        await client.query(createRelationQuery, [parentEpicUUID, storyUUID]);
        logger.info(`[STORY SERVICE] Successfully created new parent-child relationship`);
        
        await client.query('COMMIT');
        
        logger.info(`[STORY SERVICE] Successfully updated parent epic for story ${storyUUID}`);
        return {
            success: true,
            message: 'Parent epic updated successfully',
            storyUUID,
            newParentEpicUUID: parentEpicUUID
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`[STORY SERVICE] Error updating parent epic for story ${storyUUID}:`, error);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Updates the parent sprint of a user story
 * @param {string} storyUUID - UUID of the user story
 * @param {string} parentSprintUUID - UUID of the new parent sprint
 * @returns {Promise<Object>} - Result of the operation
 */
const updateParentSprint = async (storyUUID, parentSprintUUID) => {
    logger.info(`[STORY SERVICE] Updating parent sprint for story ${storyUUID} to sprint ${parentSprintUUID}`);
    
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        // Step 1: Find current sprint parent of the story
        logger.info(`[STORY SERVICE] Searching for current sprint parent of story ${storyUUID}`);
        const currentSprintQuery = `
            SELECT rpc.rel_parent_ticket_uuid as parent_uuid
            FROM core.rel_parent_child_tickets rpc
            INNER JOIN core.tickets t ON t.uuid = rpc.rel_parent_ticket_uuid
            WHERE rpc.rel_child_ticket_uuid = $1
            AND rpc.dependency_code = 'STORY'
            AND rpc.ended_at IS NULL
            AND t.ticket_type_code = 'SPRINT'
        `;
        
        const currentSprintResult = await client.query(currentSprintQuery, [storyUUID]);
        
        if (currentSprintResult.rows.length > 0) {
            const currentSprintUUID = currentSprintResult.rows[0].parent_uuid;
            logger.info(`[STORY SERVICE] Found current sprint parent: ${currentSprintUUID}`);
            
            // Step 2: End current sprint relationship
            logger.info(`[STORY SERVICE] Ending current relationship between sprint ${currentSprintUUID} and story ${storyUUID}`);
            const endRelationQuery = `
                UPDATE core.rel_parent_child_tickets
                SET ended_at = NOW(),
                    updated_at = NOW()
                WHERE rel_parent_ticket_uuid = $1
                AND rel_child_ticket_uuid = $2
                AND dependency_code = 'STORY'
                AND ended_at IS NULL
            `;
            
            const endResult = await client.query(endRelationQuery, [currentSprintUUID, storyUUID]);
            logger.info(`[STORY SERVICE] Ended ${endResult.rowCount} sprint relationship(s)`);
        } else {
            logger.info(`[STORY SERVICE] No current sprint parent found for story ${storyUUID}`);
        }
        
        // Step 3: Create new relationship with the sprint
        logger.info(`[STORY SERVICE] Creating new relationship between sprint ${parentSprintUUID} and story ${storyUUID}`);
        const createRelationQuery = `
            INSERT INTO core.rel_parent_child_tickets (
                uuid,
                rel_parent_ticket_uuid,
                rel_child_ticket_uuid,
                dependency_code,
                created_at,
                updated_at
            ) VALUES (
                uuid_generate_v4(),
                $1,
                $2,
                'STORY',
                NOW(),
                NOW()
            )
        `;
        
        await client.query(createRelationQuery, [parentSprintUUID, storyUUID]);
        logger.info(`[STORY SERVICE] Successfully created new sprint parent-child relationship`);
        
        await client.query('COMMIT');
        
        logger.info(`[STORY SERVICE] Successfully updated parent sprint for story ${storyUUID}`);
        return {
            success: true,
            message: 'Parent sprint updated successfully',
            storyUUID,
            newParentSprintUUID: parentSprintUUID
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`[STORY SERVICE] Error updating parent sprint for story ${storyUUID}:`, error);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Crée une nouvelle user story
 * @param {Object} storyData - Données pour la création de la user story
 * @returns {Promise<Object>} - Détails de la user story créée
 */
const createStory = async (storyData) => {
    logger.info('[STORY SERVICE] Creating new user story');
    
    // Définir les champs standards pour une user story
    const standardFields = {
        title: storyData.title,
        description: storyData.description,
        configuration_item_uuid: storyData.configuration_item_uuid,
        ticket_type_code: 'USER_STORY',
        ticket_status_code: storyData.ticket_status_code || 'NEW',
        requested_by_uuid: storyData.requested_by_uuid || null,
        requested_for_uuid: storyData.requested_for_uuid || null,
        writer_uuid: storyData.writer_uuid
    };
    
    // Logique d'assignation spécifique aux USER_STORY
    const assignmentFields = {};
    
    // rel_assigned_to_person from body
    const relAssignedToPerson = storyData.assigned_to_person || null;
    
    // rel_assigned_to_group = uuid du groupe assigné au ticket ayant le uuid égal à project_id
    let relAssignedToGroup = null;
    if (storyData.project_id) {
        try {
            const groupQuery = `SELECT rel_assigned_to_group FROM core.rel_tickets_groups_persons WHERE rel_ticket = $1 AND type = 'ASSIGNED' LIMIT 1`;
            const groupResult = await db.query(groupQuery, [storyData.project_id]);
            if (groupResult.rows.length > 0) {
                relAssignedToGroup = groupResult.rows[0].rel_assigned_to_group;
            }
        } catch (error) {
            logger.warn(`[STORY SERVICE] Could not retrieve group assignment from project ${storyData.project_id}:`, error.message);
        }
    }
    
    if (relAssignedToGroup || relAssignedToPerson) {
        assignmentFields.assigned_to_group = relAssignedToGroup;
        assignmentFields.assigned_to_person = relAssignedToPerson;
        logger.info('[STORY SERVICE] Prepared USER_STORY assignment');
    } else {
        logger.warn('[STORY SERVICE] USER_STORY assignment: no group or person found for assignment');
    }
    
    // Définir les attributs étendus pour une user story
    const extendedAttributesFields = {};
    
    // Remove forbidden fields
    const forbiddenFields = ['uuid', 'created_at', 'updated_at', 'sprint_id', 'project_id', 'epic_id', 'rel_assigned_to_person'];
    // Fields that go directly in columns
    const columnFields = [
        'title', 'description', 'configuration_item_uuid', 'writer_uuid',
        'ticket_type_code', 'ticket_status_code', 'requested_for_uuid', 'requested_by_uuid'
    ];
    
    // Everything else goes into core_extended_attributes
    Object.keys(storyData).forEach(key => {
        if (!forbiddenFields.includes(key) && !columnFields.includes(key)) {
            extendedAttributesFields[key] = storyData[key];
        }
    });
    
    // Gérer la liste des observateurs (watchers)
    const watchList = storyData.watch_list && Array.isArray(storyData.watch_list) ? 
        storyData.watch_list : [];
    
    // Pour les USER_STORY, pas de relations parent-enfant dans applyCreation
    // Nous les gérerons après avec addChildrenTickets
    const parentChildRelations = [];
    
    logger.info('[STORY SERVICE] Successfully prepared data for user story creation');
    
    // Appeler applyCreation pour créer effectivement le ticket
    const { applyCreation, addChildrenTickets } = require('./service');
    
    const createdStory = await applyCreation(
        storyData,
        'USER_STORY',
        standardFields,
        assignmentFields,
        extendedAttributesFields,
        watchList,
        parentChildRelations,
        getStoryById,
        '[STORY SERVICE]'
    );
    
    // USER_STORY: relations parent-enfant multiples possibles
    // Créer les relations après la création de la story
    
    // 5A: epic_id present - EPIC → USER_STORY
    if (storyData.epic_id) {
        try {
            logger.info(`[STORY SERVICE] Creating USER_STORY relationship with EPIC: ${storyData.epic_id}`);
            await addChildrenTickets(
                storyData.epic_id, // Parent UUID (l'epic)
                'STORY', // Type de dépendance
                [createdStory.uuid] // Enfant UUID (la story créée)
            );
            logger.info(`[STORY SERVICE] Successfully created USER_STORY relationship with EPIC: ${storyData.epic_id}`);
        } catch (relationError) {
            logger.error(`[STORY SERVICE] Error creating USER_STORY relationship with EPIC: ${relationError.message}`);
        }
    } else if (storyData.project_id) {
        // 5B: epic_id vide, story fille du projet - PROJECT → USER_STORY
        try {
            logger.info(`[STORY SERVICE] Creating USER_STORY relationship with PROJECT: ${storyData.project_id}`);
            await addChildrenTickets(
                storyData.project_id, // Parent UUID (le projet)
                'STORY', // Type de dépendance
                [createdStory.uuid] // Enfant UUID (la story créée)
            );
            logger.info(`[STORY SERVICE] Successfully created USER_STORY relationship with PROJECT: ${storyData.project_id}`);
        } catch (relationError) {
            logger.error(`[STORY SERVICE] Error creating USER_STORY relationship with PROJECT: ${relationError.message}`);
        }
    }
    
    // 5C: sprint_id présent - SPRINT → USER_STORY
    if (storyData.sprint_id) {
        try {
            logger.info(`[STORY SERVICE] Creating USER_STORY relationship with SPRINT: ${storyData.sprint_id}`);
            await addChildrenTickets(
                storyData.sprint_id, // Parent UUID (le sprint)
                'STORY', // Type de dépendance
                [createdStory.uuid] // Enfant UUID (la story créée)
            );
            logger.info(`[STORY SERVICE] Successfully created USER_STORY relationship with SPRINT: ${storyData.sprint_id}`);
        } catch (relationError) {
            logger.error(`[STORY SERVICE] Error creating USER_STORY relationship with SPRINT: ${relationError.message}`);
        }
    }
    
    return createdStory;
};

/**
 * Build filter condition for user stories search (wrapper with USER_STORY-specific JSONB columns)
 * @param {string} column - Column name
 * @param {Object} filterDef - Filter definition with operator and value(s)
 * @param {string} dataType - Column data type (text, number, date, boolean)
 * @param {Array} queryParams - Array to push parameters into
 * @param {number} paramIndex - Current parameter index
 * @returns {Object} { condition: string, newParamIndex: number }
 */
const buildFilterCondition = (column, filterDef, dataType, queryParams, paramIndex) => {
  const { buildFilterCondition: buildGenericFilterCondition } = require('./ticketFilterBuilder');
  
  return buildGenericFilterCondition(column, filterDef, dataType, queryParams, paramIndex, {
    jsonbDateColumns: [],
    jsonbTextColumns: [
      'priority'
    ],
    jsonbArrayColumns: [
      'tags'
    ],
    jsonbNumericColumns: [
      'story_points'
    ],
    servicePrefix: '[STORY SERVICE]'
  });
};

/**
 * Search user stories with advanced filters, sorting, and pagination
 * @param {Object} searchParams - Search parameters
 * @returns {Promise<Object>} Object with data, total, hasMore, and pagination metadata
 */
const searchUserStories = async (searchParams) => {
  try {
    const servicePrefix = '[STORY SERVICE]';
    
    const { filters = {}, sort = {}, pagination = {}, lang = 'en' } = searchParams;
    
    // Extract pagination parameters
    const page = pagination.page || 1;
    const limit = pagination.limit || 50;
    const offset = (page - 1) * limit;
    
    // Extract sort parameters
    const sortBy = sort.by || 'created_at';
    const sortDirection = sort.direction || 'desc';
    
    // Build WHERE clause from advanced filters
    const queryParams = [];
    let paramIndex = 1;
    let whereClause = '';
    
    // Always filter by ticket_type = USER_STORY
    const baseConditions = [`t.ticket_type_code = 'USER_STORY'`];
    
    // Validate filter format
    if (filters && filters.conditions && Array.isArray(filters.conditions) && filters.conditions.length > 0) {
        const mode = filters.mode || 'include';
        const operator = (filters.operator || 'AND').toUpperCase();
        
        logger.info(`${servicePrefix} Processing ${filters.conditions.length} advanced filter(s) with mode=${mode}, operator=${operator}`);
        
        const filterConditions = [];
        
        // Process each filter condition
        for (const filterDef of filters.conditions) {
          const { column } = filterDef;
          
          logger.info(`${servicePrefix} Processing filter condition:`, JSON.stringify(filterDef));
          
          if (!column) {
            logger.warn(`${servicePrefix} Filter condition missing column, skipping`);
            continue;
          }
          
          // Special handling for project_id (stored in rel_parent_child_tickets, not JSONB)
          // Stories can be linked to project directly OR via epic
          if (column === 'project_id') {
            logger.info(`${servicePrefix} Special handling for project_id filter`);
            const { operator: filterOperator, value } = filterDef;
            
            if (filterOperator === 'is' && Array.isArray(value) && value.length > 0) {
              const projectUuids = value;
              const placeholders = projectUuids.map((_, idx) => `$${paramIndex + idx}`).join(', ');
              
              // Stories can be linked to project in two ways:
              // 1. Direct: PROJECT → STORY
              // 2. Via Epic: PROJECT → EPIC → STORY
              const condition = `(
                t.uuid IN (
                  SELECT rpc.rel_child_ticket_uuid 
                  FROM core.rel_parent_child_tickets rpc 
                  WHERE rpc.rel_parent_ticket_uuid IN (${placeholders})
                    AND rpc.dependency_code = 'STORY'
                    AND rpc.ended_at IS NULL
                )
                OR t.uuid IN (
                  SELECT rpc1.rel_child_ticket_uuid
                  FROM core.rel_parent_child_tickets rpc1
                  JOIN core.rel_parent_child_tickets rpc2 ON rpc1.rel_parent_ticket_uuid = rpc2.rel_child_ticket_uuid
                  WHERE rpc2.rel_parent_ticket_uuid IN (${placeholders})
                    AND rpc1.dependency_code = 'STORY'
                    AND rpc2.dependency_code = 'EPIC'
                    AND rpc1.ended_at IS NULL
                    AND rpc2.ended_at IS NULL
                )
              )`;
              
              projectUuids.forEach(uuid => queryParams.push(uuid));
              paramIndex += projectUuids.length;
              
              filterConditions.push(condition);
              logger.info(`${servicePrefix} Added project_id filter: ${condition}`);
            } else if (filterOperator === 'is_not' && Array.isArray(value) && value.length > 0) {
              const projectUuids = value;
              const placeholders = projectUuids.map((_, idx) => `$${paramIndex + idx}`).join(', ');
              
              const condition = `(
                t.uuid NOT IN (
                  SELECT rpc.rel_child_ticket_uuid 
                  FROM core.rel_parent_child_tickets rpc 
                  WHERE rpc.rel_parent_ticket_uuid IN (${placeholders})
                    AND rpc.dependency_code = 'STORY'
                    AND rpc.ended_at IS NULL
                )
                AND t.uuid NOT IN (
                  SELECT rpc1.rel_child_ticket_uuid
                  FROM core.rel_parent_child_tickets rpc1
                  JOIN core.rel_parent_child_tickets rpc2 ON rpc1.rel_parent_ticket_uuid = rpc2.rel_child_ticket_uuid
                  WHERE rpc2.rel_parent_ticket_uuid IN (${placeholders})
                    AND rpc1.dependency_code = 'STORY'
                    AND rpc2.dependency_code = 'EPIC'
                    AND rpc1.ended_at IS NULL
                    AND rpc2.ended_at IS NULL
                )
              )`;
              
              projectUuids.forEach(uuid => queryParams.push(uuid));
              paramIndex += projectUuids.length;
              
              filterConditions.push(condition);
              logger.info(`${servicePrefix} Added project_id NOT filter: ${condition}`);
            }
            
            continue;
          }
          
          // Special handling for epic_id (stored in rel_parent_child_tickets, not JSONB)
          if (column === 'epic_id') {
            logger.info(`${servicePrefix} Special handling for epic_id filter`);
            const { operator: filterOperator, value } = filterDef;
            
            if (filterOperator === 'is' && Array.isArray(value) && value.length > 0) {
              const epicUuids = value;
              const placeholders = epicUuids.map((_, idx) => `$${paramIndex + idx}`).join(', ');
              
              const condition = `t.uuid IN (
                SELECT rpc.rel_child_ticket_uuid 
                FROM core.rel_parent_child_tickets rpc 
                WHERE rpc.rel_parent_ticket_uuid IN (${placeholders})
                  AND rpc.dependency_code = 'STORY'
                  AND rpc.ended_at IS NULL
              )`;
              
              epicUuids.forEach(uuid => queryParams.push(uuid));
              paramIndex += epicUuids.length;
              
              filterConditions.push(condition);
              logger.info(`${servicePrefix} Added epic_id filter: ${condition}`);
            } else if (filterOperator === 'is_not' && Array.isArray(value) && value.length > 0) {
              const epicUuids = value;
              const placeholders = epicUuids.map((_, idx) => `$${paramIndex + idx}`).join(', ');
              
              const condition = `t.uuid NOT IN (
                SELECT rpc.rel_child_ticket_uuid 
                FROM core.rel_parent_child_tickets rpc 
                WHERE rpc.rel_parent_ticket_uuid IN (${placeholders})
                  AND rpc.dependency_code = 'STORY'
                  AND rpc.ended_at IS NULL
              )`;
              
              epicUuids.forEach(uuid => queryParams.push(uuid));
              paramIndex += epicUuids.length;
              
              filterConditions.push(condition);
              logger.info(`${servicePrefix} Added epic_id NOT filter: ${condition}`);
            }
            
            continue;
          }
          
          // Special handling for sprint_id (stored in rel_parent_child_tickets, not JSONB)
          if (column === 'sprint_id') {
            logger.info(`${servicePrefix} Special handling for sprint_id filter`);
            const { operator: filterOperator, value } = filterDef;
            
            if (filterOperator === 'is' && Array.isArray(value) && value.length > 0) {
              const sprintUuids = value;
              const placeholders = sprintUuids.map((_, idx) => `$${paramIndex + idx}`).join(', ');
              
              const condition = `t.uuid IN (
                SELECT rpc.rel_child_ticket_uuid 
                FROM core.rel_parent_child_tickets rpc 
                WHERE rpc.rel_parent_ticket_uuid IN (${placeholders})
                  AND rpc.dependency_code = 'STORY'
                  AND rpc.ended_at IS NULL
              )`;
              
              sprintUuids.forEach(uuid => queryParams.push(uuid));
              paramIndex += sprintUuids.length;
              
              filterConditions.push(condition);
              logger.info(`${servicePrefix} Added sprint_id filter: ${condition}`);
            } else if (filterOperator === 'is_not' && Array.isArray(value) && value.length > 0) {
              const sprintUuids = value;
              const placeholders = sprintUuids.map((_, idx) => `$${paramIndex + idx}`).join(', ');
              
              const condition = `t.uuid NOT IN (
                SELECT rpc.rel_child_ticket_uuid 
                FROM core.rel_parent_child_tickets rpc 
                WHERE rpc.rel_parent_ticket_uuid IN (${placeholders})
                  AND rpc.dependency_code = 'STORY'
                  AND rpc.ended_at IS NULL
              )`;
              
              sprintUuids.forEach(uuid => queryParams.push(uuid));
              paramIndex += sprintUuids.length;
              
              filterConditions.push(condition);
              logger.info(`${servicePrefix} Added sprint_id NOT filter: ${condition}`);
            }
            
            continue;
          }
          
          // Get column metadata to determine data type
          const metadataQuery = `
            SELECT data_type 
            FROM administration.table_metadata 
            WHERE table_name = $1 AND column_name = $2
          `;
          const metadataResult = await db.query(metadataQuery, ['tickets', column]);
          
          logger.info(`${servicePrefix} Metadata query result for column ${column}:`, metadataResult.rows);
          
          if (metadataResult.rows.length === 0) {
            logger.warn(`${servicePrefix} No metadata for column ${column}, skipping filter`);
            continue;
          }
          
          const { data_type } = metadataResult.rows[0];
          logger.info(`${servicePrefix} Column ${column} has data_type: ${data_type}`);
          
          // Build the condition for this filter
          const { condition, newParamIndex } = buildFilterCondition(
            column,
            filterDef,
            data_type,
            queryParams,
            paramIndex
          );
          
          logger.info(`${servicePrefix} buildFilterCondition returned: condition="${condition}", newParamIndex=${newParamIndex}`);
          
          if (condition) {
            filterConditions.push(condition);
            paramIndex = newParamIndex;
            logger.info(`${servicePrefix} Added filter: ${condition}`);
          } else {
            logger.warn(`${servicePrefix} buildFilterCondition returned empty condition for column ${column}`);
          }
        }
        
        // Combine all filter conditions
        if (filterConditions.length > 0) {
          const combinedConditions = filterConditions.join(` ${operator} `);
          
          // Apply mode: include or exclude
          if (mode === 'exclude') {
            baseConditions.push(`NOT (${combinedConditions})`);
          } else {
            if (operator === 'OR' || filterConditions.length > 1) {
              baseConditions.push(`(${combinedConditions})`);
            } else {
              baseConditions.push(combinedConditions);
            }
          }
          
          logger.info(`${servicePrefix} Filter conditions added to base conditions`);
        }
    }
    
    whereClause = `WHERE ${baseConditions.join(' AND ')}`;
    logger.info(`${servicePrefix} Final WHERE clause: ${whereClause}`);
    
    // Calculate the parameter index for lang (after all filter params)
    const langParamIndex = paramIndex;
    
    // Sort column mapping for calculated/joined columns
    const sortColumnMapping = {
      'uuid': 't.uuid',
      'title': 't.title',
      'description': 't.description',
      'ticket_type_code': 't.ticket_type_code',
      'ticket_status_code': 't.ticket_status_code',
      'ticket_status_label': 'COALESCE(tst.label, ts.code)',
      'writer_uuid': 't.writer_uuid',
      'writer_name': "p3.first_name || ' ' || p3.last_name",
      'requested_for_uuid': 't.requested_for_uuid',
      'requested_for_name': "p2.first_name || ' ' || p2.last_name",
      'assigned_to_person': 'p4.uuid',
      'assigned_person_name': "p4.first_name || ' ' || p4.last_name",
      'created_at': 't.created_at',
      'updated_at': 't.updated_at',
      'closed_at': 't.closed_at',
      // JSONB fields
      'priority': "t.core_extended_attributes->>'priority'",
      'story_points': "(t.core_extended_attributes->>'story_points')::INTEGER",
      'acceptance_criteria': "t.core_extended_attributes->>'acceptance_criteria'",
      'tags': "t.core_extended_attributes->'tags'",
      // Calculated fields (subqueries)
      'project_id': `COALESCE(
        (SELECT project.uuid FROM core.rel_parent_child_tickets rpc1 JOIN core.tickets epic ON rpc1.rel_parent_ticket_uuid = epic.uuid JOIN core.rel_parent_child_tickets rpc2 ON epic.uuid = rpc2.rel_child_ticket_uuid JOIN core.tickets project ON rpc2.rel_parent_ticket_uuid = project.uuid WHERE rpc1.rel_child_ticket_uuid = t.uuid AND rpc1.dependency_code = 'STORY' AND rpc1.ended_at IS NULL AND rpc2.dependency_code = 'EPIC' AND rpc2.ended_at IS NULL LIMIT 1),
        (SELECT parent.uuid FROM core.rel_parent_child_tickets rpc JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'STORY' AND parent.ticket_type_code = 'PROJECT' AND rpc.ended_at IS NULL LIMIT 1)
      )`,
      'project_title': `COALESCE(
        (SELECT project.title FROM core.rel_parent_child_tickets rpc1 JOIN core.tickets epic ON rpc1.rel_parent_ticket_uuid = epic.uuid JOIN core.rel_parent_child_tickets rpc2 ON epic.uuid = rpc2.rel_child_ticket_uuid JOIN core.tickets project ON rpc2.rel_parent_ticket_uuid = project.uuid WHERE rpc1.rel_child_ticket_uuid = t.uuid AND rpc1.dependency_code = 'STORY' AND rpc1.ended_at IS NULL AND rpc2.dependency_code = 'EPIC' AND rpc2.ended_at IS NULL LIMIT 1),
        (SELECT parent.title FROM core.rel_parent_child_tickets rpc JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'STORY' AND parent.ticket_type_code = 'PROJECT' AND rpc.ended_at IS NULL LIMIT 1)
      )`,
      'epic_id': '(SELECT parent.uuid FROM core.rel_parent_child_tickets rpc JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = \'STORY\' AND parent.ticket_type_code = \'EPIC\' AND rpc.ended_at IS NULL LIMIT 1)',
      'epic_title': '(SELECT parent.title FROM core.rel_parent_child_tickets rpc JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = \'STORY\' AND parent.ticket_type_code = \'EPIC\' AND rpc.ended_at IS NULL LIMIT 1)',
      'sprint_id': '(SELECT parent.uuid FROM core.rel_parent_child_tickets rpc JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = \'STORY\' AND parent.ticket_type_code = \'SPRINT\' AND rpc.ended_at IS NULL LIMIT 1)',
      'sprint_title': '(SELECT parent.title FROM core.rel_parent_child_tickets rpc JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = \'STORY\' AND parent.ticket_type_code = \'SPRINT\' AND rpc.ended_at IS NULL LIMIT 1)'
    };
    
    // Get the SQL expression for sorting
    const sortExpression = sortColumnMapping[sortBy] || `t.${sortBy}`;
    
    logger.info(`${servicePrefix} Sort parameters: sortBy="${sortBy}" → SQL expression: "${sortExpression}", sortDirection="${sortDirection}"`);
    logger.info(`${servicePrefix} Pagination: page=${page}, limit=${limit}, offset=${offset}`);
    logger.info(`${servicePrefix} Language: ${lang}`);
    
    // Count total results
    const countQuery = `
      SELECT COUNT(*) as total
      FROM core.tickets t
      ${whereClause}
    `;
    
    logger.info(`${servicePrefix} Count query params: ${JSON.stringify(queryParams)}`);
    
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);
    
    // Get paginated results with all data
    const dataQuery = `
      SELECT 
        t.uuid,
        t.title,
        t.description,
        t.writer_uuid,
        t.requested_for_uuid,
        t.ticket_type_code,
        t.ticket_status_code,
        t.created_at,
        t.updated_at,
        t.closed_at,
        
        -- Person names
        p2.first_name || ' ' || p2.last_name as requested_for_name,
        p3.first_name || ' ' || p3.last_name as writer_name,
        
        -- Translated labels
        COALESCE(ttt.label, tt.code) as ticket_type_label,
        COALESCE(tst.label, ts.code) as ticket_status_label,
        
        -- Assignment info
        p4.uuid as assigned_to_person,
        p4.first_name || ' ' || p4.last_name as assigned_person_name,
        
        -- User story-specific fields from core_extended_attributes
        t.core_extended_attributes->'tags' as tags,
        t.core_extended_attributes->>'priority' as priority,
        t.core_extended_attributes->>'story_points' as story_points,
        t.core_extended_attributes->>'acceptance_criteria' as acceptance_criteria,
        
        -- Project parent (two cases)
        COALESCE(
          (SELECT project.uuid FROM core.rel_parent_child_tickets rpc1 JOIN core.tickets epic ON rpc1.rel_parent_ticket_uuid = epic.uuid JOIN core.rel_parent_child_tickets rpc2 ON epic.uuid = rpc2.rel_child_ticket_uuid JOIN core.tickets project ON rpc2.rel_parent_ticket_uuid = project.uuid WHERE rpc1.rel_child_ticket_uuid = t.uuid AND rpc1.dependency_code = 'STORY' AND rpc1.ended_at IS NULL AND rpc2.dependency_code = 'EPIC' AND rpc2.ended_at IS NULL LIMIT 1),
          (SELECT parent.uuid FROM core.rel_parent_child_tickets rpc JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'STORY' AND parent.ticket_type_code = 'PROJECT' AND rpc.ended_at IS NULL LIMIT 1)
        ) as project_id,
        COALESCE(
          (SELECT project.title FROM core.rel_parent_child_tickets rpc1 JOIN core.tickets epic ON rpc1.rel_parent_ticket_uuid = epic.uuid JOIN core.rel_parent_child_tickets rpc2 ON epic.uuid = rpc2.rel_child_ticket_uuid JOIN core.tickets project ON rpc2.rel_parent_ticket_uuid = project.uuid WHERE rpc1.rel_child_ticket_uuid = t.uuid AND rpc1.dependency_code = 'STORY' AND rpc1.ended_at IS NULL AND rpc2.dependency_code = 'EPIC' AND rpc2.ended_at IS NULL LIMIT 1),
          (SELECT parent.title FROM core.rel_parent_child_tickets rpc JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'STORY' AND parent.ticket_type_code = 'PROJECT' AND rpc.ended_at IS NULL LIMIT 1)
        ) as project_title,
        
        -- Epic parent
        (SELECT parent.uuid FROM core.rel_parent_child_tickets rpc JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'STORY' AND parent.ticket_type_code = 'EPIC' AND rpc.ended_at IS NULL LIMIT 1) as epic_id,
        (SELECT parent.title FROM core.rel_parent_child_tickets rpc JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'STORY' AND parent.ticket_type_code = 'EPIC' AND rpc.ended_at IS NULL LIMIT 1) as epic_title,
        
        -- Sprint parent
        (SELECT parent.uuid FROM core.rel_parent_child_tickets rpc JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'STORY' AND parent.ticket_type_code = 'SPRINT' AND rpc.ended_at IS NULL LIMIT 1) as sprint_id,
        (SELECT parent.title FROM core.rel_parent_child_tickets rpc JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'STORY' AND parent.ticket_type_code = 'SPRINT' AND rpc.ended_at IS NULL LIMIT 1) as sprint_title
        
      FROM core.tickets t
      LEFT JOIN configuration.persons p2 ON t.requested_for_uuid = p2.uuid
      LEFT JOIN configuration.persons p3 ON t.writer_uuid = p3.uuid
      JOIN configuration.ticket_types tt ON t.ticket_type_code = tt.code
      JOIN configuration.ticket_status ts ON t.ticket_status_code = ts.code AND ts.rel_ticket_type = tt.code
      LEFT JOIN translations.ticket_types_translation ttt ON tt.uuid = ttt.ticket_type_uuid AND ttt.lang = $${langParamIndex}
      LEFT JOIN translations.ticket_status_translation tst ON ts.uuid = tst.ticket_status_uuid AND tst.lang = $${langParamIndex}
      LEFT JOIN (
        SELECT rel_ticket, rel_assigned_to_person
        FROM core.rel_tickets_groups_persons
        WHERE type = 'ASSIGNED' AND (ended_at IS NULL OR ended_at > NOW())
      ) rtgp ON t.uuid = rtgp.rel_ticket
      LEFT JOIN configuration.persons p4 ON rtgp.rel_assigned_to_person = p4.uuid
      ${whereClause}
      ORDER BY ${sortExpression} ${sortDirection.toUpperCase()}
      LIMIT $${langParamIndex + 1} OFFSET $${langParamIndex + 2}
    `;
    
    queryParams.push(lang, limit, offset);
    
    logger.info(`${servicePrefix} Data query params: ${JSON.stringify(queryParams)}`);
    
    const dataResult = await db.query(dataQuery, queryParams);
    
    // Calculate pagination metadata
    const currentPage = page;
    const totalPages = Math.ceil(total / limit);
    const hasMore = offset + limit < total;
    
    logger.info(`${servicePrefix} Found ${dataResult.rows.length} user stories (total: ${total})`);
    
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
    logger.error('[STORY SERVICE] Error searching user stories:', error);
    throw error;
  }
};

/**
 * Lazy search for user stories with pagination
 * @param {string} searchQuery - Search term
 * @param {number} [page=1] - Page number (1-indexed)
 * @param {number} [limit=25] - Number of results per page
 * @param {string} [lang='en'] - Language code for translations
 * @returns {Promise<Object>} Object with data and pagination metadata
 */
const getUserStoriesLazySearch = async (searchQuery = '', page = 1, limit = 25, lang = 'en') => {
  try {
    logger.info(`[STORY SERVICE] Getting user stories with lazy search: "${searchQuery}", page: ${page}, limit: ${limit}, lang: ${lang}`);
    
    // Validate and sanitize pagination parameters
    const validPage = Math.max(1, parseInt(page) || 1);
    const validLimit = Math.min(50, Math.max(1, parseInt(limit) || 25)); // Max 50 per page
    const offset = (validPage - 1) * validLimit;
    
    // Separate WHERE clauses for COUNT and main query
    let countWhereClause = `WHERE t.ticket_type_code = 'USER_STORY'`;
    let mainWhereClause = `WHERE t.ticket_type_code = 'USER_STORY'`;
    const countParams = []; // Params for COUNT query (no lang needed)
    const queryParams = [lang]; // Params for main query (starts with lang at $1)
    let countParamIndex = 1; // For COUNT query
    let paramIndex = 2; // For main query (starts at $2 after lang)
    
    // Add search filter if provided
    if (searchQuery && searchQuery.trim().length > 0) {
      // Split search terms by spaces for multi-term search
      const searchTerms = searchQuery.trim().split(/\s+/).filter(term => term.length > 0);
      
      const countSearchConditions = [];
      const mainSearchConditions = [];
      
      searchTerms.forEach(term => {
        // For COUNT query
        countParams.push(`%${term}%`);
        countSearchConditions.push(`(
          unaccent(LOWER(t.title)) LIKE unaccent(LOWER($${countParamIndex})) OR
          unaccent(LOWER(t.description)) LIKE unaccent(LOWER($${countParamIndex}))
        )`);
        countParamIndex++;
        
        // For main query
        queryParams.push(`%${term}%`);
        mainSearchConditions.push(`(
          unaccent(LOWER(t.title)) LIKE unaccent(LOWER($${paramIndex})) OR
          unaccent(LOWER(t.description)) LIKE unaccent(LOWER($${paramIndex}))
        )`);
        paramIndex++;
      });
      
      if (countSearchConditions.length > 0) {
        countWhereClause += ` AND ${countSearchConditions.join(' AND ')}`;
        mainWhereClause += ` AND ${mainSearchConditions.join(' AND ')}`;
      }
    }
    
    // Count total matching results
    const countQuery = `
      SELECT COUNT(*) as total
      FROM core.tickets t
      ${countWhereClause}
    `;
    
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    // Get paginated results
    const dataQuery = `
      SELECT 
        t.uuid,
        t.title,
        t.description,
        t.ticket_status_code,
        COALESCE(tst.label, ts.code) as ticket_status_label,
        t.created_at,
        t.updated_at,
        
        -- Person names
        p2.first_name || ' ' || p2.last_name as requested_for_name,
        p3.first_name || ' ' || p3.last_name as writer_name,
        
        -- Assignment
        p4.uuid as assigned_to_person,
        p4.first_name || ' ' || p4.last_name as assigned_person_name,
        
        -- User story fields
        t.core_extended_attributes->'tags' as tags,
        t.core_extended_attributes->>'priority' as priority,
        t.core_extended_attributes->>'story_points' as story_points,
        
        -- Parent titles
        COALESCE(
          (SELECT project.title FROM core.rel_parent_child_tickets rpc1 JOIN core.tickets epic ON rpc1.rel_parent_ticket_uuid = epic.uuid JOIN core.rel_parent_child_tickets rpc2 ON epic.uuid = rpc2.rel_child_ticket_uuid JOIN core.tickets project ON rpc2.rel_parent_ticket_uuid = project.uuid WHERE rpc1.rel_child_ticket_uuid = t.uuid AND rpc1.dependency_code = 'STORY' AND rpc1.ended_at IS NULL AND rpc2.dependency_code = 'EPIC' AND rpc2.ended_at IS NULL LIMIT 1),
          (SELECT parent.title FROM core.rel_parent_child_tickets rpc JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'STORY' AND parent.ticket_type_code = 'PROJECT' AND rpc.ended_at IS NULL LIMIT 1)
        ) as project_title,
        (SELECT parent.title FROM core.rel_parent_child_tickets rpc JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'STORY' AND parent.ticket_type_code = 'EPIC' AND rpc.ended_at IS NULL LIMIT 1) as epic_title,
        (SELECT parent.title FROM core.rel_parent_child_tickets rpc JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'STORY' AND parent.ticket_type_code = 'SPRINT' AND rpc.ended_at IS NULL LIMIT 1) as sprint_title
        
      FROM core.tickets t
      LEFT JOIN configuration.persons p2 ON t.requested_for_uuid = p2.uuid
      LEFT JOIN configuration.persons p3 ON t.writer_uuid = p3.uuid
      JOIN configuration.ticket_types tt ON t.ticket_type_code = tt.code
      JOIN configuration.ticket_status ts ON t.ticket_status_code = ts.code AND ts.rel_ticket_type = tt.code
      LEFT JOIN translations.ticket_status_translation tst ON ts.uuid = tst.ticket_status_uuid AND tst.lang = $1
      LEFT JOIN (
        SELECT rel_ticket, rel_assigned_to_person
        FROM core.rel_tickets_groups_persons
        WHERE type = 'ASSIGNED' AND (ended_at IS NULL OR ended_at > NOW())
      ) rtgp ON t.uuid = rtgp.rel_ticket
      LEFT JOIN configuration.persons p4 ON rtgp.rel_assigned_to_person = p4.uuid
      ${mainWhereClause}
      ORDER BY t.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(validLimit, offset);
    
    const dataResult = await db.query(dataQuery, queryParams);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / validLimit);
    const hasMore = offset + validLimit < total;
    
    logger.info(`[STORY SERVICE] Lazy search found ${dataResult.rows.length} user stories (total: ${total})`);
    
    return {
      data: dataResult.rows,
      total: total,
      hasMore: hasMore,
      pagination: {
        page: validPage,
        limit: validLimit,
        offset: offset,
        totalPages: totalPages
      }
    };
    
  } catch (error) {
    logger.error('[STORY SERVICE] Error in lazy search:', error);
    throw error;
  }
};

module.exports = {
    getStoryById,
    getUserStories,
    updateStory,
    updateParentEpic,
    updateParentSprint,
    createStory,
    searchUserStories,
    getUserStoriesLazySearch
};
