const db = require('../../../config/database');
const logger = require('../../../config/logger');
const ticketService = require('./service');

/**
 * Récupère les defects avec les attributs étendus spécifiques aux defects
 * @param {string} lang - Code de langue pour les traductions
 * @returns {Promise<Array>} - Liste des defects avec leurs attributs
 */
const getDefects = async (lang) => {
    const servicePrefix = '[DEFECT SERVICE]';
    
    // Définition des attributs spécifiques aux defects
    const baseQuery = `
        -- Extraction des attributs spécifiques aux defects depuis le JSONB
        t.core_extended_attributes->'tags' as tags,
        t.core_extended_attributes->>'severity' as severity,
        COALESCE(
            (SELECT dsl.label FROM translations.defect_setup_labels dsl 
            WHERE dsl.rel_defect_setup_code = t.core_extended_attributes->>'severity' AND dsl.lang = $1),
            t.core_extended_attributes->>'severity'
        ) as severity_label,
        t.core_extended_attributes->>'workaround' as workaround,
        t.core_extended_attributes->>'environment' as environment,
        COALESCE(
            (SELECT dsl.label FROM translations.defect_setup_labels dsl 
            WHERE dsl.rel_defect_setup_code = t.core_extended_attributes->>'environment' AND dsl.lang = $1),
            t.core_extended_attributes->>'environment'
        ) as environment_label,
        t.core_extended_attributes->>'impact_area' as impact_area,
        COALESCE(
            (SELECT dsl.label FROM translations.defect_setup_labels dsl 
            WHERE dsl.rel_defect_setup_code = t.core_extended_attributes->>'impact_area' AND dsl.lang = $1),
            t.core_extended_attributes->>'impact_area'
        ) as impact_area_label,
        t.core_extended_attributes->>'expected_behavior' as expected_behavior,
        t.core_extended_attributes->>'steps_to_reproduce' as steps_to_reproduce,
        
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
        
        -- Récupération du titre du projet parent
        (
            SELECT parent.title
            FROM core.rel_parent_child_tickets rpc
            JOIN core.tickets parent ON rpc.rel_parent_ticket_uuid = parent.uuid
            WHERE rpc.rel_child_ticket_uuid = t.uuid AND rpc.dependency_code = 'DEFECT' AND rpc.ended_at IS NULL
            LIMIT 1
        ) as project_title
    `;
    
    // Définition des jointures spécifiques aux defects
    const additionalJoins = ``;
    
    // Utilisation de la fonction getTickets factorisée
    return ticketService.getTickets(lang, 'DEFECT', baseQuery, additionalJoins, [], servicePrefix);
};

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
                p4.uuid as assigned_to_person,
                p4.first_name || ' ' || p4.last_name as assigned_person_name,
                
                -- Champs spécifiques aux défauts depuis core_extended_attributes
                t.core_extended_attributes->>'tags' as tags,
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
                WHERE type = 'ASSIGNED' AND (ended_at IS NULL OR ended_at > NOW())
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
        
        // Transformer les tags de format JSON string en tableau d'objets
        const defect = result.rows[0];
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
        }
        
        return defect;
    } catch (error) {
        logger.error(`[DEFECT SERVICE] Error fetching defect with UUID ${uuid}:`, error);
        throw error;
    }
};

module.exports = {
    getDefects,
    getDefectById
};
