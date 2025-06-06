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
                    AND ke.ticket_type_code = 'KNOWNERROR'
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
                    AND ch.ticket_type_code = 'CHANGE'
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
                    AND inc.ticket_type_code = 'INCIDENT'
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

/**
 * Met à jour partiellement un problème par son UUID
 * @param {string} uuid - UUID du problème à mettre à jour
 * @param {Object} updateData - Données à mettre à jour
 * @returns {Promise<Object>} - Détails du problème mis à jour
 */
const updateProblem = async (uuid, updateData) => {
    try {
        // Vérifier si le problème existe
        const checkQuery = `
            SELECT uuid FROM core.tickets 
            WHERE uuid = $1 AND ticket_type_code = 'PROBLEM'
        `;
        const checkResult = await db.query(checkQuery, [uuid]);
        
        if (checkResult.rows.length === 0) {
            logger.error(`[PROBLEM SERVICE] No problem found with UUID: ${uuid}`);
            return null;
        }
        
        // Séparer les champs standards des champs d'assignation et des attributs étendus spécifiques aux problèmes
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
            'knownerrors_list', 'changes_list', 'incidents_list',
            'root_cause', 'definitive_solution', 'target_resolution_date',
            'actual_resolution_date', 'actual_resolution_workload', 'closure_justification'
        ];
        
        // Filtrer les champs standards à mettre à jour
        const standardFieldsToUpdate = Object.keys(updateData).filter(field => 
            standardFields.includes(field)
        );
        
        // Filtrer les champs d'assignation à mettre à jour
        const assignmentFieldsToUpdate = Object.keys(updateData).filter(field => 
            assignmentFields.includes(field)
        );
        
        // Filtrer les attributs étendus à mettre à jour
        const extendedAttributesToUpdate = Object.keys(updateData).filter(field => 
            extendedAttributesFields.includes(field)
        );
        
        // Vérifier s'il y a des champs à mettre à jour
        if (standardFieldsToUpdate.length === 0 && assignmentFieldsToUpdate.length === 0 && extendedAttributesToUpdate.length === 0) {
            logger.warn(`[PROBLEM SERVICE] No valid fields to update for problem with UUID: ${uuid}`);
            return await getProblemById(uuid, 'en'); // Retourner le problème sans modifications
        }
        
        // Ajouter des logs pour voir les champs à mettre à jour
        logger.info(`[PROBLEM SERVICE] Updating problem with UUID: ${uuid}`);
        logger.info(`[PROBLEM SERVICE] Standard fields to update: ${JSON.stringify(standardFieldsToUpdate)}`);
        logger.info(`[PROBLEM SERVICE] Assignment fields to update: ${JSON.stringify(assignmentFieldsToUpdate)}`);
        logger.info(`[PROBLEM SERVICE] Extended attributes to update: ${JSON.stringify(extendedAttributesToUpdate)}`);
        
        // Utiliser une transaction pour garantir l'intégrité des données
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');
            
            let updatedProblem = null;
            
            // Cas 1: Mise à jour des champs standards
            if (standardFieldsToUpdate.length > 0) {
                let setClause = standardFieldsToUpdate.map((field, index) => 
                    `${field} = $${index + 2}`
                ).join(', ');
                
                // Ajouter la mise à jour de updated_at
                setClause += ', updated_at = CURRENT_TIMESTAMP';
                
                const updateQuery = `
                    UPDATE core.tickets
                    SET ${setClause}
                    WHERE uuid = $1
                    RETURNING *
                `;
                
                // Préparer les valeurs pour la requête
                const values = [uuid];
                standardFieldsToUpdate.forEach(field => {
                    values.push(updateData[field]);
                });
                
                logger.info(`[PROBLEM SERVICE] Executing standard fields update query for problem with UUID: ${uuid}`);
                const result = await client.query(updateQuery, values);
                
                if (result.rows.length === 0) {
                    logger.error(`[PROBLEM SERVICE] Failed to update standard fields for problem with UUID: ${uuid}`);
                    throw new Error('Failed to update standard fields');
                }
                
                updatedProblem = result.rows[0];
                logger.info(`[PROBLEM SERVICE] Successfully updated standard fields for problem with UUID: ${uuid}`);
            }
            
            // Cas 2: Mise à jour des attributs étendus
            if (extendedAttributesToUpdate.length > 0) {
                // Approche optimisée : utiliser jsonb_set pour mettre à jour chaque attribut individuellement
                let setClause = 'core_extended_attributes = ';
                let params = [uuid]; // Premier paramètre est toujours l'UUID
                let paramIndex = 2;
                
                // Construire une chaîne de jsonb_set imbriqués pour mettre à jour tous les attributs en une seule requête
                extendedAttributesToUpdate.forEach((attr, index) => {
                    // Premier attribut : initialiser avec COALESCE pour gérer le cas où core_extended_attributes est NULL
                    if (index === 0) {
                        setClause += `jsonb_set(
                            COALESCE(core_extended_attributes, '{}'::jsonb),
                            '{${attr}}',
                            $${paramIndex}::jsonb,
                            true
                        )`;
                    } else {
                        // Pour les attributs suivants, imbriquer les appels jsonb_set
                        setClause = `jsonb_set(
                            ${setClause},
                            '{${attr}}',
                            $${paramIndex}::jsonb,
                            true
                        )`;
                    }
                    
                    // Ajouter la valeur du paramètre
                    params.push(JSON.stringify(updateData[attr]));
                    paramIndex++;
                });
                
                // Construire la requête SQL complète
                const updateExtendedQuery = `
                    UPDATE core.tickets
                    SET ${setClause},
                        updated_at = CURRENT_TIMESTAMP
                    WHERE uuid = $1
                    RETURNING *
                `;
                
                logger.info(`[PROBLEM SERVICE] Executing optimized extended attributes update query for problem with UUID: ${uuid}`);
                const result = await client.query(updateExtendedQuery, params);
                
                if (result.rows.length === 0) {
                    logger.error(`[PROBLEM SERVICE] Failed to update extended attributes for problem with UUID: ${uuid}`);
                    throw new Error('Failed to update extended attributes');
                }
                
                updatedProblem = result.rows[0];
                logger.info(`[PROBLEM SERVICE] Successfully updated extended attributes for problem with UUID: ${uuid}`);
            }
            
            // Cas 3: Mise à jour des champs d'assignation
            if (assignmentFieldsToUpdate.length > 0) {
                // Déterminer le type de mise à jour
                const isUpdatingGroup = assignmentFieldsToUpdate.includes('assigned_to_group');
                const isUpdatingPerson = assignmentFieldsToUpdate.includes('assigned_to_person');
                
                // Cas C: Si on met à jour uniquement rel_assigned_to_person
                if (isUpdatingPerson && !isUpdatingGroup) {
                    // Récupérer l'assignation courante
                    const getCurrentAssignmentQuery = `
                        SELECT uuid, rel_assigned_to_group
                        FROM core.rel_tickets_groups_persons
                        WHERE rel_ticket = $1 
                          AND type = 'ASSIGNED'
                          AND ended_at IS NULL
                        LIMIT 1
                    `;
                    
                    const currentAssignment = await client.query(getCurrentAssignmentQuery, [uuid]);
                    
                    if (currentAssignment.rows.length > 0) {
                        // Mettre à jour l'assignation existante avec la nouvelle personne
                        const updateAssignmentQuery = `
                            UPDATE core.rel_tickets_groups_persons
                            SET rel_assigned_to_person = $2
                            WHERE uuid = $1
                        `;
                        
                        await client.query(updateAssignmentQuery, [
                            currentAssignment.rows[0].uuid,
                            updateData.assigned_to_person || null
                        ]);
                        
                        logger.info(`[PROBLEM SERVICE] Updated person assignment for problem with UUID: ${uuid}`);
                    } else {
                        // Aucune assignation courante, créer une nouvelle assignation avec seulement la personne
                        const newAssignmentQuery = `
                            INSERT INTO core.rel_tickets_groups_persons (
                                rel_ticket,
                                rel_assigned_to_group,
                                rel_assigned_to_person,
                                type
                            ) VALUES ($1, NULL, $2, 'ASSIGNED')
                        `;
                        
                        await client.query(newAssignmentQuery, [
                            uuid,
                            updateData.assigned_to_person || null
                        ]);
                        
                        logger.info(`[PROBLEM SERVICE] Created new person-only assignment for problem with UUID: ${uuid}`);
                    }
                } else {
                    // Cas A et B: Mise à jour du groupe (avec ou sans personne)
                    // 1. Mettre fin à l'assignation précédente
                    const endAssignmentQuery = `
                        UPDATE core.rel_tickets_groups_persons
                        SET ended_at = CURRENT_TIMESTAMP
                        WHERE rel_ticket = $1 
                          AND type = 'ASSIGNED'
                          AND ended_at IS NULL
                    `;
                    
                    await client.query(endAssignmentQuery, [uuid]);
                    logger.info(`[PROBLEM SERVICE] Ended previous assignment for problem with UUID: ${uuid}`);
                    
                    // 2. Créer une nouvelle assignation si des valeurs sont fournies
                    if (updateData.assigned_to_group || updateData.assigned_to_person) {
                        const newAssignmentQuery = `
                            INSERT INTO core.rel_tickets_groups_persons (
                                rel_ticket,
                                rel_assigned_to_group,
                                rel_assigned_to_person,
                                type
                            ) VALUES ($1, $2, $3, 'ASSIGNED')
                        `;
                        
                        await client.query(newAssignmentQuery, [
                            uuid,
                            updateData.assigned_to_group || null,
                            updateData.assigned_to_person || null
                        ]);
                        
                        logger.info(`[PROBLEM SERVICE] Created new assignment for problem with UUID: ${uuid}`);
                    }
                }
                
                // Mettre à jour le compteur d'assignations si nécessaire
                if (isUpdatingGroup) {
                    // Récupérer le compteur actuel
                    const getCurrentCountQuery = `
                        SELECT core_extended_attributes->>'assignment_count' as assignment_count
                        FROM core.tickets
                        WHERE uuid = $1
                    `;
                    
                    const currentCount = await client.query(getCurrentCountQuery, [uuid]);
                    let assignmentCount = 1; // Valeur par défaut si non défini
                    
                    if (currentCount.rows.length > 0 && currentCount.rows[0].assignment_count) {
                        assignmentCount = parseInt(currentCount.rows[0].assignment_count) + 1;
                    }
                    
                    // Mettre à jour le compteur
                    const updateCountQuery = `
                        UPDATE core.tickets
                        SET core_extended_attributes = jsonb_set(
                            core_extended_attributes,
                            '{assignment_count}',
                            to_jsonb($2::integer),
                            true
                        )
                        WHERE uuid = $1
                    `;
                    
                    await client.query(updateCountQuery, [uuid, assignmentCount]);
                    logger.info(`[PROBLEM SERVICE] Updated assignment count to ${assignmentCount} for problem with UUID: ${uuid}`);
                }
            }
            
            await client.query('COMMIT');
            logger.info(`[PROBLEM SERVICE] Transaction committed for problem update with UUID: ${uuid}`);
            
            // Récupérer le problème mis à jour avec toutes ses informations
            return await getProblemById(uuid, 'en');
            
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error(`[PROBLEM SERVICE] Transaction rolled back for problem update with UUID: ${uuid}:`, error);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        logger.error(`[PROBLEM SERVICE] Error updating problem with UUID ${uuid}:`, error);
        throw error;
    }
};

module.exports = {
    getProblemById,
    getProblems,
    updateProblem
};
