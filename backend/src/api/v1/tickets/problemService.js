const db = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Récupère un problème par son UUID
 * @param {string} uuid - UUID du problème
 * @param {string} lang - Code de langue pour les traductions (fr, en, etc.)
 * @returns {Promise<Object>} - Détails du problème
 */
const getProblemById = async (uuid, lang = 'en') => {
    logger.info(`[PROBLEM SERVICE] Fetching problem with UUID: ${uuid} and language: ${lang}`);
    
    try {
        // Requête SQL pour récupérer les détails du problème avec les données d'assignation
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
                ) as watch_list,
                
                -- Champs spécifiques aux problèmes extraits du JSONB core_extended_attributes
                t.core_extended_attributes->>'rel_problem_categories_code' as problem_category_code,
                COALESCE(pcl.label, t.core_extended_attributes->>'rel_problem_categories_code') as problem_category_label,
                t.core_extended_attributes->>'rel_service' as service_uuid,
                t.core_extended_attributes->>'rel_service_offerings' as service_offering_uuid,
                t.core_extended_attributes->>'impact' as impact,
                COALESCE(iil.label, t.core_extended_attributes->>'impact') as impact_label,
                t.core_extended_attributes->>'urgency' as urgency,
                COALESCE(iul.label, t.core_extended_attributes->>'urgency') as urgency_label,
                t.core_extended_attributes->>'symptoms_description' as symptoms_description,
                t.core_extended_attributes->>'workaround' as workaround,
                t.core_extended_attributes->>'knownerrors_list' as known_errors_list,
                t.core_extended_attributes->>'changes_list' as changes_list,
                t.core_extended_attributes->>'incidents_list' as incidents_list,
                t.core_extended_attributes->>'root_cause' as root_cause,
                t.core_extended_attributes->>'definitive_solution' as definitive_solution,
                t.core_extended_attributes->>'target_resolution_date' as target_resolution_date,
                t.core_extended_attributes->>'actual_resolution_date' as actual_resolution_date,
                t.core_extended_attributes->>'actual_resolution_workload' as actual_resolution_workload,
                t.core_extended_attributes->>'closure_justification' as closure_justification,
                t.closed_at as closed_at,
                
                -- Informations sur les éléments de configuration, services et offres de service
                ci.name as configuration_item_name,
                s.name as rel_service_name,
                so.name as rel_service_offerings_name
                
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
            LEFT JOIN data.configuration_items ci ON t.configuration_item_uuid = ci.uuid
            LEFT JOIN data.services s ON t.core_extended_attributes->>'rel_service' = s.uuid::text
            LEFT JOIN data.service_offerings so ON t.core_extended_attributes->>'rel_service_offerings' = so.uuid::text
                
            -- Jointure pour l'assignation (équipe et personne)
            LEFT JOIN (
                SELECT rel_ticket, rel_assigned_to_group, rel_assigned_to_person
                FROM core.rel_tickets_groups_persons
                WHERE type = 'ASSIGNED' AND (ended_at IS NULL OR ended_at > NOW())
            ) rtgp ON t.uuid = rtgp.rel_ticket
            LEFT JOIN configuration.groups g ON rtgp.rel_assigned_to_group = g.uuid
            LEFT JOIN configuration.persons p4 ON rtgp.rel_assigned_to_person = p4.uuid
            
            -- Jointure pour la traduction des catégories de problèmes
            LEFT JOIN translations.problem_categories_labels pcl ON 
                pcl.rel_problem_category_code = t.core_extended_attributes->>'rel_problem_categories_code'
                AND pcl.lang = $2
                
            -- Jointure pour la traduction des impacts
            LEFT JOIN translations.incident_impacts_labels iil ON
                iil.rel_incident_impact_code = t.core_extended_attributes->>'impact'
                AND iil.language = $2
                
            -- Jointure pour la traduction des urgences
            LEFT JOIN translations.incident_urgencies_labels iul ON
                iul.rel_incident_urgency_code = t.core_extended_attributes->>'urgency'
                AND iul.language = $2
            
            WHERE t.uuid = $1 AND t.ticket_type_code = 'PROBLEM'
        `;
        
        const result = await db.query(query, [uuid, lang]);
        
        if (result.rows.length === 0) {
            logger.warn(`[PROBLEM SERVICE] No problem found with UUID: ${uuid}`);
            return null;
        }
        
        logger.info(`[PROBLEM SERVICE] Successfully retrieved problem with UUID: ${uuid}`);
        return result.rows[0];
    } catch (error) {
        logger.error(`[PROBLEM SERVICE] Error fetching problem with UUID ${uuid}:`, error);
        throw error;
    }
};

/**
 * Récupère tous les problèmes
 * @param {string} lang - Code de langue pour les traductions (fr, en, etc.)
 * @returns {Promise<Array>} - Liste des problèmes
 */
const getProblems = async (lang = 'en') => {
    logger.info(`[PROBLEM SERVICE] Fetching all problems with language: ${lang}`);
    
    try {
        // Requête SQL pour récupérer la liste des problèmes avec les données d'assignation
        const query = `
            SELECT 
                t.uuid,
                t.title,
                t.description,
                t.created_at,
                t.updated_at,
                t.ticket_status_code,
                t.ticket_type_code,
                p1.first_name || ' ' || p1.last_name as requested_by_name,
                p2.first_name || ' ' || p2.last_name as requested_for_name,
                p3.first_name || ' ' || p3.last_name as writer_name,
                COALESCE(ttt.label, tt.code) as ticket_type_label,
                COALESCE(tst.label, ts.code) as ticket_status_label,
                
                -- Informations sur l'équipe assignée
                g.group_name as assigned_group_name,
                
                -- Informations sur la personne assignée
                p4.first_name || ' ' || p4.last_name as assigned_person_name,
                
                -- Champs spécifiques aux problèmes extraits du JSONB core_extended_attributes
                t.core_extended_attributes->>'rel_problem_categories_code' as problem_category_code,
                COALESCE(pcl.label, t.core_extended_attributes->>'rel_problem_categories_code') as problem_category_label,
                t.core_extended_attributes->>'impact' as impact,
                COALESCE(iil.label, t.core_extended_attributes->>'impact') as impact_label,
                t.core_extended_attributes->>'urgency' as urgency,
                COALESCE(iul.label, t.core_extended_attributes->>'urgency') as urgency_label,
                t.core_extended_attributes->>'symptoms_description' as symptoms_description,
                t.core_extended_attributes->>'workaround' as workaround,
                t.core_extended_attributes->>'root_cause' as root_cause,
                t.core_extended_attributes->>'definitive_solution' as definitive_solution,
                t.core_extended_attributes->>'closure_justification' as closure_justification,
                t.core_extended_attributes->>'target_resolution_date' as target_resolution_date,
                t.core_extended_attributes->>'actual_resolution_date' as actual_resolution_date,
                t.core_extended_attributes->>'actual_resolution_workload' as actual_resolution_workload,
                t.closed_at as closed_at,
                
                -- Informations sur les éléments de configuration, services et offres de service
                ci.name as configuration_item_name,
                s.name as rel_service_name,
                so.name as rel_service_offerings_name
                
            FROM core.tickets t
            LEFT JOIN configuration.persons p1 ON t.requested_by_uuid = p1.uuid
            LEFT JOIN configuration.persons p2 ON t.requested_for_uuid = p2.uuid
            JOIN configuration.persons p3 ON t.writer_uuid = p3.uuid
            JOIN configuration.ticket_types tt ON t.ticket_type_code = tt.code
            JOIN configuration.ticket_status ts ON t.ticket_status_code = ts.code AND ts.rel_ticket_type = tt.code 
            LEFT JOIN translations.ticket_types_translation ttt ON tt.uuid = ttt.ticket_type_uuid 
                AND ttt.lang = $1
            LEFT JOIN translations.ticket_status_translation tst ON ts.uuid = tst.ticket_status_uuid 
                AND tst.lang = $1
            LEFT JOIN data.configuration_items ci ON t.configuration_item_uuid = ci.uuid
            LEFT JOIN data.services s ON t.core_extended_attributes->>'rel_service' = s.uuid::text
            LEFT JOIN data.service_offerings so ON t.core_extended_attributes->>'rel_service_offerings' = so.uuid::text
                
            -- Jointure pour l'assignation (équipe et personne)
            LEFT JOIN (
                SELECT rel_ticket, rel_assigned_to_group, rel_assigned_to_person
                FROM core.rel_tickets_groups_persons
                WHERE type = 'ASSIGNED' AND (ended_at IS NULL OR ended_at > NOW())
            ) rtgp ON t.uuid = rtgp.rel_ticket
            LEFT JOIN configuration.groups g ON rtgp.rel_assigned_to_group = g.uuid
            LEFT JOIN configuration.persons p4 ON rtgp.rel_assigned_to_person = p4.uuid
            
            -- Jointure pour la traduction des catégories de problèmes
            LEFT JOIN translations.problem_categories_labels pcl ON 
                pcl.rel_problem_category_code = t.core_extended_attributes->>'rel_problem_categories_code'
                AND pcl.lang = $1
                
            -- Jointure pour la traduction des impacts
            LEFT JOIN translations.incident_impacts_labels iil ON
                iil.rel_incident_impact_code = t.core_extended_attributes->>'impact'
                AND iil.language = $1
                
            -- Jointure pour la traduction des urgences
            LEFT JOIN translations.incident_urgencies_labels iul ON
                iul.rel_incident_urgency_code = t.core_extended_attributes->>'urgency'
                AND iul.language = $1
            
            WHERE t.ticket_type_code = 'PROBLEM'
            ORDER BY t.created_at DESC
        `;
        
        const result = await db.query(query, [lang]);
        
        logger.info(`[PROBLEM SERVICE] Successfully retrieved ${result.rows.length} problems`);
        return result.rows;
    } catch (error) {
        logger.error('[PROBLEM SERVICE] Error fetching problems:', error);
        throw error;
    }
};

module.exports = {
    getProblemById,
    getProblems
};
