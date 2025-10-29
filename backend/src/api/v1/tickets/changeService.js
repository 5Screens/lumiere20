const db = require('../../../config/database');
const logger = require('../../../config/logger');
const ticketService = require('./service');
const { buildFilterCondition } = require('./changeSearchService');

/**
 * Récupère les changements avec les attributs étendus spécifiques aux changements
 * @param {string} lang - Code de langue pour les traductions
 * @returns {Promise<Array>} - Liste des changements avec leurs attributs
 */
const getChanges = async (lang) => {
    const servicePrefix = '[CHANGE SERVICE]';
    
    // Définition des attributs spécifiques aux changements
    const baseQuery = `
        -- Extraction des attributs spécifiques aux changements depuis le JSONB
        t.core_extended_attributes->>'rel_services' as rel_services,
        t.core_extended_attributes->>'rel_service_offerings' as rel_service_offerings,
        t.core_extended_attributes->>'rel_change_type_code' as rel_change_type_code,
        COALESCE(change_type_t.label, t.core_extended_attributes->>'rel_change_type_code') as change_type_label,
        t.core_extended_attributes->>'r_q1' as r_q1,
        r_q1_t.label as r_q1_label,
        t.core_extended_attributes->>'r_q2' as r_q2,
        r_q2_t.label as r_q2_label,
        t.core_extended_attributes->>'r_q3' as r_q3,
        r_q3_t.label as r_q3_label,
        t.core_extended_attributes->>'r_q4' as r_q4,
        r_q4_t.label as r_q4_label,
        t.core_extended_attributes->>'r_q5' as r_q5,
        r_q5_t.label as r_q5_label,
        t.core_extended_attributes->>'i_q1' as i_q1,
        i_q1_t.label as i_q1_label,
        t.core_extended_attributes->>'i_q2' as i_q2,
        i_q2_t.label as i_q2_label,
        t.core_extended_attributes->>'i_q3' as i_q3,
        i_q3_t.label as i_q3_label,
        t.core_extended_attributes->>'i_q4' as i_q4,
        i_q4_t.label as i_q4_label,
        t.core_extended_attributes->>'requested_start_date_at' as requested_start_date_at,
        t.core_extended_attributes->>'requested_end_date_at' as requested_end_date_at,
        t.core_extended_attributes->>'planned_start_date_at' as planned_start_date_at,
        t.core_extended_attributes->>'planned_end_date_at' as planned_end_date_at,
        t.core_extended_attributes->>'rel_change_justifications_code' as rel_change_justifications_code,
        COALESCE(change_justification_t.label, t.core_extended_attributes->>'rel_change_justifications_code') as change_justifications_label,
        t.core_extended_attributes->>'rel_change_objective' as rel_change_objective,
        COALESCE(change_objective_t.label, t.core_extended_attributes->>'rel_change_objective') as change_objective_label,
        t.core_extended_attributes->>'test_plan' as test_plan,
        t.core_extended_attributes->>'implementation_plan' as implementation_plan,
        t.core_extended_attributes->>'rollbcak_plan' as rollbcak_plan,
        t.core_extended_attributes->>'post_implementation_plan' as post_implementation_plan,
        t.core_extended_attributes->>'cab_comments' as cab_comments,
        t.core_extended_attributes->>'rel_cab_validation_status' as rel_cab_validation_status,
        COALESCE(cab_validation_t.label, t.core_extended_attributes->>'rel_cab_validation_status') as cab_validation_status_label,
        t.core_extended_attributes->'required_validations' as required_validations,
        (
            SELECT json_agg(label)
            FROM jsonb_array_elements_text(t.core_extended_attributes->'required_validations') as rv
            LEFT JOIN translations.change_setup_label csl ON csl.rel_change_setup_code = rv AND csl.lang = $1
        ) as required_validations_labels,
        t.core_extended_attributes->>'validated_at' as validated_at,
        t.core_extended_attributes->>'actual_start_date_at' as actual_start_date_at,
        t.core_extended_attributes->>'actual_end_date_at' as actual_end_date_at,
        t.core_extended_attributes->>'elapsed_time' as elapsed_time,
        t.core_extended_attributes->>'success_criteria' as success_criteria,
        t.core_extended_attributes->>'post_change_evaluation' as post_change_evaluation,
        COALESCE(post_change_eval_t.label, t.core_extended_attributes->>'post_change_evaluation') as post_change_evaluation_label,
        t.core_extended_attributes->>'post_change_comment' as post_change_comment,
        -- Récupération des tickets liés depuis la table de relations
        (SELECT json_agg(json_build_object(
            'uuid', child.uuid,
            'title', child.title,
            'ticket_status_code', child.ticket_status_code
        ))
        FROM core.rel_parent_child_tickets rel
        JOIN core.tickets child ON rel.rel_child_ticket_uuid = child.uuid
        WHERE rel.rel_parent_ticket_uuid = t.uuid
        AND rel.dependency_code = 'EMBEDDED_TICKETS'
        AND rel.ended_at IS NULL
        ) as related_tickets,
        service.name as rel_service_name,
        service_offerings.name as rel_service_offerings_name
    `;
    
    // Définition des jointures spécifiques aux changements
    const additionalJoins = `
        -- Traductions additionnelles pour les attributs spécifiques changements
        -- Type de changement (metadata = 'TYPE')
        LEFT JOIN translations.change_setup_label change_type_t 
            ON change_type_t.rel_change_setup_code = t.core_extended_attributes->>'rel_change_type_code' AND change_type_t.lang = $1
        
        -- Justification de changement (metadata = 'JUSTIFICATION')
        LEFT JOIN translations.change_setup_label change_justification_t 
            ON change_justification_t.rel_change_setup_code = t.core_extended_attributes->>'rel_change_justifications_code' AND change_justification_t.lang = $1
            
        -- Objectif de changement (metadata = 'OBJECTIVE')
        LEFT JOIN translations.change_setup_label change_objective_t 
            ON change_objective_t.rel_change_setup_code = t.core_extended_attributes->>'rel_change_objective' AND change_objective_t.lang = $1
            
        -- Statut de validation CAB (metadata = 'CAB_VALIDATION_STATUS')
        LEFT JOIN translations.change_setup_label cab_validation_t 
            ON cab_validation_t.rel_change_setup_code = t.core_extended_attributes->>'rel_cab_validation_status' AND cab_validation_t.lang = $1
            
        -- Évaluation post-changement
        LEFT JOIN translations.change_setup_label post_change_eval_t 
            ON post_change_eval_t.rel_change_setup_code = t.core_extended_attributes->>'post_change_evaluation' AND post_change_eval_t.lang = $1
            
        -- Questions d'évaluation des risques et impacts
        LEFT JOIN translations.change_questions_labels r_q1_t 
            ON r_q1_t.rel_change_question_code = 'R_Q1_CODE' AND r_q1_t.lang = $1
        LEFT JOIN translations.change_questions_labels r_q2_t 
            ON r_q2_t.rel_change_question_code = 'R_Q2_CODE' AND r_q2_t.lang = $1
        LEFT JOIN translations.change_questions_labels r_q3_t 
            ON r_q3_t.rel_change_question_code = 'R_Q3_CODE' AND r_q3_t.lang = $1
        LEFT JOIN translations.change_questions_labels r_q4_t 
            ON r_q4_t.rel_change_question_code = 'R_Q4_CODE' AND r_q4_t.lang = $1
        LEFT JOIN translations.change_questions_labels r_q5_t 
            ON r_q5_t.rel_change_question_code = 'R_Q5_CODE' AND r_q5_t.lang = $1
        LEFT JOIN translations.change_questions_labels i_q1_t 
            ON i_q1_t.rel_change_question_code = 'I_Q1_CODE' AND i_q1_t.lang = $1
        LEFT JOIN translations.change_questions_labels i_q2_t 
            ON i_q2_t.rel_change_question_code = 'I_Q2_CODE' AND i_q2_t.lang = $1
        LEFT JOIN translations.change_questions_labels i_q3_t 
            ON i_q3_t.rel_change_question_code = 'I_Q3_CODE' AND i_q3_t.lang = $1
        LEFT JOIN translations.change_questions_labels i_q4_t 
            ON i_q4_t.rel_change_question_code = 'I_Q4_CODE' AND i_q4_t.lang = $1
        -- Jointures pour les services et offres de service
        LEFT JOIN data.services service 
            ON service.uuid = (t.core_extended_attributes->>'rel_services')::uuid
        LEFT JOIN data.service_offerings service_offerings 
            ON service_offerings.uuid = (t.core_extended_attributes->>'rel_service_offerings')::uuid
    `;
    
    // Utilisation de la fonction getTickets factorisée
    return ticketService.getTickets(lang, 'CHANGE', baseQuery, additionalJoins, [], servicePrefix);
};

