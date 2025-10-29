const db = require('../../../config/database');
const logger = require('../../../config/logger');
const ticketService = require('./service');
const { buildFilterCondition: buildGenericFilterCondition } = require('./ticketFilterBuilder');

/**
 * Build filter condition for knowledge articles search (wrapper with KNOWLEDGE-specific JSONB columns)
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
      'last_review_at', 'next_review_at'
    ],
    jsonbTextColumns: [
      'rel_category', 'rel_service', 'rel_service_offerings', 'rel_lang',
      'rel_confidentiality_level', 'rel_involved_process', 'summary',
      'prerequisites', 'limitations', 'security_notes', 'version',
      'license_type', 'rel_target_audience', 'business_scope'
    ],
    jsonbNumericColumns: [],
    servicePrefix: '[KNOWLEDGE SERVICE]'
  });
};

/**
 * Récupère un article de connaissance par son UUID
 * @param {string} uuid - UUID de l'article de connaissance
 * @param {string} lang - Code de langue pour les traductions (fr, en, etc.)
 * @returns {Promise<Object>} - Détails de l'article de connaissance
 */
const getKnowledgeById = async (uuid, lang = 'en') => {
    logger.info(`[KNOWLEDGE SERVICE] Fetching knowledge article with UUID: ${uuid} and language: ${lang}`);
    
    try {
        // Requête SQL pour récupérer les détails de l'article de connaissance avec les données d'assignation
        const query = `
            SELECT 
                t.uuid,
                t.title,
                t.description,
                t.configuration_item_uuid,
                ci.name as configuration_item_name,
                t.created_at,
                t.updated_at,
                t.closed_at,
                t.requested_by_uuid,
                t.requested_for_uuid,
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
                
                -- Extraction des attributs spécifiques aux articles de connaissance depuis le JSONB
                t.core_extended_attributes->>'rel_category' as rel_category,
                COALESCE(
                    (SELECT ksl.label FROM translations.knowledge_setup_label ksl 
                    WHERE ksl.rel_change_setup_code = t.core_extended_attributes->>'rel_category' AND ksl.lang = $2 ),
                    t.core_extended_attributes->>'rel_category'
                ) as rel_category_label,
                t.core_extended_attributes->'keywords' as keywords,
                t.core_extended_attributes->>'rel_service' as rel_service,
                t.core_extended_attributes->>'rel_service_offerings' as rel_service_offerings,
                service.name as rel_service_name,
                service_offerings.name as rel_service_offerings_name,
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'uuid', ksc.uuid,
                            'metadata', ksc.metadata,
                            'code', ksc.code,
                            'lang', ksl.lang,
                            'label', ksl.label
                        )
                    )
                    FROM jsonb_array_elements_text(t.core_extended_attributes->'rel_target_audience') as audience_code
                    JOIN configuration.knowledge_setup_codes ksc ON ksc.code = audience_code
                    JOIN translations.knowledge_setup_label ksl ON ksl.rel_change_setup_code = audience_code
                    WHERE ksl.lang = $2
                ) as rel_target_audience,
                t.core_extended_attributes->>'rel_lang' as rel_lang,
                lang.native_name as rel_lang_name,
                t.core_extended_attributes->>'rel_confidentiality_level' as rel_confidentiality_level,
                COALESCE(
                    (SELECT ksl.label FROM translations.knowledge_setup_label ksl 
                    WHERE ksl.rel_change_setup_code = t.core_extended_attributes->>'rel_confidentiality_level' AND ksl.lang = $2),
                    t.core_extended_attributes->>'rel_confidentiality_level'
                ) as rel_confidentiality_level_label,
                t.core_extended_attributes->>'summary' as summary,
                t.core_extended_attributes->>'prerequisites' as prerequisites,
                t.core_extended_attributes->>'limitations' as limitations,
                t.core_extended_attributes->>'security_notes' as security_notes,
                t.core_extended_attributes->>'rel_ticket_type' as rel_ticket_type,
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'uuid', ksc.uuid,
                            'metadata', ksc.metadata,
                            'code', ksc.code,
                            'lang', ksl.lang,
                            'label', ksl.label
                        )
                    )
                    FROM jsonb_array_elements_text(t.core_extended_attributes->'business_scope') as scope_code
                    JOIN configuration.knowledge_setup_codes ksc ON ksc.code = scope_code
                    JOIN translations.knowledge_setup_label ksl ON ksl.rel_change_setup_code = scope_code
                    WHERE ksl.lang = $2
                ) as business_scope,
                t.core_extended_attributes->>'version' as version,
                t.core_extended_attributes->>'last_review_at' as last_review_at,
                t.core_extended_attributes->>'next_review_at' as next_review_at,
                t.core_extended_attributes->>'license_type' as license_type,
                t.core_extended_attributes->>'rel_involved_process' as rel_involved_process,
                COALESCE(
                    (SELECT ttt2.label FROM translations.ticket_types_translation ttt2
                    JOIN configuration.ticket_types tt2 ON tt2.uuid = ttt2.ticket_type_uuid
                    WHERE tt2.code = t.core_extended_attributes->>'rel_involved_process' AND ttt2.lang = $2),
                    t.core_extended_attributes->>'rel_involved_process'
                ) as rel_involved_process_label,
                
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
                    AND rpc.dependency_code = 'TIED_TICKETS'
                ) as tieds_tickets_count,
                
                -- Liste des tickets liés à la connaissance
                (
                    SELECT COALESCE(json_agg(
                        json_build_object(
                            'uuid', tick.uuid,
                            'title', tick.title
                        )
                    ), '[]'::json)
                    FROM core.rel_parent_child_tickets rpc
                    JOIN core.tickets tick ON rpc.rel_child_ticket_uuid = tick.uuid
                    WHERE rpc.rel_parent_ticket_uuid = t.uuid 
                    AND rpc.dependency_code = 'TIED_TICKETS'
                    AND (rpc.ended_at IS NULL OR rpc.ended_at > NOW())
                ) AS tickets_list
                
            FROM core.tickets t
            LEFT JOIN data.configuration_items ci ON t.configuration_item_uuid = ci.uuid
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
            
            -- Jointures pour les services et langues
            LEFT JOIN data.services service ON service.uuid = (t.core_extended_attributes->>'rel_service')::uuid
            LEFT JOIN data.service_offerings service_offerings ON service_offerings.uuid = (t.core_extended_attributes->>'rel_service_offerings')::uuid
            LEFT JOIN translations.languages lang ON lang.code = t.core_extended_attributes->>'rel_lang'
            
            WHERE t.uuid = $1 AND t.ticket_type_code = 'KNOWLEDGE'
        `;
        
        const result = await db.query(query, [uuid, lang]);
        
        if (result.rows.length === 0) {
            logger.warn(`[KNOWLEDGE SERVICE] No knowledge article found with UUID: ${uuid}`);
            return null;
        }
        
        logger.info(`[KNOWLEDGE SERVICE] Successfully retrieved knowledge article with UUID: ${uuid}`);
        
        // Get attachments associated with the knowledge article
        const attachmentService = require('../attachments/service');
        const attachments = await attachmentService.getAttachmentsByObjectUuid(uuid);
        const knowledgeArticle = result.rows[0];
        knowledgeArticle.attachments = attachments;
        
        return knowledgeArticle;
    } catch (error) {
        logger.error(`[KNOWLEDGE SERVICE] Error fetching knowledge article with UUID ${uuid}:`, error);
        throw error;
    }
};

