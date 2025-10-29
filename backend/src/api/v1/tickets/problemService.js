const db = require('../../../config/database');
const logger = require('../../../config/logger');
const ticketService = require('./service');

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
                    AND rpc.dependency_code = 'KNOWNERROR'
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
                    AND rpc.dependency_code = 'CHANGE'
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
                    AND rpc.dependency_code = 'INCIDENT'
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
            LEFT JOIN translations.incident_setup_labels iil ON
                iil.rel_incident_setup_code = t.core_extended_attributes->>'impact'
                AND iil.lang = $2
                
            -- Jointure pour la traduction des urgences
            LEFT JOIN translations.incident_setup_labels iul ON
                iul.rel_incident_setup_code = t.core_extended_attributes->>'urgency'
                AND iul.lang = $2
            
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
 * Crée un nouveau problème
 * @param {Object} problemData - Données pour la création du problème
 * @returns {Promise<Object>} - Détails du problème créé
 */
const createProblem = async (problemData) => {
    logger.info('[PROBLEM SERVICE] Preparing data for problem creation');
    
    // Définir les champs standards pour un problème
    const standardFields = {
        title: problemData.title,
        description: problemData.description,
        configuration_item_uuid: problemData.configuration_item_uuid,
        ticket_type_code: 'PROBLEM',
        ticket_status_code: problemData.ticket_status_code || 'NEW',
        requested_by_uuid: problemData.requested_by_uuid || problemData.writer_uuid,
        requested_for_uuid: problemData.requested_for_uuid || problemData.writer_uuid,
        writer_uuid: problemData.writer_uuid
    };
    
    // Définir les champs d'assignation pour un problème
    const assignmentFields = {
        assigned_to_group: problemData.assigned_to_group,
        assigned_to_person: problemData.assigned_to_person
    };
    
    // Définir les attributs étendus pour un problème
    const extendedAttributesFields = {};
    
    // Liste des champs spécifiques aux problèmes
    const problemExtendedFields = [
        'rel_problem_categories_code', 'rel_service', 'rel_service_offerings',
        'impact', 'urgency', 'symptoms_description', 'workaround',
        'root_cause', 'definitive_solution', 'target_resolution_date',
        'actual_resolution_date', 'actual_resolution_workload', 'closure_justification',
        'pbm_closed_at'
    ];
    
    // Ajouter chaque champ présent dans problemData aux attributs étendus
    problemExtendedFields.forEach(field => {
        if (problemData[field] !== undefined) {
            extendedAttributesFields[field] = problemData[field];
        }
    });
    
    // Gérer la liste des observateurs (watchers)
    const watchList = problemData.watch_list && Array.isArray(problemData.watch_list) ? 
        problemData.watch_list : [];
    
    if (watchList.length > 0) {
        logger.info(`[PROBLEM SERVICE] Processing ${watchList.length} watchers for problem creation`);
    }
    
    logger.info('[PROBLEM SERVICE] Successfully prepared data for problem creation');
    
    // Préparer les relations parent-enfant
    const parentChildRelations = [];
    
    // Gérer la liste des erreurs connues (knownerrors_list)
    if (problemData.knownerrors_list && Array.isArray(problemData.knownerrors_list) && problemData.knownerrors_list.length > 0) {
        problemData.knownerrors_list.forEach(knownErrorUuid => {
            parentChildRelations.push({
                childUuid: knownErrorUuid,
                dependencyCode: 'KNOWNERROR'
            });
        });
        logger.info(`[PROBLEM SERVICE] Prepared ${problemData.knownerrors_list.length} known error relations`);
    }
    
    // Gérer la liste des changements (changes_list)
    if (problemData.changes_list && Array.isArray(problemData.changes_list) && problemData.changes_list.length > 0) {
        problemData.changes_list.forEach(changeUuid => {
            parentChildRelations.push({
                childUuid: changeUuid,
                dependencyCode: 'CHANGE'
            });
        });
        logger.info(`[PROBLEM SERVICE] Prepared ${problemData.changes_list.length} change relations`);
    }
    
    // Gérer la liste des incidents (incidents_list)
    if (problemData.incidents_list && Array.isArray(problemData.incidents_list) && problemData.incidents_list.length > 0) {
        problemData.incidents_list.forEach(incidentUuid => {
            parentChildRelations.push({
                childUuid: incidentUuid,
                dependencyCode: 'INCIDENT'
            });
        });
        logger.info(`[PROBLEM SERVICE] Prepared ${problemData.incidents_list.length} incident relations`);
    }
    
    // Appeler applyCreation pour créer effectivement le ticket
    const { applyCreation } = require('./service');
    
    return await applyCreation(
        problemData,
        'PROBLEM',
        standardFields,
        assignmentFields,
        extendedAttributesFields,
        watchList,
        parentChildRelations,
        getProblemById,
        '[PROBLEM SERVICE]'
    );
};

