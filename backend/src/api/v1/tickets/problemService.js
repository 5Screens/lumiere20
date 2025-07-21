const db = require('../../../config/database');
const logger = require('../../../config/logger');
const ticketService = require('./service');

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
                t.core_extended_attributes->>'rel_problem_categories_code' as rel_problem_categories_code,
                COALESCE(pcl.label, t.core_extended_attributes->>'rel_problem_categories_code') as rel_problem_categories_label,
                t.core_extended_attributes->>'rel_service' as rel_service,
                t.core_extended_attributes->>'rel_service_offerings' as rel_service_offerings,
                t.core_extended_attributes->>'impact' as impact,
                COALESCE(iil.label, t.core_extended_attributes->>'impact') as impact_label,
                t.core_extended_attributes->>'urgency' as urgency,
                COALESCE(iul.label, t.core_extended_attributes->>'urgency') as urgency_label,
                t.core_extended_attributes->>'symptoms_description' as symptoms_description,
                t.core_extended_attributes->>'workaround' as workaround,
                
                -- Gestion des listes de tickets associés à partir de la table rel_parent_child_tickets
                
                -- Liste des erreurs connues (knownerrors) associées au problème
                (
                    SELECT COALESCE(json_agg(
                        json_build_object(
                            'uuid', ke.uuid,
                            'title', ke.title
                        )
                    ), '[]'::json)
                    FROM core.rel_parent_child_tickets rpc
                    JOIN core.tickets ke ON rpc.rel_child_ticket_uuid = ke.uuid
                    WHERE rpc.rel_parent_ticket_uuid = t.uuid 
                    AND rpc.dependency_code = 'KNOWNERROR'
                    AND (rpc.ended_at IS NULL OR rpc.ended_at > NOW())
                ) AS knownerrors_list,
                
                -- Liste des changements (changes) associés au problème
                (
                    SELECT COALESCE(json_agg(
                        json_build_object(
                            'uuid', ch.uuid,
                            'title', ch.title
                        )
                    ), '[]'::json)
                    FROM core.rel_parent_child_tickets rpc
                    JOIN core.tickets ch ON rpc.rel_child_ticket_uuid = ch.uuid
                    WHERE rpc.rel_parent_ticket_uuid = t.uuid 
                    AND rpc.dependency_code = 'CHANGE'
                    AND (rpc.ended_at IS NULL OR rpc.ended_at > NOW())
                ) AS changes_list,
                
                -- Liste des incidents associés au problème
                (
                    SELECT COALESCE(json_agg(
                        json_build_object(
                            'uuid', inc.uuid,
                            'title', inc.title
                        )
                    ), '[]'::json)
                    FROM core.rel_parent_child_tickets rpc
                    JOIN core.tickets inc ON rpc.rel_child_ticket_uuid = inc.uuid
                    WHERE rpc.rel_parent_ticket_uuid = t.uuid 
                    AND rpc.dependency_code = 'INCIDENT'
                    AND (rpc.ended_at IS NULL OR rpc.ended_at > NOW())
                ) AS incidents_list,
                
                t.core_extended_attributes->>'root_cause' as root_cause,
                t.core_extended_attributes->>'definitive_solution' as definitive_solution,
                (t.core_extended_attributes->>'target_resolution_date')::timestamp as target_resolution_date,
                (t.core_extended_attributes->>'actual_resolution_date')::timestamp as actual_resolution_date,
                (t.core_extended_attributes->>'actual_resolution_workload')::numeric as actual_resolution_workload,
                t.core_extended_attributes->>'closure_justification' as closure_justification,
                
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
    const servicePrefix = '[PROBLEM SERVICE]';
    
    // Définition des attributs spécifiques aux problèmes
    const baseQuery = `
        -- Extraction des attributs spécifiques aux problèmes depuis le JSONB
        t.core_extended_attributes->>'rel_problem_categories_code' as problem_category_code,
        COALESCE(pcl.label, t.core_extended_attributes->>'rel_problem_categories_code') as problem_category_label,
        t.core_extended_attributes->>'impact' as impact,
        COALESCE(iil.label, t.core_extended_attributes->>'impact') as impact_label,
        t.core_extended_attributes->>'urgency' as urgency,
        COALESCE(iul.label, t.core_extended_attributes->>'urgency') as urgency_label,
        t.core_extended_attributes->>'symptoms_description' as symptoms_description,
        t.core_extended_attributes->>'workaround' as workaround,
        -- Listes JSON traitées comme des colonnes distinctes
        (t.core_extended_attributes->>'knownerrors_list')::jsonb as known_errors_list,
        (t.core_extended_attributes->>'changes_list')::jsonb as changes_list,
        (t.core_extended_attributes->>'incidents_list')::jsonb as incidents_list,
        
        t.core_extended_attributes->>'root_cause' as root_cause,
        t.core_extended_attributes->>'definitive_solution' as definitive_solution,
        t.core_extended_attributes->>'closure_justification' as closure_justification,
        (t.core_extended_attributes->>'target_resolution_date')::timestamp as target_resolution_date,
        (t.core_extended_attributes->>'actual_resolution_date')::timestamp as actual_resolution_date,
        (t.core_extended_attributes->>'actual_resolution_workload')::numeric as actual_resolution_workload,
        
        -- Informations sur les services et offres de service
        s.name as rel_service_name,
        so.name as rel_service_offerings_name
    `;
    
    // Définition des jointures spécifiques aux problèmes
    const additionalJoins = `
        LEFT JOIN data.services s ON t.core_extended_attributes->>'rel_service' = s.uuid::text
        LEFT JOIN data.service_offerings so ON t.core_extended_attributes->>'rel_service_offerings' = so.uuid::text
            
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
    `;
    
    // Utilisation de la fonction getTickets factorisée
    return ticketService.getTickets(lang, 'PROBLEM', baseQuery, additionalJoins, [], servicePrefix);
};

