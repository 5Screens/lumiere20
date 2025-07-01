const db = require('../../../config/database');
const logger = require('../../../config/logger');
const ticketService = require('./service');

/**
 * Récupère un epic par son UUID
 * @param {string} uuid - UUID de l'epic
 * @param {string} lang - Code de langue pour les traductions (fr, en, etc.)
 * @returns {Promise<Object>} - Détails de l'epic
 */
const getEpicById = async (uuid, lang = 'en') => {
    logger.info(`[EPIC SERVICE] Fetching epic with UUID: ${uuid} and language: ${lang}`);
    
    try {
        // Requête SQL pour récupérer les détails de l'epic avec les données d'assignation
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
            
            WHERE t.uuid = $1 AND t.ticket_type_code = 'EPIC'
        `;
        
        const result = await db.query(query, [uuid, lang]);
        
        if (result.rows.length === 0) {
            logger.warn(`[EPIC SERVICE] No epic found with UUID: ${uuid}`);
            return null;
        }
        
        logger.info(`[EPIC SERVICE] Successfully retrieved epic with UUID: ${uuid}`);
        return result.rows[0];
    } catch (error) {
        logger.error(`[EPIC SERVICE] Error fetching epic with UUID ${uuid}:`, error);
        throw error;
    }
};

/**
 * Récupère les epics avec les attributs étendus spécifiques aux epics
 * @param {string} lang - Code de langue pour les traductions
 * @returns {Promise<Array>} - Liste des epics avec leurs attributs
 */
const getEpics = async (lang) => {
    const servicePrefix = '[EPIC SERVICE]';
    
    // Définition des attributs spécifiques aux epics
    const baseQuery = `
        -- Extraction des attributs spécifiques aux epics depuis le JSONB
        t.core_extended_attributes->'tags' as tags,
        t.core_extended_attributes->>'color' as color,
        t.core_extended_attributes->>'end_date' as end_date,
        t.core_extended_attributes->>'start_date' as start_date,
        t.core_extended_attributes->>'progress_percent' as progress_percent,
        
        -- Nombre de user stories enfants
        (
            SELECT COUNT(*)
            FROM core.rel_parent_child_tickets rpc
            WHERE rpc.rel_parent_ticket_uuid = t.uuid 
              AND rpc.dependency_code = 'STORY' 
              AND rpc.ended_at IS NULL
        ) as stories_count,
        
        -- Nombre de tâches enfants
        (
            SELECT COUNT(*)
            FROM core.rel_parent_child_tickets rpc
            WHERE rpc.rel_parent_ticket_uuid = t.uuid 
              AND rpc.dependency_code = 'TASK' 
              AND rpc.ended_at IS NULL
        ) as tasks_count,
        
        -- Récupération du titre du projet parent
        (
            SELECT parent.title
            FROM core.rel_parent_child_tickets rpc
            JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid
            WHERE rpc.rel_child_ticket_uuid = t.uuid 
              AND rpc.dependency_code = 'EPIC' 
              AND parent.ticket_type_code = 'PROJECT'
              AND rpc.ended_at IS NULL
            LIMIT 1
        ) as project_title,
        
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
        ) as tieds_tickets_count
    `;
    
    // Définition des jointures spécifiques aux epics
    const additionalJoins = ``;
    
    // Utilisation de la fonction getTickets factorisée
    return ticketService.getTickets(lang, 'EPIC', baseQuery, additionalJoins, [], servicePrefix);
};

module.exports = {
    getEpicById,
    getEpics
};
