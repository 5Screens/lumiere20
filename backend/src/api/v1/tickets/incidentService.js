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
            ci.name as configuration_item_name,
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
            g.group_name as assigned_group_name,
            g.uuid as assigned_group_uuid,
            p4.first_name || ' ' || p4.last_name as assigned_person_name,
            p4.uuid as assigned_person_uuid,
            -- Extraction des attributs spécifiques aux incidents depuis le JSONB
            t.core_extended_attributes->>'impact' as impact,
            COALESCE(impacts_t.label, t.core_extended_attributes->>'impact') as impact_label,
            t.core_extended_attributes->>'urgency' as urgency,
            COALESCE(urgencies_t.label, t.core_extended_attributes->>'urgency') as urgency_label,
            (t.core_extended_attributes->>'priority')::integer as priority,
            t.core_extended_attributes->>'cause_code' as cause_code,
            COALESCE(cause_codes_t.label, t.core_extended_attributes->>'cause_code') as cause_code_label,
            t.core_extended_attributes->>'rel_service' as rel_service,
            t.core_extended_attributes->>'contact_type' as contact_type,
            COALESCE(contact_types_t.label, t.core_extended_attributes->>'contact_type') as contact_type_label,
            (t.core_extended_attributes->>'reopen_count')::integer as reopen_count,
            (t.core_extended_attributes->>'standby_count')::integer as standby_count,
            t.core_extended_attributes->>'rel_problem_id' as rel_problem_id,
            problem.title as rel_problem_title,
            t.core_extended_attributes->>'resolution_code' as resolution_code,
            COALESCE(resolution_codes_t.label, t.core_extended_attributes->>'resolution_code') as resolution_code_label,
            (t.core_extended_attributes->>'assignment_count')::integer as assignment_count,
            t.core_extended_attributes->>'resolution_notes' as resolution_notes,
            t.core_extended_attributes->>'rel_change_request' as rel_change_request,
            change_request.title as rel_change_request_title,
            (t.core_extended_attributes->>'assignment_to_count')::integer as assignment_to_count,
            t.core_extended_attributes->>'rel_service_offerings' as rel_service_offerings,
            service.name as rel_service_name,
            service_offerings.name as rel_service_offerings_name
        FROM core.tickets t
        LEFT JOIN configuration.persons p1 ON t.requested_by_uuid = p1.uuid
        LEFT JOIN configuration.persons p2 ON t.requested_for_uuid = p2.uuid
        JOIN configuration.persons p3 ON t.writer_uuid = p3.uuid
        JOIN configuration.ticket_types tt ON t.ticket_type_code = tt.code
        JOIN configuration.ticket_status ts ON t.ticket_status_code = ts.code AND ts.rel_ticket_type = tt.code
        LEFT JOIN data.configuration_items ci ON t.configuration_item_uuid = ci.uuid 
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

        -- Traductions additionnelles pour les attributs spécifiques incidents
        LEFT JOIN translations.incident_impacts_labels impacts_t ON impacts_t.rel_incident_impact_code = t.core_extended_attributes->>'impact' AND impacts_t.language = $1
        LEFT JOIN translations.incident_urgencies_labels urgencies_t ON urgencies_t.rel_incident_urgency_code = t.core_extended_attributes->>'urgency' AND urgencies_t.language = $1
        LEFT JOIN translations.incident_cause_codes_labels cause_codes_t ON cause_codes_t.rel_incident_cause_code_code = t.core_extended_attributes->>'cause_code' AND cause_codes_t.language = $1
        LEFT JOIN translations.contact_types_labels contact_types_t ON contact_types_t.rel_contact_type_code = t.core_extended_attributes->>'contact_type' AND contact_types_t.language = $1
        LEFT JOIN translations.incident_resolution_codes_labels resolution_codes_t ON resolution_codes_t.rel_incident_resolution_code = t.core_extended_attributes->>'resolution_code' AND resolution_codes_t.language = $1
        
        -- Jointures pour récupérer les informations liées
        LEFT JOIN core.tickets problem ON problem.uuid = (t.core_extended_attributes->>'rel_problem_id')::uuid
        LEFT JOIN core.tickets change_request ON change_request.uuid = (t.core_extended_attributes->>'rel_change_request')::uuid
        LEFT JOIN data.services service ON service.uuid = (t.core_extended_attributes->>'rel_service')::uuid
        LEFT JOIN data.service_offerings service_offerings ON service_offerings.uuid = (t.core_extended_attributes->>'rel_service_offerings')::uuid

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

/**
 * Récupère un incident par son UUID
 * @param {string} uuid - UUID de l'incident
 * @param {string} lang - Code de langue pour les traductions (fr, en, etc.)
 * @returns {Promise<Object>} - Détails de l'incident
 */
