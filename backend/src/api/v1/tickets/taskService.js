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
 * Build filter condition for tickets search
 * @param {string} column - Column name
 * @param {Object} filterDef - Filter definition with operator and value(s)
 * @param {string} dataType - Column data type (text, number, date, boolean)
 * @param {Array} queryParams - Array to push parameters into
 * @param {number} paramIndex - Current parameter index
 * @returns {Object} { condition: string, newParamIndex: number }
 */
const buildFilterCondition = (column, filterDef, dataType, queryParams, paramIndex) => {
  const { operator, value, empty_string_is_null } = filterDef;
  let condition = '';
  
  // Handle NULL checks
  if (operator === 'is_null') {
    if (empty_string_is_null && (dataType === 'text' || dataType === 'string')) {
      condition = `(t.${column} IS NULL OR t.${column} = '')`;
    } else {
      condition = `t.${column} IS NULL`;
    }
    return { condition, newParamIndex: paramIndex };
  }
  
  if (operator === 'is_not_null') {
    if (empty_string_is_null && (dataType === 'text' || dataType === 'string')) {
      condition = `(t.${column} IS NOT NULL AND t.${column} != '')`;
    } else {
      condition = `t.${column} IS NOT NULL`;
    }
    return { condition, newParamIndex: paramIndex };
  }
  
  // Handle TEXT/STRING/UUID type
  if (dataType === 'text' || dataType === 'string' || dataType === 'uuid') {
    if (operator === 'contains') {
      if (Array.isArray(value)) {
        const conditions = value.map((val, index) => {
          const cond = `LOWER(CAST(t.${column} AS TEXT)) LIKE LOWER($${paramIndex++})`;
          queryParams.push(`%${val}%`);
          return cond;
        });
        condition = `(${conditions.join(' OR ')})`;
      } else {
        condition = `LOWER(CAST(t.${column} AS TEXT)) LIKE LOWER($${paramIndex++})`;
        queryParams.push(`%${value}%`);
      }
    } else if (operator === 'equals' || operator === 'is') {
      if (Array.isArray(value)) {
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
        condition = `t.${column} IN (${placeholders})`;
        queryParams.push(...value);
      } else {
        condition = `t.${column} = $${paramIndex++}`;
        queryParams.push(value);
      }
    } else if (operator === 'not_equals') {
      if (Array.isArray(value)) {
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
        condition = `t.${column} NOT IN (${placeholders})`;
        queryParams.push(...value);
      } else {
        condition = `t.${column} != $${paramIndex++}`;
        queryParams.push(value);
      }
    }
  }
  
  // Handle NUMBER type
  else if (dataType === 'number' || dataType === 'integer' || dataType === 'numeric') {
    if (operator === 'equals') {
      if (Array.isArray(value)) {
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
        condition = `t.${column} IN (${placeholders})`;
        queryParams.push(...value);
      } else {
        condition = `t.${column} = $${paramIndex++}`;
        queryParams.push(value);
      }
    } else if (operator === 'lt') {
      condition = `t.${column} < $${paramIndex++}`;
      queryParams.push(value);
    } else if (operator === 'lte') {
      condition = `t.${column} <= $${paramIndex++}`;
      queryParams.push(value);
    } else if (operator === 'gt') {
      condition = `t.${column} > $${paramIndex++}`;
      queryParams.push(value);
    } else if (operator === 'gte') {
      condition = `t.${column} >= $${paramIndex++}`;
      queryParams.push(value);
    } else if (operator === 'between') {
      const startValue = value.gte || value.min || value.start;
      const endValue = value.lte || value.max || value.end;
      condition = `t.${column} BETWEEN $${paramIndex++} AND $${paramIndex++}`;
      queryParams.push(startValue, endValue);
    }
  }
  
  // Handle DATE type
  else if (dataType === 'date' || dataType === 'timestamp' || dataType === 'datetime') {
    if (operator === 'after') {
      condition = `DATE(t.${column}) > DATE($${paramIndex++})`;
      queryParams.push(value);
    } else if (operator === 'on_or_after') {
      condition = `DATE(t.${column}) >= DATE($${paramIndex++})`;
      queryParams.push(value);
    } else if (operator === 'before') {
      condition = `DATE(t.${column}) < DATE($${paramIndex++})`;
      queryParams.push(value);
    } else if (operator === 'on_or_before') {
      condition = `DATE(t.${column}) <= DATE($${paramIndex++})`;
      queryParams.push(value);
    } else if (operator === 'between') {
      const startDate = value.gte || value.start;
      const endDate = value.lte || value.end;
      condition = `DATE(t.${column}) BETWEEN DATE($${paramIndex++}) AND DATE($${paramIndex++})`;
      queryParams.push(startDate, endDate);
    } else if (operator === 'on' || operator === 'equals') {
      condition = `DATE(t.${column}) = DATE($${paramIndex++})`;
      queryParams.push(value);
    }
  }
  
  // Handle BOOLEAN type
  else if (dataType === 'boolean' || dataType === 'bool') {
    if (operator === 'is_true') {
      condition = `t.${column} = true`;
    } else if (operator === 'is_false') {
      condition = `t.${column} = false`;
    } else if (operator === 'any') {
      condition = '1=1';
    }
  }
  
  return { condition, newParamIndex: paramIndex };
};

