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
 * Crée une nouvelle tâche
 * @param {Object} taskData - Données de la tâche à créer
 * @returns {Promise<Object>} - Détails de la tâche créée
 */
const createTask = async (taskData) => {
    logger.info('[TASK SERVICE] Preparing data for task creation');
    
    try {
        // Définir les champs standards pour une tâche
        const standardFields = {
            title: taskData.title,
            description: taskData.description,
            configuration_item_uuid: taskData.configuration_item_uuid,
            ticket_type_code: 'TASK',
            ticket_status_code: taskData.ticket_status_code || 'NEW',
            requested_by_uuid: taskData.requested_by_uuid,
            requested_for_uuid: taskData.requested_for_uuid,
            writer_uuid: taskData.writer_uuid
        };
        
        // Définir les champs d'assignation pour une tâche
        const assignmentFields = {
            assigned_to_group: taskData.assigned_to_group,
            assigned_to_person: taskData.assigned_to_person
        };
        
        // Les tâches n'ont pas d'attributs étendus spécifiques définis
        const extendedAttributesFields = {};
        
        // Gérer la liste des observateurs (watchers)
        const watchList = taskData.watch_list && Array.isArray(taskData.watch_list) ? 
            taskData.watch_list : [];
        
        if (watchList.length > 0) {
            logger.info(`[TASK SERVICE] Processing ${watchList.length} watchers for task creation`);
        }
        
        // Relations parent-enfant (les tâches n'ont généralement pas de relations spécifiques)
        const parentChildRelations = [];
        
        // Appeler applyCreation pour créer effectivement le ticket
        const { applyCreation } = require('./service');
        
        return await applyCreation(
            taskData,
            'TASK',
            standardFields,
            assignmentFields,
            extendedAttributesFields,
            watchList,
            parentChildRelations,
            getTaskById,
            '[TASK SERVICE]'
        );
    } catch (error) {
        logger.error('[TASK SERVICE] Error creating task:', error);
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
    // Définir les champs spécifiques aux tâches
    const standardFields = [
        'title', 'description', 'configuration_item_uuid',
        'ticket_status_code', 'requested_by_uuid', 'requested_for_uuid',
        'core_extended_attributes', 'user_extended_attributes'
    ];
    
    const assignmentFields = [
        'assigned_to_group', 'assigned_to_person'
    ];
    
    // Les tâches n'ont pas d'attributs étendus spécifiques définis comme les incidents et problèmes
    const extendedAttributesFields = [];
    
    // Utiliser la fonction applyUpdate du service.js
    const { applyUpdate } = require('./service');
    return await applyUpdate(
        uuid,
        updateData,
        'TASK',
        standardFields,
        assignmentFields,
        extendedAttributesFields,
        getTaskById,
        '[TASK SERVICE]'
    );
};

module.exports = {
    getTaskById,
    getTasks,
    createTask,
    updateTask
};