/**
 * Crée un nouveau problème
 * @param {Object} problemData - Données pour la création du problème
 * @returns {Promise<Object>} - Détails du problème créé
 */
const createProblem = async (problemData) => {
    logger.info('[PROBLEM SERVICE] Preparing data for problem creation');
    
    // Définir les champs standards pour un problème
    const standardFields = {
        title: problemData.title,
        description: problemData.description,
        configuration_item_uuid: problemData.configuration_item_uuid,
        ticket_type_code: 'PROBLEM',
        ticket_status_code: problemData.ticket_status_code || 'NEW',
        requested_by_uuid: problemData.requested_by_uuid || problemData.writer_uuid,
        requested_for_uuid: problemData.requested_for_uuid || problemData.writer_uuid,
        writer_uuid: problemData.writer_uuid
    };
    
    // Définir les champs d'assignation pour un problème
    const assignmentFields = {
        assigned_to_group: problemData.assigned_to_group,
        assigned_to_person: problemData.assigned_to_person
    };
    
    // Définir les attributs étendus pour un problème
    const extendedAttributesFields = {};
    
    // Liste des champs spécifiques aux problèmes
    const problemExtendedFields = [
        'rel_problem_categories_code', 'rel_service', 'rel_service_offerings',
        'impact', 'urgency', 'symptoms_description', 'workaround',
        'root_cause', 'definitive_solution', 'target_resolution_date',
        'actual_resolution_date', 'actual_resolution_workload', 'closure_justification',
        'pbm_closed_at'
    ];
    
    // Ajouter chaque champ présent dans problemData aux attributs étendus
    problemExtendedFields.forEach(field => {
        if (problemData[field] !== undefined) {
            extendedAttributesFields[field] = problemData[field];
        }
    });
    
    // Gérer la liste des observateurs (watchers)
    const watchList = problemData.watch_list && Array.isArray(problemData.watch_list) ? 
        problemData.watch_list : [];
    
    if (watchList.length > 0) {
        logger.info(`[PROBLEM SERVICE] Processing ${watchList.length} watchers for problem creation`);
    }
    
    logger.info('[PROBLEM SERVICE] Successfully prepared data for problem creation');
    
    // Préparer les relations parent-enfant
    const parentChildRelations = [];
    
    // Gérer la liste des erreurs connues (knownerrors_list)
    if (problemData.knownerrors_list && Array.isArray(problemData.knownerrors_list) && problemData.knownerrors_list.length > 0) {
        problemData.knownerrors_list.forEach(knownErrorUuid => {
            parentChildRelations.push({
                childUuid: knownErrorUuid,
                dependencyCode: 'KNOWNERROR'
            });
        });
        logger.info(`[PROBLEM SERVICE] Prepared ${problemData.knownerrors_list.length} known error relations`);
    }
    
    // Gérer la liste des changements (changes_list)
    if (problemData.changes_list && Array.isArray(problemData.changes_list) && problemData.changes_list.length > 0) {
        problemData.changes_list.forEach(changeUuid => {
            parentChildRelations.push({
                childUuid: changeUuid,
                dependencyCode: 'CHANGE'
            });
        });
        logger.info(`[PROBLEM SERVICE] Prepared ${problemData.changes_list.length} change relations`);
    }
    
    // Gérer la liste des incidents (incidents_list)
    if (problemData.incidents_list && Array.isArray(problemData.incidents_list) && problemData.incidents_list.length > 0) {
        problemData.incidents_list.forEach(incidentUuid => {
            parentChildRelations.push({
                childUuid: incidentUuid,
                dependencyCode: 'INCIDENT'
            });
        });
        logger.info(`[PROBLEM SERVICE] Prepared ${problemData.incidents_list.length} incident relations`);
    }
    
    // Appeler applyCreation pour créer effectivement le ticket
    const { applyCreation } = require('./service');
    
    return await applyCreation(
        problemData,
        'PROBLEM',
        standardFields,
        assignmentFields,
        extendedAttributesFields,
        watchList,
        parentChildRelations,
        getProblemById,
        '[PROBLEM SERVICE]'
    );
};

/**
 * Met à jour partiellement un problème par son UUID
 * @param {string} uuid - UUID du problème à mettre à jour
 * @param {Object} updateData - Données à mettre à jour
 * @returns {Promise<Object>} - Détails du problème mis à jour
 */
const updateProblem = async (uuid, updateData) => {
    // Définir les champs spécifiques aux problèmes
    const standardFields = [
        'title', 'description', 'configuration_item_uuid',
        'ticket_status_code', 'requested_by_uuid', 'requested_for_uuid',
        'closed_at'
    ];
    
    const assignmentFields = [
        'assigned_to_group', 'assigned_to_person'
    ];
    
    const extendedAttributesFields = [
        'rel_problem_categories_code', 'rel_service', 'rel_service_offerings',
        'impact', 'urgency', 'symptoms_description', 'workaround',
        'root_cause', 'definitive_solution', 'target_resolution_date',
        'actual_resolution_date', 'actual_resolution_workload', 'closure_justification'
    ];
    
    // Utiliser la fonction applyUpdate du service.js
    const { applyUpdate } = require('./service');
    return await applyUpdate(
        uuid,
        updateData,
        'PROBLEM',
        standardFields,
        assignmentFields,
        extendedAttributesFields,
        getProblemById,
        '[PROBLEM SERVICE]'
    );
};

module.exports = {
    getProblemById,
    getProblems,
    createProblem,
    updateProblem
};
