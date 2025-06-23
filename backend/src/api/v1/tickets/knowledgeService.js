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
        'category', 'tags', 'keywords', 'summary', 'content',
        'visibility', 'expiry_date', 'review_date', 'language',
        'target_audience', 'related_articles', 'attachments',
        'approval_status', 'approved_by', 'approved_at',
        'views_count', 'rating', 'feedback_count',
        'last_reviewed_by', 'last_reviewed_at', 'version_notes'
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
    
    // Les articles de connaissance n'ont généralement pas de relations parent-enfant lors de la création
    const parentChildRelations = [];
    
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
    createKnowledge
};