const getIncidentById = async (uuid, lang = 'en') => {
    logger.info(`[INCIDENT SERVICE] Fetching incident with UUID: ${uuid} and language: ${lang}`);
    
    try {
        // Requête SQL pour récupérer les détails de l'incident avec les données d'assignation
        const query = `
            SELECT 
                t.uuid,
                t.title,
                t.description,
                t.configuration_item_uuid,
                t.requested_by_uuid,
                t.requested_for_uuid,
                t.writer_uuid,
                t.ticket_type_code,
                t.ticket_status_code,
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
                
                -- Informations sur l'équipe assignée
                g.uuid as assigned_to_group,
                g.group_name as assigned_group_name,
                           
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
                
                -- Champs spécifiques aux incidents depuis core_extended_attributes
                t.core_extended_attributes->>'impact' as impact,
                t.core_extended_attributes->>'urgency' as urgency,
                (t.core_extended_attributes->>'priority')::integer as priority,
                t.core_extended_attributes->>'cause_code' as cause_code,
                t.core_extended_attributes->>'rel_service' as rel_service,
                t.core_extended_attributes->>'rel_service_offerings' as rel_service_offerings,
                t.core_extended_attributes->>'contact_type' as contact_type,
                t.core_extended_attributes->>'rel_problem_id' as rel_problem_id,
                t.core_extended_attributes->>'rel_change_request' as rel_change_request,
                t.core_extended_attributes->>'resolution_code' as resolution_code,
                t.core_extended_attributes->>'resolution_notes' as resolution_notes,
                
                -- Labels traduits pour les champs avec référence
                COALESCE(impacts_t.label, t.core_extended_attributes->>'impact') as impact_label,
                COALESCE(urgencies_t.label, t.core_extended_attributes->>'urgency') as urgency_label,
                COALESCE(cause_codes_t.label, t.core_extended_attributes->>'cause_code') as cause_code_label,
                COALESCE(contact_types_t.label, t.core_extended_attributes->>'contact_type') as contact_type_label,
                COALESCE(resolution_codes_t.label, t.core_extended_attributes->>'resolution_code') as resolution_code_label,
                
                -- Titre du problème lié si existant
                problem.title as rel_problem_title,

                -- Comptages
                (t.core_extended_attributes->>'assignment_count')::integer as assignment_count,
                (t.core_extended_attributes->>'reopen_count')::integer as reopen_count,
                (t.core_extended_attributes->>'standby_count')::integer as standby_count
                
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
            
            -- Jointures pour les traductions des champs spécifiques aux incidents
            LEFT JOIN configuration.incident_impacts impacts ON t.core_extended_attributes->>'impact' = impacts.code
            LEFT JOIN translations.incident_impacts_labels impacts_t ON impacts_t.rel_incident_impact_code = t.core_extended_attributes->>'impact' AND impacts_t.language = $2
            
            LEFT JOIN configuration.incident_urgencies urgencies ON t.core_extended_attributes->>'urgency' = urgencies.code
            LEFT JOIN translations.incident_urgencies_labels urgencies_t ON urgencies_t.rel_incident_urgency_code = t.core_extended_attributes->>'urgency' AND urgencies_t.language = $2
            
            LEFT JOIN configuration.incident_cause_codes cause_codes ON t.core_extended_attributes->>'cause_code' = cause_codes.code
            LEFT JOIN translations.incident_cause_codes_labels cause_codes_t ON cause_codes_t.rel_incident_cause_code_code = t.core_extended_attributes->>'cause_code' AND cause_codes_t.language = $2
            
            LEFT JOIN configuration.contact_types contact_types ON t.core_extended_attributes->>'contact_type' = contact_types.code
            LEFT JOIN translations.contact_types_labels contact_types_t ON contact_types_t.rel_contact_type_code = t.core_extended_attributes->>'contact_type' AND contact_types_t.language = $2
            
            LEFT JOIN configuration.incident_resolution_codes resolution_codes ON t.core_extended_attributes->>'resolution_code' = resolution_codes.code
            LEFT JOIN translations.incident_resolution_codes_labels resolution_codes_t ON resolution_codes_t.rel_incident_resolution_code = t.core_extended_attributes->>'resolution_code' AND resolution_codes_t.language = $2
            
            -- Jointure pour récupérer le titre du problème lié
            LEFT JOIN core.tickets problem ON t.core_extended_attributes->>'rel_problem_id' = problem.uuid::text
            
            WHERE t.uuid = $1 AND t.ticket_type_code = 'INCIDENT'
        `;
        
        const result = await db.query(query, [uuid, lang]);
        
        if (result.rows.length === 0) {
            logger.warn(`[INCIDENT SERVICE] No incident found with UUID: ${uuid}`);
            return null;
        }
        
        logger.info(`[INCIDENT SERVICE] Successfully retrieved incident with UUID: ${uuid}`);
        return result.rows[0];
    } catch (error) {
        logger.error(`[INCIDENT SERVICE] Error fetching incident with UUID ${uuid}:`, error);
        throw error;
    }
};

/**
 * Met à jour partiellement un incident par son UUID
 * @param {string} uuid - UUID de l'incident à mettre à jour
 * @param {Object} updateData - Données à mettre à jour
 * @returns {Promise<Object>} - Détails de l'incident mis à jour
 */
const updateIncident = async (uuid, updateData) => {
    // Définir les champs spécifiques aux incidents
    const standardFields = [
        'title', 'description', 'configuration_item_uuid',
        'ticket_status_code', 'requested_by_uuid', 'requested_for_uuid'
    ];
    
    const assignmentFields = [
        'assigned_to_group', 'assigned_to_person'
    ];
    
    const extendedAttributesFields = [
        'impact', 'urgency', 'priority', 'cause_code', 'rel_service', 
        'contact_type', 'reopen_count', 'standby_count', 'rel_problem_id',
        'resolution_code', 'assignment_count', 'resolution_notes',
        'rel_change_request', 'rel_service_offerings'
    ];
    
    // Utiliser la fonction applyUpdate du service.js
    const { applyUpdate } = require('./service');
    return await applyUpdate(
        uuid,
        updateData,
        'INCIDENT',
        standardFields,
        assignmentFields,
        extendedAttributesFields,
        getIncidentById,
        '[INCIDENT SERVICE]'
    );
};

module.exports = {
    getIncidents,
    getIncidentById,
    updateIncident
};
