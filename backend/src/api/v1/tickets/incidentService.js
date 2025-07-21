const db = require('../../../config/database');
const logger = require('../../../config/logger');
const ticketService = require('./service');

/**
 * Récupère les incidents avec les attributs étendus spécifiques aux incidents
 * @param {string} lang - Code de langue pour les traductions
 * @returns {Promise<Array>} - Liste des incidents avec leurs attributs
 */
const getIncidents = async (lang) => {
    const servicePrefix = '[INCIDENT SERVICE]';
    
    // Définition des attributs spécifiques aux incidents
    const baseQuery = `
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
        problem_rel.rel_child_ticket_uuid as rel_problem_id,
        problem.title as rel_problem_title,
        t.core_extended_attributes->>'resolution_code' as resolution_code,
        COALESCE(resolution_codes_t.label, t.core_extended_attributes->>'resolution_code') as resolution_code_label,
        (t.core_extended_attributes->>'assignment_count')::integer as assignment_count,
        t.core_extended_attributes->>'resolution_notes' as resolution_notes,
        change_rel.rel_child_ticket_uuid as rel_change_request,
        change_request.title as rel_change_request_title,
        (t.core_extended_attributes->>'assignment_to_count')::integer as assignment_to_count,
        t.core_extended_attributes->>'rel_service_offerings' as rel_service_offerings,
        service.name as rel_service_name,
        service_offerings.name as rel_service_offerings_name
    `;
    
    // Définition des jointures spécifiques aux incidents
    const additionalJoins = `
        -- Traductions additionnelles pour les attributs spécifiques incidents
        LEFT JOIN translations.incident_impacts_labels impacts_t 
            ON impacts_t.rel_incident_impact_code = t.core_extended_attributes->>'impact' AND impacts_t.language = $1
        LEFT JOIN translations.incident_urgencies_labels urgencies_t 
            ON urgencies_t.rel_incident_urgency_code = t.core_extended_attributes->>'urgency' AND urgencies_t.language = $1
        LEFT JOIN translations.incident_cause_codes_labels cause_codes_t 
            ON cause_codes_t.rel_incident_cause_code_code = t.core_extended_attributes->>'cause_code' AND cause_codes_t.language = $1
        LEFT JOIN translations.contact_types_labels contact_types_t 
            ON contact_types_t.rel_contact_type_code = t.core_extended_attributes->>'contact_type' AND contact_types_t.language = $1
        LEFT JOIN translations.incident_resolution_codes_labels resolution_codes_t 
            ON resolution_codes_t.rel_incident_resolution_code = t.core_extended_attributes->>'resolution_code' AND resolution_codes_t.language = $1
        -- Jointures pour les relations avec d'autres tickets
        LEFT JOIN core.rel_parent_child_tickets problem_rel 
            ON t.uuid = problem_rel.rel_parent_ticket_uuid AND problem_rel.dependency_code = 'KNOWN_PROBLEM' AND problem_rel.ended_at IS NULL
        LEFT JOIN core.tickets problem 
            ON problem_rel.rel_child_ticket_uuid = problem.uuid
        LEFT JOIN core.rel_parent_child_tickets change_rel 
            ON t.uuid = change_rel.rel_parent_ticket_uuid AND change_rel.dependency_code = 'CHANGE_AT_ORIGIN' AND change_rel.ended_at IS NULL
        LEFT JOIN core.tickets change_request 
            ON change_rel.rel_child_ticket_uuid = change_request.uuid
        -- Jointures pour les services et offres de service
        LEFT JOIN data.services service 
            ON t.core_extended_attributes->>'rel_service' = service.uuid::text
        LEFT JOIN data.service_offerings service_offerings 
            ON t.core_extended_attributes->>'rel_service_offerings' = service_offerings.uuid::text
    `;
    
    // Utilisation de la fonction getTickets factorisée
    return ticketService.getTickets(lang, 'INCIDENT', baseQuery, additionalJoins, [], servicePrefix);
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
                ci.name as configuration_item_name,
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
                
                -- Informations sur les tickets liés (problème et demande de changement)
                problem.title as rel_problem_title,
                
                change_request.title as rel_change_request_title,
                
                -- Champs spécifiques aux incidents depuis core_extended_attributes
                t.core_extended_attributes->>'impact' as impact,
                t.core_extended_attributes->>'urgency' as urgency,
                (t.core_extended_attributes->>'priority')::integer as priority,
                t.core_extended_attributes->>'cause_code' as cause_code,
                t.core_extended_attributes->>'rel_service' as rel_service,
                t.core_extended_attributes->>'rel_service_offerings' as rel_service_offerings,
                service.name as rel_service_name,
                service_offerings.name as rel_service_offerings_name,
                t.core_extended_attributes->>'contact_type' as contact_type,
                problem_rel.rel_child_ticket_uuid as rel_problem_id,
                change_rel.rel_child_ticket_uuid as rel_change_request,
                t.core_extended_attributes->>'resolution_code' as resolution_code,
                t.core_extended_attributes->>'resolution_notes' as resolution_notes,
                
                -- Labels traduits pour les champs avec référence
                COALESCE(impacts_t.label, t.core_extended_attributes->>'impact') as impact_label,
                COALESCE(urgencies_t.label, t.core_extended_attributes->>'urgency') as urgency_label,
                COALESCE(cause_codes_t.label, t.core_extended_attributes->>'cause_code') as cause_code_label,
                COALESCE(contact_types_t.label, t.core_extended_attributes->>'contact_type') as contact_type_label,
                COALESCE(resolution_codes_t.label, t.core_extended_attributes->>'resolution_code') as resolution_code_label,
                


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
            
            -- Jointures pour les relations parent-enfant
            LEFT JOIN core.rel_parent_child_tickets problem_rel ON t.uuid = problem_rel.rel_parent_ticket_uuid 
                AND problem_rel.dependency_code = 'KNOWN_PROBLEM'
                AND problem_rel.ended_at is null
            LEFT JOIN core.rel_parent_child_tickets change_rel ON t.uuid = change_rel.rel_parent_ticket_uuid 
                AND change_rel.dependency_code = 'CHANGE_AT_ORIGIN'
                AND change_rel.ended_at is null
            
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
            LEFT JOIN core.tickets problem ON problem_rel.rel_child_ticket_uuid = problem.uuid
            
            -- Jointure pour récupérer le titre de la demande de changement liée
            LEFT JOIN core.tickets change_request ON change_rel.rel_child_ticket_uuid = change_request.uuid
            
            -- Jointures pour les services et offres de service
            LEFT JOIN data.services service ON t.core_extended_attributes->>'rel_service' = service.uuid::text
            LEFT JOIN data.service_offerings service_offerings ON t.core_extended_attributes->>'rel_service_offerings' = service_offerings.uuid::text
            
            -- Jointure pour récupérer le nom de l'élément de configuration
            LEFT JOIN data.configuration_items ci ON t.configuration_item_uuid = ci.uuid
            
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
        'contact_type', 'reopen_count', 'standby_count',
        'resolution_code', 'assignment_count', 'resolution_notes',
        'rel_service_offerings'
    ];
    
    // Extraire les relations parent-enfant pour les traiter séparément
    const relProblemId = updateData.rel_problem_id;
    const relChangeRequest = updateData.rel_change_request;
    
    // Utiliser les fonctions du service.js
    const { applyUpdate, addChildrenTickets, removeChildTicket } = require('./service');
    
    // Mettre à jour les champs standards, d'assignation et attributs étendus
    const updatedIncident = await applyUpdate(
        uuid,
        updateData,
        'INCIDENT',
        standardFields,
        assignmentFields,
        extendedAttributesFields,
        getIncidentById,
        '[INCIDENT SERVICE]'
    );
    
    // Gérer la relation avec le problème si présent
    if (relProblemId !== undefined) {
        logger.info(`[INCIDENT SERVICE] Updating problem relation for incident ${uuid}`);
        
        try {
            // 1. Récupérer d'abord les relations existantes pour ce type de dépendance
            const existingRelations = await db.query(
                `SELECT rel_child_ticket_uuid FROM core.rel_parent_child_tickets 
                 WHERE rel_parent_ticket_uuid = $1 AND dependency_code = $2 AND ended_at IS NULL`,
                [uuid, 'KNOWN_PROBLEM']
            );
            
            // Logs pour débogage
            logger.info(`[INCIDENT SERVICE] Found ${existingRelations.rowCount} existing problem relations for incident ${uuid}`);
            logger.info(`[INCIDENT SERVICE] Existing problem relations: ${JSON.stringify(existingRelations.rows)}`);
            
            // 2. Supprimer chaque relation existante
            for (const row of existingRelations.rows) {
                await removeChildTicket(uuid, row.rel_child_ticket_uuid);
                logger.info(`[INCIDENT SERVICE] Removed problem relation: ${uuid} -> ${row.rel_child_ticket_uuid}`);
            }
            
            // 3. Ajouter la nouvelle relation si elle existe
            if (relProblemId) {
                await addChildrenTickets(uuid, 'KNOWN_PROBLEM', [relProblemId]);
                logger.info(`[INCIDENT SERVICE] Added new problem relation: ${uuid} -> ${relProblemId}`);
            } else {
                logger.info(`[INCIDENT SERVICE] No new problem relation to add for incident ${uuid}`);
            }
        } catch (error) {
            logger.error(`[INCIDENT SERVICE] Error managing problem relation for incident ${uuid}:`, error);
        }
    }
    
    // Gérer la relation avec la demande de changement si présente
    if (relChangeRequest !== undefined) {
        logger.info(`[INCIDENT SERVICE] Updating change request relation for incident ${uuid}`);
        
        try {
            // 1. Récupérer d'abord les relations existantes pour ce type de dépendance
            const existingRelations = await db.query(
                `SELECT rel_child_ticket_uuid FROM core.rel_parent_child_tickets 
                 WHERE rel_parent_ticket_uuid = $1 AND dependency_code = $2 AND ended_at IS NULL`,
                [uuid, 'CHANGE_AT_ORIGIN']
            );
            
            // Logs pour débogage
            logger.info(`[INCIDENT SERVICE] Found ${existingRelations.rowCount} existing change request relations for incident ${uuid}`);
            logger.info(`[INCIDENT SERVICE] Existing change request relations: ${JSON.stringify(existingRelations.rows)}`);
            
            // 2. Supprimer chaque relation existante
            for (const row of existingRelations.rows) {
                await removeChildTicket(uuid, row.rel_child_ticket_uuid);
                logger.info(`[INCIDENT SERVICE] Removed change request relation: ${uuid} -> ${row.rel_child_ticket_uuid}`);
            }
            
            // 3. Ajouter la nouvelle relation si elle existe
            if (relChangeRequest) {
                await addChildrenTickets(uuid, 'CHANGE_AT_ORIGIN', [relChangeRequest]);
                logger.info(`[INCIDENT SERVICE] Added new change request relation: ${uuid} -> ${relChangeRequest}`);
            } else {
                logger.info(`[INCIDENT SERVICE] No new change request relation to add for incident ${uuid}`);
            }
        } catch (error) {
            logger.error(`[INCIDENT SERVICE] Error managing change request relation for incident ${uuid}:`, error);
        }
    }
    
    // Récupérer l'incident mis à jour avec toutes ses relations
    return updatedIncident;
};