/**
 * Crée un nouveau changement
 * @param {Object} ticketData - Données du ticket à créer
 * @returns {Promise<Object>} - Détails du changement créé
 */
const createChange = async (ticketData) => {
    logger.info('[CHANGE SERVICE] Preparing data for change creation');
    
    // Définir les champs standards pour le changement
    const standardFields = {
        title: ticketData.title,
        description: ticketData.description,
        configuration_item_uuid: ticketData.configuration_item_uuid,
        ticket_status_code: ticketData.ticket_status_code,
        ticket_type_code: 'CHANGE',
        requested_by_uuid: ticketData.requested_by_uuid,
        requested_for_uuid: ticketData.requested_for_uuid,
        writer_uuid: ticketData.writer_uuid
    };
    
    // Définir les champs d'assignation
    const assignmentFields = {
        assigned_to_group: ticketData.assigned_to_group,
        assigned_to_person: ticketData.assigned_to_person
    };
    
    // Liste des champs spécifiques aux changements
    const changeExtendedFields = [
        'rel_services', 'rel_service_offerings', 'rel_change_type_code',
        'r_q1', 'r_q2', 'r_q3', 'r_q4', 'r_q5',
        'i_q1', 'i_q2', 'i_q3', 'i_q4',
        'requested_start_date_at', 'requested_end_date_at', 'planned_start_date_at', 'planned_end_date_at',
        'rel_change_justifications_code', 'rel_change_objective', 'test_plan', 'implementation_plan',
        'rollbcak_plan', 'post_implementation_plan', 'cab_comments', 'rel_cab_validation_status',
        'required_validations', 'validated_at', 'actual_start_date_at',
        'actual_end_date_at', 'elapsed_time', 'subscribers', 'success_criteria',
        'post_change_evaluation', 'post_change_comment'
    ];
    
    // Extraire les related_tickets pour les gérer comme relations parent-enfant
    const relatedTickets = ticketData.related_tickets;
    
    // Préparer les relations parent-enfant
    const parentChildRelations = [];
    if (relatedTickets && Array.isArray(relatedTickets) && relatedTickets.length > 0) {
        relatedTickets.forEach(ticketUuid => {
            parentChildRelations.push({
                childUuid: ticketUuid,
                dependencyCode: 'EMBEDDED_TICKETS'
            });
        });
    }
    
    // Initialiser l'objet des attributs étendus
    const extendedAttributesFields = {};
    
    // Ajouter chaque champ présent dans ticketData aux attributs étendus
    changeExtendedFields.forEach(field => {
        if (field !== 'related_tickets' && ticketData[field] !== undefined) {
            extendedAttributesFields[field] = ticketData[field];
        }
    });
    
    // Extraire la liste des observateurs
    const watchList = ticketData.watch_list || [];
    
    logger.info(`[CHANGE SERVICE] Prepared data for change creation with ${parentChildRelations.length} related tickets`);
    
    // Appeler applyCreation pour créer effectivement le ticket
    const { applyCreation } = require('./service');
    
    return await applyCreation(
        ticketData,
        'CHANGE',
        standardFields,
        assignmentFields,
        extendedAttributesFields,
        watchList,
        parentChildRelations,
        getChangeById,
        '[CHANGE SERVICE]'
    );
};

