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

module.exports = {
    getStoryById,
    getUserStories,
    updateStory,
    updateParentEpic,
    updateParentSprint
};
