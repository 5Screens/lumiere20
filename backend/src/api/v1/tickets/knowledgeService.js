const db = require('../../../config/database');
const logger = require('../../../config/logger');

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
                ) as watchers
                
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
            
            WHERE t.uuid = $1 AND t.ticket_type_code = 'KNOWLEDGE'
        `;
        
        const result = await db.query(query, [uuid, lang]);
        
        if (result.rows.length === 0) {
            logger.warn(`[KNOWLEDGE SERVICE] No knowledge article found with UUID: ${uuid}`);
            return null;
        }
        
        logger.info(`[KNOWLEDGE SERVICE] Successfully retrieved knowledge article with UUID: ${uuid}`);
        return result.rows[0];
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
    logger.info(`[KNOWLEDGE SERVICE] Fetching knowledge articles with language ${lang || 'en'}`);
    
    const params = [lang || 'en'];
    
    const query = `
        SELECT t.uuid,
            t.title,
            t.description,
            t.configuration_item_uuid,
            ci.name as configuration_item_name,
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
            g.group_name as assigned_group_name,
            g.uuid as assigned_group_uuid,
            p4.first_name || ' ' || p4.last_name as assigned_person_name,
            p4.uuid as assigned_person_uuid,
            
            -- Extraction des attributs spécifiques aux articles de connaissance depuis le JSONB
            t.core_extended_attributes->>'category' as category,
            t.core_extended_attributes->>'tags' as tags,
            t.core_extended_attributes->>'keywords' as keywords,
            t.core_extended_attributes->>'visibility' as visibility,
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
            
            -- Informations sur les observateurs (watchers) - nombre uniquement pour la liste
            (
                SELECT COUNT(*)
                FROM core.rel_tickets_groups_persons w
                WHERE w.rel_ticket = t.uuid AND w.type = 'WATCHER' AND (w.ended_at IS NULL OR w.ended_at > NOW())
            ) as watchers_count
            
        FROM core.tickets t
        LEFT JOIN configuration.persons p1 ON t.requested_by_uuid = p1.uuid
        LEFT JOIN configuration.persons p2 ON t.requested_for_uuid = p2.uuid
        JOIN configuration.persons p3 ON t.writer_uuid = p3.uuid
        JOIN configuration.ticket_types tt ON t.ticket_type_code = tt.code
        JOIN configuration.ticket_status ts ON t.ticket_status_code = ts.code AND ts.rel_ticket_type = tt.code
        LEFT JOIN data.configuration_items ci ON t.configuration_item_uuid = ci.uuid 
        LEFT JOIN translations.ticket_types_translation ttt ON tt.uuid = ttt.ticket_type_uuid 
            AND ttt.lang = $1
        LEFT JOIN translations.ticket_status_translation tst ON ts.uuid = tst.ticket_status_uuid 
            AND tst.lang = $1
            
        -- Jointure pour l'assignation actuelle
        LEFT JOIN (
            SELECT rel_ticket, rel_assigned_to_group, rel_assigned_to_person
            FROM core.rel_tickets_groups_persons
            WHERE type = 'ASSIGNED' AND ended_at IS NULL
        ) rtgp ON t.uuid = rtgp.rel_ticket
        LEFT JOIN configuration.groups g ON rtgp.rel_assigned_to_group = g.uuid
        LEFT JOIN configuration.persons p4 ON rtgp.rel_assigned_to_person = p4.uuid
        
        -- Jointures pour les services
        LEFT JOIN data.services service ON t.core_extended_attributes->>'rel_service' = service.uuid::text
        LEFT JOIN data.service_offerings service_offerings ON t.core_extended_attributes->>'rel_service_offerings' = service_offerings.uuid::text
        
        WHERE t.ticket_type_code = 'KNOWLEDGE'
        ORDER BY t.created_at DESC
    `;
    
    try {
        const result = await db.query(query, params);
        logger.info(`[KNOWLEDGE SERVICE] Successfully fetched ${result.rows.length} knowledge articles`);
        
        // Parse JSON fields that might be stored as strings
        result.rows.forEach(row => {
            if (row.tags && typeof row.tags === 'string') {
                try {
                    row.tags = JSON.parse(row.tags);
                } catch (e) {
                    // If parsing fails, keep as string
                }
            }
            if (row.keywords && typeof row.keywords === 'string') {
                try {
                    row.keywords = JSON.parse(row.keywords);
                } catch (e) {
                    // If parsing fails, keep as string
                }
            }
        });
        
        return result.rows;
    } catch (error) {
        logger.error('[KNOWLEDGE SERVICE] Error fetching knowledge articles:', error);
        throw error;
    }
};

/**
 * Prépare les données pour la création d'un article de connaissance
 * @param {Object} knowledgeData - Données pour la création de l'article de connaissance
 * @returns {Object} - Objet contenant les champs standards, d'assignation, attributs étendus et observateurs
 */
const createKnowledge = (knowledgeData) => {
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
    
    return {
        standardFields,
        assignmentFields,
        extendedAttributesFields,
        watchList,
        parentChildRelations
    };
};

module.exports = {
    getKnowledgeById,
    getKnowledgeArticles,
    createKnowledge
};
