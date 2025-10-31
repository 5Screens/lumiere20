const db = require('../../../config/database');
const logger = require('../../../config/logger');
const ticketService = require('./service');
const { buildFilterCondition: buildGenericFilterCondition } = require('./ticketFilterBuilder');

/**
 * Build filter condition for sprints search (wrapper with SPRINT-specific JSONB columns)
 * @param {string} column - Column name
 * @param {Object} filterDef - Filter definition with operator and value(s)
 * @param {string} dataType - Column data type (text, number, date, boolean)
 * @param {Array} queryParams - Array to push parameters into
 * @param {number} paramIndex - Current parameter index
 * @returns {Object} { condition: string, newParamIndex: number }
 */
const buildFilterCondition = (column, filterDef, dataType, queryParams, paramIndex) => {
  const { operator, value } = filterDef;
  
  // Handle project_id as a special relational column
  if (column === 'project_id') {
    logger.info(`[SPRINT SERVICE] Building condition for relational column: project_id`);
    
    if (operator === 'is_null') {
      const condition = `NOT EXISTS (
        SELECT 1 FROM core.rel_parent_child_tickets rpc
        WHERE rpc.rel_child_ticket_uuid = t.uuid
          AND rpc.dependency_code = 'SPRINT'
          AND rpc.ended_at IS NULL
      )`;
      return { condition, newParamIndex: paramIndex };
    } else if (operator === 'is_not_null') {
      const condition = `EXISTS (
        SELECT 1 FROM core.rel_parent_child_tickets rpc
        WHERE rpc.rel_child_ticket_uuid = t.uuid
          AND rpc.dependency_code = 'SPRINT'
          AND rpc.ended_at IS NULL
      )`;
      return { condition, newParamIndex: paramIndex };
    } else if (operator === 'equals' || operator === 'is') {
      if (Array.isArray(value)) {
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
        queryParams.push(...value);
        const condition = `EXISTS (
          SELECT 1 FROM core.rel_parent_child_tickets rpc
          WHERE rpc.rel_child_ticket_uuid = t.uuid
            AND rpc.dependency_code = 'SPRINT'
            AND rpc.ended_at IS NULL
            AND rpc.rel_parent_ticket_uuid IN (${placeholders})
        )`;
        return { condition, newParamIndex: paramIndex };
      } else {
        queryParams.push(value);
        const condition = `EXISTS (
          SELECT 1 FROM core.rel_parent_child_tickets rpc
          WHERE rpc.rel_child_ticket_uuid = t.uuid
            AND rpc.dependency_code = 'SPRINT'
            AND rpc.ended_at IS NULL
            AND rpc.rel_parent_ticket_uuid = $${paramIndex++}
        )`;
        return { condition, newParamIndex: paramIndex };
      }
    } else if (operator === 'not_equals' || operator === 'is_not') {
      if (Array.isArray(value)) {
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
        queryParams.push(...value);
        const condition = `(NOT EXISTS (
          SELECT 1 FROM core.rel_parent_child_tickets rpc
          WHERE rpc.rel_child_ticket_uuid = t.uuid
            AND rpc.dependency_code = 'SPRINT'
            AND rpc.ended_at IS NULL
            AND rpc.rel_parent_ticket_uuid IN (${placeholders})
        ) OR NOT EXISTS (
          SELECT 1 FROM core.rel_parent_child_tickets rpc
          WHERE rpc.rel_child_ticket_uuid = t.uuid
            AND rpc.dependency_code = 'SPRINT'
            AND rpc.ended_at IS NULL
        ))`;
        return { condition, newParamIndex: paramIndex };
      } else {
        queryParams.push(value);
        const condition = `(NOT EXISTS (
          SELECT 1 FROM core.rel_parent_child_tickets rpc
          WHERE rpc.rel_child_ticket_uuid = t.uuid
            AND rpc.dependency_code = 'SPRINT'
            AND rpc.ended_at IS NULL
            AND rpc.rel_parent_ticket_uuid = $${paramIndex++}
        ) OR NOT EXISTS (
          SELECT 1 FROM core.rel_parent_child_tickets rpc
          WHERE rpc.rel_child_ticket_uuid = t.uuid
            AND rpc.dependency_code = 'SPRINT'
            AND rpc.ended_at IS NULL
        ))`;
        return { condition, newParamIndex: paramIndex };
      }
    }
  }
  
  // Use generic filter builder for other columns
  return buildGenericFilterCondition(column, filterDef, dataType, queryParams, paramIndex, {
    jsonbDateColumns: [
      'start_date', 'end_date'
    ],
    jsonbTextColumns: [],
    jsonbArrayColumns: [],
    jsonbNumericColumns: [
      'actual_velocity', 'estimated_velocity'
    ],
    servicePrefix: '[SPRINT SERVICE]'
  });
};

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

