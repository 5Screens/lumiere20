const db = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Récupère les incidents avec les attributs étendus spécifiques aux incidents
 * @param {string} lang - Code de langue pour les traductions
 * @returns {Promise<Array>} - Liste des incidents avec leurs attributs
 */
const getIncidents = async (lang) => {
    logger.info(`[SERVICE] Fetching incidents with language ${lang || 'en'}`);
    
    const params = [lang || 'en'];
    
    const query = `
        SELECT t.uuid,
            t.title,
            t.description,
            t.configuration_item_uuid,
            t.created_at,
            t.updated_at,
            t.closed_at,
            p1.first_name || ' ' || p1.last_name as requested_by_name,
            p2.first_name || ' ' || p2.last_name as requested_for_name,
            p3.first_name || ' ' || p3.last_name as writer_name,
            COALESCE(ttt.label, tt.code) as ticket_type_label,
            COALESCE(tst.label, ts.code) as ticket_status_label,
            tt.code as ticket_type_code,
            ts.code as ticket_status_code,
            g.groupe_name as assigned_group_name,
            g.uuid as assigned_group_uuid,
            p4.first_name || ' ' || p4.last_name as assigned_person_name,
            p4.uuid as assigned_person_uuid,
            -- Extraction des attributs spécifiques aux incidents depuis le JSONB
            t.core_extended_attributes->>'impact' as impact,
            t.core_extended_attributes->>'urgency' as urgency,
            (t.core_extended_attributes->>'priority')::integer as priority,
            t.core_extended_attributes->>'cause_code' as cause_code,
            t.core_extended_attributes->>'rel_service' as rel_service,
            t.core_extended_attributes->>'contact_type' as contact_type,
            (t.core_extended_attributes->>'reopen_count')::integer as reopen_count,
            (t.core_extended_attributes->>'standby_count')::integer as standby_count,
            t.core_extended_attributes->>'rel_problem_id' as rel_problem_id,
            t.core_extended_attributes->>'resolution_code' as resolution_code,
            (t.core_extended_attributes->>'assignment_count')::integer as assignment_count,
            t.core_extended_attributes->>'resolution_notes' as resolution_notes,
            t.core_extended_attributes->>'rel_change_request' as rel_change_request,
            (t.core_extended_attributes->>'assignment_to_count')::integer as assignment_to_count,
            t.core_extended_attributes->>'rel_service_offerings' as rel_service_offerings
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
        LEFT JOIN (
            SELECT rel_ticket, rel_assigned_to_group, rel_assigned_to_person
            FROM core.rel_tickets_groups_persons
            WHERE type = 'ASSIGNED' AND ended_at IS NULL
        ) rtgp ON t.uuid = rtgp.rel_ticket
        LEFT JOIN configuration.groups g ON rtgp.rel_assigned_to_group = g.uuid
        LEFT JOIN configuration.persons p4 ON rtgp.rel_assigned_to_person = p4.uuid
        WHERE t.ticket_type_code = 'INCIDENT'
    `;
    
    try {
        const result = await db.query(query, params);
        return result.rows;
    } catch (error) {
        logger.error('[SERVICE] Error in getIncidents:', error);
        throw error;
    }
};

module.exports = {
    getIncidents
};
