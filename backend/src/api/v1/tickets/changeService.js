const db = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Récupère un changement par son UUID
 * @param {string} uuid - UUID du changement
 * @param {string} lang - Code de langue pour les traductions (fr, en, etc.)
 * @returns {Promise<Object>} - Détails du changement
 */
const getChangeById = async (uuid, lang = 'en') => {
    logger.info(`[CHANGE SERVICE] Fetching change with UUID: ${uuid} and language: ${lang}`);
    
    try {
        // Requête SQL pour récupérer les détails du changement avec les données d'assignation
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
                
                -- Champs spécifiques aux changements
                chg_ci_uuid,
                chg_service_uuid,
                chg_service_offering_uuid,
                chg_type,
                chg_r_q1,
                chg_r_q2,
                chg_r_q3,
                chg_r_q4,
                chg_r_q5,
                chg_i_q1,
                chg_i_q2,
                chg_i_q3,
                chg_i_q4,
                chg_requested_start_date,
                chg_requested_end_date,
                chg_planned_start_date,
                chg_planned_end_date,
                chg_justification,
                chg_objectives,
                chg_test_plan,
                chg_implementation_plan,
                chg_backout_plan,
                chg_monitoring_plan,
                chg_cab_comments,
                chg_validation_state,
                chg_required_levels,
                chg_validation_date,
                chg_related_changes,
                chg_related_incidents,
                chg_related_requests,
                chg_related_tasks,
                chg_actual_start_date,
                chg_actual_end_date,
                chg_actual_workload,
                chg_success_criteria,
                chg_post_change_review,
                chg_closure_comments,
                chg_closed_at
                
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
            
            WHERE t.uuid = $1 AND t.ticket_type_code = 'CHANGE'
        `;
        
        const result = await db.query(query, [uuid, lang]);
        
        if (result.rows.length === 0) {
            logger.warn(`[CHANGE SERVICE] No change found with UUID: ${uuid}`);
            return null;
        }
        
        logger.info(`[CHANGE SERVICE] Successfully retrieved change with UUID: ${uuid}`);
        return result.rows[0];
    } catch (error) {
        logger.error(`[CHANGE SERVICE] Error fetching change with UUID ${uuid}:`, error);
        throw error;
    }
};

module.exports = {
    getChangeById
};
