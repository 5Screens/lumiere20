const db = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Prépare les données pour la création d'un changement
 * @param {Object} ticketData - Données du ticket à créer
 * @returns {Object} - Données structurées pour la création
 */
const createChange = (ticketData) => {
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
                dependencyCode: 'TICKETS_IMPLEMENTED'
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
    
    return {
        standardFields,
        assignmentFields,
        extendedAttributesFields,
        watchList,
        parentChildRelations
    };
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
                [uuid, 'TICKETS_IMPLEMENTED']
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
                await addChildrenTickets(uuid, 'TICKETS_IMPLEMENTED', relatedTickets);
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
                    AND rel.dependency_code = 'TICKETS_IMPLEMENTED'
                    AND rel.ended_at IS NULL
                ) as related_tickets,
                
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
    getChangeById,
    createChange,
    updateChange
};
