const db = require('../../../config/database');
const logger = require('../../../config/logger');
const ticketService = require('./service');

/**
 * Récupère un sprint par son UUID
 * @param {string} uuid - UUID du sprint
 * @param {string} lang - Code de langue pour les traductions (fr, en, etc.)
 * @returns {Promise<Object>} - Détails du sprint
 */
const getSprintById = async (uuid, lang = 'en') => {
    logger.info(`[SPRINT SERVICE] Fetching sprint with UUID: ${uuid} and language: ${lang}`);
    
    try {
        // Requête SQL pour récupérer les détails du sprint avec les données d'assignation
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
                -- Extraction des attributs spécifiques aux sprints depuis le JSONB
                t.core_extended_attributes->>'start_date' as start_date,
                t.core_extended_attributes->>'end_date' as end_date,
                t.core_extended_attributes->>'actual_velocity' as actual_velocity,
                t.core_extended_attributes->>'estimated_velocity' as estimated_velocity,
                p1.first_name || ' ' || p1.last_name as requested_by_name,
                p2.first_name || ' ' || p2.last_name as requested_for_name,
                p3.first_name || ' ' || p3.last_name as writer_name,
                COALESCE(ttt.label, tt.code) as ticket_type_label,
                COALESCE(tst.label, ts.code) as ticket_status_label,
                tt.code as ticket_type_code,
                ts.code as ticket_status_code,
                
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
                ) as tieds_tickets_count,
                
                -- Nombre de tickets de type STORY
                (
                    SELECT COUNT(*)
                    FROM core.rel_parent_child_tickets rpc
                    WHERE rpc.rel_parent_ticket_uuid = t.uuid AND rpc.dependency_code = 'STORY'
                ) as stories_count,
                
                -- Nombre de tickets de type TASK
                (
                    SELECT COUNT(*)
                    FROM core.rel_parent_child_tickets rpc
                    WHERE rpc.rel_parent_ticket_uuid = t.uuid AND rpc.dependency_code = 'TASK'
                ) as tasks_count,
                
                -- Récupération du titre et de l'UUID du projet parent
                (
                    SELECT parent.title
                    FROM core.rel_parent_child_tickets rpc
                    JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid
                    WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'SPRINT' AND rpc.ended_at IS NULL
                    LIMIT 1
                ) as project_name,
                (
                    SELECT parent.uuid
                    FROM core.rel_parent_child_tickets rpc
                    JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid
                    WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'SPRINT' AND rpc.ended_at IS NULL
                    LIMIT 1
                ) as project_id
                
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
            
            WHERE t.uuid = $1 AND t.ticket_type_code = 'SPRINT'
        `;
        
        const result = await db.query(query, [uuid, lang]);
        
        if (result.rows.length === 0) {
            logger.warn(`[SPRINT SERVICE] No sprint found with UUID: ${uuid}`);
            return null;
        }
        
        logger.info(`[SPRINT SERVICE] Successfully retrieved sprint with UUID: ${uuid}`);
        return result.rows[0];
    } catch (error) {
        logger.error(`[SPRINT SERVICE] Error fetching sprint with UUID ${uuid}:`, error);
        throw error;
    }
};

/**
 * Récupère les sprints avec les attributs étendus spécifiques aux sprints
 * @param {string} lang - Code de langue pour les traductions
 * @returns {Promise<Array>} - Liste des sprints avec leurs attributs
 */
const getSprints = async (lang) => {
    const servicePrefix = '[SPRINT SERVICE]';
    
    // Définition des attributs spécifiques aux sprints
    const baseQuery = `
        -- Extraction des attributs spécifiques aux sprints depuis le JSONB
        t.core_extended_attributes->>'start_date' as start_date,
        t.core_extended_attributes->>'end_date' as end_date,
        t.core_extended_attributes->>'actual_velocity' as actual_velocity,
        t.core_extended_attributes->>'estimated_velocity' as estimated_velocity,
        
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
        ) as tieds_tickets_count,
        
        -- Nombre de tickets de type STORY
        (
            SELECT COUNT(*)
            FROM core.rel_parent_child_tickets rpc
            WHERE rpc.rel_parent_ticket_uuid = t.uuid AND rpc.dependency_code = 'STORY'
        ) as stories_count,
        
        -- Nombre de tickets de type TASK
        (
            SELECT COUNT(*)
            FROM core.rel_parent_child_tickets rpc
            WHERE rpc.rel_parent_ticket_uuid = t.uuid AND rpc.dependency_code = 'TASK'
        ) as tasks_count,
        
        -- Récupération du titre du projet parent
        (
            SELECT parent.title
            FROM core.rel_parent_child_tickets rpc
            JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid
            WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'SPRINT' AND rpc.ended_at IS NULL
            LIMIT 1
        ) as project_title
    `;
    
    // Définition des jointures spécifiques aux sprints
    const additionalJoins = ``;
    
    // Utilisation de la fonction getTickets factorisée
    return ticketService.getTickets(lang, 'SPRINT', baseQuery, additionalJoins, [], servicePrefix);
};

/**
 * Updates a sprint partially by its UUID
 * @param {string} uuid - UUID of the sprint to update
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated sprint details
 */
const updateSprint = async (uuid, updateData) => {
    // Define sprint-specific fields
    const standardFields = [
        'title', 'description', 'ticket_status_code',
        'ticket_type_code', 'requested_for_uuid', 'requested_by_uuid'
    ];
    
    const assignmentFields = [
        'rel_assigned_to_group', 'rel_assigned_to_person'
    ];
    
    const extendedAttributesFields = [
        'end_date', 'start_date', 'actual_velocity', 'estimated_velocity'
    ];
    
    // Use functions from service.js
    const { applyUpdate, addChildrenTickets, removeChildTicket } = require('./service');
    
    // Extract project ID from updateData
    const projectId = updateData.project_id;
    
    // Update standard fields, assignment fields and extended attributes
    const updatedSprint = await applyUpdate(
        uuid,
        updateData,
        'SPRINT',
        standardFields,
        assignmentFields,
        extendedAttributesFields,
        getSprintById,
        '[SPRINT SERVICE]'
    );
    
    // Handle project relation if present
    if (projectId !== undefined) {
        logger.info(`[SPRINT SERVICE] Updating project relation for sprint ${uuid}`);
        
        try {
            // 1. Récupérer d'abord les relations existantes pour ce type de dépendance
            const existingRelations = await db.query(
                `SELECT rel_parent_ticket_uuid FROM core.rel_parent_child_tickets 
                 WHERE rel_child_ticket_uuid = $1 AND dependency_code = $2 AND ended_at IS NULL`,
                [uuid, 'SPRINT']
            );
            
            // Logs pour débogage
            logger.info(`[SPRINT SERVICE] Found ${existingRelations.rowCount} existing project relations for sprint ${uuid}`);
            logger.info(`[SPRINT SERVICE] Existing project relations: ${JSON.stringify(existingRelations.rows)}`);
            
            // 2. Supprimer chaque relation existante
            for (const row of existingRelations.rows) {
                await removeChildTicket(row.rel_parent_ticket_uuid, uuid);
                logger.info(`[SPRINT SERVICE] Removed project relation: ${row.rel_parent_ticket_uuid} -> ${uuid}`);
            }
            
            // 3. Ajouter la nouvelle relation si elle existe
            if (projectId) {
                await addChildrenTickets(projectId, 'SPRINT', [uuid]);
                logger.info(`[SPRINT SERVICE] Added new project relation: ${projectId} -> ${uuid}`);
            } else {
                logger.info(`[SPRINT SERVICE] No new project relation to add for sprint ${uuid}`);
            }
        } catch (error) {
            logger.error(`[SPRINT SERVICE] Error managing project relation for sprint ${uuid}:`, error);
        }
    }
    
    return updatedSprint;
};

module.exports = {
    getSprintById,
    getSprints,
    updateSprint
};
