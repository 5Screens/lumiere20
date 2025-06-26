const db = require('../../../config/database');
const logger = require('../../../config/logger');
const ticketService = require('./service');

/**
 * Récupère les defects avec les attributs étendus spécifiques aux defects
 * @param {string} lang - Code de langue pour les traductions
 * @returns {Promise<Array>} - Liste des defects avec leurs attributs
 */
const getDefects = async (lang) => {
    const servicePrefix = '[DEFECT SERVICE]';
    
    // Définition des attributs spécifiques aux defects
    const baseQuery = `
        -- Extraction des attributs spécifiques aux defects depuis le JSONB
        t.core_extended_attributes->>'tags' as tags,
        t.core_extended_attributes->>'severity' as severity,
        COALESCE(
            (SELECT dsl.label FROM translations.defect_setup_labels dsl 
            WHERE dsl.rel_defect_setup_code = t.core_extended_attributes->>'severity' AND dsl.lang = $1),
            t.core_extended_attributes->>'severity'
        ) as severity_label,
        t.core_extended_attributes->>'workaround' as workaround,
        t.core_extended_attributes->>'environment' as environment,
        COALESCE(
            (SELECT dsl.label FROM translations.defect_setup_labels dsl 
            WHERE dsl.rel_defect_setup_code = t.core_extended_attributes->>'environment' AND dsl.lang = $1),
            t.core_extended_attributes->>'environment'
        ) as environment_label,
        t.core_extended_attributes->>'impact_area' as impact_area,
        COALESCE(
            (SELECT dsl.label FROM translations.defect_setup_labels dsl 
            WHERE dsl.rel_defect_setup_code = t.core_extended_attributes->>'impact_area' AND dsl.lang = $1),
            t.core_extended_attributes->>'impact_area'
        ) as impact_area_label,
        t.core_extended_attributes->>'expected_behavior' as expected_behavior,
        t.core_extended_attributes->>'steps_to_reproduce' as steps_to_reproduce,
        
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
    
    // Définition des jointures spécifiques aux defects
    const additionalJoins = ``;
    
    // Utilisation de la fonction getTickets factorisée
    return ticketService.getTickets(lang, 'DEFECT', baseQuery, additionalJoins, [], servicePrefix);
};

/**
 * Récupère un défaut par son UUID
 * @param {string} uuid - UUID du défaut
 * @param {string} lang - Code de langue pour les traductions (fr, en, etc.)
 * @returns {Promise<Object>} - Détails du défaut
 */
const getDefectById = async (uuid, lang = 'en') => {
    logger.info(`[DEFECT SERVICE] Fetching defect with UUID: ${uuid} and language: ${lang}`);
    
    try {
        // Requête SQL pour récupérer les détails du défaut avec les données d'assignation
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
                ) as watchers,
                
                -- Champs spécifiques aux défauts
                def_environment,
                def_severity,
                def_version_found,
                def_version_fixed,
                def_steps_to_reproduce,
                def_expected_behavior,
                def_actual_behavior,
                def_root_cause,
                def_resolution,
                def_test_results,
                def_verification_date,
                def_verified_by_uuid
                
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
            
            WHERE t.uuid = $1 AND t.ticket_type_code = 'DEFECT'
        `;
        
        const result = await db.query(query, [uuid, lang]);
        
        if (result.rows.length === 0) {
            logger.warn(`[DEFECT SERVICE] No defect found with UUID: ${uuid}`);
            return null;
        }
        
        logger.info(`[DEFECT SERVICE] Successfully retrieved defect with UUID: ${uuid}`);
        return result.rows[0];
    } catch (error) {
        logger.error(`[DEFECT SERVICE] Error fetching defect with UUID ${uuid}:`, error);
        throw error;
    }
};

module.exports = {
    getDefects,
    getDefectById
};