/**
 * Met à jour partiellement un problème par son UUID
 * @param {string} uuid - UUID du problème à mettre à jour
 * @param {Object} updateData - Données à mettre à jour
 * @returns {Promise<Object>} - Détails du problème mis à jour
 */
const updateProblem = async (uuid, updateData) => {
    // Définir les champs spécifiques aux problèmes
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
        'root_cause', 'definitive_solution', 'target_resolution_date',
        'actual_resolution_date', 'actual_resolution_workload', 'closure_justification'
    ];
    
    // Utiliser la fonction applyUpdate du service.js
    const { applyUpdate } = require('./service');
    return await applyUpdate(
        uuid,
        updateData,
        'PROBLEM',
        standardFields,
        assignmentFields,
        extendedAttributesFields,
        getProblemById,
        '[PROBLEM SERVICE]'
    );
};

const { buildFilterCondition: buildGenericFilterCondition } = require('./ticketFilterBuilder');

/**
 * Build filter condition for problems search (wrapper with PROBLEM-specific JSONB columns)
 * @param {string} column - Column name
 * @param {Object} filterDef - Filter definition with operator and value(s)
 * @param {string} dataType - Column data type (text, number, date, boolean)
 * @param {Array} queryParams - Array to push parameters into
 * @param {number} paramIndex - Current parameter index
 * @returns {Object} { condition: string, newParamIndex: number }
 */
const buildFilterCondition = (column, filterDef, dataType, queryParams, paramIndex) => {
  return buildGenericFilterCondition(column, filterDef, dataType, queryParams, paramIndex, {
    jsonbDateColumns: ['target_resolution_date', 'actual_resolution_date'],
    jsonbNumericColumns: ['actual_resolution_workload'],
    jsonbTextColumns: [
      'impact', 'urgency', 'rel_problem_categories_code', 
      'rel_service', 'rel_service_offerings', 
      'symptoms_description', 'workaround', 'root_cause', 
      'definitive_solution', 'closure_justification'
    ],
    servicePrefix: '[PROBLEM SERVICE]'
  });
};

/**
 * Get problems with lazy search - returns paginated results filtered by search query
 * @param {string} [searchQuery] - Optional search term to filter problems
 * @param {number} [page=1] - Page number (1-indexed)
 * @param {number} [limit=10] - Number of results per page
 * @param {string} [lang='en'] - Language code for translations
 * @returns {Promise<Object>} Object with data and pagination metadata
 */
