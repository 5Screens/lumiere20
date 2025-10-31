const db = require('../../../config/database');
const logger = require('../../../config/logger');
const ticketService = require('./service');
const { buildFilterCondition: buildGenericFilterCondition } = require('./ticketFilterBuilder');

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
                g.uuid as rel_assigned_to_group,
                g.group_name as assigned_group_name,
                
                -- Informations sur la personne assignée
                p4.uuid as rel_assigned_to_person,
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
                -- Transformation de issue_type_scheme_id en tableau d'objets avec uuid, code et libellé
                (
                    SELECT json_agg(json_build_object(
                        'uuid', s.uuid,
                        'code', symptoms.code,
                        'libelle', COALESCE(st.label, symptoms.code)
                    ))
                    FROM (
                        SELECT jsonb_array_elements_text(t.core_extended_attributes->'issue_type_scheme_id') as code
                    ) as symptoms
                    LEFT JOIN configuration.symptoms s ON s.code = symptoms.code
                    LEFT JOIN translations.symptoms_translation st ON st.symptom_code = symptoms.code AND st.lang = $2
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
                        'uuid', p5.uuid,
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
                        'uuid', g2.uuid,
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
    const logger = require('../../../config/logger');
    const db = require('../../../config/database');
    
    // Check if visibility is being updated
    const isVisibilityUpdated = updateData.hasOwnProperty('visibility');
    
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
    
    // If visibility was updated, end all active relations in rel_tickets_groups_persons
    if (isVisibilityUpdated) {
        try {
            logger.info(`[PROJECT SERVICE] Ending active relations for project ${uuid} due to visibility update`);
            
            const endRelationsQuery = `
                UPDATE core.rel_tickets_groups_persons 
                SET ended_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE rel_ticket = $1 
                AND type = 'ACCESS_GRANTED'
                  AND ended_at IS NULL
            `;
            
            const result = await db.query(endRelationsQuery, [uuid]);
            
            if (result.rowCount > 0) {
                logger.info(`[PROJECT SERVICE] Ended ${result.rowCount} active relations for project ${uuid}`);
            } else {
                logger.info(`[PROJECT SERVICE] No active relations found to end for project ${uuid}`);
            }
            
        } catch (error) {
            logger.error(`[PROJECT SERVICE] Error ending active relations for project ${uuid}:`, error);
            // Don't throw the error to avoid breaking the update process
            // The project update was successful, this is just cleanup
        }
    }
    
    return updatedProject;
};

/**
 * Crée un nouveau projet
 * @param {Object} projectData - Données pour la création du projet
 * @returns {Promise<Object>} - Détails du projet créé
 */