/**
 * Search TASK tickets with advanced filters, sorting and pagination
 * @param {Object} searchParams - Search parameters including filters, sort, pagination, and lang
 * @returns {Object} Search results with data and metadata
 * 
 * Expected format:
 * {
 *   "filters": {
 *     "mode": "include" | "exclude",
 *     "operator": "AND" | "OR",
 *     "conditions": [
 *       { "column": "title", "operator": "contains", "value": "server" },
 *       { "column": "ticket_status_code", "operator": "equals", "value": ["NEW", "IN_PROGRESS"] }
 *     ]
 *   },
 *   "sort": { "by": "created_at", "direction": "desc" },
 *   "pagination": { "page": 1, "limit": 20 },
 *   "lang": "fr"
 * }
 */
const searchTasks = async (searchParams) => {
  try {
    logger.info('[TASK SERVICE] Searching tickets with advanced filters:', JSON.stringify(searchParams, null, 2));
    
    const { filters = {}, sort = {}, pagination = {}, lang = 'en' } = searchParams;
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;
    const { by: sortBy = 'created_at', direction: sortDirection = 'desc' } = sort;
    
    logger.info(`[TASK SERVICE] Sort parameters: sortBy="${sortBy}", sortDirection="${sortDirection}"`);
    logger.info(`[TASK SERVICE] Pagination: page=${page}, limit=${limit}, offset=${offset}`);
    logger.info(`[TASK SERVICE] Language: ${lang}`);
    
    // Build WHERE clause from advanced filters
    const queryParams = [];
    let paramIndex = 1;
    let whereClause = '';
    
    // Always filter by ticket_type = TASK
    const baseConditions = [`t.ticket_type_code = 'TASK'`];
    
    // Validate filter format
    if (Object.keys(filters).length > 0) {
      if (!filters.conditions || !Array.isArray(filters.conditions)) {
        const error = new Error(
          'Invalid filter format. filters.conditions must be an array. ' +
          'Example: { "filters": { "conditions": [{ "column": "title", "operator": "contains", "value": "server" }] } }'
        );
        logger.error('[TASK SERVICE] Missing or invalid filters.conditions');
        throw error;
      }
      
      if (filters.conditions.length > 0) {
        const mode = filters.mode || 'include';
        const operator = (filters.operator || 'AND').toUpperCase();
        
        logger.info(`[TASK SERVICE] Processing ${filters.conditions.length} advanced filter(s) with mode=${mode}, operator=${operator}`);
        
        const filterConditions = [];
        
        // Process each filter condition
        for (const filterDef of filters.conditions) {
          const { column } = filterDef;
          
          logger.info(`[TASK SERVICE] Processing filter condition:`, JSON.stringify(filterDef));
          
          if (!column) {
            logger.warn('[TASK SERVICE] Filter condition missing column, skipping');
            continue;
          }
          
          // Get column metadata to determine data type
          const metadataQuery = `
            SELECT data_type 
            FROM administration.table_metadata 
            WHERE table_name = $1 AND column_name = $2
          `;
          const metadataResult = await db.query(metadataQuery, ['tickets', column]);
          
          logger.info(`[TASK SERVICE] Metadata query result for column ${column}:`, metadataResult.rows);
          
          if (metadataResult.rows.length === 0) {
            logger.warn(`[TASK SERVICE] No metadata for column ${column}, skipping filter`);
            continue;
          }
          
          const { data_type } = metadataResult.rows[0];
          logger.info(`[TASK SERVICE] Column ${column} has data_type: ${data_type}`);
          
          // Build the condition for this filter
          const { condition, newParamIndex } = buildFilterCondition(
            column,
            filterDef,
            data_type,
            queryParams,
            paramIndex
          );
          
          logger.info(`[TASK SERVICE] buildFilterCondition returned: condition="${condition}", newParamIndex=${newParamIndex}`);
          
          if (condition) {
            filterConditions.push(condition);
            paramIndex = newParamIndex;
            logger.info(`[TASK SERVICE] Added filter: ${condition}`);
          } else {
            logger.warn(`[TASK SERVICE] buildFilterCondition returned empty condition for column ${column}`);
          }
        }
        
        // Combine all filter conditions
        if (filterConditions.length > 0) {
          const combinedConditions = filterConditions.join(` ${operator} `);
          
          // Apply mode: include or exclude
          if (mode === 'exclude') {
            baseConditions.push(`NOT (${combinedConditions})`);
          } else {
            baseConditions.push(combinedConditions);
          }
          
          logger.info(`[TASK SERVICE] Filter conditions added to base conditions`);
        }
      }
    }
    
    whereClause = `WHERE ${baseConditions.join(' AND ')}`;
    logger.info(`[TASK SERVICE] Final WHERE clause: ${whereClause}`);
    
    // Count total results
    const countQuery = `
      SELECT COUNT(*) as total
      FROM core.tickets t
      ${whereClause}
    `;
    
    logger.info(`[TASK SERVICE] Count query params: ${JSON.stringify(queryParams)}`);
    
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);
    
    // Get paginated results with all data
    const dataQuery = `
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
        t.core_extended_attributes,
        t.user_extended_attributes,
        
        -- Person names
        p1.first_name || ' ' || p1.last_name as requested_by_name,
        p2.first_name || ' ' || p2.last_name as requested_for_name,
        p3.first_name || ' ' || p3.last_name as writer_name,
        
        -- Translated labels
        COALESCE(ttt.label, tt.code) as ticket_type_label,
        COALESCE(tst.label, ts.code) as ticket_status_label,
        
        -- Assignment info
        g.uuid as assigned_to_group,
        g.group_name as assigned_group_name,
        p4.uuid as assigned_to_person,
        p4.first_name || ' ' || p4.last_name as assigned_person_name
        
      FROM core.tickets t
      LEFT JOIN configuration.persons p1 ON t.requested_by_uuid = p1.uuid
      LEFT JOIN configuration.persons p2 ON t.requested_for_uuid = p2.uuid
      LEFT JOIN configuration.persons p3 ON t.writer_uuid = p3.uuid
      JOIN configuration.ticket_types tt ON t.ticket_type_code = tt.code
      JOIN configuration.ticket_status ts ON t.ticket_status_code = ts.code AND ts.rel_ticket_type = tt.code
      LEFT JOIN translations.ticket_types_translation ttt ON tt.uuid = ttt.ticket_type_uuid AND ttt.lang = $${paramIndex}
      LEFT JOIN translations.ticket_status_translation tst ON ts.uuid = tst.ticket_status_uuid AND tst.lang = $${paramIndex}
      LEFT JOIN (
        SELECT rel_ticket, rel_assigned_to_group, rel_assigned_to_person
        FROM core.rel_tickets_groups_persons
        WHERE type = 'ASSIGNED' AND (ended_at IS NULL OR ended_at > NOW())
      ) rtgp ON t.uuid = rtgp.rel_ticket
      LEFT JOIN configuration.groups g ON rtgp.rel_assigned_to_group = g.uuid
      LEFT JOIN configuration.persons p4 ON rtgp.rel_assigned_to_person = p4.uuid
      ${whereClause}
      ORDER BY t.${sortBy} ${sortDirection.toUpperCase()}
      LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}
    `;
    
    queryParams.push(lang, limit, offset);
    
    logger.info(`[TASK SERVICE] Data query params: ${JSON.stringify(queryParams)}`);
    
    const dataResult = await db.query(dataQuery, queryParams);
    
    // Calculate pagination metadata
    const currentPage = page;
    const totalPages = Math.ceil(total / limit);
    const hasMore = offset + limit < total;
    
    logger.info(`[TASK SERVICE] Found ${dataResult.rows.length} tickets (total: ${total})`);
    
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
    logger.error('[TASK SERVICE] Error searching tickets:', error);
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

/**
 * Get filter values for a specific column in tickets table (for tasks)
 * @param {string} columnName - Name of the column
 * @param {string} searchQuery - Optional search query for dynamic filters
 * @param {string} lang - Language code for translations (e.g., 'fr', 'en', 'es')
 * @returns {Object} Filter values
 */
const getTasksFilterValues = async (columnName, searchQuery = null, lang = 'en') => {
  try {
    logger.info(`[TASK SERVICE] Getting filter values for tickets.${columnName} (lang: ${lang})`);
    
    // First, get the metadata for this column
    const metadataQuery = `
      SELECT 
        filter_type,
        filter_options,
        is_foreign_key,
        related_table,
        related_column,
        is_multilang,
        related_translation_table,
        translation_foreign_key,
        translation_label_column
      FROM administration.table_metadata
      WHERE table_name = $1 AND column_name = $2
    `;
    
    const metadataResult = await db.query(metadataQuery, ['tickets', columnName]);
    
    if (metadataResult.rows.length === 0) {
      throw new Error(`No metadata found for tickets.${columnName}`);
    }
    
    const metadata = metadataResult.rows[0];
    let values = [];
    
    // Helper function to get table with schema
    const getTableWithSchema = (tableName) => {
      if (tableName.includes('.')) return tableName;
      return `core.${tableName}`;
    };
    
    // Handle different filter types
    switch (metadata.filter_type) {
      case 'checkbox':
        // Get distinct values for checkbox filter
        if (metadata.is_foreign_key && metadata.related_table) {
          // Check if this column is multilingual
          if (metadata.is_multilang && metadata.related_translation_table) {
            logger.info(`[TASK SERVICE] Using multilingual query for ${columnName}`);
            
            // Determine value column based on related_column
            const valueColumn = metadata.related_column || 'uuid';
            const labelColumn = metadata.translation_label_column || 'label';
            
            // Build multilingual query
            // Special handling for ticket_status_code: filter by rel_ticket_type
            let additionalFilter = '';
            if (columnName === 'ticket_status_code' && metadata.related_table === 'configuration.ticket_status') {
              additionalFilter = " AND r.rel_ticket_type = 'TASK'";
            } else if (columnName === 'ticket_type_code' && metadata.related_table === 'configuration.ticket_types') {
              // For ticket types, we might want to filter specific types
              // For now, no additional filter needed
            }
            
            const multilingualQuery = `
              SELECT DISTINCT
                r.${valueColumn} as value,
                tr.${labelColumn} as label
              FROM ${metadata.related_table} r
              INNER JOIN ${metadata.related_translation_table} tr ON tr.${metadata.translation_foreign_key} = r.uuid
              WHERE tr.lang = $1
                AND tr.${labelColumn} IS NOT NULL${additionalFilter}
              ORDER BY tr.${labelColumn}
            `;
            
            logger.info(`[TASK SERVICE] Multilingual query: ${multilingualQuery}`);
            const multilingualResult = await db.query(multilingualQuery, [lang]);
            values = multilingualResult.rows;
          } else {
            // Non-multilingual foreign key
            let labelColumn = 'name';
            let valueColumn = 'uuid';
            
            // Special cases for tables without 'name' column
            if (metadata.related_table === 'configuration.ticket_status' || 
                metadata.related_table === 'configuration.ticket_types') {
              labelColumn = 'code';
              valueColumn = 'code';
            } else if (metadata.related_table === 'configuration.persons') {
              // For persons table, concatenate first_name and last_name
              labelColumn = "first_name || ' ' || last_name";
              valueColumn = 'uuid';
            }
            
            // If it's a foreign key, get values from related table
            const fkQuery = `
              SELECT DISTINCT
                r.${valueColumn} as value,
                r.${labelColumn} as label
              FROM ${metadata.related_table} r
              INNER JOIN ${getTableWithSchema('tickets')} t ON t.${columnName} = r.${metadata.related_column || 'uuid'}
              WHERE r.${labelColumn} IS NOT NULL
                AND t.ticket_type_code = 'TASK'
              ORDER BY r.${labelColumn}
            `;
            
            logger.info(`[TASK SERVICE] Non-multilingual FK query: ${fkQuery}`);
            const fkResult = await db.query(fkQuery);
            values = fkResult.rows;
          }
        } else {
          // Get distinct values from the column itself
          const distinctQuery = `
            SELECT DISTINCT ${columnName} as value
            FROM ${getTableWithSchema('tickets')}
            WHERE ${columnName} IS NOT NULL
              AND ticket_type_code = 'TASK'
            ORDER BY ${columnName}
          `;
          const distinctResult = await db.query(distinctQuery);
          values = distinctResult.rows.map(row => ({
            value: row.value,
            label: row.value
          }));
        }
        break;
        
      case 'search':
        if (searchQuery) {
          // Dynamic search based on query
          if (metadata.is_foreign_key && metadata.related_table) {
            // Check if this column is multilingual
            if (metadata.is_multilang && metadata.related_translation_table) {
              logger.info(`[TASK SERVICE] Using multilingual search for ${columnName}`);
              
              const valueColumn = metadata.related_column || 'uuid';
              const labelColumn = metadata.translation_label_column || 'label';
              
              // Special handling for ticket_status_code: filter by rel_ticket_type
              let additionalFilter = '';
              if (columnName === 'ticket_status_code' && metadata.related_table === 'configuration.ticket_status') {
                additionalFilter = " AND r.rel_ticket_type = 'TASK'";
              }
              
              // Search in translation table
              const searchMultilingualQuery = `
                SELECT DISTINCT
                  r.${valueColumn} as value,
                  tr.${labelColumn} as label
                FROM ${metadata.related_table} r
                INNER JOIN ${metadata.related_translation_table} tr ON tr.${metadata.translation_foreign_key} = r.uuid
                WHERE tr.lang = $1
                  AND LOWER(tr.${labelColumn}) LIKE LOWER($2)
                  AND tr.${labelColumn} IS NOT NULL${additionalFilter}
                ORDER BY tr.${labelColumn}
                LIMIT 20
              `;
              
              const searchMultilingualResult = await db.query(searchMultilingualQuery, [lang, `%${searchQuery}%`]);
              values = searchMultilingualResult.rows;
            } else {
              // Non-multilingual search
              let labelColumn = 'name';
              let valueColumn = 'uuid';
              
              // Special cases for tables without 'name' column
              if (metadata.related_table === 'configuration.ticket_status' || 
                  metadata.related_table === 'configuration.ticket_types') {
                labelColumn = 'code';
                valueColumn = 'code';
              } else if (metadata.related_table === 'configuration.persons') {
                // For persons table, concatenate first_name and last_name
                labelColumn = "first_name || ' ' || last_name";
                valueColumn = 'uuid';
              }
              
              // Search in related table
              const searchFkQuery = `
                SELECT DISTINCT
                  r.${valueColumn} as value,
                  r.${labelColumn} as label
                FROM ${metadata.related_table} r
                WHERE LOWER(r.${labelColumn}) LIKE LOWER($1)
                ORDER BY r.${labelColumn}
                LIMIT 20
              `;
              const searchFkResult = await db.query(searchFkQuery, [`%${searchQuery}%`]);
              values = searchFkResult.rows;
            }
          } else {
            // Search in the column itself
            const searchColumnQuery = `
              SELECT DISTINCT ${columnName} as value
              FROM ${getTableWithSchema('tickets')}
              WHERE LOWER(CAST(${columnName} AS TEXT)) LIKE LOWER($1)
                AND ${columnName} IS NOT NULL
                AND ticket_type_code = 'TASK'
              ORDER BY ${columnName}
              LIMIT 20
            `;
            const searchColumnResult = await db.query(searchColumnQuery, [`%${searchQuery}%`]);
            values = searchColumnResult.rows.map(row => ({
              value: row.value,
              label: row.value
            }));
          }
        }
        break;
        
      case 'select':
        // Get all possible values for select filter
        if (metadata.filter_options && metadata.filter_options.options) {
          // Static options from metadata
          values = metadata.filter_options.options.map(option => ({
            value: option,
            label: option
          }));
        } else if (metadata.is_foreign_key && metadata.related_table) {
          // Determine the label column based on the related table
          let labelColumn = 'name';
          let valueColumn = 'uuid';
          
          // Special cases for tables without 'name' column
          if (metadata.related_table === 'configuration.ticket_status' || 
              metadata.related_table === 'configuration.ticket_types') {
            labelColumn = 'code';
            valueColumn = 'code';
          } else if (metadata.related_table === 'configuration.persons') {
            // For persons table, concatenate first_name and last_name
            labelColumn = "first_name || ' ' || last_name";
            valueColumn = 'uuid';
          }
          
          // Dynamic options from related table
          const selectQuery = `
            SELECT DISTINCT
              ${valueColumn} as value,
              ${labelColumn} as label
            FROM ${metadata.related_table}
            WHERE ${labelColumn} IS NOT NULL
            ORDER BY ${labelColumn}
          `;
          const selectResult = await db.query(selectQuery);
          values = selectResult.rows;
        }
        break;
        
      case 'date_range':
        // Return min and max dates
        const dateRangeQuery = `
          SELECT 
            MIN(${columnName}) as min_date,
            MAX(${columnName}) as max_date
          FROM ${getTableWithSchema('tickets')}
          WHERE ${columnName} IS NOT NULL
            AND ticket_type_code = 'TASK'
        `;
        const dateRangeResult = await db.query(dateRangeQuery);
        return {
          min: dateRangeResult.rows[0].min_date,
          max: dateRangeResult.rows[0].max_date
        };
        
      default:
        logger.warn(`[TASK SERVICE] Unknown filter type: ${metadata.filter_type}`);
        break;
    }
    
    logger.info(`[TASK SERVICE] Found ${values.length} values for ${columnName}`);
    return values;
    
  } catch (error) {
    logger.error('[TASK SERVICE] Error getting filter values:', error);
    throw error;
  }
};

module.exports = {
    getTaskById,
    searchTasks,
    createTask,
    updateTask,
    getTasksFilterValues
};
