const db = require('../../../config/database');
const logger = require('../../../config/logger');
const ticketService = require('./service');

/**
 * Récupère un sprint par son UUID
 * @param {string} uuid - UUID du sprint
 * @param {string} lang - Code de langue pour les traductions (fr, en, etc.)
 * @returns {Promise<Object>} - Détails du sprint
 */
const getSprintById = async (uuid, lang = 'en') => {
    logger.info(`[SPRINT SERVICE] Fetching sprint with UUID: ${uuid} and language: ${lang}`);
    
    try {
        // Requête SQL pour récupérer les détails du sprint avec les données d'assignation
        const query = `
            SELECT 
                t.*,
                p1.first_name || ' ' || p1.last_name as requested_by_name,
                p2.first_name || ' ' || p2.last_name as requested_for_name,
                p3.first_name || ' ' || p3.last_name as writer_name,
                COALESCE(ttt.label, tt.code) as ticket_type_label,
                COALESCE(tst.label, ts.code) as ticket_status_label,
                tt.code as ticket_type_code,
                ts.code as ticket_status_code,
                
                -- Informations sur l'équipe assignée
                g.group_name as assigned_group_name,
                g.uuid as assigned_to_group,
                
                -- Informations sur la personne assignée
                p4.uuid as assigned_to_person,
                p4.first_name || ' ' || p4.last_name as assigned_person_name,
                
                -- Informations sur les observateurs (watchers)
                (
                    SELECT json_agg(json_build_object(
                        'uuid', w.uuid,
                        'person_uuid', p5.uuid,
                        'person_name', p5.first_name || ' ' || p5.last_name,
                        'created_at', w.created_at
                    ))
                    FROM core.rel_tickets_groups_persons w
                    JOIN configuration.persons p5 ON w.rel_assigned_to_person = p5.uuid
                    WHERE w.rel_ticket = t.uuid AND w.type = 'WATCHER' AND (w.ended_at IS NULL OR w.ended_at > NOW())
                ) as watchers
                
            FROM core.tickets t
            LEFT JOIN configuration.persons p1 ON t.requested_by_uuid = p1.uuid
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
            
            WHERE t.uuid = $1 AND t.ticket_type_code = 'SPRINT'
        `;
        
        const result = await db.query(query, [uuid, lang]);
        
        if (result.rows.length === 0) {
            logger.warn(`[SPRINT SERVICE] No sprint found with UUID: ${uuid}`);
            return null;
        }
        
        logger.info(`[SPRINT SERVICE] Successfully retrieved sprint with UUID: ${uuid}`);
        return result.rows[0];
    } catch (error) {
        logger.error(`[SPRINT SERVICE] Error fetching sprint with UUID ${uuid}:`, error);
        throw error;
    }
};

/**
 * Récupère les sprints avec les attributs étendus spécifiques aux sprints
 * @param {string} lang - Code de langue pour les traductions
 * @returns {Promise<Array>} - Liste des sprints avec leurs attributs
 */
const getSprints = async (lang) => {
    const servicePrefix = '[SPRINT SERVICE]';
    
    // Définition des attributs spécifiques aux sprints
    const baseQuery = `
        -- Extraction des attributs spécifiques aux sprints depuis le JSONB
        t.core_extended_attributes->>'start_date' as start_date,
        t.core_extended_attributes->>'end_date' as end_date,
        t.core_extended_attributes->>'actual_velocity' as actual_velocity,
        t.core_extended_attributes->>'estimated_velocity' as estimated_velocity,
        
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
        
        -- Nombre de tickets de type STORY
        (
            SELECT COUNT(*)
            FROM core.rel_parent_child_tickets rpc
            WHERE rpc.rel_parent_ticket_uuid = t.uuid AND rpc.dependency_code = 'STORY'
        ) as stories_count,
        
        -- Nombre de tickets de type TASK
        (
            SELECT COUNT(*)
            FROM core.rel_parent_child_tickets rpc
            WHERE rpc.rel_parent_ticket_uuid = t.uuid AND rpc.dependency_code = 'TASK'
        ) as tasks_count,
        
        -- Récupération du titre du projet parent
        (
            SELECT parent.title
            FROM core.rel_parent_child_tickets rpc
            JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid
            WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'SPRINT' AND rpc.ended_at IS NULL
            LIMIT 1
        ) as project_title
    `;
    
    // Définition des jointures spécifiques aux sprints
    const additionalJoins = ``;
    
    // Utilisation de la fonction getTickets factorisée
    return ticketService.getTickets(lang, 'SPRINT', baseQuery, additionalJoins, [], servicePrefix);
};

module.exports = {
    getSprintById,
    getSprints
};