/**
 * Met à jour partiellement un changement par son UUID
 * @param {string} uuid - UUID du changement à mettre à jour
 * @param {Object} updateData - Données à mettre à jour
 * @returns {Promise<Object>} - Détails du changement mis à jour
 */
const updateChange = async (uuid, updateData) => {
    // Définir les champs spécifiques aux changements
    const standardFields = [
        'title', 'description', 'configuration_item_uuid',
        'ticket_status_code', 'requested_by_uuid', 'requested_for_uuid'
    ];
    
    const assignmentFields = [
        'assigned_to_group', 'assigned_to_person'
    ];
    
    const extendedAttributesFields = [
        'rel_services', 'rel_service_offerings', 'rel_change_type_code',
        'r_q1', 'r_q2', 'r_q3', 'r_q4', 'r_q5',
        'i_q1', 'i_q2', 'i_q3', 'i_q4',
        'requested_start_date_at', 'requested_end_date_at', 'planned_start_date_at', 'planned_end_date_at',
        'rel_change_justifications_code', 'rel_change_objective', 'test_plan', 'implementation_plan',
        'rollbcak_plan', 'post_implementation_plan', 'cab_comments', 'rel_cab_validation_status',
        'required_validations', 'validated_at', 'actual_start_date_at',
        'actual_end_date_at', 'elapsed_time', 'success_criteria',
        'post_change_evaluation', 'post_change_comment'
    ];
    
    // Extraire les tickets liés pour les traiter séparément
    const relatedTickets = updateData.related_tickets;
    
    // Utiliser les fonctions du service.js
    const { applyUpdate, addChildrenTickets, removeChildTicket } = require('./service');
    
    // Mettre à jour les champs standards, d'assignation et attributs étendus
    const updatedChange = await applyUpdate(
        uuid,
        updateData,
        'CHANGE',
        standardFields,
        assignmentFields,
        extendedAttributesFields,
        getChangeById,
        '[CHANGE SERVICE]'
    );
    
    // Gérer les tickets liés si présents
    if (relatedTickets !== undefined) {
        logger.info(`[CHANGE SERVICE] Updating related tickets for change ${uuid}`);
        
        try {
            // 1. Récupérer d'abord les relations existantes
            const existingRelations = await db.query(
                `SELECT rel_child_ticket_uuid FROM core.rel_parent_child_tickets 
                 WHERE rel_parent_ticket_uuid = $1 AND dependency_code = $2 AND ended_at IS NULL`,
                [uuid, 'EMBEDDED_TICKETS']
            );
            
            // Logs pour débogage
            logger.info(`[CHANGE SERVICE] Found ${existingRelations.rowCount} existing related tickets for change ${uuid}`);
            logger.info(`[CHANGE SERVICE] Existing related tickets: ${JSON.stringify(existingRelations.rows)}`);
            
            // 2. Supprimer chaque relation existante
            for (const row of existingRelations.rows) {
                await removeChildTicket(uuid, row.rel_child_ticket_uuid);
                logger.info(`[CHANGE SERVICE] Removed related ticket: ${uuid} -> ${row.rel_child_ticket_uuid}`);
            }
            
            // 3. Ajouter les nouvelles relations si elles existent
            if (relatedTickets && Array.isArray(relatedTickets) && relatedTickets.length > 0) {
                await addChildrenTickets(uuid, 'EMBEDDED_TICKETS', relatedTickets);
                logger.info(`[CHANGE SERVICE] Added ${relatedTickets.length} new related tickets for change ${uuid}`);
            } else {
                logger.info(`[CHANGE SERVICE] No new related tickets to add for change ${uuid}`);
            }
        } catch (error) {
            logger.error(`[CHANGE SERVICE] Error managing related tickets for change ${uuid}:`, error);
        }
    }
    
    return updatedChange;
};

/**
 * Récupère un changement par son UUID
 * @param {string} uuid - UUID du changement
 * @param {string} lang - Code de langue pour les traductions (fr, en, etc.)
 * @returns {Promise<Object>} - Détails du changement
 */