/**
 * Crée un nouveau sprint
 * @param {Object} sprintData - Données pour la création du sprint
 * @returns {Promise<Object>} - Détails du sprint créé
 */
const createSprint = async (sprintData) => {
    logger.info('[SPRINT SERVICE] Creating new sprint');
    
    // Définir les champs standards pour un sprint
    const standardFields = {
        title: sprintData.title,
        description: sprintData.description,
        configuration_item_uuid: sprintData.configuration_item_uuid,
        ticket_type_code: 'SPRINT',
        ticket_status_code: sprintData.ticket_status_code || 'NEW',
        // Pour les sprints, requested_by_uuid = requested_for_uuid = le uuid du rédacteur
        requested_by_uuid: sprintData.writer_uuid,
        requested_for_uuid: sprintData.writer_uuid,
        writer_uuid: sprintData.writer_uuid
    };
    
    // Définir les champs d'assignation pour un sprint
    const assignmentFields = {
        assigned_to_group: sprintData.assigned_to_group || sprintData.rel_assigned_to_group,
        assigned_to_person: sprintData.assigned_to_person || sprintData.rel_assigned_to_person || null
    };
    
    // Définir les attributs étendus pour un sprint
    const extendedAttributesFields = {};
    
    // Champs à inclure dans core_extended_attributes pour les sprints
    // project_id n'est pas inclus dans les attributs étendus pour les sprints
    const sprintFields = [
        'start_date', 'end_date', 'actual_velocity',
        'estimated_velocity'
    ];
    
    // Ajouter chaque champ présent dans sprintData aux attributs étendus
    sprintFields.forEach(field => {
        if (sprintData[field] !== undefined) {
            extendedAttributesFields[field] = sprintData[field];
        }
    });
    
    // Gérer la liste des observateurs (watchers)
    const watchList = sprintData.watch_list && Array.isArray(sprintData.watch_list) ? 
        sprintData.watch_list : [];
    
    // Pour les SPRINT, pas de relations parent-enfant dans applyCreation
    // Nous les gérerons après avec addChildrenTickets
    const parentChildRelations = [];
    
    logger.info('[SPRINT SERVICE] Successfully prepared data for sprint creation');
    
    // Appeler applyCreation pour créer effectivement le ticket
    const { applyCreation, addChildrenTickets } = require('./service');
    
    const createdSprint = await applyCreation(
        sprintData,
        'SPRINT',
        standardFields,
        assignmentFields,
        extendedAttributesFields,
        watchList,
        parentChildRelations,
        getSprintById,
        '[SPRINT SERVICE]'
    );
    
    // SPRINT: parent-child relationship (fille du projet)
    // Créer la relation PROJECT → SPRINT après la création du sprint
    if (sprintData.project_id) {
        try {
            logger.info(`[SPRINT SERVICE] Creating SPRINT relationship with PROJECT: ${sprintData.project_id}`);
            await addChildrenTickets(
                sprintData.project_id, // Parent UUID (le projet)
                'SPRINT', // Type de dépendance
                [createdSprint.uuid] // Enfant UUID (le sprint créé)
            );
            logger.info(`[SPRINT SERVICE] Successfully created SPRINT relationship with PROJECT: ${sprintData.project_id}`);
        } catch (relationError) {
            logger.error(`[SPRINT SERVICE] Error creating SPRINT relationship with PROJECT: ${relationError.message}`);
            // Ne pas faire échouer la création du sprint pour une erreur de relation
        }
    }
    
    return createdSprint;
};

/**
 * Lazy search for sprints with pagination
 * @param {string} [searchQuery=''] - Search term
 * @param {number} [page=1] - Page number
 * @param {number} [limit=10] - Items per page
 * @param {string} [lang='en'] - Language code for translations
 * @returns {Promise<Object>} Object with data and pagination metadata
 */