const createProject = async (projectData) => {
    logger.info('[PROJECT SERVICE] Creating new project');
    logger.info(`[PROJECT SERVICE] writer_uuid received: ${projectData.writer_uuid}`);
    
    // Vérifier que writer_uuid est fourni
    if (!projectData.writer_uuid) {
        throw new Error('writer_uuid is required for project creation');
    }
    
    // Définir les champs standards pour un projet
    const standardFields = {
        title: projectData.title,
        description: projectData.description,
        configuration_item_uuid: projectData.configuration_item_uuid,
        ticket_type_code: 'PROJECT',
        ticket_status_code: projectData.ticket_status_code || 'NEW',
        // Pour les projets, requested_by_uuid = requested_for_uuid = le uuid du rédacteur
        requested_by_uuid: projectData.writer_uuid,
        requested_for_uuid: projectData.writer_uuid,
        writer_uuid: projectData.writer_uuid
    };
    
    // Définir les champs d'assignation pour un projet
    const assignmentFields = {
        assigned_to_group: projectData.assigned_to_group || projectData.rel_assigned_to_group,
        assigned_to_person: projectData.assigned_to_person || projectData.rel_assigned_to_person || null
    };
    
    // Définir les attributs étendus pour un projet
    const extendedAttributesFields = {};
    
    // Champs à inclure dans core_extended_attributes pour les projets
    const projectFields = [
        'key', 'start_date', 'end_date', 'issue_type_scheme_id',
        'visibility', 'project_type'
    ];
    
    // Ajouter chaque champ présent dans projectData aux attributs étendus
    projectFields.forEach(field => {
        if (projectData[field] !== undefined) {
            extendedAttributesFields[field] = projectData[field];
        }
    });
    
    // Gérer la liste des observateurs (watchers)
    const watchList = projectData.watch_list && Array.isArray(projectData.watch_list) ? 
        projectData.watch_list : [];
    
    // Pas de relations parent-enfant pour les projets lors de la création
    const parentChildRelations = [];
    
    logger.info('[PROJECT SERVICE] Successfully prepared data for project creation');
    
    // Appeler applyCreation pour créer effectivement le ticket
    const { applyCreation } = require('./service');
    
    // Créer le projet de base
    const createdProject = await applyCreation(
        projectData,
        'PROJECT',
        standardFields,
        assignmentFields,
        extendedAttributesFields,
        watchList,
        parentChildRelations,
        getProjectById,
        '[PROJECT SERVICE]'
    );
    
    // Logique spécifique aux projets : gestion des accès
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        
        // 4. Handle access_to_users for PROJECT type if provided
        if (projectData.access_to_users && Array.isArray(projectData.access_to_users) && projectData.access_to_users.length > 0) {
            logger.info(`[PROJECT SERVICE] Processing ${projectData.access_to_users.length} access_to_users for PROJECT ticket`);
            
            // Prepare batch insert for access_to_users
            const accessUsersValues = projectData.access_to_users.map((personUuid, index) => {
                return `($1, NULL, $${index + 2}, 'ACCESS_GRANTED')`;
            }).join(', ');
            
            const accessUsersQuery = `
                INSERT INTO core.rel_tickets_groups_persons (
                    rel_ticket,
                    rel_assigned_to_group,
                    rel_assigned_to_person,
                    type
                ) VALUES ${accessUsersValues}
            `;
            
            const accessUsersParams = [createdProject.uuid, ...projectData.access_to_users];
            await client.query(accessUsersQuery, accessUsersParams);
            logger.info(`[PROJECT SERVICE] Successfully added ${projectData.access_to_users.length} access_to_users`);
        }
        
        // 5. Handle access_to_groups for PROJECT type if provided
        if (projectData.access_to_groups && Array.isArray(projectData.access_to_groups) && projectData.access_to_groups.length > 0) {
            logger.info(`[PROJECT SERVICE] Processing ${projectData.access_to_groups.length} access_to_groups for PROJECT ticket`);
            
            // Prepare batch insert for access_to_groups
            const accessGroupsValues = projectData.access_to_groups.map((groupUuid, index) => {
                return `($1, $${index + 2}, NULL, 'ACCESS_GRANTED')`;
            }).join(', ');
            
            const accessGroupsQuery = `
                INSERT INTO core.rel_tickets_groups_persons (
                    rel_ticket,
                    rel_assigned_to_group,
                    rel_assigned_to_person,
                    type
                ) VALUES ${accessGroupsValues}
            `;
            
            const accessGroupsParams = [createdProject.uuid, ...projectData.access_to_groups];
            await client.query(accessGroupsQuery, accessGroupsParams);
            logger.info(`[PROJECT SERVICE] Successfully added ${projectData.access_to_groups.length} access_to_groups`);
        }
        
        await client.query('COMMIT');
        logger.info('[PROJECT SERVICE] Successfully completed project creation with access management');
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('[PROJECT SERVICE] Error managing project access:', error);
        // Don't throw the error as the project was already created successfully
        // This is just additional access management
    } finally {
        client.release();
    }
    
    return createdProject;
};

/**
 * Build filter condition for projects search (wrapper with PROJECT-specific JSONB columns)
 * @param {string} column - Column name
 * @param {Object} filterDef - Filter definition with operator and value(s)
 * @param {string} dataType - Column data type (text, number, date, boolean)
 * @param {Array} queryParams - Array to push parameters into
 * @param {number} paramIndex - Current parameter index
 * @returns {Object} { condition: string, newParamIndex: number }
 */
const buildFilterCondition = (column, filterDef, dataType, queryParams, paramIndex) => {
  return buildGenericFilterCondition(column, filterDef, dataType, queryParams, paramIndex, {
    jsonbDateColumns: [
      'start_date', 'end_date'
    ],
    jsonbTextColumns: [
      'key', 'visibility', 'project_type'
    ],
    jsonbArrayColumns: [
      'issue_type_scheme_id'
    ],
    jsonbNumericColumns: [],
    servicePrefix: '[PROJECT SERVICE]'
  });
};

/**
 * Lazy search for projects with pagination
 * @param {string} searchQuery - Search term
 * @param {number} [page=1] - Page number (1-indexed)
 * @param {number} [limit=25] - Number of results per page
 * @param {string} [lang='en'] - Language code for translations
 * @returns {Promise<Object>} Object with data and pagination metadata
 */
