const db = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Récupère une tâche par son UUID
 * @param {string} uuid - UUID de la tâche
 * @param {string} lang - Code de langue pour les traductions (fr, en, etc.)
 * @returns {Promise<Object>} - Détails de la tâche
 */
const getTaskById = async (uuid, lang = 'en') => {
    logger.info(`[TASK SERVICE] Fetching task with UUID: ${uuid} and language: ${lang}`);
    
    try {
        // Requête SQL pour récupérer les détails du ticket avec les données d'assignation
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
                ) as watch_list
                
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
            
            WHERE t.uuid = $1 AND t.ticket_type_code = 'TASK'
        `;
        
        const result = await db.query(query, [uuid, lang]);
        
        if (result.rows.length === 0) {
            logger.warn(`[TASK SERVICE] No task found with UUID: ${uuid}`);
            return null;
        }
        
        logger.info(`[TASK SERVICE] Successfully retrieved task with UUID: ${uuid}`);
        return result.rows[0];
    } catch (error) {
        logger.error(`[TASK SERVICE] Error fetching task with UUID ${uuid}:`, error);
        throw error;
    }
};

/**
 * Récupère toutes les tâches
 * @param {string} lang - Code de langue pour les traductions (fr, en, etc.)
 * @returns {Promise<Array>} - Liste des tâches
 */
const getTasks = async (lang = 'en') => {
    logger.info(`[TASK SERVICE] Fetching all tasks with language: ${lang}`);
    
    try {
        // Requête SQL pour récupérer tous les tickets de type TASK
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
                g.group_name as assigned_group_name,
                g.uuid as assigned_group_uuid,
                p4.first_name || ' ' || p4.last_name as assigned_person_name,
                p4.uuid as assigned_person_uuid
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
                WHERE type = 'ASSIGNED' AND (ended_at IS NULL OR ended_at > NOW())
            ) rtgp ON t.uuid = rtgp.rel_ticket
            LEFT JOIN configuration.groups g ON rtgp.rel_assigned_to_group = g.uuid
            LEFT JOIN configuration.persons p4 ON rtgp.rel_assigned_to_person = p4.uuid
            WHERE t.ticket_type_code = 'TASK'
        `;
        
        const result = await db.query(query, [lang]);
        
        logger.info(`[TASK SERVICE] Successfully retrieved ${result.rows.length} tasks`);
        return result.rows;
    } catch (error) {
        logger.error('[TASK SERVICE] Error fetching tasks:', error);
        throw error;
    }
};

/**
 * Met à jour partiellement une tâche par son UUID
 * @param {string} uuid - UUID de la tâche à mettre à jour
 * @param {Object} updateData - Données à mettre à jour
 * @returns {Promise<Object>} - Détails de la tâche mise à jour
 */
const updateTask = async (uuid, updateData) => {
    try {
        // Vérifier si la tâche existe
        const checkQuery = `
            SELECT uuid FROM core.tickets 
            WHERE uuid = $1 AND ticket_type_code = 'TASK'
        `;
        const checkResult = await db.query(checkQuery, [uuid]);
        
        if (checkResult.rows.length === 0) {
            logger.error(`[TASK SERVICE] No task found with UUID: ${uuid}`);
            return null;
        }
        
        // Séparer les champs standards des champs d'assignation
        const standardFields = [
            'title', 'description', 'configuration_item_uuid',
            'ticket_status_code', 'requested_by_uuid', 'requested_for_uuid',
            'core_extended_attributes', 'user_extended_attributes'
        ];
        
        const assignmentFields = [
            'assigned_to_group', 'assigned_to_person'
        ];
        
        // Filtrer les champs standards à mettre à jour
        const standardFieldsToUpdate = Object.keys(updateData).filter(field => 
            standardFields.includes(field)
        );
        
        // Filtrer les champs d'assignation à mettre à jour
        const assignmentFieldsToUpdate = Object.keys(updateData).filter(field => 
            assignmentFields.includes(field)
        );
        
        // Vérifier s'il y a des champs à mettre à jour
        if (standardFieldsToUpdate.length === 0 && assignmentFieldsToUpdate.length === 0) {
            logger.warn(`[TASK SERVICE] No valid fields to update for task with UUID: ${uuid}`);
            return await getTaskById(uuid, 'en'); // Retourner la tâche sans modifications
        }
        
        // Ajouter des logs pour voir les champs à mettre à jour
        logger.info(`[TASK SERVICE] Updating task with UUID: ${uuid}`);
        logger.info(`[TASK SERVICE] Standard fields to update: ${JSON.stringify(standardFieldsToUpdate)}`);
        logger.info(`[TASK SERVICE] Assignment fields to update: ${JSON.stringify(assignmentFieldsToUpdate)}`);
        
        // Utiliser une transaction pour garantir l'intégrité des données
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');
            
            let updatedTask = null;
            
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
                
                logger.info(`[TASK SERVICE] Executing standard fields update query for task with UUID: ${uuid}`);
                const result = await client.query(updateQuery, values);
                
                if (result.rows.length === 0) {
                    logger.error(`[TASK SERVICE] Failed to update standard fields for task with UUID: ${uuid}`);
                    throw new Error('Failed to update standard fields');
                }
                
                updatedTask = result.rows[0];
                logger.info(`[TASK SERVICE] Successfully updated standard fields for task with UUID: ${uuid}`);
            }
            
            // Cas 2: Mise à jour des champs d'assignation
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
                        
                        logger.info(`[TASK SERVICE] Updated person assignment for task with UUID: ${uuid}`);
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
                        
                        logger.info(`[TASK SERVICE] Created new person-only assignment for task with UUID: ${uuid}`);
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
                    logger.info(`[TASK SERVICE] Ended previous assignment for task with UUID: ${uuid}`);
                    
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
                        
                        logger.info(`[TASK SERVICE] Created new assignment for task with UUID: ${uuid}`);
                    }
                }
            }
            
            await client.query('COMMIT');
            logger.info(`[TASK SERVICE] Transaction committed for task update with UUID: ${uuid}`);
            
            // Récupérer la tâche mise à jour avec toutes ses informations
            return await getTaskById(uuid, 'en');
            
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error(`[TASK SERVICE] Transaction rolled back for task update with UUID: ${uuid}:`, error);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        logger.error(`[TASK SERVICE] Error updating task with UUID ${uuid}:`, error);
        throw error;
    }
};

module.exports = {
    getTaskById,
    getTasks,
    updateTask
};