const getSprintsLazySearch = async (searchQuery = '', page = 1, limit = 10, lang = 'en') => {
    try {
        logger.info(`[SPRINT SERVICE] Getting sprints with lazy search: "${searchQuery}", page: ${page}, limit: ${limit}, lang: ${lang}`);
        
        // Validate and sanitize pagination parameters
        const validPage = Math.max(1, parseInt(page) || 1);
        const validLimit = Math.min(50, Math.max(1, parseInt(limit) || 10)); // Max 50 per page
        const offset = (validPage - 1) * validLimit;
        
        // Separate WHERE clauses for COUNT and main query
        let countWhereClause = `WHERE t.ticket_type_code = 'SPRINT'`;
        let mainWhereClause = `WHERE t.ticket_type_code = 'SPRINT'`;
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
        
        // Main query to fetch sprints
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
                t.core_extended_attributes->>'start_date' as start_date,
                t.core_extended_attributes->>'end_date' as end_date,
                t.core_extended_attributes->>'actual_velocity' as actual_velocity,
                t.core_extended_attributes->>'estimated_velocity' as estimated_velocity,
                (
                    SELECT parent.title
                    FROM core.rel_parent_child_tickets rpc
                    JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid
                    WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'SPRINT' AND rpc.ended_at IS NULL
                    LIMIT 1
                ) as project_title
            FROM core.tickets t
            JOIN configuration.persons p3 ON t.writer_uuid = p3.uuid
            JOIN configuration.ticket_status ts ON t.ticket_status_code = ts.code AND ts.rel_ticket_type = 'SPRINT'
            LEFT JOIN translations.ticket_status_translation tst ON ts.uuid = tst.ticket_status_uuid AND tst.lang = $1
            ${mainWhereClause}
            ORDER BY t.created_at DESC
            LIMIT ${validLimit} OFFSET ${offset}
        `;
        
        const { rows } = await db.query(query, queryParams);
        
        // Calculate pagination metadata
        const totalPages = Math.ceil(total / validLimit);
        const hasMore = validPage < totalPages;
        
        logger.info(`[SPRINT SERVICE] Found ${rows.length} sprints (total: ${total}, page: ${validPage}/${totalPages})`);
        
        return {
            data: rows,
            pagination: {
                page: validPage,
                limit: validLimit,
                total: total,
                totalPages: totalPages,
                hasMore: hasMore
            }
        };
    } catch (error) {
        logger.error('[SPRINT SERVICE] Error in lazy search:', error);
        throw error;
    }
};

/**
 * Advanced search for sprints with filters, sorting, and pagination
 * @param {Object} searchParams - Search parameters including filters, sort, pagination, and lang
 * @returns {Promise<Object>} - { data: Array, total: number, hasMore: boolean, pagination: Object }
 */
const searchSprints = async (searchParams) => {
  try {
    const servicePrefix = '[SPRINT SERVICE]';
    
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
    
    // Always filter by ticket_type = SPRINT
    const baseConditions = [`t.ticket_type_code = 'SPRINT'`];
    
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
      'requested_by_uuid': 't.requested_by_uuid',
      'requested_by_name': "p1.first_name || ' ' || p1.last_name",
      'requested_for_uuid': 't.requested_for_uuid',
      'requested_for_name': "p2.first_name || ' ' || p2.last_name",
      'writer_uuid': 't.writer_uuid',
      'writer_name': "p3.first_name || ' ' || p3.last_name",
      'created_at': 't.created_at',
      'updated_at': 't.updated_at',
      'closed_at': 't.closed_at',
      // JSONB fields
      'start_date': "t.core_extended_attributes->>'start_date'",
      'end_date': "t.core_extended_attributes->>'end_date'",
      'actual_velocity': "t.core_extended_attributes->>'actual_velocity'",
      'estimated_velocity': "t.core_extended_attributes->>'estimated_velocity'",
      // Calculated fields
      'project_id': "(SELECT parent.uuid FROM core.rel_parent_child_tickets rpc JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'SPRINT' AND rpc.ended_at IS NULL LIMIT 1)",
      'project_title': "(SELECT parent.title FROM core.rel_parent_child_tickets rpc JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'SPRINT' AND rpc.ended_at IS NULL LIMIT 1)",
      'attachments_count': '(SELECT COUNT(*) FROM core.attachments a WHERE a.object_uuid = t.uuid)',
      'tieds_tickets_count': '(SELECT COUNT(*) FROM core.rel_parent_child_tickets rpc WHERE rpc.rel_parent_ticket_uuid = t.uuid)',
      'stories_count': "(SELECT COUNT(*) FROM core.rel_parent_child_tickets rpc WHERE rpc.rel_parent_ticket_uuid = t.uuid AND rpc.dependency_code = 'STORY')",
      'tasks_count': "(SELECT COUNT(*) FROM core.rel_parent_child_tickets rpc WHERE rpc.rel_parent_ticket_uuid = t.uuid AND rpc.dependency_code = 'TASK')"
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
        t.requested_by_uuid,
        t.requested_for_uuid,
        t.writer_uuid,
        t.ticket_type_code,
        t.ticket_status_code,
        t.created_at,
        t.updated_at,
        t.closed_at,
        
        -- Person names
        p1.first_name || ' ' || p1.last_name as requested_by_name,
        p2.first_name || ' ' || p2.last_name as requested_for_name,
        p3.first_name || ' ' || p3.last_name as writer_name,
        
        -- Translated labels
        COALESCE(ttt.label, tt.code) as ticket_type_label,
        COALESCE(tst.label, ts.code) as ticket_status_label,
        
        -- Sprint-specific fields from core_extended_attributes
        t.core_extended_attributes->>'start_date' as start_date,
        t.core_extended_attributes->>'end_date' as end_date,
        t.core_extended_attributes->>'actual_velocity' as actual_velocity,
        t.core_extended_attributes->>'estimated_velocity' as estimated_velocity,
        
        -- Project relation
        (
          SELECT parent.uuid
          FROM core.rel_parent_child_tickets rpc
          JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid
          WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'SPRINT' AND rpc.ended_at IS NULL
          LIMIT 1
        ) as project_id,
        (
          SELECT parent.title
          FROM core.rel_parent_child_tickets rpc
          JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid
          WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'SPRINT' AND rpc.ended_at IS NULL
          LIMIT 1
        ) as project_title,
        
        -- Counts
        (SELECT COUNT(*) FROM core.attachments a WHERE a.object_uuid = t.uuid) as attachments_count,
        (SELECT COUNT(*) FROM core.rel_parent_child_tickets rpc WHERE rpc.rel_parent_ticket_uuid = t.uuid) as tieds_tickets_count,
        (SELECT COUNT(*) FROM core.rel_parent_child_tickets rpc WHERE rpc.rel_parent_ticket_uuid = t.uuid AND rpc.dependency_code = 'STORY') as stories_count,
        (SELECT COUNT(*) FROM core.rel_parent_child_tickets rpc WHERE rpc.rel_parent_ticket_uuid = t.uuid AND rpc.dependency_code = 'TASK') as tasks_count
        
      FROM core.tickets t
      LEFT JOIN configuration.persons p1 ON t.requested_by_uuid = p1.uuid
      LEFT JOIN configuration.persons p2 ON t.requested_for_uuid = p2.uuid
      LEFT JOIN configuration.persons p3 ON t.writer_uuid = p3.uuid
      JOIN configuration.ticket_types tt ON t.ticket_type_code = tt.code
      JOIN configuration.ticket_status ts ON t.ticket_status_code = ts.code AND ts.rel_ticket_type = tt.code
      LEFT JOIN translations.ticket_types_translation ttt ON tt.uuid = ttt.ticket_type_uuid AND ttt.lang = $${langParamIndex}
      LEFT JOIN translations.ticket_status_translation tst ON ts.uuid = tst.ticket_status_uuid AND tst.lang = $${langParamIndex}
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
    
    logger.info(`${servicePrefix} Found ${dataResult.rows.length} sprints (total: ${total})`);
    
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
    logger.error('[SPRINT SERVICE] Error searching sprints:', error);
    throw error;
  }
};

module.exports = {
    getSprintById,
    createSprint,
    updateSprint,
    getSprintsLazySearch,
    searchSprints
};