/**
 * Crée un nouvel incident
 * @param {Object} incidentData - Données pour la création de l'incident
 * @returns {Promise<Object>} - Détails de l'incident créé
 */
const createIncident = async (incidentData) => {
    logger.info('[INCIDENT SERVICE] Preparing data for incident creation');
    
    // Définir les champs standards pour un incident
    const standardFields = {
        title: incidentData.title,
        description: incidentData.description,
        configuration_item_uuid: incidentData.configuration_item_uuid,
        ticket_type_code: 'INCIDENT',
        ticket_status_code: incidentData.ticket_status_code || 'NEW',
        requested_by_uuid: incidentData.requested_by_uuid,
        requested_for_uuid: incidentData.requested_for_uuid,
        writer_uuid: incidentData.writer_uuid
    };
    
    // Définir les champs d'assignation pour un incident
    const assignmentFields = {
        assigned_to_group: incidentData.assigned_to_group,
        assigned_to_person: incidentData.assigned_to_person
    };
    
    // Définir les attributs étendus pour un incident
    const extendedAttributesFields = {};
    
    // Liste des champs spécifiques aux incidents
    const incidentExtendedFields = [
        'impact', 'urgency', 'priority', 'rel_service', 'rel_service_offerings',
        'resolution_notes', 'resolution_code', 'cause_code',
        'sla_pickup_due_at', 'assigned_to_at', 
        'sla_resolution_due_at', 'resolved_at', 'reopen_count', 'assignment_count',
        'assignment_to_count', 'standby_count', 'contact_type'
    ];
    
    // Ajouter chaque champ présent dans incidentData aux attributs étendus
    incidentExtendedFields.forEach(field => {
        if (incidentData[field] !== undefined) {
            extendedAttributesFields[field] = incidentData[field];
        }
    });
    
    // Initialiser certains compteurs à 0 s'ils ne sont pas définis
    if (extendedAttributesFields.reopen_count === undefined) extendedAttributesFields.reopen_count = 0;
    if (extendedAttributesFields.assignment_count === undefined) extendedAttributesFields.assignment_count = 0;
    if (extendedAttributesFields.assignment_to_count === undefined) extendedAttributesFields.assignment_to_count = 0;
    if (extendedAttributesFields.standby_count === undefined) extendedAttributesFields.standby_count = 0;
    
    // Gérer la liste des observateurs (watchers)
    const watchList = incidentData.watch_list && Array.isArray(incidentData.watch_list) ? 
        incidentData.watch_list : [];
    
    if (watchList.length > 0) {
        logger.info(`[INCIDENT SERVICE] Processing ${watchList.length} watchers for incident creation`);
    }
    
    logger.info('[INCIDENT SERVICE] Successfully prepared data for incident creation');
    
    // Préparer les relations parent-enfant
    const parentChildRelations = [];
    
    // Extraire les relations parent-enfant pour les traiter séparément
    const relProblemId = incidentData.rel_problem_id;
    const relChangeRequest = incidentData.rel_change_request;
    
    // Ajouter la relation avec le problème si présent
    if (relProblemId) {
        parentChildRelations.push({
            childUuid: relProblemId,
            dependencyCode: 'KNOWN_PROBLEM'
        });
        logger.info(`[INCIDENT SERVICE] Prepared parent-child relation with problem ${relProblemId}`);
    }
    
    // Ajouter la relation avec la demande de changement si présente
    if (relChangeRequest) {
        parentChildRelations.push({
            childUuid: relChangeRequest,
            dependencyCode: 'CHANGE_AT_ORIGIN'
        });
        logger.info(`[INCIDENT SERVICE] Prepared parent-child relation with change request ${relChangeRequest}`);
    }
    
    // Appeler applyCreation pour créer effectivement le ticket
    const { applyCreation } = require('./service');
    
    return await applyCreation(
        incidentData,
        'INCIDENT',
        standardFields,
        assignmentFields,
        extendedAttributesFields,
        watchList,
        parentChildRelations,
        getIncidentById,
        '[INCIDENT SERVICE]'
    );
};

module.exports = {
    getIncidents,
    getIncidentById,
    updateIncident,
    createIncident
};