const getProblemsLazySearch = async (searchQuery = '', page = 1, limit = 10, lang = 'en') => {
    try {
        logger.info(`[PROBLEM SERVICE] Getting problems with lazy search: "${searchQuery}", page: ${page}, limit: ${limit}, lang: ${lang}`);
        
        // Validate and sanitize pagination parameters
        const validPage = Math.max(1, parseInt(page) || 1);
        const validLimit = Math.min(50, Math.max(1, parseInt(limit) || 10)); // Max 50 per page
        const offset = (validPage - 1) * validLimit;
        
        // Separate WHERE clauses for COUNT and main query
        let countWhereClause = `WHERE t.ticket_type_code = 'PROBLEM'`;
        let mainWhereClause = `WHERE t.ticket_type_code = 'PROBLEM'`;
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
        
        // Main query to fetch problems
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
                ci.name as configuration_item_name,
                t.core_extended_attributes->>'rel_problem_categories_code' as problem_category_code,
                COALESCE(pcl.label, t.core_extended_attributes->>'rel_problem_categories_code') as problem_category_label,
                t.core_extended_attributes->>'impact' as impact,
                COALESCE(iil.label, t.core_extended_attributes->>'impact') as impact_label,
                t.core_extended_attributes->>'urgency' as urgency,
                COALESCE(iul.label, t.core_extended_attributes->>'urgency') as urgency_label
            FROM core.tickets t
            JOIN configuration.persons p3 ON t.writer_uuid = p3.uuid
            JOIN configuration.ticket_status ts ON t.ticket_status_code = ts.code AND ts.rel_ticket_type = 'PROBLEM'
            LEFT JOIN translations.ticket_status_translation tst ON ts.uuid = tst.ticket_status_uuid AND tst.lang = $1
            LEFT JOIN data.configuration_items ci ON t.configuration_item_uuid = ci.uuid
            LEFT JOIN translations.problem_categories_labels pcl ON 
                pcl.rel_problem_category_code = t.core_extended_attributes->>'rel_problem_categories_code'
                AND pcl.lang = $1
            LEFT JOIN translations.incident_setup_labels iil ON
                iil.rel_incident_setup_code = t.core_extended_attributes->>'impact'
                AND iil.lang = $1
            LEFT JOIN translations.incident_setup_labels iul ON
                iul.rel_incident_setup_code = t.core_extended_attributes->>'urgency'
                AND iul.lang = $1
            ${mainWhereClause}
            ORDER BY t.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        queryParams.push(validLimit, offset);
        
        const { rows } = await db.query(query, queryParams);
        
        const hasMore = offset + rows.length < total;
        
        logger.info(`[PROBLEM SERVICE] Retrieved ${rows.length} problems (page ${validPage}, total: ${total}, hasMore: ${hasMore})`);
        
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
        logger.error('[PROBLEM SERVICE] Error in lazy search:', error);
        throw error;
    }
};

/**
 * Search PROBLEM tickets with advanced filters, sorting and pagination
 * @param {Object} searchParams - Search parameters including filters, sort, pagination, and lang
 * @returns {Object} Search results with data and metadata
 */