const getChangeById = async (uuid, lang = 'en') => {
    logger.info(`[getChangeById] Récupération du changement avec l'UUID: ${uuid}, langue: ${lang}`);
    logger.info(`[CHANGE SERVICE] Fetching change with UUID: ${uuid} and language: ${lang}`);
    
    try {
        // Requête SQL pour récupérer les détails du changement avec les données d'assignation
        const query = `
            SELECT 
                t.uuid,
                t.title,
                t.description,
                t.configuration_item_uuid,
                ci.name as configuration_item_name,
                t.created_at,
                t.updated_at,
                t.closed_at,
                t.requested_by_uuid,
                t.requested_for_uuid,
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
                
                -- Récupérer les tickets liés depuis la table de relations
                (
                    SELECT json_agg(json_build_object(
                        'uuid', rt.uuid,
                        'title', rt.title,
                        'ticket_status_code', rt.ticket_status_code,
                        'ticket_type_code', rt.ticket_type_code
                    ))
                    FROM core.rel_parent_child_tickets rel
                    JOIN core.tickets rt ON rel.rel_child_ticket_uuid = rt.uuid
                    WHERE rel.rel_parent_ticket_uuid = t.uuid 
                    AND rel.dependency_code = 'EMBEDDED_TICKETS'
                    AND rel.ended_at IS NULL
                ) as related_tickets,
                
                -- Extraction des attributs spécifiques aux changements depuis le JSONB
                t.core_extended_attributes->>'rel_services' as rel_services,
                t.core_extended_attributes->>'rel_service_offerings' as rel_service_offerings,
                t.core_extended_attributes->>'rel_change_type_code' as rel_change_type_code,
                COALESCE(change_type_t.label, t.core_extended_attributes->>'rel_change_type_code') as change_type_label,
                t.core_extended_attributes->>'r_q1' as r_q1,
                r_q1_t.label as r_q1_label,
                t.core_extended_attributes->>'r_q2' as r_q2,
                r_q2_t.label as r_q2_label,
                t.core_extended_attributes->>'r_q3' as r_q3,
                r_q3_t.label as r_q3_label,
                t.core_extended_attributes->>'r_q4' as r_q4,
                r_q4_t.label as r_q4_label,
                t.core_extended_attributes->>'r_q5' as r_q5,
                r_q5_t.label as r_q5_label,
                t.core_extended_attributes->>'i_q1' as i_q1,
                i_q1_t.label as i_q1_label,
                t.core_extended_attributes->>'i_q2' as i_q2,
                i_q2_t.label as i_q2_label,
                t.core_extended_attributes->>'i_q3' as i_q3,
                i_q3_t.label as i_q3_label,
                t.core_extended_attributes->>'i_q4' as i_q4,
                i_q4_t.label as i_q4_label,
                t.core_extended_attributes->>'requested_start_date_at' as requested_start_date_at,
                t.core_extended_attributes->>'requested_end_date_at' as requested_end_date_at,
                t.core_extended_attributes->>'planned_start_date_at' as planned_start_date_at,
                t.core_extended_attributes->>'planned_end_date_at' as planned_end_date_at,
                t.core_extended_attributes->>'rel_change_justifications_code' as rel_change_justifications_code,
                COALESCE(change_justification_t.label, t.core_extended_attributes->>'rel_change_justifications_code') as change_justifications_label,
                t.core_extended_attributes->>'rel_change_objective' as rel_change_objective,
                COALESCE(change_objective_t.label, t.core_extended_attributes->>'rel_change_objective') as change_objective_label,
                t.core_extended_attributes->>'test_plan' as test_plan,
                t.core_extended_attributes->>'implementation_plan' as implementation_plan,
                t.core_extended_attributes->>'rollbcak_plan' as rollbcak_plan,
                t.core_extended_attributes->>'post_implementation_plan' as post_implementation_plan,
                t.core_extended_attributes->>'cab_comments' as cab_comments,
                t.core_extended_attributes->>'rel_cab_validation_status' as rel_cab_validation_status,
                COALESCE(cab_validation_t.label, t.core_extended_attributes->>'rel_cab_validation_status') as cab_validation_status_label,
                (
                    SELECT json_agg(json_build_object(
                        'uuid', csc.uuid,
                        'code', rv,
                        'label', COALESCE(rv_t.label, rv)
                    ))
                    FROM jsonb_array_elements_text(t.core_extended_attributes->'required_validations') as rv
                    LEFT JOIN configuration.change_setup_codes csc ON csc.code = rv
                    LEFT JOIN translations.change_setup_label rv_t ON rv_t.rel_change_setup_code = rv AND rv_t.lang = $2
                ) as required_validations,
                t.core_extended_attributes->>'validated_at' as validated_at,
                t.core_extended_attributes->>'actual_start_date_at' as actual_start_date_at,
                t.core_extended_attributes->>'actual_end_date_at' as actual_end_date_at,
                t.core_extended_attributes->>'elapsed_time' as elapsed_time,
                t.core_extended_attributes->>'success_criteria' as success_criteria,
                t.core_extended_attributes->>'post_change_evaluation' as post_change_evaluation,
                t.core_extended_attributes->>'post_change_comment' as post_change_comment,
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
            
            -- Traductions additionnelles pour les attributs spécifiques aux changements
            -- Type de changement (metadata = 'TYPE')
            LEFT JOIN translations.change_setup_label change_type_t ON change_type_t.rel_change_setup_code = t.core_extended_attributes->>'rel_change_type_code' 
                AND change_type_t.lang = $2
            
            -- Justification de changement (metadata = 'JUSTIFICATION')
            LEFT JOIN translations.change_setup_label change_justification_t ON change_justification_t.rel_change_setup_code = t.core_extended_attributes->>'rel_change_justifications_code' 
                AND change_justification_t.lang = $2
                
            -- Objectif de changement (metadata = 'OBJECTIVE')
            LEFT JOIN translations.change_setup_label change_objective_t ON change_objective_t.rel_change_setup_code = t.core_extended_attributes->>'rel_change_objective' 
                AND change_objective_t.lang = $2
                
            -- Statut de validation CAB (metadata = 'CAB_VALIDATION_STATUS')
            LEFT JOIN translations.change_setup_label cab_validation_t ON cab_validation_t.rel_change_setup_code = t.core_extended_attributes->>'rel_cab_validation_status' 
                AND cab_validation_t.lang = $2
                
            -- Questions d'évaluation des risques et impacts
            LEFT JOIN translations.change_questions_labels r_q1_t ON r_q1_t.rel_change_question_code = 'R_Q1_CODE' AND r_q1_t.lang = $2
            LEFT JOIN translations.change_questions_labels r_q2_t ON r_q2_t.rel_change_question_code = 'R_Q2_CODE' AND r_q2_t.lang = $2
            LEFT JOIN translations.change_questions_labels r_q3_t ON r_q3_t.rel_change_question_code = 'R_Q3_CODE' AND r_q3_t.lang = $2
            LEFT JOIN translations.change_questions_labels r_q4_t ON r_q4_t.rel_change_question_code = 'R_Q4_CODE' AND r_q4_t.lang = $2
            LEFT JOIN translations.change_questions_labels r_q5_t ON r_q5_t.rel_change_question_code = 'R_Q5_CODE' AND r_q5_t.lang = $2
            LEFT JOIN translations.change_questions_labels i_q1_t ON i_q1_t.rel_change_question_code = 'I_Q1_CODE' AND i_q1_t.lang = $2
            LEFT JOIN translations.change_questions_labels i_q2_t ON i_q2_t.rel_change_question_code = 'I_Q2_CODE' AND i_q2_t.lang = $2
            LEFT JOIN translations.change_questions_labels i_q3_t ON i_q3_t.rel_change_question_code = 'I_Q3_CODE' AND i_q3_t.lang = $2
            LEFT JOIN translations.change_questions_labels i_q4_t ON i_q4_t.rel_change_question_code = 'I_Q4_CODE' AND i_q4_t.lang = $2
                
            -- Jointures pour les services et offres de services
            LEFT JOIN data.services service ON service.uuid = (t.core_extended_attributes->>'rel_services')::uuid
            LEFT JOIN data.service_offerings service_offerings ON service_offerings.uuid = (t.core_extended_attributes->>'rel_service_offerings')::uuid
            
            WHERE t.uuid = $1 AND t.ticket_type_code = 'CHANGE'
        `;
        
        const result = await db.query(query, [uuid, lang]);
        
        if (result.rows.length === 0) {
            logger.warn(`[CHANGE SERVICE] No change found with UUID: ${uuid}`);
            return null;
        }
        
        logger.info(`[CHANGE SERVICE] Successfully retrieved change with UUID: ${uuid}`);
        logger.info(`[getChangeById] Changement récupéré avec succès: ${uuid}`);  
        logger.debug(`[getChangeById] Données du changement: ${JSON.stringify(result.rows[0])}`);  
        return result.rows[0];
    } catch (error) {
        logger.error(`[CHANGE SERVICE] Error fetching change with UUID ${uuid}:`, error);
        throw error;
    }
};

