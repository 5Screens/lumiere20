const db = require('../../../config/database');
const logger = require('../../../config/logger');
const ticketService = require('./service');
const { addChildrenTickets, removeChildTicket } = require('./service');
const { buildFilterCondition: buildGenericFilterCondition } = require('./ticketFilterBuilder');

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
    
    // Pour les EPIC, pas de relations parent-enfant dans applyCreation
    // Nous les gérerons après avec addChildrenTickets
    const parentChildRelations = [];
    
    logger.info('[EPIC SERVICE] Successfully prepared data for epic creation');
    
    // Appeler applyCreation pour créer effectivement le ticket
    const { applyCreation, addChildrenTickets } = require('./service');
    
    const createdEpic = await applyCreation(
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
    
    // EPIC: parent-child relationship (fille du projet)
    // Créer la relation PROJECT → EPIC après la création de l'epic
    if (epicData.project_id) {
        try {
            logger.info(`[EPIC SERVICE] Creating EPIC relationship with PROJECT: ${epicData.project_id}`);
            await addChildrenTickets(
                epicData.project_id, // Parent UUID (le projet)
                'EPIC', // Type de dépendance
                [createdEpic.uuid] // Enfant UUID (l'epic créé)
            );
            logger.info(`[EPIC SERVICE] Successfully created EPIC relationship with PROJECT: ${epicData.project_id}`);
        } catch (relationError) {
            logger.error(`[EPIC SERVICE] Error creating EPIC relationship with PROJECT: ${relationError.message}`);
            // Ne pas faire échouer la création de l'epic pour une erreur de relation
        }
    }
    
    return createdEpic;
};

/**
 * Build filter condition for epics search (wrapper with EPIC-specific JSONB columns)
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
      'color'
    ],
    jsonbArrayColumns: [
      'tags'
    ],
    jsonbNumericColumns: [
      'progress_percent'
    ],
    servicePrefix: '[EPIC SERVICE]'
  });
};

/**
 * Lazy search for epics with pagination
 * @param {string} searchQuery - Search term
 * @param {number} [page=1] - Page number (1-indexed)
 * @param {number} [limit=25] - Number of results per page
 * @param {string} [lang='en'] - Language code for translations
 * @returns {Promise<Object>} Object with data and pagination metadata
 */