/**
 * Récupère les articles de connaissance avec les attributs étendus spécifiques
 * @param {string} lang - Code de langue pour les traductions
 * @returns {Promise<Array>} - Liste des articles de connaissance avec leurs attributs
 */
const getKnowledgeArticles = async (lang) => {
    const servicePrefix = '[KNOWLEDGE SERVICE]';
    
    // Définition des attributs spécifiques aux articles de connaissance
    const baseQuery = `
        -- Extraction des attributs spécifiques aux articles de connaissance depuis le JSONB
        t.core_extended_attributes->>'rel_category' as rel_category,
        COALESCE(
            (SELECT ksl.label FROM translations.knowledge_setup_label ksl 
            WHERE ksl.rel_change_setup_code = t.core_extended_attributes->>'rel_category' AND ksl.lang = $1 ),
            t.core_extended_attributes->>'rel_category'
        ) as rel_category_label,
        t.core_extended_attributes->'keywords' as keywords,
        t.core_extended_attributes->>'visibility' as visibility,
        t.core_extended_attributes->>'summary' as summary,
        t.core_extended_attributes->>'prerequisites' as prerequisites,
        t.core_extended_attributes->>'limitations' as limitations,
        t.core_extended_attributes->>'security_notes' as security_notes,
        t.core_extended_attributes->>'expiry_date' as expiry_date,
        t.core_extended_attributes->>'review_date' as review_date,
        t.core_extended_attributes->>'approval_status' as approval_status,
        t.core_extended_attributes->>'approved_by' as approved_by,
        t.core_extended_attributes->>'approval_date' as approval_date,
        (t.core_extended_attributes->>'views_count')::integer as views_count,
        (t.core_extended_attributes->>'feedback_count')::integer as feedback_count,
        t.core_extended_attributes->>'average_rating' as average_rating,
        t.core_extended_attributes->>'content_format' as content_format,
        t.core_extended_attributes->>'rel_service' as rel_service,
        t.core_extended_attributes->>'rel_service_offerings' as rel_service_offerings,
        service.name as rel_service_name,
        service_offerings.name as rel_service_offerings_name,
        t.core_extended_attributes->>'rel_lang' as rel_lang,
        lang.native_name as rel_lang_name,
        t.core_extended_attributes->>'rel_confidentiality_level' as rel_confidentiality_level,
        COALESCE(
            (SELECT ksl.label FROM translations.knowledge_setup_label ksl 
            WHERE ksl.rel_change_setup_code = t.core_extended_attributes->>'rel_confidentiality_level' AND ksl.lang = $1),
            t.core_extended_attributes->>'rel_confidentiality_level'
        ) as rel_confidentiality_level_label,
        t.core_extended_attributes->>'rel_involved_process' as rel_involved_process,
        COALESCE(
            (SELECT ttt2.label FROM translations.ticket_types_translation ttt2
            JOIN configuration.ticket_types tt2 ON tt2.uuid = ttt2.ticket_type_uuid
            WHERE tt2.code = t.core_extended_attributes->>'rel_involved_process' AND ttt2.lang = $1),
            t.core_extended_attributes->>'rel_involved_process'
        ) as rel_involved_process_label,
        t.core_extended_attributes->>'version' as version,
        t.core_extended_attributes->>'last_review_at' as last_review_at,
        t.core_extended_attributes->>'next_review_at' as next_review_at,
        t.core_extended_attributes->>'license_type' as license_type,
        t.core_extended_attributes->>'rel_target_audience' as rel_target_audience,
        (
            SELECT jsonb_agg(ksl.label)
            FROM jsonb_array_elements_text(t.core_extended_attributes->'rel_target_audience') as audience_code
            JOIN translations.knowledge_setup_label ksl ON ksl.rel_change_setup_code = audience_code
            WHERE ksl.lang = $1
        ) as rel_target_audience_label,
        t.core_extended_attributes->>'business_scope' as business_scope,
        (
            SELECT jsonb_agg(ksl.label)
            FROM jsonb_array_elements_text(t.core_extended_attributes->'business_scope') as scope_code
            JOIN translations.knowledge_setup_label ksl ON ksl.rel_change_setup_code = scope_code
            WHERE ksl.lang = $1
        ) as business_scope_label,
        
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
    
    // Définition des jointures spécifiques aux articles de connaissance
    const additionalJoins = `
        -- Jointures pour les services
        LEFT JOIN data.services service ON service.uuid::text = t.core_extended_attributes->>'rel_service'
        LEFT JOIN data.service_offerings service_offerings ON service_offerings.uuid::text = t.core_extended_attributes->>'rel_service_offerings'
        LEFT JOIN translations.languages lang ON lang.code = t.core_extended_attributes->>'rel_lang'
    `;
    
    // Utilisation de la fonction getTickets factorisée
    return ticketService.getTickets(lang, 'KNOWLEDGE', baseQuery, additionalJoins, [], servicePrefix);
};

/**
 * Crée un nouvel article de connaissance
 * @param {Object} knowledgeData - Données pour la création de l'article de connaissance
 * @returns {Promise<Object>} - Détails de l'article de connaissance créé
 */
const createKnowledge = async (knowledgeData) => {
    logger.info('[KNOWLEDGE SERVICE] Preparing data for knowledge article creation');
    
    // Définir les champs standards pour un article de connaissance
    const standardFields = {
        title: knowledgeData.title,
        description: knowledgeData.description,
        configuration_item_uuid: knowledgeData.configuration_item_uuid,
        ticket_type_code: 'KNOWLEDGE',
        ticket_status_code: knowledgeData.ticket_status_code || 'DRAFT',
        // Pour les articles de connaissance, requested_by et requested_for sont le writer
        requested_by_uuid: knowledgeData.writer_uuid,
        requested_for_uuid: knowledgeData.writer_uuid,
        writer_uuid: knowledgeData.writer_uuid
    };
    
    // Définir les champs d'assignation pour un article de connaissance
    const assignmentFields = {
        assigned_to_group: knowledgeData.assigned_to_group,
        assigned_to_person: knowledgeData.assigned_to_person
    };
    
    // Définir les attributs étendus pour un article de connaissance
    const extendedAttributesFields = {};
    
    // Liste des champs spécifiques aux articles de connaissance
    const knowledgeExtendedFields = [
        'rel_category', 'keywords', 'rel_service', 'rel_service_offerings',
        'rel_target_audience', 'rel_lang', 'rel_confidentiality_level',
        'summary', 'prerequisites', 'limitations', 'security_notes',
        'rel_ticket_type', 'business_scope', 'version',
        'last_review_at', 'next_review_at', 'license_type', 'rel_involved_process'
    ];
    
    // Ajouter chaque champ présent dans knowledgeData aux attributs étendus
    knowledgeExtendedFields.forEach(field => {
        if (knowledgeData[field] !== undefined) {
            extendedAttributesFields[field] = knowledgeData[field];
        }
    });
    
    // Initialiser certains compteurs à 0 s'ils ne sont pas définis
    if (extendedAttributesFields.views_count === undefined) extendedAttributesFields.views_count = 0;
    if (extendedAttributesFields.feedback_count === undefined) extendedAttributesFields.feedback_count = 0;
    
    // Gérer la liste des observateurs (watchers)
    const watchList = knowledgeData.watch_list && Array.isArray(knowledgeData.watch_list) ? 
        knowledgeData.watch_list : [];
    
    if (watchList.length > 0) {
        logger.info(`[KNOWLEDGE SERVICE] Processing ${watchList.length} watchers for knowledge article creation`);
    }
    
    logger.info('[KNOWLEDGE SERVICE] Successfully prepared data for knowledge article creation');
    
    // Gérer les relations parent-enfant pour les tickets liés
    const parentChildRelations = [];
    
    // Gérer la liste des tickets liés (tickets_list)
    if (knowledgeData.tickets_list && Array.isArray(knowledgeData.tickets_list) && knowledgeData.tickets_list.length > 0) {
        knowledgeData.tickets_list.forEach(ticketUuid => {
            parentChildRelations.push({
                childUuid: ticketUuid,
                dependencyCode: 'TIED_TICKETS'
            });
        });
        logger.info(`[KNOWLEDGE SERVICE] Prepared ${knowledgeData.tickets_list.length} tied ticket relations`);
    }
    
    // Appeler applyCreation pour créer effectivement le ticket
    const { applyCreation } = require('./service');
    
    return await applyCreation(
        knowledgeData,
        'KNOWLEDGE',
        standardFields,
        assignmentFields,
        extendedAttributesFields,
        watchList,
        parentChildRelations,
        getKnowledgeById,
        '[KNOWLEDGE SERVICE]'
    );
};

/**
 * Met à jour partiellement un article de connaissance par son UUID
 * @param {string} uuid - UUID de l'article de connaissance à mettre à jour
 * @param {Object} updateData - Données à mettre à jour
 * @returns {Promise<Object>} - Détails de l'article de connaissance mis à jour
 */
const updateKnowledge = async (uuid, updateData) => {
    // Définir les champs spécifiques aux articles de connaissance
    const standardFields = [
        'title', 'description', 'configuration_item_uuid',
        'ticket_status_code', 'requested_by_uuid', 'requested_for_uuid',
        'writer_uuid', 'closed_at'
    ];
    
    const assignmentFields = [
        'assigned_to_group', 'assigned_to_person'
    ];
    
    const extendedAttributesFields = [
        'rel_category', 'keywords', 'rel_service', 'rel_service_offerings',
        'rel_target_audience', 'rel_lang', 'rel_confidentiality_level',
        'summary', 'prerequisites', 'limitations', 'security_notes',
        'rel_ticket_type', 'business_scope', 'version',
        'last_review_at', 'next_review_at', 'license_type', 'rel_involved_process'
    ];
    
    // Utiliser la fonction applyUpdate du service.js
    const { applyUpdate } = require('./service');
    return await applyUpdate(
        uuid,
        updateData,
        'KNOWLEDGE',
        standardFields,
        assignmentFields,
        extendedAttributesFields,
        getKnowledgeById,
        '[KNOWLEDGE SERVICE]'
    );
};

/**
 * Lazy search for knowledge articles (for dropdown filters)
 * @param {string} searchQuery - Search term
 * @param {string} lang - Language code
 * @returns {Promise<Array>} - List of knowledge articles matching the search
 */
const getKnowledgeArticlesLazySearch = async (searchQuery, lang = 'en') => {
  logger.info(`[KNOWLEDGE SERVICE] Lazy search for knowledge articles with query: "${searchQuery}", lang: ${lang}`);
  
  try {
    const queryParams = [];
    let whereClause = '';
    
    if (searchQuery && searchQuery.trim().length > 0) {
      // Split search query by spaces for AND logic
      const searchTerms = searchQuery.trim().split(/\s+/).filter(term => term.length > 0);
      
      const conditions = searchTerms.map((term, index) => {
        const paramIndex = index + 1;
        queryParams.push(`%${term}%`);
        return `(
          unaccent(LOWER(t.title)) LIKE unaccent(LOWER($${paramIndex})) OR
          unaccent(LOWER(t.description)) LIKE unaccent(LOWER($${paramIndex}))
        )`;
      });
      
      whereClause = `WHERE t.ticket_type_code = 'KNOWLEDGE' AND ${conditions.join(' AND ')}`;
    } else {
      whereClause = `WHERE t.ticket_type_code = 'KNOWLEDGE'`;
    }
    
    const query = `
      SELECT 
        t.uuid,
        t.title,
        t.description,
        t.ticket_status_code,
        COALESCE(tst.label, ts.code) as ticket_status_label,
        t.created_at
      FROM core.tickets t
      JOIN configuration.ticket_status ts ON t.ticket_status_code = ts.code
      LEFT JOIN translations.ticket_status_translation tst ON ts.uuid = tst.ticket_status_uuid AND tst.lang = $${queryParams.length + 1}
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT 20
    `;
    
    queryParams.push(lang);
    
    const result = await db.query(query, queryParams);
    
    logger.info(`[KNOWLEDGE SERVICE] Lazy search found ${result.rows.length} knowledge articles`);
    
    return result.rows;
  } catch (error) {
    logger.error('[KNOWLEDGE SERVICE] Error in lazy search:', error);
    throw error;
  }
};

/**
 * Advanced search for knowledge articles with filters, sorting, and pagination
 * @param {Object} filters - Advanced filter conditions
 * @param {Object} sort - Sort configuration { by: string, direction: string }
 * @param {Object} pagination - Pagination { page: number, limit: number }
 * @param {string} lang - Language code for translations
 * @returns {Promise<Object>} - { data: Array, total: number, hasMore: boolean, pagination: Object }
 */
const searchKnowledgeArticles = async (filters = {}, sort = {}, pagination = {}, lang = 'en') => {
  try {
    const servicePrefix = '[KNOWLEDGE SERVICE]';
    
    // Extract pagination parameters
    const page = pagination.page || 1;
    const limit = pagination.limit || 50;
    const offset = (page - 1) * limit;
    
    // Extract sort parameters
    const sortBy = sort.by || 'created_at';
    const sortDirection = sort.direction || 'desc';
    
    // Sort column mapping for calculated/joined columns
    const sortColumnMapping = {
      'uuid': 't.uuid',
      'title': 't.title',
      'description': 't.description',
      'ticket_type_code': 't.ticket_type_code',
      'ticket_status_code': 't.ticket_status_code',
      'ticket_status_label': 'COALESCE(tst.label, ts.code)',
      'requested_for_uuid': 't.requested_for_uuid',
      'requested_for_name': "p2.first_name || ' ' || p2.last_name",
      'writer_uuid': 't.writer_uuid',
      'writer_name': "p3.first_name || ' ' || p3.last_name",
      'configuration_item_uuid': 't.configuration_item_uuid',
      'configuration_item_name': 'ci.name',
      'assigned_to_group': 'g.uuid',
      'assigned_group_name': 'g.group_name',
      'assigned_to_person': 'p4.uuid',
      'assigned_person_name': "p4.first_name || ' ' || p4.last_name",
      'created_at': 't.created_at',
      'updated_at': 't.updated_at',
      'closed_at': 't.closed_at',
      // JSONB fields
      'rel_category': "t.core_extended_attributes->>'rel_category'",
      'rel_category_label': "COALESCE(category_t.label, t.core_extended_attributes->>'rel_category')",
      'rel_service': "t.core_extended_attributes->>'rel_service'",
      'rel_service_name': 'service.name',
      'rel_service_offerings': "t.core_extended_attributes->>'rel_service_offerings'",
      'rel_service_offerings_name': 'service_offerings.name',
      'rel_lang': "t.core_extended_attributes->>'rel_lang'",
      'rel_lang_name': 'lang.native_name',
      'rel_confidentiality_level': "t.core_extended_attributes->>'rel_confidentiality_level'",
      'rel_confidentiality_level_label': "COALESCE(confidentiality_t.label, t.core_extended_attributes->>'rel_confidentiality_level')",
      'rel_involved_process': "t.core_extended_attributes->>'rel_involved_process'",
      'rel_involved_process_label': "COALESCE(process_t.label, t.core_extended_attributes->>'rel_involved_process')",
      'version': "t.core_extended_attributes->>'version'",
      'last_review_at': "t.core_extended_attributes->>'last_review_at'",
      'next_review_at': "t.core_extended_attributes->>'next_review_at'",
      'license_type': "t.core_extended_attributes->>'license_type'",
      'attachments_count': '(SELECT COUNT(*) FROM core.attachments a WHERE a.object_uuid = t.uuid)',
      'tieds_tickets_count': '(SELECT COUNT(*) FROM core.rel_parent_child_tickets rpc WHERE rpc.rel_parent_ticket_uuid = t.uuid AND rpc.dependency_code = \'TIED_TICKETS\')'
    };
    
    // Get the SQL expression for sorting
    const sortExpression = sortColumnMapping[sortBy] || `t.${sortBy}`;
    
    logger.info(`${servicePrefix} Sort parameters: sortBy="${sortBy}" → SQL expression: "${sortExpression}", sortDirection="${sortDirection}"`);
    logger.info(`${servicePrefix} Pagination: page=${page}, limit=${limit}, offset=${offset}`);
    logger.info(`${servicePrefix} Language: ${lang}`);
    
    // Build WHERE clause from advanced filters
    const queryParams = [];
    let paramIndex = 1;
    let whereClause = '';
    
    // Always filter by ticket_type = KNOWLEDGE
    const baseConditions = [`t.ticket_type_code = 'KNOWLEDGE'`];
    
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
        t.configuration_item_uuid,
        ci.name as configuration_item_name,
        t.requested_for_uuid,
        t.writer_uuid,
        t.ticket_type_code,
        t.ticket_status_code,
        t.created_at,
        t.updated_at,
        t.closed_at,
        
        -- Person names
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
        
        -- Knowledge-specific fields from core_extended_attributes
        t.core_extended_attributes->>'rel_category' as rel_category,
        COALESCE(category_t.label, t.core_extended_attributes->>'rel_category') as rel_category_label,
        t.core_extended_attributes->'keywords' as keywords,
        t.core_extended_attributes->>'rel_service' as rel_service,
        service.name as rel_service_name,
        t.core_extended_attributes->>'rel_service_offerings' as rel_service_offerings,
        service_offerings.name as rel_service_offerings_name,
        t.core_extended_attributes->>'rel_lang' as rel_lang,
        lang.native_name as rel_lang_name,
        t.core_extended_attributes->>'rel_confidentiality_level' as rel_confidentiality_level,
        COALESCE(confidentiality_t.label, t.core_extended_attributes->>'rel_confidentiality_level') as rel_confidentiality_level_label,
        t.core_extended_attributes->>'rel_involved_process' as rel_involved_process,
        COALESCE(process_t.label, t.core_extended_attributes->>'rel_involved_process') as rel_involved_process_label,
        t.core_extended_attributes->>'summary' as summary,
        t.core_extended_attributes->>'prerequisites' as prerequisites,
        t.core_extended_attributes->>'limitations' as limitations,
        t.core_extended_attributes->>'security_notes' as security_notes,
        t.core_extended_attributes->>'version' as version,
        t.core_extended_attributes->>'last_review_at' as last_review_at,
        t.core_extended_attributes->>'next_review_at' as next_review_at,
        t.core_extended_attributes->>'license_type' as license_type,
        t.core_extended_attributes->'rel_target_audience' as rel_target_audience,
        (
          SELECT jsonb_agg(ksl.label)
          FROM jsonb_array_elements_text(t.core_extended_attributes->'rel_target_audience') as audience_code
          JOIN translations.knowledge_setup_label ksl ON ksl.rel_change_setup_code = audience_code
          WHERE ksl.lang = $${paramIndex}
        ) as rel_target_audience_label,
        t.core_extended_attributes->'business_scope' as business_scope,
        (
          SELECT jsonb_agg(ksl.label)
          FROM jsonb_array_elements_text(t.core_extended_attributes->'business_scope') as scope_code
          JOIN translations.knowledge_setup_label ksl ON ksl.rel_change_setup_code = scope_code
          WHERE ksl.lang = $${paramIndex}
        ) as business_scope_label,
        
        -- Counts
        (SELECT COUNT(*) FROM core.attachments a WHERE a.object_uuid = t.uuid) as attachments_count,
        (SELECT COUNT(*) FROM core.rel_parent_child_tickets rpc WHERE rpc.rel_parent_ticket_uuid = t.uuid AND rpc.dependency_code = 'TIED_TICKETS') as tieds_tickets_count
        
      FROM core.tickets t
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
      LEFT JOIN translations.knowledge_setup_label category_t ON category_t.rel_change_setup_code = t.core_extended_attributes->>'rel_category' AND category_t.lang = $${paramIndex}
      LEFT JOIN translations.knowledge_setup_label confidentiality_t ON confidentiality_t.rel_change_setup_code = t.core_extended_attributes->>'rel_confidentiality_level' AND confidentiality_t.lang = $${paramIndex}
      LEFT JOIN translations.ticket_types_translation process_t ON process_t.ticket_type_uuid = (SELECT uuid FROM configuration.ticket_types WHERE code = t.core_extended_attributes->>'rel_involved_process') AND process_t.lang = $${paramIndex}
      LEFT JOIN data.services service ON t.core_extended_attributes->>'rel_service' = service.uuid::text
      LEFT JOIN data.service_offerings service_offerings ON t.core_extended_attributes->>'rel_service_offerings' = service_offerings.uuid::text
      LEFT JOIN translations.languages lang ON lang.code = t.core_extended_attributes->>'rel_lang'
      ${whereClause}
      ORDER BY ${sortExpression} ${sortDirection.toUpperCase()}
      LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}
    `;
    
    queryParams.push(lang, limit, offset);
    
    logger.info(`${servicePrefix} Data query params: ${JSON.stringify(queryParams)}`);
    
    const dataResult = await db.query(dataQuery, queryParams);
    
    // Calculate pagination metadata
    const currentPage = page;
    const totalPages = Math.ceil(total / limit);
    const hasMore = offset + limit < total;
    
    logger.info(`${servicePrefix} Found ${dataResult.rows.length} knowledge articles (total: ${total})`);
    
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
    logger.error('[KNOWLEDGE SERVICE] Error searching knowledge articles:', error);
    throw error;
  }
};

module.exports = {
    getKnowledgeById,
    getKnowledgeArticles,
    createKnowledge,
    updateKnowledge,
    getKnowledgeArticlesLazySearch,
    searchKnowledgeArticles
};
