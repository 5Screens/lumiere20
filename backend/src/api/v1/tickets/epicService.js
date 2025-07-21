const db = require('../../../config/database');
const logger = require('../../../config/logger');
const ticketService = require('./service');
const { addChildrenTickets, removeChildTicket } = require('./service');

/**
 * Récupère un epic par son UUID
 * @param {string} uuid - UUID de l'epic
 * @param {string} lang - Code de langue pour les traductions (fr, en, etc.)
 * @returns {Promise<Object>} - Détails de l'epic
 */
const getEpicById = async (uuid, lang = 'en') => {
    logger.info(`[EPIC SERVICE] Fetching epic with UUID: ${uuid} and language: ${lang}`);
    
    try {
        // Requête SQL pour récupérer les détails de l'epic avec les données d'assignation
        const query = `
            SELECT 
                t.uuid,
                t.title,
                t.description,
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
                
                -- Champs spécifiques aux epics depuis core_extended_attributes
                t.core_extended_attributes->'tags' as tags,
                t.core_extended_attributes->>'color' as color,
                t.core_extended_attributes->>'end_date' as end_date,
                t.core_extended_attributes->>'start_date' as start_date,
                t.core_extended_attributes->>'progress_percent' as progress_percent,
                
                -- Récupération du titre et de l'UUID du projet parent
                (
                    SELECT parent.title
                    FROM core.rel_parent_child_tickets rpc
                    JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid
                    WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'EPIC' AND parent.ticket_type_code = 'PROJECT' AND rpc.ended_at IS NULL
                    LIMIT 1
                ) as project_name,
                (
                    SELECT parent.uuid
                    FROM core.rel_parent_child_tickets rpc
                    JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid
                    WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'EPIC' AND parent.ticket_type_code = 'PROJECT' AND rpc.ended_at IS NULL
                    LIMIT 1
                ) as project_id,
                
                -- Nombre de user stories enfants
                (
                    SELECT COUNT(*)
                    FROM core.rel_parent_child_tickets rpc
                    WHERE rpc.rel_parent_ticket_uuid = t.uuid 
                      AND rpc.dependency_code = 'STORY' 
                      AND rpc.ended_at IS NULL
                ) as stories_count,
                
                -- Nombre de tâches enfants
                (
                    SELECT COUNT(*)
                    FROM core.rel_parent_child_tickets rpc
                    WHERE rpc.rel_parent_ticket_uuid = t.uuid 
                      AND rpc.dependency_code = 'TASK' 
                      AND rpc.ended_at IS NULL
                ) as tasks_count,
                
                -- Nombre de pièces jointes
                (
                    SELECT COUNT(*)
                    FROM core.attachments a
                    WHERE a.object_uuid = t.uuid
                ) as attachments_count
                
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
            
            WHERE t.uuid = $1 AND t.ticket_type_code = 'EPIC'
        `;
        
        const result = await db.query(query, [uuid, lang]);
        
        if (result.rows.length === 0) {
            logger.warn(`[EPIC SERVICE] No epic found with UUID: ${uuid}`);
            return null;
        }
        
        // Transformer les tags de format JSON string en tableau d'objets
        const epic = result.rows[0];
/*        if (epic.tags) {
            try {
                // Parse la chaîne JSON des tags
                const parsedTags = JSON.parse(epic.tags);
                // Transformer chaque tag en objet avec propriété name
                epic.tags = parsedTags.map(tag => ({ name: tag }));
            } catch (err) {
                logger.warn(`[EPIC SERVICE] Error parsing tags for epic ${uuid}:`, err);
                // En cas d'erreur, initialiser avec un tableau vide
                epic.tags = [];
            }
        } else {
            epic.tags = [];
        }
  */      
        logger.info(`[EPIC SERVICE] Successfully retrieved epic with UUID: ${uuid}`);
        return epic;
    } catch (error) {
        logger.error(`[EPIC SERVICE] Error fetching epic with UUID ${uuid}:`, error);
        throw error;
    }
};

/**
 * Récupère les epics avec les attributs étendus spécifiques aux epics
 * @param {string} lang - Code de langue pour les traductions
 * @returns {Promise<Array>} - Liste des epics avec leurs attributs
 */
