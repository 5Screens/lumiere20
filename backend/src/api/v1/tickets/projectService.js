const db = require('../../../config/database');
const logger = require('../../../config/logger');
const ticketService = require('./service');

/**
 * Récupère un projet par son UUID
 * @param {string} uuid - UUID du projet
 * @param {string} lang - Code de langue pour les traductions (fr, en, etc.)
 * @returns {Promise<Object>} - Détails du projet
 */
const getProjectById = async (uuid, lang = 'en') => {
    logger.info(`[PROJECT SERVICE] Fetching project with UUID: ${uuid} and language: ${lang}`);
    
    try {
        // Requête SQL pour récupérer les détails du projet avec les données d'assignation
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
                
                -- Informations sur l'équipe assignée
                g.uuid as assigned_to_group,
                g.group_name as assigned_group_name,
                
                -- Informations sur la personne assignée
                p4.uuid as assigned_to_person,
                p4.first_name || ' ' || p4.last_name as assigned_person_name,
                
                -- Champs spécifiques aux projets depuis core_extended_attributes
                t.core_extended_attributes->>'key' as key,
                t.core_extended_attributes->>'project_type' as project_type,
                t.core_extended_attributes->>'project_priority' as project_priority,
                t.core_extended_attributes->>'project_status' as project_status,
                t.core_extended_attributes->>'start_date' as start_date,
                t.core_extended_attributes->>'end_date' as end_date,
                t.core_extended_attributes->>'budget' as budget,
                t.core_extended_attributes->>'completion_percentage' as completion_percentage,
                t.core_extended_attributes->>'risk_level' as risk_level,
                -- Transformation de issue_type_scheme_id en tableau d'objets avec code et libellé
                (
                    SELECT json_agg(json_build_object(
                        'code', symptoms.symptom_code,
                        'libelle', COALESCE(st.libelle, symptoms.symptom_code)
                    ))
                    FROM (
                        SELECT jsonb_array_elements_text(t.core_extended_attributes->'issue_type_scheme_id') as symptom_code
                    ) as symptoms
                    LEFT JOIN translations.symptoms_translation st ON st.symptom_code = symptoms.symptom_code AND st.langue = $2
                ) as issue_type_scheme_id,
                t.core_extended_attributes->>'visibility' as visibility,
                
                -- Labels traduits pour les champs avec référence
                COALESCE(project_type_t.label, t.core_extended_attributes->>'project_type') as project_type_label,
                COALESCE(project_priority_t.label, t.core_extended_attributes->>'project_priority') as project_priority_label,
                COALESCE(project_status_t.label, t.core_extended_attributes->>'project_status') as project_status_label,
                COALESCE(risk_level_t.label, t.core_extended_attributes->>'risk_level') as risk_level_label,
                COALESCE(visibility_t.label, t.core_extended_attributes->>'visibility') as visibility_label,
                
                -- Comptage des tickets liés au projet
                (
                    SELECT COUNT(*)
                    FROM core.rel_parent_child_tickets rpc
                    WHERE rpc.rel_parent_ticket_uuid = t.uuid 
                    AND rpc.dependency_code = 'DEFECT'
                    AND (rpc.ended_at IS NULL OR rpc.ended_at > NOW())
                ) as defect_count,
                
                (
                    SELECT COUNT(*)
                    FROM core.rel_parent_child_tickets rpc
                    WHERE rpc.rel_parent_ticket_uuid = t.uuid 
                    AND rpc.dependency_code = 'STORY'
                    AND (rpc.ended_at IS NULL OR rpc.ended_at > NOW())
                ) as us_count,
                
                (
                    SELECT COUNT(*)
                    FROM core.rel_parent_child_tickets rpc
                    WHERE rpc.rel_parent_ticket_uuid = t.uuid 
                    AND rpc.dependency_code = 'EPIC'
                    AND (rpc.ended_at IS NULL OR rpc.ended_at > NOW())
                ) as epic_count,
                
                (
                    SELECT COUNT(*)
                    FROM core.rel_parent_child_tickets rpc
                    WHERE rpc.rel_parent_ticket_uuid = t.uuid 
                    AND rpc.dependency_code = 'SPRINT'
                    AND (rpc.ended_at IS NULL OR rpc.ended_at > NOW())
                ) as sprint_count,
                
                -- Informations sur les utilisateurs ayant accès au projet
                (
                    SELECT json_agg(json_build_object(
                        'uuid', w.uuid,
                        'person_uuid', p5.uuid,
                        'person_name', p5.first_name || ' ' || p5.last_name,
                        'created_at', w.created_at
                    ))
                    FROM core.rel_tickets_groups_persons w
                    JOIN configuration.persons p5 ON w.rel_assigned_to_person = p5.uuid
                    WHERE w.rel_ticket = t.uuid AND w.type = 'ACCESS_GRANTED' AND w.rel_assigned_to_group IS NULL AND (w.ended_at IS NULL OR w.ended_at > NOW())
                ) as access_to_users,
                
                -- Informations sur les groupes ayant accès au projet
                (
                    SELECT json_agg(json_build_object(
                        'uuid', w.uuid,
                        'group_uuid', g2.uuid,
                        'group_name', g2.group_name,
                        'created_at', w.created_at
                    ))
                    FROM core.rel_tickets_groups_persons w
                    JOIN configuration.groups g2 ON w.rel_assigned_to_group = g2.uuid
                    WHERE w.rel_ticket = t.uuid AND w.type = 'ACCESS_GRANTED' AND (w.ended_at IS NULL OR w.ended_at > NOW())
                ) as access_to_groups
                
                -- Autres informations spécifiques aux projets peuvent être ajoutées ici
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
            
            -- Jointures pour les traductions des champs spécifiques aux projets
            LEFT JOIN translations.project_setup_label project_type_t ON project_type_t.rel_project_setup_code = t.core_extended_attributes->>'project_type' 
                AND project_type_t.lang = $2
            LEFT JOIN translations.project_setup_label project_priority_t ON project_priority_t.rel_project_setup_code = t.core_extended_attributes->>'project_priority' 
                AND project_priority_t.lang = $2
            LEFT JOIN translations.project_setup_label project_status_t ON project_status_t.rel_project_setup_code = t.core_extended_attributes->>'project_status' 
                AND project_status_t.lang = $2
            LEFT JOIN translations.project_setup_label risk_level_t ON risk_level_t.rel_project_setup_code = t.core_extended_attributes->>'risk_level' 
                AND risk_level_t.lang = $2
            LEFT JOIN translations.project_setup_label visibility_t ON visibility_t.rel_project_setup_code = t.core_extended_attributes->>'visibility' 
                AND visibility_t.lang = $2
                
            -- Pas de jointures supplémentaires pour les départements et sponsors (non présents dans le modèle)
            
            -- Les projets n'ont pas de référence à configuration_item_uuid
            
            WHERE t.uuid = $1 AND t.ticket_type_code = 'PROJECT'
        `;
        
        const result = await db.query(query, [uuid, lang]);
        
        if (result.rows.length === 0) {
            logger.warn(`[PROJECT SERVICE] No project found with UUID: ${uuid}`);
            return null;
        }
        
        logger.info(`[PROJECT SERVICE] Successfully retrieved project with UUID: ${uuid}`);
        return result.rows[0];
    } catch (error) {
        logger.error(`[PROJECT SERVICE] Error fetching project with UUID ${uuid}:`, error);
        throw error;
    }
};

/**
 * Récupère les projets avec les attributs étendus spécifiques aux projets
 * @param {string} lang - Code de langue pour les traductions
 * @returns {Promise<Array>} - Liste des projets avec leurs attributs
 */
const getProjects = async (lang) => {
    const servicePrefix = '[PROJECT SERVICE]';
    
    // Définition des attributs spécifiques aux projets
    const baseQuery = `
        -- Extraction des attributs spécifiques aux projets depuis le JSONB
        t.core_extended_attributes->>'key' as key,
        t.core_extended_attributes->>'start_date' as start_date,
        t.core_extended_attributes->>'end_date' as end_date,
        t.core_extended_attributes->>'issue_type_scheme_id' as issue_type_scheme_id,
        t.core_extended_attributes->>'visibility' as visibility,
        COALESCE(
            (SELECT psl.label FROM translations.project_setup_label psl 
            WHERE psl.rel_project_setup_code = t.core_extended_attributes->>'visibility' AND psl.lang = $1),
            t.core_extended_attributes->>'visibility'
        ) as visibility_label,
        t.core_extended_attributes->>'project_type' as project_type,
        COALESCE(
            (SELECT psl.label FROM translations.project_setup_label psl 
            WHERE psl.rel_project_setup_code = t.core_extended_attributes->>'project_type' AND psl.lang = $1),
            t.core_extended_attributes->>'project_type'
        ) as project_type_label,
        
        -- Comptage des defects liés au projet
        (
            SELECT COUNT(*)
            FROM core.rel_parent_child_tickets rpc
            WHERE rpc.rel_parent_ticket_uuid = t.uuid 
            AND rpc.dependency_code = 'DEFECT'
            AND (rpc.ended_at IS NULL OR rpc.ended_at > NOW())
        ) as defect_count,
        
        -- Comptage des user stories liées au projet
        (
            SELECT COUNT(*)
            FROM core.rel_parent_child_tickets rpc
            WHERE rpc.rel_parent_ticket_uuid = t.uuid 
            AND rpc.dependency_code = 'STORY'
            AND (rpc.ended_at IS NULL OR rpc.ended_at > NOW())
        ) as us_count,
        
        -- Comptage des epics liés au projet
        (
            SELECT COUNT(*)
            FROM core.rel_parent_child_tickets rpc
            WHERE rpc.rel_parent_ticket_uuid = t.uuid 
            AND rpc.dependency_code = 'EPIC'
            AND (rpc.ended_at IS NULL OR rpc.ended_at > NOW())
        ) as epic_count,
        
        -- Comptage des sprints liés au projet
        (
            SELECT COUNT(*)
            FROM core.rel_parent_child_tickets rpc
            WHERE rpc.rel_parent_ticket_uuid = t.uuid 
            AND rpc.dependency_code = 'SPRINT'
            AND (rpc.ended_at IS NULL OR rpc.ended_at > NOW())
        ) as sprint_count
    `;
    
    // Définition des jointures spécifiques aux projets
    const additionalJoins = `
        -- Aucune jointure supplémentaire nécessaire pour les projets
        -- Les traductions sont gérées directement dans la requête principale
    `;
    
    // Utilisation de la fonction getTickets factorisée
    return ticketService.getTickets(lang, 'PROJECT', baseQuery, additionalJoins, [], servicePrefix);
};

/**
 * Met à jour partiellement un projet par son UUID
 * @param {string} uuid - UUID du projet à mettre à jour
 * @param {Object} updateData - Données à mettre à jour
 * @returns {Promise<Object>} - Détails du projet mis à jour
 */
const updateProject = async (uuid, updateData) => {
    // Définir les champs spécifiques aux projets
    const standardFields = [
        'title', 'description', 'configuration_item_uuid',
        'ticket_status_code', 'requested_by_uuid', 'requested_for_uuid'
    ];
    
    const assignmentFields = [
        'assigned_to_group', 'assigned_to_person'
    ];
    
    const extendedAttributesFields = [
        'key', 'start_date', 'end_date', 'issue_type_scheme_id',
        'visibility', 'project_type'
    ];
    
    
    // Utiliser les fonctions du service.js
    const { applyUpdate } = require('./service');
    
    // Mettre à jour les champs standards, d'assignation et attributs étendus
    const updatedProject = await applyUpdate(
        uuid,
        updateData,
        'PROJECT',
        standardFields,
        assignmentFields,
        extendedAttributesFields,
        getProjectById,
        '[PROJECT SERVICE]'
    );
    
    return updatedProject;
};

module.exports = {
    getProjectById,
    getProjects,
    updateProject
};
