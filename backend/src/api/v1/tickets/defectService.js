const db = require('../../../config/database');
const logger = require('../../../config/logger');
const ticketService = require('./service');

/**
 * Récupère un défaut par son UUID
 * @param {string} uuid - UUID du défaut
 * @param {string} lang - Code de langue pour les traductions (fr, en, etc.)
 * @returns {Promise<Object>} - Détails du défaut
 */
const getDefectById = async (uuid, lang = 'en') => {
    logger.info(`[DEFECT SERVICE] Fetching defect with UUID: ${uuid} and language: ${lang}`);
    
    try {
        // Requête SQL pour récupérer les détails du défaut avec les données d'assignation
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
                p4.uuid as rel_assigned_to_person,
                p4.first_name || ' ' || p4.last_name as assigned_person_name,
                
                -- Champs spécifiques aux défauts depuis core_extended_attributes
                t.core_extended_attributes->'tags' as tags,
                t.core_extended_attributes->>'severity' as severity,
                t.core_extended_attributes->>'workaround' as workaround,
                t.core_extended_attributes->>'environment' as environment,
                t.core_extended_attributes->>'impact_area' as impact_area,
                t.core_extended_attributes->>'expected_behavior' as expected_behavior,
                t.core_extended_attributes->>'steps_to_reproduce' as steps_to_reproduce,
                
                -- Labels traduits pour les champs avec référence
                COALESCE(severity_t.label, t.core_extended_attributes->>'severity') as severity_label,
                COALESCE(environment_t.label, t.core_extended_attributes->>'environment') as environment_label,
                COALESCE(impact_area_t.label, t.core_extended_attributes->>'impact_area') as impact_area_label,
                
                -- Récupération du titre et de l'UUID du projet parent
                (
                    SELECT parent.title
                    FROM core.rel_parent_child_tickets rpc
                    JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid
                    WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'DEFECT' AND rpc.ended_at IS NULL
                    LIMIT 1
                ) as project_name,
                (
                    SELECT parent.uuid
                    FROM core.rel_parent_child_tickets rpc
                    JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid
                    WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'DEFECT' AND rpc.ended_at IS NULL
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
                
            -- Jointure pour l'assignation (équipe et personne)
            LEFT JOIN (
                SELECT rel_ticket, rel_assigned_to_group, rel_assigned_to_person
                FROM core.rel_tickets_groups_persons
                WHERE type = 'ASSIGNED' AND ended_at IS NULL
            ) rtgp ON t.uuid = rtgp.rel_ticket
            LEFT JOIN configuration.groups g ON rtgp.rel_assigned_to_group = g.uuid
            LEFT JOIN configuration.persons p4 ON rtgp.rel_assigned_to_person = p4.uuid
            
            -- Jointures pour les labels traduits des champs de référence
            LEFT JOIN translations.defect_setup_labels severity_t ON 
                severity_t.rel_defect_setup_code = t.core_extended_attributes->>'severity' AND severity_t.lang = $2
            LEFT JOIN translations.defect_setup_labels environment_t ON 
                environment_t.rel_defect_setup_code = t.core_extended_attributes->>'environment' AND environment_t.lang = $2
            LEFT JOIN translations.defect_setup_labels impact_area_t ON 
                impact_area_t.rel_defect_setup_code = t.core_extended_attributes->>'impact_area' AND impact_area_t.lang = $2
            
            WHERE t.uuid = $1 AND t.ticket_type_code = 'DEFECT'
        `;
        
        const result = await db.query(query, [uuid, lang]);
        
        if (result.rows.length === 0) {
            logger.warn(`[DEFECT SERVICE] No defect found with UUID: ${uuid}`);
            return null;
        }
        
        logger.info(`[DEFECT SERVICE] Successfully retrieved defect with UUID: ${uuid}`);
        
        
        const defect = result.rows[0];
        /* Transformer les tags de format JSON string en tableau d'objets
        if (defect.tags) {
            try {
                // Parse la chaîne JSON des tags
                const parsedTags = JSON.parse(defect.tags);
                // Transformer chaque tag en objet avec propriété name
                defect.tags = parsedTags.map(tag => ({ name: tag }));
            } catch (err) {
                logger.warn(`[DEFECT SERVICE] Error parsing tags for defect ${uuid}:`, err);
                // En cas d'erreur, initialiser avec un tableau vide
                defect.tags = [];
            }
        } else {
            defect.tags = [];
        }*/
        
        // Récupérer les pièces jointes associées au défaut
        const attachmentService = require('../attachments/service');
        const attachments = await attachmentService.getAttachmentsByObjectUuid(uuid);
        defect.attachments = attachments;
        
        return defect;
    } catch (error) {
        logger.error(`[DEFECT SERVICE] Error fetching defect with UUID ${uuid}:`, error);
        throw error;
    }
};

/**
 * Updates a defect partially by its UUID
 * @param {string} uuid - UUID of the defect to update
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated defect details
 */
const updateDefect = async (uuid, updateData) => {
    // Define defect-specific fields
    const standardFields = [
        'title', 'description', 'ticket_status_code',
        'ticket_type_code', 'requested_for_uuid', 'requested_by_uuid'
    ];
    
    const assignmentFields = [
        'assigned_to_person'
    ];
    
    const extendedAttributesFields = [
        'tags', 'severity', 'workaround', 'environment',
        'impact_area', 'expected_behavior', 'steps_to_reproduce'
    ];
    
    // Extract project relation to handle separately
    const projectId = updateData.project_id;
    
    // Use functions from service.js
    const { applyUpdate, addChildrenTickets, removeChildTicket } = require('./service');
    
    // Update standard fields, assignment fields and extended attributes
    const updatedDefect = await applyUpdate(
        uuid,
        updateData,
        'DEFECT',
        standardFields,
        assignmentFields,
        extendedAttributesFields,
        getDefectById,
        '[DEFECT SERVICE]'
    );
    
    // Handle project relation if present
    if (projectId !== undefined) {
        logger.info(`[DEFECT SERVICE] Updating project relation for defect ${uuid}`);
        
        try {
            // 1. Récupérer d'abord les relations existantes pour ce type de dépendance
            const existingRelations = await db.query(
                `SELECT rel_parent_ticket_uuid FROM core.rel_parent_child_tickets 
                 WHERE rel_child_ticket_uuid = $1 AND dependency_code = $2 AND ended_at IS NULL`,
                [uuid, 'DEFECT']
            );
            
            // Logs pour débogage
            logger.info(`[DEFECT SERVICE] Found ${existingRelations.rowCount} existing project relations for defect ${uuid}`);
            logger.info(`[DEFECT SERVICE] Existing project relations: ${JSON.stringify(existingRelations.rows)}`);
            
            // 2. Supprimer chaque relation existante
            for (const row of existingRelations.rows) {
                await removeChildTicket(row.rel_parent_ticket_uuid, uuid);
                logger.info(`[DEFECT SERVICE] Removed project relation: ${row.rel_parent_ticket_uuid} -> ${uuid}`);
            }
            
            // 3. Ajouter la nouvelle relation si elle existe
            if (projectId) {
                await addChildrenTickets(projectId, 'DEFECT', [uuid]);
                logger.info(`[DEFECT SERVICE] Added new project relation: ${projectId} -> ${uuid}`);
            } else {
                logger.info(`[DEFECT SERVICE] No new project relation to add for defect ${uuid}`);
            }
        } catch (error) {
            logger.error(`[DEFECT SERVICE] Error managing project relation for defect ${uuid}:`, error);
        }
    }
    
    return updatedDefect;
};

/**
 * Crée un nouveau défaut
 * @param {Object} defectData - Données pour la création du défaut
 * @returns {Promise<Object>} - Détails du défaut créé
 */
const createDefect = async (defectData) => {
    logger.info('[DEFECT SERVICE] Creating new defect');
    
    // Définir les champs standards pour un défaut
    const standardFields = {
        title: defectData.title,
        description: defectData.description,
        configuration_item_uuid: defectData.configuration_item_uuid,
        ticket_type_code: 'DEFECT',
        ticket_status_code: defectData.ticket_status_code || 'NEW',
        requested_by_uuid: defectData.requested_by_uuid || null,
        requested_for_uuid: defectData.requested_for_uuid || null,
        writer_uuid: defectData.writer_uuid
    };
    
    // Logique d'assignation spécifique aux DEFECT
    const assignmentFields = {};
    
    // rel_assigned_to_person from body
    const relAssignedToPerson = defectData.assigned_to_person || null;
    
    // rel_assigned_to_group = uuid du groupe assigné au ticket ayant le uuid égal à project_id
    let relAssignedToGroup = null;
    if (defectData.project_id) {
        try {
            const groupQuery = `SELECT rel_assigned_to_group FROM core.rel_tickets_groups_persons WHERE rel_ticket = $1 AND type = 'ASSIGNED' LIMIT 1`;
            const groupResult = await db.query(groupQuery, [defectData.project_id]);
            if (groupResult.rows.length > 0) {
                relAssignedToGroup = groupResult.rows[0].rel_assigned_to_group;
            }
        } catch (error) {
            logger.warn(`[DEFECT SERVICE] Could not retrieve group assignment from project ${defectData.project_id}:`, error.message);
        }
    }
    
    if (relAssignedToGroup || relAssignedToPerson) {
        assignmentFields.assigned_to_group = relAssignedToGroup;
        assignmentFields.assigned_to_person = relAssignedToPerson;
        logger.info('[DEFECT SERVICE] Prepared DEFECT assignment');
    } else {
        logger.warn('[DEFECT SERVICE] DEFECT assignment: no group or person found for assignment');
    }
    
    // Définir les attributs étendus pour un défaut
    const extendedAttributesFields = {};
    
    // Remove forbidden fields
    const forbiddenFields = ['uuid', 'created_at', 'updated_at', 'sprint_id', 'project_id', 'epic_id', 'rel_assigned_to_person'];
    // Fields that go directly in columns
    const columnFields = [
        'title', 'ticket_status_code','description', 'writer_uuid',
        'ticket_type_code', 'requested_for_uuid', 'requested_by_uuid'
    ];
    
    // Everything else goes into core_extended_attributes
    Object.keys(defectData).forEach(key => {
        if (!forbiddenFields.includes(key) && !columnFields.includes(key)) {
            extendedAttributesFields[key] = defectData[key];
        }
    });
    
    // Gérer la liste des observateurs (watchers)
    const watchList = defectData.watch_list && Array.isArray(defectData.watch_list) ? 
        defectData.watch_list : [];
    
    // Pour les DEFECT, pas de relations parent-enfant dans applyCreation
    // Nous les gérerons après avec addChildrenTickets
    const parentChildRelations = [];
    
    logger.info('[DEFECT SERVICE] Successfully prepared data for defect creation');
    
    // Appeler applyCreation pour créer effectivement le ticket
    const { applyCreation, addChildrenTickets } = require('./service');
    
    const createdDefect = await applyCreation(
        defectData,
        'DEFECT',
        standardFields,
        assignmentFields,
        extendedAttributesFields,
        watchList,
        parentChildRelations,
        getDefectById,
        '[DEFECT SERVICE]'
    );
    
    // DEFECT: parent-child relationship (fille du projet)
    // Créer la relation PROJECT → DEFECT après la création du defect
    if (defectData.project_id) {
        try {
            logger.info(`[DEFECT SERVICE] Creating DEFECT relationship with PROJECT: ${defectData.project_id}`);
            await addChildrenTickets(
                defectData.project_id, // Parent UUID (le projet)
                'DEFECT', // Type de dépendance
                [createdDefect.uuid] // Enfant UUID (le defect créé)
            );
            logger.info(`[DEFECT SERVICE] Successfully created DEFECT relationship with PROJECT: ${defectData.project_id}`);
        } catch (relationError) {
            logger.error(`[DEFECT SERVICE] Error creating DEFECT relationship with PROJECT: ${relationError.message}`);
            // Ne pas faire échouer la création du defect pour une erreur de relation
        }
    }
    
    return createdDefect;
};

/**
 * Lazy search for defects with pagination
 * @param {string} [searchQuery=''] - Search term
 * @param {number} [page=1] - Page number
 * @param {number} [limit=25] - Items per page
 * @param {string} [lang='en'] - Language code for translations
 * @returns {Promise<Object>} Object with data and pagination metadata
 */
const getDefectsLazySearch = async (searchQuery = '', page = 1, limit = 25, lang = 'en') => {
    try {
        logger.info(`[DEFECT SERVICE] Getting defects with lazy search: "${searchQuery}", page: ${page}, limit: ${limit}, lang: ${lang}`);
        
        // Validate and sanitize pagination parameters
        const validPage = Math.max(1, parseInt(page) || 1);
        const validLimit = Math.min(50, Math.max(1, parseInt(limit) || 25)); // Max 50 per page
        const offset = (validPage - 1) * validLimit;
        
        let queryParams = [lang];
        let whereConditions = ["t.ticket_type_code = 'DEFECT'"];
        
        // Add search conditions if search query is provided
        if (searchQuery && searchQuery.trim()) {
            const searchTerms = searchQuery.trim().split(/\s+/).filter(term => term.length > 0);
            
            const searchConditions = searchTerms.map((term, index) => {
                const paramIndex = queryParams.length + 1;
                queryParams.push(`%${term}%`);
                return `(
                    unaccent(LOWER(t.title)) LIKE unaccent(LOWER($${paramIndex})) OR
                    unaccent(LOWER(t.description)) LIKE unaccent(LOWER($${paramIndex}))
                )`;
            });
            
            whereConditions.push(`(${searchConditions.join(' AND ')})`);
        }
        
        // Count total results for pagination
        const countQuery = `
            SELECT COUNT(*) as total
            FROM core.tickets t
            WHERE ${whereConditions.join(' AND ')}
        `;
        
        const countResult = await db.query(countQuery, queryParams);
        const total = parseInt(countResult.rows[0].total);
        
        // Get paginated data
        const query = `
            SELECT 
                t.uuid,
                t.title,
                SUBSTRING(t.description, 1, 120) as description,
                t.ticket_type_code,
                t.ticket_status_code,
                COALESCE(tst.label, ts.code) as ticket_status_label,
                t.created_at,
                t.updated_at,
                t.closed_at,
                p3.first_name || ' ' || p3.last_name as writer_name,
                t.core_extended_attributes->>'severity' as severity,
                COALESCE(
                    (SELECT dsl.label FROM translations.defect_setup_labels dsl 
                    WHERE dsl.rel_defect_setup_code = t.core_extended_attributes->>'severity' AND dsl.lang = $1),
                    t.core_extended_attributes->>'severity'
                ) as severity_label
            FROM core.tickets t
            JOIN configuration.persons p3 ON t.writer_uuid = p3.uuid
            JOIN configuration.ticket_status ts ON t.ticket_status_code = ts.code
            LEFT JOIN translations.ticket_status_translation tst ON ts.uuid = tst.ticket_status_uuid AND tst.lang = $1
            WHERE ${whereConditions.join(' AND ')}
            ORDER BY t.created_at DESC
            LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
        `;
        
        queryParams.push(validLimit, offset);
        
        const { rows } = await db.query(query, queryParams);
        
        // Calculate pagination metadata
        const totalPages = Math.ceil(total / validLimit);
        const hasMore = validPage < totalPages;
        
        logger.info(`[DEFECT SERVICE] Found ${rows.length} defects (total: ${total}, page: ${validPage}/${totalPages})`);
        
        return {
            data: rows,
            total: total,
            hasMore: hasMore,
            pagination: {
                page: validPage,
                limit: validLimit,
                total: total,
                hasMore: hasMore
            }
        };
    } catch (error) {
        logger.error('[DEFECT SERVICE] Error in lazy search:', error);
        throw error;
    }
};

/**
 * Advanced search for defects with filters, sorting, and pagination
 * @param {Object} searchParams - Search parameters including filters, sort, pagination, and lang
 * @returns {Promise<Object>} - { data: Array, total: number, hasMore: boolean, pagination: Object }
 */
const searchDefects = async (searchParams) => {
  try {
    const servicePrefix = '[DEFECT SERVICE]';
    const { buildFilterCondition } = require('./ticketFilterBuilder');
    
    const { filters = {}, sort = {}, pagination = {}, lang = 'en' } = searchParams;
    
    // Extract pagination parameters
    const page = pagination.page || 1;
    const limit = pagination.limit || 50;
    const offset = (page - 1) * limit;
    
    // Extract sort parameters
    const sortBy = sort.by || 'created_at';
    const sortDirection = sort.direction || 'desc';
    
    logger.info(`${servicePrefix} searchDefects called with: page=${page}, limit=${limit}, sortBy=${sortBy}, sortDirection=${sortDirection}, lang=${lang}`);
    
    // Build WHERE clause from advanced filters
    const queryParams = [];
    let paramIndex = 1;
    let whereClause = '';
    
    // Always filter by ticket_type = DEFECT
    const baseConditions = [`t.ticket_type_code = 'DEFECT'`];
    
    // Validate filter format
    if (filters && filters.conditions && Array.isArray(filters.conditions) && filters.conditions.length > 0) {
        const mode = filters.mode || 'include';
        const operator = (filters.operator || 'AND').toUpperCase();
        
        logger.info(`${servicePrefix} Processing ${filters.conditions.length} advanced filter(s) with mode=${mode}, operator=${operator}`);
        
        const filterConditions = [];
        
        // Define JSONB columns specific to defects
        const jsonbTextColumns = ['severity', 'environment', 'impact_area', 'workaround', 'expected_behavior', 'steps_to_reproduce'];
        const jsonbArrayColumns = ['tags'];
        
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
          
          // Build the condition for this filter using ticketFilterBuilder
          const { condition, newParamIndex } = buildFilterCondition(
            column,
            filterDef,
            data_type,
            queryParams,
            paramIndex,
            {
              jsonbTextColumns,
              jsonbArrayColumns,
              dependencyCode: 'DEFECT',
              servicePrefix
            }
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
      'requested_by_uuid': 't.requested_by_uuid',
      'requested_by_name': "p1.first_name || ' ' || p1.last_name",
      'requested_for_uuid': 't.requested_for_uuid',
      'requested_for_name': "p2.first_name || ' ' || p2.last_name",
      'assigned_to_group': 'g.uuid',
      'assigned_group_name': 'g.group_name',
      'assigned_to_person': 'p4.uuid',
      'assigned_person_name': "p4.first_name || ' ' || p4.last_name",
      'created_at': 't.created_at',
      'updated_at': 't.updated_at',
      'closed_at': 't.closed_at',
      // JSONB fields
      'severity': "t.core_extended_attributes->>'severity'",
      'severity_label': "COALESCE(severity_t.label, t.core_extended_attributes->>'severity')",
      'environment': "t.core_extended_attributes->>'environment'",
      'environment_label': "COALESCE(environment_t.label, t.core_extended_attributes->>'environment')",
      'impact_area': "t.core_extended_attributes->>'impact_area'",
      'impact_area_label': "COALESCE(impact_area_t.label, t.core_extended_attributes->>'impact_area')",
      'workaround': "t.core_extended_attributes->>'workaround'",
      'expected_behavior': "t.core_extended_attributes->>'expected_behavior'",
      'steps_to_reproduce': "t.core_extended_attributes->>'steps_to_reproduce'",
      'tags': "t.core_extended_attributes->'tags'",
      'project_title': '(SELECT parent.title FROM core.rel_parent_child_tickets rpc JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = \'DEFECT\' AND rpc.ended_at IS NULL LIMIT 1)',
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
        
        -- Assignment info
        g.uuid as assigned_to_group,
        g.group_name as assigned_group_name,
        p4.uuid as assigned_to_person,
        p4.first_name || ' ' || p4.last_name as assigned_person_name,
        
        -- Defect-specific fields from core_extended_attributes
        t.core_extended_attributes->'tags' as tags,
        t.core_extended_attributes->>'severity' as severity,
        COALESCE(severity_t.label, t.core_extended_attributes->>'severity') as severity_label,
        t.core_extended_attributes->>'environment' as environment,
        COALESCE(environment_t.label, t.core_extended_attributes->>'environment') as environment_label,
        t.core_extended_attributes->>'impact_area' as impact_area,
        COALESCE(impact_area_t.label, t.core_extended_attributes->>'impact_area') as impact_area_label,
        t.core_extended_attributes->>'workaround' as workaround,
        t.core_extended_attributes->>'expected_behavior' as expected_behavior,
        t.core_extended_attributes->>'steps_to_reproduce' as steps_to_reproduce,
        
        -- Project info
        (
          SELECT parent.title
          FROM core.rel_parent_child_tickets rpc
          JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid
          WHERE rpc.rel_child_ticket_uuid = t.uuid 
          AND rpc.dependency_code = 'DEFECT'
          AND rpc.ended_at IS NULL
          LIMIT 1
        ) as project_title,
        
        -- Attachments count
        (
          SELECT COUNT(*)
          FROM core.attachments a
          WHERE a.object_uuid = t.uuid
        ) as attachments_count
        
      FROM core.tickets t
      LEFT JOIN configuration.persons p1 ON t.requested_by_uuid = p1.uuid
      LEFT JOIN configuration.persons p2 ON t.requested_for_uuid = p2.uuid
      LEFT JOIN configuration.persons p3 ON t.writer_uuid = p3.uuid
      JOIN configuration.ticket_types tt ON t.ticket_type_code = tt.code
      JOIN configuration.ticket_status ts ON t.ticket_status_code = ts.code AND ts.rel_ticket_type = tt.code
      LEFT JOIN translations.ticket_types_translation ttt ON tt.uuid = ttt.ticket_type_uuid AND ttt.lang = $${langParamIndex}
      LEFT JOIN translations.ticket_status_translation tst ON ts.uuid = tst.ticket_status_uuid AND tst.lang = $${langParamIndex}
      LEFT JOIN (
        SELECT rel_ticket, rel_assigned_to_group, rel_assigned_to_person
        FROM core.rel_tickets_groups_persons
        WHERE type = 'ASSIGNED' AND ended_at IS NULL
      ) rtgp ON t.uuid = rtgp.rel_ticket
      LEFT JOIN configuration.groups g ON rtgp.rel_assigned_to_group = g.uuid
      LEFT JOIN configuration.persons p4 ON rtgp.rel_assigned_to_person = p4.uuid
      LEFT JOIN translations.defect_setup_labels severity_t ON severity_t.rel_defect_setup_code = t.core_extended_attributes->>'severity' AND severity_t.lang = $${langParamIndex}
      LEFT JOIN translations.defect_setup_labels environment_t ON environment_t.rel_defect_setup_code = t.core_extended_attributes->>'environment' AND environment_t.lang = $${langParamIndex}
      LEFT JOIN translations.defect_setup_labels impact_area_t ON impact_area_t.rel_defect_setup_code = t.core_extended_attributes->>'impact_area' AND impact_area_t.lang = $${langParamIndex}
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
    
    logger.info(`${servicePrefix} Found ${dataResult.rows.length} defects (total: ${total})`);
    
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
    logger.error('[DEFECT SERVICE] Error searching defects:', error);
    throw error;
  }
};

module.exports = {
    getDefectById,
    createDefect,
    updateDefect,
    getDefectsLazySearch,
    searchDefects
};