const searchProblems = async (searchParams) => {
  try {
    logger.info('[PROBLEM SERVICE] Searching problems with advanced filters:', JSON.stringify(searchParams, null, 2));
    
    const { filters = {}, sort = {}, pagination = {}, lang = 'en' } = searchParams;
    const { page = 1, limit = 25 } = pagination;
    const offset = (page - 1) * limit;
    const { by: sortBy = 'created_at', direction: sortDirection = 'desc' } = sort;
    
    // Mapping des colonnes affichées (frontend) vers les expressions SQL triables (backend)
    const sortColumnMapping = {
      'writer_name': "p3.first_name || ' ' || p3.last_name",
      'ticket_status_label': 'COALESCE(tst.label, ts.code)',
      'requested_by_name': "p1.first_name || ' ' || p1.last_name",
      'requested_for_name': "p2.first_name || ' ' || p2.last_name",
      'assigned_group_name': 'g.group_name',
      'assigned_person_name': "p4.first_name || ' ' || p4.last_name",
      'ticket_type_label': 'COALESCE(ttt.label, tt.code)',
      'configuration_item_name': 'ci.name',
      'problem_category_label': 'COALESCE(pcl.label, t.core_extended_attributes->>\'rel_problem_categories_code\')',
      'impact_label': 'COALESCE(iil.label, t.core_extended_attributes->>\'impact\')',
      'urgency_label': 'COALESCE(iul.label, t.core_extended_attributes->>\'urgency\')',
      'rel_service_name': 's.name',
      'rel_service_offerings_name': 'so.name',
      // Colonnes de la table tickets
      'uuid': 't.uuid',
      'title': 't.title',
      'description': 't.description',
      'created_at': 't.created_at',
      'updated_at': 't.updated_at',
      'closed_at': 't.closed_at',
      // Colonnes JSONB dans core_extended_attributes
      'target_resolution_date': "(t.core_extended_attributes->>'target_resolution_date')::timestamp",
      'actual_resolution_date': "(t.core_extended_attributes->>'actual_resolution_date')::timestamp",
      'actual_resolution_workload': "(t.core_extended_attributes->>'actual_resolution_workload')::numeric",
      'symptoms_description': "t.core_extended_attributes->>'symptoms_description'",
      'workaround': "t.core_extended_attributes->>'workaround'",
      'root_cause': "t.core_extended_attributes->>'root_cause'",
      'definitive_solution': "t.core_extended_attributes->>'definitive_solution'",
      'closure_justification': "t.core_extended_attributes->>'closure_justification'"
    };
    
    // Obtenir l'expression SQL pour le tri
    const sortExpression = sortColumnMapping[sortBy] || `t.${sortBy}`;
    
    logger.info(`[PROBLEM SERVICE] Sort parameters: sortBy="${sortBy}" → SQL expression: "${sortExpression}", sortDirection="${sortDirection}"`);
    logger.info(`[PROBLEM SERVICE] Pagination: page=${page}, limit=${limit}, offset=${offset}`);
    logger.info(`[PROBLEM SERVICE] Language: ${lang}`);
    
    // Build WHERE clause from advanced filters
    const queryParams = [];
    let paramIndex = 1;
    let whereClause = '';
    
    // Always filter by ticket_type = PROBLEM
    const baseConditions = [`t.ticket_type_code = 'PROBLEM'`];
    
    // Validate filter format
    if (Object.keys(filters).length > 0) {
      if (!filters.conditions || !Array.isArray(filters.conditions)) {
        const error = new Error(
          'Invalid filter format. filters.conditions must be an array. ' +
          'Example: { "filters": { "conditions": [{ "column": "title", "operator": "contains", "value": "server" }] } }'
        );
        logger.error('[PROBLEM SERVICE] Missing or invalid filters.conditions');
        throw error;
      }
      
      if (filters.conditions.length > 0) {
        const mode = filters.mode || 'include';
        const operator = (filters.operator || 'AND').toUpperCase();
        
        logger.info(`[PROBLEM SERVICE] Processing ${filters.conditions.length} advanced filter(s) with mode=${mode}, operator=${operator}`);
        
        const filterConditions = [];
        
        // Process each filter condition
        for (const filterDef of filters.conditions) {
          const { column } = filterDef;
          
          logger.info(`[PROBLEM SERVICE] Processing filter condition:`, JSON.stringify(filterDef));
          
          if (!column) {
            logger.warn('[PROBLEM SERVICE] Filter condition missing column, skipping');
            continue;
          }
          
          // Get column metadata to determine data type
          const metadataQuery = `
            SELECT data_type 
            FROM administration.table_metadata 
            WHERE table_name = $1 AND column_name = $2
          `;
          const metadataResult = await db.query(metadataQuery, ['tickets', column]);
          
          logger.info(`[PROBLEM SERVICE] Metadata query result for column ${column}:`, metadataResult.rows);
          
          if (metadataResult.rows.length === 0) {
            logger.warn(`[PROBLEM SERVICE] No metadata for column ${column}, skipping filter`);
            continue;
          }
          
          const { data_type } = metadataResult.rows[0];
          logger.info(`[PROBLEM SERVICE] Column ${column} has data_type: ${data_type}`);
          
          // Build the condition for this filter
          const { condition, newParamIndex } = buildFilterCondition(
            column,
            filterDef,
            data_type,
            queryParams,
            paramIndex
          );
          
          logger.info(`[PROBLEM SERVICE] buildFilterCondition returned: condition="${condition}", newParamIndex=${newParamIndex}`);
          
          if (condition) {
            filterConditions.push(condition);
            paramIndex = newParamIndex;
            logger.info(`[PROBLEM SERVICE] Added filter: ${condition}`);
          } else {
            logger.warn(`[PROBLEM SERVICE] buildFilterCondition returned empty condition for column ${column}`);
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
          
          logger.info(`[PROBLEM SERVICE] Filter conditions added to base conditions`);
        }
      }
    }
    
    whereClause = `WHERE ${baseConditions.join(' AND ')}`;
    logger.info(`[PROBLEM SERVICE] Final WHERE clause: ${whereClause}`);
    
    // Count total results
    const countQuery = `
      SELECT COUNT(*) as total
      FROM core.tickets t
      ${whereClause}
    `;
    
    logger.info(`[PROBLEM SERVICE] Count query params: ${JSON.stringify(queryParams)}`);
    
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);
    
    // Get paginated results with all data
    const dataQuery = `
      SELECT 
        t.uuid,
        t.title,
        t.description,
        t.configuration_item_uuid,
        ci.name as configuration_item_name,
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
        p4.first_name || ' ' || p4.last_name as assigned_person_name,
        
        -- Problem-specific fields from core_extended_attributes
        t.core_extended_attributes->>'rel_problem_categories_code' as rel_problem_categories_code,
        COALESCE(pcl.label, t.core_extended_attributes->>'rel_problem_categories_code') as problem_category_label,
        t.core_extended_attributes->>'impact' as impact,
        COALESCE(iil.label, t.core_extended_attributes->>'impact') as impact_label,
        t.core_extended_attributes->>'urgency' as urgency,
        COALESCE(iul.label, t.core_extended_attributes->>'urgency') as urgency_label,
        t.core_extended_attributes->>'symptoms_description' as symptoms_description,
        t.core_extended_attributes->>'workaround' as workaround,
        t.core_extended_attributes->>'root_cause' as root_cause,
        t.core_extended_attributes->>'definitive_solution' as definitive_solution,
        t.core_extended_attributes->>'closure_justification' as closure_justification,
        (t.core_extended_attributes->>'target_resolution_date')::timestamp as target_resolution_date,
        (t.core_extended_attributes->>'actual_resolution_date')::timestamp as actual_resolution_date,
        (t.core_extended_attributes->>'actual_resolution_workload')::numeric as actual_resolution_workload,
        t.core_extended_attributes->>'rel_service' as rel_service,
        s.name as rel_service_name,
        t.core_extended_attributes->>'rel_service_offerings' as rel_service_offerings,
        so.name as rel_service_offerings_name
        
      FROM core.tickets t
      LEFT JOIN configuration.persons p1 ON t.requested_by_uuid = p1.uuid
      LEFT JOIN configuration.persons p2 ON t.requested_for_uuid = p2.uuid
      LEFT JOIN configuration.persons p3 ON t.writer_uuid = p3.uuid
      LEFT JOIN data.configuration_items ci ON t.configuration_item_uuid = ci.uuid
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
      LEFT JOIN translations.problem_categories_labels pcl ON pcl.rel_problem_category_code = t.core_extended_attributes->>'rel_problem_categories_code' AND pcl.lang = $${paramIndex}
      LEFT JOIN translations.incident_setup_labels iil ON iil.rel_incident_setup_code = t.core_extended_attributes->>'impact' AND iil.lang = $${paramIndex}
      LEFT JOIN translations.incident_setup_labels iul ON iul.rel_incident_setup_code = t.core_extended_attributes->>'urgency' AND iul.lang = $${paramIndex}
      LEFT JOIN data.services s ON t.core_extended_attributes->>'rel_service' = s.uuid::text
      LEFT JOIN data.service_offerings so ON t.core_extended_attributes->>'rel_service_offerings' = so.uuid::text
      ${whereClause}
      ORDER BY ${sortExpression} ${sortDirection.toUpperCase()}
      LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}
    `;
    
    queryParams.push(lang, limit, offset);
    
    logger.info(`[PROBLEM SERVICE] Data query params: ${JSON.stringify(queryParams)}`);
    
    const dataResult = await db.query(dataQuery, queryParams);
    
    // Calculate pagination metadata
    const currentPage = page;
    const totalPages = Math.ceil(total / limit);
    const hasMore = offset + limit < total;
    
    logger.info(`[PROBLEM SERVICE] Found ${dataResult.rows.length} problems (total: ${total})`);
    
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
    logger.error('[PROBLEM SERVICE] Error searching problems:', error);
    throw error;
  }
};

module.exports = {
    getProblemById,
    getProblemsLazySearch,
    createProblem,
    updateProblem,
    searchProblems
};