/**
 * Get changes with lazy search - returns paginated results filtered by search query
 * @param {string} [searchQuery] - Optional search term to filter changes
 * @param {number} [page=1] - Page number (1-indexed)
 * @param {number} [limit=10] - Number of results per page
 * @param {string} [lang='en'] - Language code for translations
 * @returns {Promise<Object>} Object with data and pagination metadata
 */
const getChangesLazySearch = async (searchQuery = '', page = 1, limit = 10, lang = 'en') => {
    try {
        logger.info(`[CHANGE SERVICE] Getting changes with lazy search: "${searchQuery}", page: ${page}, limit: ${limit}, lang: ${lang}`);
        
        // Validate and sanitize pagination parameters
        const validPage = Math.max(1, parseInt(page) || 1);
        const validLimit = Math.min(50, Math.max(1, parseInt(limit) || 10)); // Max 50 per page
        const offset = (validPage - 1) * validLimit;
        
        // Separate WHERE clauses for COUNT and main query
        let countWhereClause = `WHERE t.ticket_type_code = 'CHANGE'`;
        let mainWhereClause = `WHERE t.ticket_type_code = 'CHANGE'`;
        const countParams = []; // Params for COUNT query (no lang needed)
        const queryParams = [lang]; // Params for main query (starts with lang at $1)
        let countParamIndex = 1; // For COUNT query
        let paramIndex = 2; // For main query (starts at $2 after lang)
        
        // If search query is provided, add search conditions
        if (searchQuery && searchQuery.trim()) {
            // Split search query by spaces to create AND conditions
            const searchTerms = searchQuery.trim().split(/\s+/).filter(term => term.length > 0);
            
            if (searchTerms.length > 0) {
                const countConditions = [];
                const mainConditions = [];
                
                searchTerms.forEach((term) => {
                    // For COUNT query
                    countParams.push(`%${term}%`);
                    countConditions.push(`(
                        unaccent(LOWER(t.title)) LIKE unaccent(LOWER($${countParamIndex})) OR
                        unaccent(LOWER(t.description)) LIKE unaccent(LOWER($${countParamIndex}))
                    )`);
                    countParamIndex++;
                    
                    // For main query
                    queryParams.push(`%${term}%`);
                    mainConditions.push(`(
                        unaccent(LOWER(t.title)) LIKE unaccent(LOWER($${paramIndex})) OR
                        unaccent(LOWER(t.description)) LIKE unaccent(LOWER($${paramIndex}))
                    )`);
                    paramIndex++;
                });
                
                countWhereClause += ` AND ${countConditions.join(' AND ')}`;
                mainWhereClause += ` AND ${mainConditions.join(' AND ')}`;
            }
        }
        
        // Count total results for pagination
        const countQuery = `
            SELECT COUNT(*) as total
            FROM core.tickets t
            ${countWhereClause}
        `;
        const { rows: countRows } = await db.query(countQuery, countParams);
        const total = parseInt(countRows[0].total);
        
        // Main query to fetch changes
        const query = `
            SELECT 
                t.uuid,
                t.title,
                t.description,
                t.ticket_status_code,
                COALESCE(tst.label, ts.code) as ticket_status_label,
                t.created_at,
                t.updated_at,
                t.closed_at,
                p3.first_name || ' ' || p3.last_name as writer_name,
                ci.name as configuration_item_name,
                t.core_extended_attributes->>'rel_change_type_code' as change_type_code,
                COALESCE(change_type_t.label, t.core_extended_attributes->>'rel_change_type_code') as change_type_label,
                service.name as rel_service_name,
                service_offerings.name as rel_service_offerings_name
            FROM core.tickets t
            JOIN configuration.persons p3 ON t.writer_uuid = p3.uuid
            JOIN configuration.ticket_status ts ON t.ticket_status_code = ts.code AND ts.rel_ticket_type = 'CHANGE'
            LEFT JOIN translations.ticket_status_translation tst ON ts.uuid = tst.ticket_status_uuid AND tst.lang = $1
            LEFT JOIN data.configuration_items ci ON t.configuration_item_uuid = ci.uuid
            LEFT JOIN translations.change_setup_label change_type_t ON 
                change_type_t.rel_change_setup_code = t.core_extended_attributes->>'rel_change_type_code'
                AND change_type_t.lang = $1
            LEFT JOIN data.services service ON service.uuid = (t.core_extended_attributes->>'rel_services')::uuid
            LEFT JOIN data.service_offerings service_offerings ON service_offerings.uuid = (t.core_extended_attributes->>'rel_service_offerings')::uuid
            ${mainWhereClause}
            ORDER BY t.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        queryParams.push(validLimit, offset);
        
        const { rows } = await db.query(query, queryParams);
        
        const hasMore = offset + rows.length < total;
        
        logger.info(`[CHANGE SERVICE] Retrieved ${rows.length} changes (page ${validPage}, total: ${total}, hasMore: ${hasMore})`);
        
        return {
            data: rows,
            pagination: {
                page: validPage,
                limit: validLimit,
                total: total,
                hasMore: hasMore
            }
        };
    } catch (error) {
        logger.error('[CHANGE SERVICE] Error in lazy search:', error);
        throw error;
    }
};

/**
 * Search CHANGE tickets with advanced filters, sorting and pagination
 * @param {Object} searchParams - Search parameters including filters, sort, pagination, and lang
 * @returns {Object} Search results with data and metadata
 */
const searchChanges = async (searchParams) => {
  try {
    logger.info('[CHANGE SERVICE] Searching changes with advanced filters:', JSON.stringify(searchParams, null, 2));
    
    const { filters = {}, sort = {}, pagination = {}, lang = 'en' } = searchParams;
    const { page = 1, limit = 25 } = pagination;
    const offset = (page - 1) * limit;
    const { by: sortBy = 'created_at', direction: sortDirection = 'desc' } = sort;
    
    // Mapping des colonnes affichées (frontend) vers les expressions SQL triables (backend)
    const sortColumnMapping = {
      'writer_name': "p3.first_name || ' ' || p3.last_name",
      'ticket_status_label': 'COALESCE(tst.label, ts.code)',
      'requested_for_name': "p2.first_name || ' ' || p2.last_name",
      'assigned_group_name': 'g.group_name',
      'assigned_person_name': "p4.first_name || ' ' || p4.last_name",
      'ticket_type_label': 'COALESCE(ttt.label, tt.code)',
      'configuration_item_name': 'ci.name',
      'change_type_label': 'COALESCE(change_type_t.label, t.core_extended_attributes->>\'rel_change_type_code\')',
      'rel_service_name': 'service.name',
      'rel_service_offerings_name': 'service_offerings.name',
      'change_justifications_label': 'COALESCE(change_justification_t.label, t.core_extended_attributes->>\'rel_change_justifications_code\')',
      'change_objective_label': 'COALESCE(change_objective_t.label, t.core_extended_attributes->>\'rel_change_objective\')',
      'cab_validation_status_label': 'COALESCE(cab_validation_t.label, t.core_extended_attributes->>\'rel_cab_validation_status\')',
      'post_change_evaluation_label': 'COALESCE(post_change_eval_t.label, t.core_extended_attributes->>\'post_change_evaluation\')',
      // Colonnes de la table tickets
      'uuid': 't.uuid',
      'title': 't.title',
      'description': 't.description',
      'created_at': 't.created_at',
      'updated_at': 't.updated_at',
      'closed_at': 't.closed_at',
      'requested_start_date_at': "(t.core_extended_attributes->>'requested_start_date_at')::timestamp",
      'requested_end_date_at': "(t.core_extended_attributes->>'requested_end_date_at')::timestamp",
      'planned_start_date_at': "(t.core_extended_attributes->>'planned_start_date_at')::timestamp",
      'planned_end_date_at': "(t.core_extended_attributes->>'planned_end_date_at')::timestamp",
      'validated_at': "(t.core_extended_attributes->>'validated_at')::timestamp",
      'actual_start_date_at': "(t.core_extended_attributes->>'actual_start_date_at')::timestamp",
      'actual_end_date_at': "(t.core_extended_attributes->>'actual_end_date_at')::timestamp"
    };
    
    // Obtenir l'expression SQL pour le tri
    const sortExpression = sortColumnMapping[sortBy] || `t.${sortBy}`;
    
    logger.info(`[CHANGE SERVICE] Sort parameters: sortBy="${sortBy}" → SQL expression: "${sortExpression}", sortDirection="${sortDirection}"`);
    logger.info(`[CHANGE SERVICE] Pagination: page=${page}, limit=${limit}, offset=${offset}`);
    logger.info(`[CHANGE SERVICE] Language: ${lang}`);
    
    // Build WHERE clause from advanced filters
    const queryParams = [];
    let paramIndex = 1;
    let whereClause = '';
    
    // Always filter by ticket_type = CHANGE
    const baseConditions = [`t.ticket_type_code = 'CHANGE'`];
    
    // Validate filter format
    if (Object.keys(filters).length > 0) {
      if (!filters.conditions || !Array.isArray(filters.conditions)) {
        const error = new Error(
          'Invalid filter format. filters.conditions must be an array. ' +
          'Example: { "filters": { "conditions": [{ "column": "title", "operator": "contains", "value": "server" }] } }'
        );
        logger.error('[CHANGE SERVICE] Missing or invalid filters.conditions');
        throw error;
      }
      
      if (filters.conditions.length > 0) {
        const mode = filters.mode || 'include';
        const operator = (filters.operator || 'AND').toUpperCase();
        
        logger.info(`[CHANGE SERVICE] Processing ${filters.conditions.length} advanced filter(s) with mode=${mode}, operator=${operator}`);
        
        const filterConditions = [];
        
        // Process each filter condition
        for (const filterDef of filters.conditions) {
          const { column } = filterDef;
          
          logger.info(`[CHANGE SERVICE] Processing filter condition:`, JSON.stringify(filterDef));
          
          if (!column) {
            logger.warn('[CHANGE SERVICE] Filter condition missing column, skipping');
            continue;
          }
          
          // Get column metadata to determine data type
          const metadataQuery = `
            SELECT data_type 
            FROM administration.table_metadata 
            WHERE table_name = $1 AND column_name = $2
          `;
          const metadataResult = await db.query(metadataQuery, ['tickets', column]);
          
          logger.info(`[CHANGE SERVICE] Metadata query result for column ${column}:`, metadataResult.rows);
          
          if (metadataResult.rows.length === 0) {
            logger.warn(`[CHANGE SERVICE] No metadata for column ${column}, skipping filter`);
            continue;
          }
          
          const { data_type } = metadataResult.rows[0];
          logger.info(`[CHANGE SERVICE] Column ${column} has data_type: ${data_type}`);
          
          // Build the condition for this filter
          const { condition, newParamIndex } = buildFilterCondition(
            column,
            filterDef,
            data_type,
            queryParams,
            paramIndex
          );
          
          logger.info(`[CHANGE SERVICE] buildFilterCondition returned: condition="${condition}", newParamIndex=${newParamIndex}`);
          
          if (condition) {
            filterConditions.push(condition);
            paramIndex = newParamIndex;
            logger.info(`[CHANGE SERVICE] Added filter: ${condition}`);
          } else {
            logger.warn(`[CHANGE SERVICE] buildFilterCondition returned empty condition for column ${column}`);
          }
        }
        
        // Combine all filter conditions
        if (filterConditions.length > 0) {
          const combinedConditions = filterConditions.join(` ${operator} `);
          
          // Apply mode: include or exclude
          // IMPORTANT: Always wrap in parentheses to avoid SQL operator precedence issues
          if (mode === 'exclude') {
            baseConditions.push(`NOT (${combinedConditions})`);
          } else {
            // Wrap in parentheses if using OR operator or multiple conditions
            if (operator === 'OR' || filterConditions.length > 1) {
              baseConditions.push(`(${combinedConditions})`);
            } else {
              baseConditions.push(combinedConditions);
            }
          }
          
          logger.info(`[CHANGE SERVICE] Filter conditions added to base conditions`);
        }
      }
    }
    
    whereClause = `WHERE ${baseConditions.join(' AND ')}`;
    logger.info(`[CHANGE SERVICE] Final WHERE clause: ${whereClause}`);
    
    // Count total results
    const countQuery = `
      SELECT COUNT(*) as total
      FROM core.tickets t
      ${whereClause}
    `;
    
    logger.info(`[CHANGE SERVICE] Count query params: ${JSON.stringify(queryParams)}`);
    
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);
    
    // Get paginated results with all data
    const dataQuery = `
      SELECT 
        t.uuid,
        t.title,
        t.description,
        t.configuration_item_uuid,
        ci.name as configuration_item_name,
        t.requested_for_uuid,
        t.writer_uuid,
        t.ticket_type_code,
        t.ticket_status_code,
        t.created_at,
        t.updated_at,
        t.closed_at,
        t.core_extended_attributes,
        t.user_extended_attributes,
        
        -- Person names
        p2.first_name || ' ' || p2.last_name as requested_for_name,
        p3.first_name || ' ' || p3.last_name as writer_name,
        
        -- Translated labels
        COALESCE(ttt.label, tt.code) as ticket_type_label,
        COALESCE(tst.label, ts.code) as ticket_status_label,
        
        -- Assignment info
        g.uuid as assigned_to_group,
        g.group_name as assigned_group_name,
        p4.uuid as assigned_to_person,
        p4.first_name || ' ' || p4.last_name as assigned_person_name,
        
        -- Change-specific fields from core_extended_attributes
        t.core_extended_attributes->>'rel_services' as rel_services,
        service.name as rel_service_name,
        t.core_extended_attributes->>'rel_service_offerings' as rel_service_offerings,
        service_offerings.name as rel_service_offerings_name,
        t.core_extended_attributes->>'rel_change_type_code' as rel_change_type_code,
        COALESCE(change_type_t.label, t.core_extended_attributes->>'rel_change_type_code') as change_type_label,
        t.core_extended_attributes->>'rel_change_justifications_code' as rel_change_justifications_code,
        COALESCE(change_justification_t.label, t.core_extended_attributes->>'rel_change_justifications_code') as change_justifications_label,
        t.core_extended_attributes->>'rel_change_objective' as rel_change_objective,
        COALESCE(change_objective_t.label, t.core_extended_attributes->>'rel_change_objective') as change_objective_label,
        t.core_extended_attributes->>'rel_cab_validation_status' as rel_cab_validation_status,
        COALESCE(cab_validation_t.label, t.core_extended_attributes->>'rel_cab_validation_status') as cab_validation_status_label,
        t.core_extended_attributes->>'post_change_evaluation' as post_change_evaluation,
        COALESCE(post_change_eval_t.label, t.core_extended_attributes->>'post_change_evaluation') as post_change_evaluation_label,
        t.core_extended_attributes->>'requested_start_date_at' as requested_start_date_at,
        t.core_extended_attributes->>'requested_end_date_at' as requested_end_date_at,
        t.core_extended_attributes->>'planned_start_date_at' as planned_start_date_at,
        t.core_extended_attributes->>'planned_end_date_at' as planned_end_date_at,
        t.core_extended_attributes->>'validated_at' as validated_at,
        t.core_extended_attributes->>'actual_start_date_at' as actual_start_date_at,
        t.core_extended_attributes->>'actual_end_date_at' as actual_end_date_at,
        t.core_extended_attributes->>'elapsed_time' as elapsed_time
        
      FROM core.tickets t
      LEFT JOIN configuration.persons p2 ON t.requested_for_uuid = p2.uuid
      LEFT JOIN configuration.persons p3 ON t.writer_uuid = p3.uuid
      LEFT JOIN data.configuration_items ci ON t.configuration_item_uuid = ci.uuid
      JOIN configuration.ticket_types tt ON t.ticket_type_code = tt.code
      JOIN configuration.ticket_status ts ON t.ticket_status_code = ts.code AND ts.rel_ticket_type = tt.code
      LEFT JOIN translations.ticket_types_translation ttt ON tt.uuid = ttt.ticket_type_uuid AND ttt.lang = $${paramIndex}
      LEFT JOIN translations.ticket_status_translation tst ON ts.uuid = tst.ticket_status_uuid AND tst.lang = $${paramIndex}
      LEFT JOIN (
        SELECT rel_ticket, rel_assigned_to_group, rel_assigned_to_person
        FROM core.rel_tickets_groups_persons
        WHERE type = 'ASSIGNED' AND (ended_at IS NULL OR ended_at > NOW())
      ) rtgp ON t.uuid = rtgp.rel_ticket
      LEFT JOIN configuration.groups g ON rtgp.rel_assigned_to_group = g.uuid
      LEFT JOIN configuration.persons p4 ON rtgp.rel_assigned_to_person = p4.uuid
      LEFT JOIN translations.change_setup_label change_type_t ON change_type_t.rel_change_setup_code = t.core_extended_attributes->>'rel_change_type_code' AND change_type_t.lang = $${paramIndex}
      LEFT JOIN translations.change_setup_label change_justification_t ON change_justification_t.rel_change_setup_code = t.core_extended_attributes->>'rel_change_justifications_code' AND change_justification_t.lang = $${paramIndex}
      LEFT JOIN translations.change_setup_label change_objective_t ON change_objective_t.rel_change_setup_code = t.core_extended_attributes->>'rel_change_objective' AND change_objective_t.lang = $${paramIndex}
      LEFT JOIN translations.change_setup_label cab_validation_t ON cab_validation_t.rel_change_setup_code = t.core_extended_attributes->>'rel_cab_validation_status' AND cab_validation_t.lang = $${paramIndex}
      LEFT JOIN translations.change_setup_label post_change_eval_t ON post_change_eval_t.rel_change_setup_code = t.core_extended_attributes->>'post_change_evaluation' AND post_change_eval_t.lang = $${paramIndex}
      LEFT JOIN data.services service ON t.core_extended_attributes->>'rel_services' = service.uuid::text
      LEFT JOIN data.service_offerings service_offerings ON t.core_extended_attributes->>'rel_service_offerings' = service_offerings.uuid::text
      ${whereClause}
      ORDER BY ${sortExpression} ${sortDirection.toUpperCase()}
      LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}
    `;
    
    queryParams.push(lang, limit, offset);
    
    logger.info(`[CHANGE SERVICE] Data query params: ${JSON.stringify(queryParams)}`);
    
    const dataResult = await db.query(dataQuery, queryParams);
    
    // Calculate pagination metadata
    const currentPage = page;
    const totalPages = Math.ceil(total / limit);
    const hasMore = offset + limit < total;
    
    logger.info(`[CHANGE SERVICE] Found ${dataResult.rows.length} changes (total: ${total})`);
    
    return {
      data: dataResult.rows,
      total: total,
      hasMore: hasMore,
      pagination: {
        offset: offset,
        limit: limit,
        currentPage: currentPage,
        totalPages: totalPages,
        sortBy: sortBy,
        sortDirection: sortDirection
      }
    };
    
  } catch (error) {
    logger.error('[CHANGE SERVICE] Error searching changes:', error);
    throw error;
  }
};

module.exports = {
    getChanges,
    getChangeById,
    createChange,
    updateChange,
    getChangesLazySearch,
    searchChanges
};