const getEpicsLazySearch = async (searchQuery = '', page = 1, limit = 25, lang = 'en') => {
  try {
    logger.info(`[EPIC SERVICE] Getting epics with lazy search: "${searchQuery}", page: ${page}, limit: ${limit}, lang: ${lang}`);
    
    // Validate and sanitize pagination parameters
    const validPage = Math.max(1, parseInt(page) || 1);
    const validLimit = Math.min(50, Math.max(1, parseInt(limit) || 25)); // Max 50 per page
    const offset = (validPage - 1) * validLimit;
    
    // Separate WHERE clauses for COUNT and main query
    let countWhereClause = `WHERE t.ticket_type_code = 'EPIC'`;
    let mainWhereClause = `WHERE t.ticket_type_code = 'EPIC'`;
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
    
    // Main query to fetch epics
    const query = `
      SELECT 
        t.uuid,
        t.title,
        t.description,
        t.ticket_status_code,
        COALESCE(tst.label, ts.code) as ticket_status_label,
        t.core_extended_attributes->>'start_date' as start_date,
        t.core_extended_attributes->>'end_date' as end_date,
        t.core_extended_attributes->>'progress_percent' as progress_percent,
        t.created_at
      FROM core.tickets t
      JOIN configuration.ticket_status ts ON t.ticket_status_code = ts.code AND ts.rel_ticket_type = 'EPIC'
      LEFT JOIN translations.ticket_status_translation tst ON ts.uuid = tst.ticket_status_uuid AND tst.lang = $1
      ${mainWhereClause}
      ORDER BY t.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(validLimit, offset);
    
    const { rows } = await db.query(query, queryParams);
    
    const hasMore = offset + rows.length < total;
    
    logger.info(`[EPIC SERVICE] Retrieved ${rows.length} epics (page ${validPage}, total: ${total}, hasMore: ${hasMore})`);
    
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
    logger.error('[EPIC SERVICE] Error in lazy search:', error);
    throw error;
  }
};

/**
 * Advanced search for epics with filters, sorting, and pagination
 * @param {Object} searchParams - Search parameters including filters, sort, pagination, and lang
 * @returns {Promise<Object>} - { data: Array, total: number, hasMore: boolean, pagination: Object }
 */
const searchEpics = async (searchParams) => {
  try {
    const servicePrefix = '[EPIC SERVICE]';
    
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
    
    // Always filter by ticket_type = EPIC
    const baseConditions = [`t.ticket_type_code = 'EPIC'`];
    
    // Validate filter format
    if (filters && filters.conditions && Array.isArray(filters.conditions) && filters.conditions.length > 0) {
        const mode = filters.mode || 'include';
        const operator = (filters.operator || 'AND').toUpperCase();
        
        logger.info(`${servicePrefix} Processing ${filters.conditions.length} advanced filter(s) with mode=${mode}, operator=${operator}`);
        
        const filterConditions = [];
        
        // Process each filter condition
        for (const filterDef of filters.conditions) {
          const { column, operator: filterOperator, value } = filterDef;
          
          logger.info(`${servicePrefix} Processing filter condition:`, JSON.stringify(filterDef));
          
          if (!column) {
            logger.warn(`${servicePrefix} Filter condition missing column, skipping`);
            continue;
          }
          
          // Special handling for project_id (stored in rel_parent_child_tickets, not JSONB)
          if (column === 'project_id') {
            logger.info(`${servicePrefix} Special handling for project_id filter`);
            
            if (filterOperator === 'is' && Array.isArray(value) && value.length > 0) {
              const projectUuids = value;
              const placeholders = projectUuids.map((_, idx) => `$${paramIndex + idx}`).join(', ');
              
              const condition = `t.uuid IN (
                SELECT rpc.rel_child_ticket_uuid 
                FROM core.rel_parent_child_tickets rpc 
                WHERE rpc.rel_parent_ticket_uuid IN (${placeholders})
                  AND rpc.dependency_code = 'EPIC'
                  AND rpc.ended_at IS NULL
              )`;
              
              projectUuids.forEach(uuid => queryParams.push(uuid));
              paramIndex += projectUuids.length;
              
              filterConditions.push(condition);
              logger.info(`${servicePrefix} Added project_id filter: ${condition}`);
            } else if (filterOperator === 'is_not' && Array.isArray(value) && value.length > 0) {
              const projectUuids = value;
              const placeholders = projectUuids.map((_, idx) => `$${paramIndex + idx}`).join(', ');
              
              const condition = `t.uuid NOT IN (
                SELECT rpc.rel_child_ticket_uuid 
                FROM core.rel_parent_child_tickets rpc 
                WHERE rpc.rel_parent_ticket_uuid IN (${placeholders})
                  AND rpc.dependency_code = 'EPIC'
                  AND rpc.ended_at IS NULL
              )`;
              
              projectUuids.forEach(uuid => queryParams.push(uuid));
              paramIndex += projectUuids.length;
              
              filterConditions.push(condition);
              logger.info(`${servicePrefix} Added project_id NOT filter: ${condition}`);
            }
            
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
      'created_at': 't.created_at',
      'updated_at': 't.updated_at',
      'closed_at': 't.closed_at',
      // JSONB fields
      'start_date': "t.core_extended_attributes->>'start_date'",
      'end_date': "t.core_extended_attributes->>'end_date'",
      'progress_percent': "t.core_extended_attributes->>'progress_percent'",
      'color': "t.core_extended_attributes->>'color'",
      'tags': "t.core_extended_attributes->'tags'",
      'project_id': "(SELECT parent.uuid FROM core.rel_parent_child_tickets rpc JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'EPIC' AND parent.ticket_type_code = 'PROJECT' AND rpc.ended_at IS NULL LIMIT 1)",
      'project_title': "(SELECT parent.title FROM core.rel_parent_child_tickets rpc JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'EPIC' AND parent.ticket_type_code = 'PROJECT' AND rpc.ended_at IS NULL LIMIT 1)",
      'stories_count': '(SELECT COUNT(*) FROM core.rel_parent_child_tickets rpc WHERE rpc.rel_parent_ticket_uuid = t.uuid AND rpc.dependency_code = \'STORY\' AND rpc.ended_at IS NULL)',
      'tasks_count': '(SELECT COUNT(*) FROM core.rel_parent_child_tickets rpc WHERE rpc.rel_parent_ticket_uuid = t.uuid AND rpc.dependency_code = \'TASK\' AND rpc.ended_at IS NULL)',
      'attachments_count': '(SELECT COUNT(*) FROM core.attachments a WHERE a.object_uuid = t.uuid)'
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
        
        -- JSONB fields extracted
        t.core_extended_attributes->>'start_date' as start_date,
        t.core_extended_attributes->>'end_date' as end_date,
        t.core_extended_attributes->>'progress_percent' as progress_percent,
        t.core_extended_attributes->>'color' as color,
        t.core_extended_attributes->'tags' as tags,
        
        -- Project parent info
        (
          SELECT parent.uuid
          FROM core.rel_parent_child_tickets rpc
          JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid
          WHERE rpc.rel_child_ticket_uuid = t.uuid 
            AND rpc.dependency_code = 'EPIC' 
            AND parent.ticket_type_code = 'PROJECT'
            AND rpc.ended_at IS NULL
          LIMIT 1
        ) as project_id,
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
        
        -- Counts
        (
          SELECT COUNT(*)
          FROM core.rel_parent_child_tickets rpc
          WHERE rpc.rel_parent_ticket_uuid = t.uuid 
            AND rpc.dependency_code = 'STORY' 
            AND rpc.ended_at IS NULL
        ) as stories_count,
        (
          SELECT COUNT(*)
          FROM core.rel_parent_child_tickets rpc
          WHERE rpc.rel_parent_ticket_uuid = t.uuid 
            AND rpc.dependency_code = 'TASK' 
            AND rpc.ended_at IS NULL
        ) as tasks_count,
        (
          SELECT COUNT(*)
          FROM core.attachments a
          WHERE a.object_uuid = t.uuid
        ) as attachments_count
        
      FROM core.tickets t
      JOIN configuration.persons p3 ON t.writer_uuid = p3.uuid
      JOIN configuration.ticket_types tt ON t.ticket_type_code = tt.code
      JOIN configuration.ticket_status ts ON t.ticket_status_code = ts.code AND ts.rel_ticket_type = tt.code
      LEFT JOIN translations.ticket_types_translation ttt ON tt.uuid = ttt.ticket_type_uuid AND ttt.lang = $${langParamIndex}
      LEFT JOIN translations.ticket_status_translation tst ON ts.uuid = tst.ticket_status_uuid AND tst.lang = $${langParamIndex}
      ${whereClause}
      ORDER BY ${sortExpression} ${sortDirection.toUpperCase()}
      LIMIT $${langParamIndex + 1} OFFSET $${langParamIndex + 2}
    `;
    
    // Add lang, limit and offset to params
    queryParams.push(lang, limit, offset);
    
    logger.info(`${servicePrefix} Data query params: ${JSON.stringify(queryParams)}`);
    
    const dataResult = await db.query(dataQuery, queryParams);
    
    const hasMore = offset + dataResult.rows.length < total;
    
    logger.info(`${servicePrefix} Retrieved ${dataResult.rows.length} epics (total: ${total}, hasMore: ${hasMore})`);
    
    return {
      data: dataResult.rows,
      total: total,
      hasMore: hasMore,
      pagination: {
        page: page,
        limit: limit,
        total: total
      }
    };
  } catch (error) {
    logger.error('[EPIC SERVICE] Error in searchEpics:', error);
    throw error;
  }
};

module.exports = {
    getEpicById,
    getEpics,
    createEpic,
    updateEpic,
    searchEpics,
    getEpicsLazySearch
};