const getEpics = async (lang) => {
    const servicePrefix = '[EPIC SERVICE]';
    
    // Définition des attributs spécifiques aux epics
    const baseQuery = `
        -- Extraction des attributs spécifiques aux epics depuis le JSONB
        t.core_extended_attributes->'tags' as tags,
        t.core_extended_attributes->>'color' as color,
        t.core_extended_attributes->>'end_date' as end_date,
        t.core_extended_attributes->>'start_date' as start_date,
        t.core_extended_attributes->>'progress_percent' as progress_percent,
        
        -- Nombre de user stories enfants
        (
            SELECT COUNT(*)
            FROM core.rel_parent_child_tickets rpc
            WHERE rpc.rel_parent_ticket_uuid = t.uuid 
              AND rpc.dependency_code = 'STORY' 
              AND rpc.ended_at IS NULL
        ) as stories_count,
        
        -- Nombre de tâches enfants
        (
            SELECT COUNT(*)
            FROM core.rel_parent_child_tickets rpc
            WHERE rpc.rel_parent_ticket_uuid = t.uuid 
              AND rpc.dependency_code = 'TASK' 
              AND rpc.ended_at IS NULL
        ) as tasks_count,
        
        -- Récupération du titre du projet parent
        (
            SELECT parent.title
            FROM core.rel_parent_child_tickets rpc
            JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid
            WHERE rpc.rel_child_ticket_uuid = t.uuid 
              AND rpc.dependency_code = 'EPIC' 
              AND parent.ticket_type_code = 'PROJECT'
              AND rpc.ended_at IS NULL
            LIMIT 1
        ) as project_title,
        
        -- Nombre de pièces jointes
        (
            SELECT COUNT(*)
            FROM core.attachments a
            WHERE a.object_uuid = t.uuid
        ) as attachments_count,
        
        -- Nombre de tickets liés
        (
            SELECT COUNT(*)
            FROM core.rel_parent_child_tickets rpc
            WHERE rpc.rel_parent_ticket_uuid = t.uuid
        ) as tieds_tickets_count
    `;
    
    // Définition des jointures spécifiques aux epics
    const additionalJoins = ``;
    
    // Utilisation de la fonction getTickets factorisée
    return ticketService.getTickets(lang, 'EPIC', baseQuery, additionalJoins, [], servicePrefix);
};

/**
 * Updates the parent project relation for an epic
 * @param {string} uuid - UUID of the epic
 * @param {Object} updateData - Data containing project_id
 * @returns {Promise<void>}
 */
const updateParentProject = async (uuid, updateData) => {
    const projectId = updateData.project_id;
    
    // Handle project relation if present
    if (projectId !== undefined) {
        logger.info(`[EPIC SERVICE] Updating project relation for epic ${uuid}`);
        
        try {
            // 1. Récupérer d'abord les relations existantes pour ce type de dépendance
            const existingRelations = await db.query(
                `SELECT rel_parent_ticket_uuid FROM core.rel_parent_child_tickets 
                 WHERE rel_child_ticket_uuid = $1 AND dependency_code = $2 AND ended_at IS NULL`,
                [uuid, 'EPIC']
            );
            
            // Logs pour débogage
            logger.info(`[EPIC SERVICE] Found ${existingRelations.rowCount} existing project relations for epic ${uuid}`);
            logger.info(`[EPIC SERVICE] Existing project relations: ${JSON.stringify(existingRelations.rows)}`);
            
            // 2. Supprimer chaque relation existante
            for (const row of existingRelations.rows) {
                await removeChildTicket(row.rel_parent_ticket_uuid, uuid);
                logger.info(`[EPIC SERVICE] Removed project relation: ${row.rel_parent_ticket_uuid} -> ${uuid}`);
            }
            
            // 3. Ajouter la nouvelle relation si elle existe
            if (projectId) {
                await addChildrenTickets(projectId, 'EPIC', [uuid]);
                logger.info(`[EPIC SERVICE] Added new project relation: ${projectId} -> ${uuid}`);
            } else {
                logger.info(`[EPIC SERVICE] No new project relation to add for epic ${uuid}`);
            }
        } catch (error) {
            logger.error(`[EPIC SERVICE] Error managing project relation for epic ${uuid}:`, error);
        }
    }
};

