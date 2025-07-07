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
                p4.uuid as assigned_to_person,
                p4.first_name || ' ' || p4.last_name as assigned_person_name,
                
                -- Champs spécifiques aux user stories depuis core_extended_attributes
                t.core_extended_attributes->>'tags' as tags,
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
        
        // Transformer les tags de format JSON string en tableau d'objets
        const story = result.rows[0];
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
        }
        
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

module.exports = {
    getStoryById,
    getUserStories
};