const getProjectsLazySearch = async (searchQuery = '', page = 1, limit = 25, lang = 'en') => {
  try {
    logger.info(`[PROJECT SERVICE] Getting projects with lazy search: "${searchQuery}", page: ${page}, limit: ${limit}, lang: ${lang}`);
    
    // Validate and sanitize pagination parameters
    const validPage = Math.max(1, parseInt(page) || 1);
    const validLimit = Math.min(50, Math.max(1, parseInt(limit) || 25)); // Max 50 per page
    const offset = (validPage - 1) * validLimit;
    
    // Separate WHERE clauses for COUNT and main query
    let countWhereClause = `WHERE t.ticket_type_code = 'PROJECT'`;
    let mainWhereClause = `WHERE t.ticket_type_code = 'PROJECT'`;
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
            unaccent(LOWER(t.description)) LIKE unaccent(LOWER($${countParamIndex})) OR
            unaccent(LOWER(t.core_extended_attributes->>'key')) LIKE unaccent(LOWER($${countParamIndex}))
          )`);
          countParamIndex++;
          
          // For main query
          queryParams.push(`%${term}%`);
          mainConditions.push(`(
            unaccent(LOWER(t.title)) LIKE unaccent(LOWER($${paramIndex})) OR
            unaccent(LOWER(t.description)) LIKE unaccent(LOWER($${paramIndex})) OR
            unaccent(LOWER(t.core_extended_attributes->>'key')) LIKE unaccent(LOWER($${paramIndex}))
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
    
    // Main query to fetch projects
    const query = `
      SELECT 
        t.uuid,
        t.title,
        t.description,
        t.core_extended_attributes->>'key' as key,
        t.ticket_status_code,
        COALESCE(tst.label, ts.code) as ticket_status_label,
        t.created_at
      FROM core.tickets t
      JOIN configuration.ticket_status ts ON t.ticket_status_code = ts.code AND ts.rel_ticket_type = 'PROJECT'
      LEFT JOIN translations.ticket_status_translation tst ON ts.uuid = tst.ticket_status_uuid AND tst.lang = $1
      ${mainWhereClause}
      ORDER BY t.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(validLimit, offset);
    
    const { rows } = await db.query(query, queryParams);
    
    const hasMore = offset + rows.length < total;
    
    logger.info(`[PROJECT SERVICE] Retrieved ${rows.length} projects (page ${validPage}, total: ${total}, hasMore: ${hasMore})`);
    
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
    logger.error('[PROJECT SERVICE] Error in lazy search:', error);
    throw error;
  }
};

/**
 * Advanced search for projects with filters, sorting, and pagination
 * @param {Object} searchParams - Search parameters including filters, sort, pagination, and lang
 * @returns {Promise<Object>} - { data: Array, total: number, hasMore: boolean, pagination: Object }
 */
const searchProjects = async (searchParams) => {
  try {
    const servicePrefix = '[PROJECT SERVICE]';
    
    const { filters = {}, sort = {}, pagination = {}, lang = 'en' } = searchParams;
    
    // Extract pagination parameters
    const page = pagination.page || 1;
    const limit = pagination.limit || 50;
    const offset = (page - 1) * limit;
    
    // Extract sort parameters
    const sortBy = sort.by || 'created_at';
    const sortDirection = sort.direction || 'desc';
    
    // Build WHERE clause from advanced filters
    const queryParams = [];
    let paramIndex = 1;
    let whereClause = '';
    
    // Always filter by ticket_type = PROJECT
    const baseConditions = [`t.ticket_type_code = 'PROJECT'`];
    
    // Validate filter format
    if (filters && filters.conditions && Array.isArray(filters.conditions) && filters.conditions.length > 0) {
        const mode = filters.mode || 'include';
        const operator = (filters.operator || 'AND').toUpperCase();
        
        logger.info(`${servicePrefix} Processing ${filters.conditions.length} advanced filter(s) with mode=${mode}, operator=${operator}`);
        
        const filterConditions = [];
        
        // Process each filter condition
        for (const filterDef of filters.conditions) {
          const { column } = filterDef;
          
          logger.info(`${servicePrefix} Processing filter condition:`, JSON.stringify(filterDef));
          
          if (!column) {
            logger.warn(`${servicePrefix} Filter condition missing column, skipping`);
            continue;
          }
          
          // Get column metadata to determine data type
          const metadataQuery = `
            SELECT data_type 
            FROM administration.table_metadata 
            WHERE table_name = $1 AND column_name = $2
          `;
          const metadataResult = await db.query(metadataQuery, ['tickets', column]);
          
          logger.info(`${servicePrefix} Metadata query result for column ${column}:`, metadataResult.rows);
          
          if (metadataResult.rows.length === 0) {
            logger.warn(`${servicePrefix} No metadata for column ${column}, skipping filter`);
            continue;
          }
          
          const { data_type } = metadataResult.rows[0];
          logger.info(`${servicePrefix} Column ${column} has data_type: ${data_type}`);
          
          // Build the condition for this filter
          const { condition, newParamIndex } = buildFilterCondition(
            column,
            filterDef,
            data_type,
            queryParams,
            paramIndex
          );
          
          logger.info(`${servicePrefix} buildFilterCondition returned: condition="${condition}", newParamIndex=${newParamIndex}`);
          
          if (condition) {
            filterConditions.push(condition);
            paramIndex = newParamIndex;
            logger.info(`${servicePrefix} Added filter: ${condition}`);
          } else {
            logger.warn(`${servicePrefix} buildFilterCondition returned empty condition for column ${column}`);
          }
        }
        
        // Combine all filter conditions
        if (filterConditions.length > 0) {
          const combinedConditions = filterConditions.join(` ${operator} `);
          
          // Apply mode: include or exclude
          if (mode === 'exclude') {
            baseConditions.push(`NOT (${combinedConditions})`);
          } else {
            if (operator === 'OR' || filterConditions.length > 1) {
              baseConditions.push(`(${combinedConditions})`);
            } else {
              baseConditions.push(combinedConditions);
            }
          }
          
          logger.info(`${servicePrefix} Filter conditions added to base conditions`);
        }
    }
    
    whereClause = `WHERE ${baseConditions.join(' AND ')}`;
    logger.info(`${servicePrefix} Final WHERE clause: ${whereClause}`);
    
    // Calculate the parameter index for lang (after all filter params)
    const langParamIndex = paramIndex;
    
    // Sort column mapping for calculated/joined columns
    const sortColumnMapping = {
      'uuid': 't.uuid',
      'title': 't.title',
      'description': 't.description',
      'ticket_type_code': 't.ticket_type_code',
      'ticket_status_code': 't.ticket_status_code',
      'ticket_status_label': 'COALESCE(tst.label, ts.code)',
      'writer_uuid': 't.writer_uuid',
      'writer_name': "p3.first_name || ' ' || p3.last_name",
      'assigned_to_group': 'g.uuid',
      'assigned_group_name': 'g.group_name',
      'assigned_to_person': 'p4.uuid',
      'assigned_person_name': "p4.first_name || ' ' || p4.last_name",
      'created_at': 't.created_at',
      'updated_at': 't.updated_at',
      'closed_at': 't.closed_at',
      // JSONB fields
      'key': "t.core_extended_attributes->>'key'",
      'start_date': "t.core_extended_attributes->>'start_date'",
      'end_date': "t.core_extended_attributes->>'end_date'",
      'visibility': "t.core_extended_attributes->>'visibility'",
      'visibility_label': "COALESCE(visibility_t.label, t.core_extended_attributes->>'visibility')",
      'project_type': "t.core_extended_attributes->>'project_type'",
      'project_type_label': "COALESCE(project_type_t.label, t.core_extended_attributes->>'project_type')",
      'defect_count': '(SELECT COUNT(*) FROM core.rel_parent_child_tickets rpc WHERE rpc.rel_parent_ticket_uuid = t.uuid AND rpc.dependency_code = \'DEFECT\' AND (rpc.ended_at IS NULL OR rpc.ended_at > NOW()))',
      'us_count': '(SELECT COUNT(*) FROM core.rel_parent_child_tickets rpc WHERE rpc.rel_parent_ticket_uuid = t.uuid AND rpc.dependency_code = \'STORY\' AND (rpc.ended_at IS NULL OR rpc.ended_at > NOW()))',
      'epic_count': '(SELECT COUNT(*) FROM core.rel_parent_child_tickets rpc WHERE rpc.rel_parent_ticket_uuid = t.uuid AND rpc.dependency_code = \'EPIC\' AND (rpc.ended_at IS NULL OR rpc.ended_at > NOW()))',
      'sprint_count': '(SELECT COUNT(*) FROM core.rel_parent_child_tickets rpc WHERE rpc.rel_parent_ticket_uuid = t.uuid AND rpc.dependency_code = \'SPRINT\' AND (rpc.ended_at IS NULL OR rpc.ended_at > NOW()))'
    };
    
    // Get the SQL expression for sorting
    const sortExpression = sortColumnMapping[sortBy] || `t.${sortBy}`;
    
    logger.info(`${servicePrefix} Sort parameters: sortBy="${sortBy}" → SQL expression: "${sortExpression}", sortDirection="${sortDirection}"`);
    logger.info(`${servicePrefix} Pagination: page=${page}, limit=${limit}, offset=${offset}`);
    logger.info(`${servicePrefix} Language: ${lang}`);
    
    // Count total results
    const countQuery = `
      SELECT COUNT(*) as total
      FROM core.tickets t
      ${whereClause}
    `;
    
    logger.info(`${servicePrefix} Count query params: ${JSON.stringify(queryParams)}`);
    
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);
    
    // Get paginated results with all data
    const dataQuery = `
      SELECT 
        t.uuid,
        t.title,
        t.description,
        t.writer_uuid,
        t.ticket_type_code,
        t.ticket_status_code,
        t.created_at,
        t.updated_at,
        t.closed_at,
        
        -- Person names
        p3.first_name || ' ' || p3.last_name as writer_name,
        
        -- Translated labels
        COALESCE(ttt.label, tt.code) as ticket_type_label,
        COALESCE(tst.label, ts.code) as ticket_status_label,
        
        -- Assignment info
        g.uuid as assigned_to_group,
        g.group_name as assigned_group_name,
        p4.uuid as assigned_to_person,
        p4.first_name || ' ' || p4.last_name as assigned_person_name,
        
        -- Project-specific fields from core_extended_attributes
        t.core_extended_attributes->>'key' as key,
        t.core_extended_attributes->>'start_date' as start_date,
        t.core_extended_attributes->>'end_date' as end_date,
        t.core_extended_attributes->>'visibility' as visibility,
        COALESCE(visibility_t.label, t.core_extended_attributes->>'visibility') as visibility_label,
        t.core_extended_attributes->>'project_type' as project_type,
        COALESCE(project_type_t.label, t.core_extended_attributes->>'project_type') as project_type_label,
        
        -- Counts
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
        ) as sprint_count
        
      FROM core.tickets t
      LEFT JOIN configuration.persons p3 ON t.writer_uuid = p3.uuid
      JOIN configuration.ticket_types tt ON t.ticket_type_code = tt.code
      JOIN configuration.ticket_status ts ON t.ticket_status_code = ts.code AND ts.rel_ticket_type = tt.code
      LEFT JOIN translations.ticket_types_translation ttt ON tt.uuid = ttt.ticket_type_uuid AND ttt.lang = $${langParamIndex}
      LEFT JOIN translations.ticket_status_translation tst ON ts.uuid = tst.ticket_status_uuid AND tst.lang = $${langParamIndex}
      LEFT JOIN (
        SELECT rel_ticket, rel_assigned_to_group, rel_assigned_to_person
        FROM core.rel_tickets_groups_persons
        WHERE type = 'ASSIGNED' AND (ended_at IS NULL OR ended_at > NOW())
      ) rtgp ON t.uuid = rtgp.rel_ticket
      LEFT JOIN configuration.groups g ON rtgp.rel_assigned_to_group = g.uuid
      LEFT JOIN configuration.persons p4 ON rtgp.rel_assigned_to_person = p4.uuid
      LEFT JOIN translations.project_setup_label visibility_t ON visibility_t.rel_project_setup_code = t.core_extended_attributes->>'visibility' AND visibility_t.lang = $${langParamIndex}
      LEFT JOIN translations.project_setup_label project_type_t ON project_type_t.rel_project_setup_code = t.core_extended_attributes->>'project_type' AND project_type_t.lang = $${langParamIndex}
      ${whereClause}
      ORDER BY ${sortExpression} ${sortDirection.toUpperCase()}
      LIMIT $${langParamIndex + 1} OFFSET $${langParamIndex + 2}
    `;
    
    queryParams.push(lang, limit, offset);
    
    logger.info(`${servicePrefix} Data query params: ${JSON.stringify(queryParams)}`);
    
    const dataResult = await db.query(dataQuery, queryParams);
    
    // Calculate pagination metadata
    const currentPage = page;
    const totalPages = Math.ceil(total / limit);
    const hasMore = offset + limit < total;
    
    logger.info(`${servicePrefix} Found ${dataResult.rows.length} projects (total: ${total})`);
    
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
    logger.error('[PROJECT SERVICE] Error searching projects:', error);
    throw error;
  }
};

module.exports = {
    getProjectById,
    getProjects,
    createProject,
    updateProject,
    getProjectsLazySearch,
    searchProjects
};