/**
 * Updates an epic partially by its UUID
 * @param {string} uuid - UUID of the epic to update
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated epic details
 */
const updateEpic = async (uuid, updateData) => {
    // Define epic-specific fields
    const standardFields = [
        'title', 'description', 'ticket_status_code',
        'ticket_type_code', 'requested_for_uuid', 'requested_by_uuid'
    ];
    
    const assignmentFields = [
        'rel_assigned_to_group', 'rel_assigned_to_person'
    ];
    
    const extendedAttributesFields = [
        'tags', 'color', 'end_date', 'start_date', 'progress_percent'
    ];
    
    // Use functions from service.js
    const { applyUpdate } = require('./service');
    
    // Update standard fields, assignment fields and extended attributes
    const updatedEpic = await applyUpdate(
        uuid,
        updateData,
        'EPIC',
        standardFields,
        assignmentFields,
        extendedAttributesFields,
        getEpicById,
        '[EPIC SERVICE]'
    );
    
    // Handle project relation if present
    await updateParentProject(uuid, updateData);
    return updatedEpic;
};

/**
 * Crée un nouvel epic
 * @param {Object} epicData - Données pour la création de l'epic
 * @returns {Promise<Object>} - Détails de l'epic créé
 */
const createEpic = async (epicData) => {
    logger.info('[EPIC SERVICE] Creating new epic');
    
    // Définir les champs standards pour un epic
    const standardFields = {
        title: epicData.title,
        description: epicData.description,
        configuration_item_uuid: epicData.configuration_item_uuid,
        ticket_type_code: 'EPIC',
        ticket_status_code: epicData.ticket_status_code || 'NEW',
        // Pour les epics, requested_by_uuid = requested_for_uuid = le uuid du rédacteur
        requested_by_uuid: epicData.writer_uuid,
        requested_for_uuid: epicData.writer_uuid,
        writer_uuid: epicData.writer_uuid
    };
    
    // Définir les champs d'assignation pour un epic
    const assignmentFields = {
        assigned_to_group: epicData.assigned_to_group || epicData.rel_assigned_to_group,
        assigned_to_person: epicData.assigned_to_person || epicData.rel_assigned_to_person || null
    };
    
    // Définir les attributs étendus pour un epic
    const extendedAttributesFields = {};
    
    // Champs à inclure dans core_extended_attributes pour les epics
    // project_id n'est pas inclus dans les attributs étendus pour les epics
    const epicFields = [
        'start_date', 'end_date', 'progress_percent',
        'color', 'tags'
    ];
    
    // Ajouter chaque champ présent dans epicData aux attributs étendus
    epicFields.forEach(field => {
        if (epicData[field] !== undefined) {
            extendedAttributesFields[field] = epicData[field];
        }
    });
    
    // Gérer la liste des observateurs (watchers)
    const watchList = epicData.watch_list && Array.isArray(epicData.watch_list) ? 
        epicData.watch_list : [];
    
    // Logique de relations parent-enfant pour les epics
    const parentChildRelations = [];
    
    // 6. Handle parent-child relationship for PROJECT > EPIC
    if (epicData.project_id) {
        parentChildRelations.push({
            parentUuid: epicData.project_id,
            dependencyCode: 'EPIC'
        });
        logger.info(`[EPIC SERVICE] Prepared EPIC relationship with PROJECT: ${epicData.project_id}`);
    }
    
    logger.info('[EPIC SERVICE] Successfully prepared data for epic creation');
    
    // Appeler applyCreation pour créer effectivement le ticket
    const { applyCreation } = require('./service');
    
    return await applyCreation(
        epicData,
        'EPIC',
        standardFields,
        assignmentFields,
        extendedAttributesFields,
        watchList,
        parentChildRelations,
        getEpicById,
        '[EPIC SERVICE]'
    );
};

module.exports = {
    getEpicById,
    getEpics,
    updateEpic
};
