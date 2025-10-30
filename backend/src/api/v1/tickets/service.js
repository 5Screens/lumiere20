const db = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Récupère les tickets avec possibilité d'ajouter des attributs spécifiques et des jointures
 * @param {string} lang - Code de langue pour les traductions
 * @param {string} ticket_type - Type de ticket à récupérer (optionnel)
 * @param {string} baseQuery - Partie de la requête SQL spécifique au type de ticket (optionnel)
 * @param {string} additionalJoins - Jointures supplémentaires spécifiques au type de ticket (optionnel)
 * @param {Array} additionalParams - Paramètres supplémentaires pour la requête SQL (optionnel)
 * @param {string} servicePrefix - Préfixe pour les logs (optionnel)
 * @returns {Promise<Array>} - Liste des tickets avec leurs attributs
 */
const getTickets = async (lang, ticket_type, baseQuery = '', additionalJoins = '', additionalParams = [], servicePrefix = '[SERVICE]') => {
    logger.info(`${servicePrefix} Fetching tickets${ticket_type ? ` of type ${ticket_type}` : ''}${lang ? ` with language ${lang}` : ''}`);
    
    const params = [lang || 'en', ...additionalParams];
    let typeCondition = '';
    let paramIndex = params.length + 1;
    
    if (ticket_type) {
        typeCondition = `AND t.ticket_type_code = $${paramIndex}`;
        params.push(ticket_type);
    }
    
    const query = `
        SELECT t.uuid,
            t.title,
            SUBSTRING(t.description, 1, 120) as description,
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
            p4.uuid as assigned_person_uuid
            ${baseQuery ? `,${baseQuery}` : ''}
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
        LEFT JOIN (
            SELECT rel_ticket, rel_assigned_to_group, rel_assigned_to_person
            FROM core.rel_tickets_groups_persons
            WHERE type = 'ASSIGNED' AND ended_at IS NULL
        ) rtgp ON t.uuid = rtgp.rel_ticket
        LEFT JOIN configuration.groups g ON rtgp.rel_assigned_to_group = g.uuid
        LEFT JOIN configuration.persons p4 ON rtgp.rel_assigned_to_person = p4.uuid
        ${additionalJoins ? additionalJoins : ''}
        WHERE 1=1 ${typeCondition}
        ORDER BY t.created_at DESC
    `;
    
    try {
        const result = await db.query(query, params);
        return result.rows;
    } catch (error) {
        logger.error(`${servicePrefix} Error in getTickets:`, error);
        throw error;
    }
};

/**
 * Crée un nouveau ticket en déléguant au service spécialisé selon le type
 * @param {Object} ticketData - Données du ticket à créer
 * @returns {Promise<Object>} - Détails du ticket créé
 */
const createTicket = async (ticketData) => {
    logger.info('[SERVICE] Creating new ticket');
    
    try {
        // Déterminer le type de ticket
        const ticketType = ticketData.ticket_type_code;
        logger.info(`[SERVICE] Ticket type: ${ticketType}`);
        
        // Importer les services nécessaires
        const incidentService = require('./incidentService');
        const problemService = require('./problemService');
        const changeService = require('./changeService');
        const knowledgeService = require('./knowledgeService');
        const taskService = require('./taskService');
        const projectService = require('./projectService');
        const sprintService = require('./sprintService');
        const epicService = require('./epicService');
        const storyService = require('./storyService');
        const defectService = require('./defectService');
        
        // Utiliser le service approprié selon le type de ticket
        let createdTicket = null;
        
        // INCIDENT
        if (ticketType === 'INCIDENT') {
            logger.info('[SERVICE] Calling incidentService.createIncident');
            createdTicket = await incidentService.createIncident(ticketData);
        }
        // PROBLEM
        else if (ticketType === 'PROBLEM') {
            logger.info('[SERVICE] Calling problemService.createProblem');
            createdTicket = await problemService.createProblem(ticketData);
        }
        // CHANGE
        else if (ticketType === 'CHANGE') {
            logger.info('[SERVICE] Calling changeService.createChange');
            createdTicket = await changeService.createChange(ticketData);
        }
        // KNOWLEDGE
        else if (ticketType === 'KNOWLEDGE') {
            logger.info('[SERVICE] Calling knowledgeService.createKnowledge');
            createdTicket = await knowledgeService.createKnowledge(ticketData);
        }
        // TASK
        else if (ticketType === 'TASK') {
            logger.info('[SERVICE] Calling taskService.createTask');
            createdTicket = await taskService.createTask(ticketData);
        }
        // PROJECT
        else if (ticketType === 'PROJECT') {
            logger.info('[SERVICE] Calling projectService.createProject');
            createdTicket = await projectService.createProject(ticketData);
        }
        // SPRINT
        else if (ticketType === 'SPRINT') {
            logger.info('[SERVICE] Calling sprintService.createSprint');
            createdTicket = await sprintService.createSprint(ticketData);
        }
        // EPIC
        else if (ticketType === 'EPIC') {
            logger.info('[SERVICE] Calling epicService.createEpic');
            createdTicket = await epicService.createEpic(ticketData);
        }
        // USER_STORY
        else if (ticketType === 'USER_STORY') {
            logger.info('[SERVICE] Calling storyService.createStory');
            createdTicket = await storyService.createStory(ticketData);
        }
        // DEFECT
        else if (ticketType === 'DEFECT') {
            logger.info('[SERVICE] Calling defectService.createDefect');
            createdTicket = await defectService.createDefect(ticketData);
        }
        // Type de ticket non pris en charge
        else {
            logger.error(`[SERVICE] POST not implemented for ticket type: ${ticketType}`);
            throw new Error(`Creation not implemented for ticket type: ${ticketType}`);
        }
        
        return createdTicket;
    } catch (error) {
        logger.error('[SERVICE] Error creating ticket:', error);
        throw error;
    }
};

// Les imports sont déplacés après l'export du module pour éviter les dépendances circulaires

/**
 * Récupère un ticket par son UUID
 * @param {string} uuid - UUID du ticket
 * @param {string} lang - Code de langue pour les traductions (fr, en, etc.)
 * @returns {Promise<Object>} - Détails du ticket
 */
const getTicketById = async (uuid, lang = 'en') => {
    logger.info(`[SERVICE] Fetching ticket with UUID: ${uuid} and language: ${lang}`);
    
    try {
        // D'abord, récupérer le type de ticket
        const ticketTypeQuery = `
            SELECT ticket_type_code
            FROM core.tickets
            WHERE uuid = $1
        `;
        
        const ticketTypeResult = await db.query(ticketTypeQuery, [uuid]);
        
        if (ticketTypeResult.rows.length === 0) {
            logger.warn(`[SERVICE] No ticket found with UUID: ${uuid}`);
            return null;
        }
        
        const ticketType = ticketTypeResult.rows[0].ticket_type_code;
        logger.info(`[SERVICE] Ticket type: ${ticketType}`);
        
        // Selon le type de ticket, importer dynamiquement le service approprié et appeler la fonction spécifique
        // Cette approche évite les dépendances circulaires
        switch (ticketType) {
            case 'TASK':
                const taskService = require('./taskService');
                return await taskService.getTaskById(uuid, lang);
            case 'INCIDENT':
                const incidentService = require('./incidentService');
                return await incidentService.getIncidentById(uuid, lang);
            case 'PROBLEM':
                const problemService = require('./problemService');
                return await problemService.getProblemById(uuid, lang);
            case 'CHANGE':
                const changeService = require('./changeService');
                return await changeService.getChangeById(uuid, lang);
            case 'KNOWLEDGE':
                const knowledgeService = require('./knowledgeService');
                return await knowledgeService.getKnowledgeById(uuid, lang);
            case 'DEFECT':
                const defectService = require('./defectService');
                return await defectService.getDefectById(uuid, lang);
            case 'USER_STORY':
                const storyService = require('./storyService');
                return await storyService.getStoryById(uuid, lang);
            case 'EPIC':
                const epicService = require('./epicService');
                return await epicService.getEpicById(uuid, lang);
            case 'PROJECT':
                const projectService = require('./projectService');
                return await projectService.getProjectById(uuid, lang);
            case 'SPRINT':
                const sprintService = require('./sprintService');
                return await sprintService.getSprintById(uuid, lang);
            default:
                logger.warn(`[SERVICE] Unsupported ticket type: ${ticketType}`);
                return null;
        }
    } catch (error) {
        logger.error(`[SERVICE] Error fetching ticket with UUID ${uuid}:`, error);
        throw error;
    }
};

const getTicketTeam = async (ticketUuid) => {
    logger.info(`[SERVICE] Fetching team for ticket with UUID: ${ticketUuid}`);
    
    try {
        // Requête pour récupérer l'équipe assignée au ticket
        const query = `
            SELECT 
                g.uuid,
                g.group_name,
                s.first_name || ' ' || s.last_name AS supervisor_full_name,
                m.first_name || ' ' || m.last_name AS manager_full_name
            FROM core.rel_tickets_groups_persons rtgp
            JOIN configuration.groups g ON rtgp.rel_assigned_to_group = g.uuid
            LEFT JOIN configuration.persons s ON g.rel_supervisor = s.uuid
            LEFT JOIN configuration.persons m ON g.rel_manager = m.uuid
            WHERE rtgp.rel_ticket = $1
            AND rtgp.type = 'ASSIGNED'
        `;
        
        const result = await db.query(query, [ticketUuid]);
        
        // Si aucune équipe n'est trouvée, retourner un tableau vide
        if (result.rows.length === 0) {
            logger.info(`[SERVICE] No team found for ticket with UUID: ${ticketUuid}`);
            return [];
        }
        
        // Retourner l'équipe trouvée
        logger.info(`[SERVICE] Successfully retrieved team for ticket with UUID: ${ticketUuid}`);
        return result.rows;
    } catch (error) {
        logger.error('[SERVICE] Error in getTicketTeam:', error);
        throw error;
    }
};

const getProjectEpics = async (projectUuid) => {
    logger.info(`[SERVICE] Fetching epics for project with UUID: ${projectUuid}`);
    
    try {
        // Vérifier que le projet existe et est de type PROJECT
        const projectQuery = `
            SELECT uuid 
            FROM core.tickets 
            WHERE uuid = $1 AND ticket_type_code = 'PROJECT'
        `;
        
        const projectResult = await db.query(projectQuery, [projectUuid]);
        
        if (projectResult.rows.length === 0) {
            logger.error(`[SERVICE] No project found with UUID: ${projectUuid}`);
            throw new Error('Project not found');
        }
        
        // Requête pour récupérer les epics liés au projet
        const epicsQuery = `
            SELECT 
                t.uuid,
                t.title
            FROM core.tickets t
            JOIN core.rel_parent_child_tickets rpc ON t.uuid = rpc.rel_child_ticket_uuid
            WHERE rpc.rel_parent_ticket_uuid = $1
            AND rpc.dependency_code = 'EPIC'
            AND t.ticket_type_code = 'EPIC'
        `;
        
        const result = await db.query(epicsQuery, [projectUuid]);
        
        logger.info(`[SERVICE] Found ${result.rows.length} epics for project with UUID: ${projectUuid}`);
        return result.rows;
    } catch (error) {
        logger.error('[SERVICE] Error in getProjectEpics:', error);
        throw error;
    }
};

/**
 * Récupère les sprints liés à un projet spécifique
 * @param {string} projectUuid - UUID du projet
 * @returns {Promise<Array>} - Liste des sprints avec leur uuid et titre
 */
const getProjectSprints = async (projectUuid) => {
    logger.info(`[SERVICE] Fetching sprints for project with UUID: ${projectUuid}`);
    
    try {
        // Vérifier que le projet existe et est de type PROJECT
        const projectQuery = `
            SELECT uuid 
            FROM core.tickets 
            WHERE uuid = $1 AND ticket_type_code = 'PROJECT'
        `;
        
        const projectResult = await db.query(projectQuery, [projectUuid]);
        
        if (projectResult.rows.length === 0) {
            logger.error(`[SERVICE] No project found with UUID: ${projectUuid}`);
            throw new Error('Project not found');
        }
        
        // Requête pour récupérer les sprints liés au projet
        const sprintsQuery = `
            SELECT 
                t.uuid,
                t.title
            FROM core.tickets t
            JOIN core.rel_parent_child_tickets rpc ON t.uuid = rpc.rel_child_ticket_uuid
            WHERE rpc.rel_parent_ticket_uuid = $1
            AND rpc.dependency_code = 'SPRINT'
            AND t.ticket_type_code = 'SPRINT'
        `;
        
        const result = await db.query(sprintsQuery, [projectUuid]);
        
        logger.info(`[SERVICE] Found ${result.rows.length} sprints for project with UUID: ${projectUuid}`);
        return result.rows;
    } catch (error) {
        logger.error('[SERVICE] Error in getProjectSprints:', error);
        throw error;
    }
};

/**
 * Récupère les membres de l'équipe assignée à un ticket spécifique
 * @param {string} ticketUuid - UUID du ticket
 * @returns {Promise<Array>} - Liste des membres de l'équipe avec leurs informations
 */
const getTicketTeamMembers = async (ticketUuid) => {
    logger.info(`[SERVICE] Fetching team members for ticket with UUID: ${ticketUuid}`);
    
    try {
        // Requête pour récupérer tous les membres des groupes assignés au ticket
        const query = `
            SELECT DISTINCT
                p.uuid,
                p.first_name,
                p.last_name,
                p.first_name || ' ' || p.last_name as full_name,
                p.email,
                p.business_phone,
                p.business_mobile_phone,
                p.personal_mobile_phone,
                p.job_role,
                p.ref_entity_uuid,
                g.uuid as group_uuid,
                g.group_name as group_name
            FROM core.rel_tickets_groups_persons rtgp
            JOIN configuration.groups g ON rtgp.rel_assigned_to_group = g.uuid
            JOIN configuration.rel_persons_groups rpg ON g.uuid = rpg.rel_group
            JOIN configuration.persons p ON rpg.rel_member = p.uuid
            WHERE rtgp.rel_ticket = $1
            AND rtgp.type = 'ASSIGNED'
            AND (rtgp.ended_at IS NULL OR rtgp.ended_at > CURRENT_TIMESTAMP)
            ORDER BY p.last_name, p.first_name
        `;
        
        const result = await db.query(query, [ticketUuid]);
        
        // Si aucun membre n'est trouvé, retourner un tableau vide
        if (result.rows.length === 0) {
            logger.info(`[SERVICE] No team members found for ticket with UUID: ${ticketUuid}`);
            return [];
        }
        
        // Retourner les membres trouvés
        logger.info(`[SERVICE] Successfully retrieved ${result.rows.length} team members for ticket with UUID: ${ticketUuid}`);
        return result.rows;
    } catch (error) {
        logger.error('[SERVICE] Error in getTicketTeamMembers:', error);
        throw error;
    }
};

/**
 * Met à jour partiellement un ticket par son UUID
 * @param {string} uuid - UUID du ticket à mettre à jour
 * @param {Object} updateData - Données à mettre à jour
 * @returns {Promise<Object>} - Détails du ticket mis à jour
 */
const updateTicket = async (uuid, updateData) => {
    logger.info(`[SERVICE] Updating ticket with UUID: ${uuid}`);
    
    try {
        // Vérifier le type de ticket
        const ticketTypeQuery = 'SELECT ticket_type_code FROM core.tickets WHERE uuid = $1';
        const ticketTypeResult = await db.query(ticketTypeQuery, [uuid]);
        
        if (ticketTypeResult.rows.length === 0) {
            logger.error(`[SERVICE] No ticket found with UUID: ${uuid}`);
            return null;
        }
        
        const ticketType = ticketTypeResult.rows[0].ticket_type_code;
        logger.info(`[SERVICE] Ticket type for UUID ${uuid}: ${ticketType}`);
        
        // Importer les services nécessaires
        const taskService = require('./taskService');
        const incidentService = require('./incidentService');
        
        // Utiliser le service approprié selon le type de ticket
        let updatedTicket = null;
        
        // TASK
        if (ticketType === 'TASK') {
            logger.info(`[SERVICE] Calling taskService.updateTask for UUID: ${uuid}`);
            updatedTicket = await taskService.updateTask(uuid, updateData);
        }
        // INCIDENT
        else if (ticketType === 'INCIDENT') {
            logger.info(`[SERVICE] Calling incidentService.updateIncident for UUID: ${uuid}`);
            updatedTicket = await incidentService.updateIncident(uuid, updateData);
        }
        // CHANGE
        else if (ticketType === 'CHANGE') {
            logger.info(`[SERVICE] Calling changeService.updateChange for UUID: ${uuid}`);
            const changeService = require('./changeService');
            updatedTicket = await changeService.updateChange(uuid, updateData);
        }
        // DEFECT
        else if (ticketType === 'DEFECT') {
            logger.info(`[SERVICE] Calling defectService.updateDefect for UUID: ${uuid}`);
            const defectService = require('./defectService');
            updatedTicket = await defectService.updateDefect(uuid, updateData);
        }
        // EPIC
        else if (ticketType === 'EPIC') {
            logger.info(`[SERVICE] Calling epicService.updateEpic for UUID: ${uuid}`);
            const epicService = require('./epicService');
            updatedTicket = await epicService.updateEpic(uuid, updateData);
        }
        // KNOWLEDGE
        else if (ticketType === 'KNOWLEDGE') {
            logger.info(`[SERVICE] Calling knowledgeService.updateKnowledge for UUID: ${uuid}`);
            const knowledgeService = require('./knowledgeService');
            updatedTicket = await knowledgeService.updateKnowledge(uuid, updateData);
        }
        // PROBLEM
        else if (ticketType === 'PROBLEM') {
            logger.info(`[SERVICE] Calling problemService.updateProblem for UUID: ${uuid}`);
            const problemService = require('./problemService');
            updatedTicket = await problemService.updateProblem(uuid, updateData);
        }
        // PROJECT
        else if (ticketType === 'PROJECT') {
            logger.info(`[SERVICE] Calling projectService.updateProject for UUID: ${uuid}`);
            const projectService = require('./projectService');
            updatedTicket = await projectService.updateProject(uuid, updateData);
        }
        // SPRINT
        else if (ticketType === 'SPRINT') {
            logger.info(`[SERVICE] Calling sprintService.updateSprint for UUID: ${uuid}`);
            const sprintService = require('./sprintService');
            updatedTicket = await sprintService.updateSprint(uuid, updateData);
        }
        // USER_STORY
        else if (ticketType === 'USER_STORY') {
            logger.info(`[SERVICE] Calling storyService.updateStory for UUID: ${uuid}`);
            const storyService = require('./storyService');
            updatedTicket = await storyService.updateStory(uuid, updateData);
        }
        // Type de ticket non pris en charge
        else {
            logger.error(`[SERVICE] PATCH not implemented for ticket type: ${ticketType}`);
            throw new Error(`Update not implemented for ticket type: ${ticketType}`);
        }
        
        return updatedTicket;
    } catch (error) {
        logger.error(`[SERVICE] Error updating ticket with UUID ${uuid}:`, error);
        throw error;
    }
};

// Ajoute des watchers à un ticket spécifique
// @param {string} ticketUuid - UUID du ticket
// @param {Array<string>} watchList - Liste des UUIDs des personnes à ajouter comme watchers
// @returns {Promise<Object>} - Résultat de l'opération
const addWatchers = async (ticketUuid, watchList) => {
    logger.info(`[SERVICE] Adding ${watchList.length} watchers to ticket ${ticketUuid}`);
    
    // Vérifier que le ticket existe
    const ticketQuery = 'SELECT uuid FROM core.tickets WHERE uuid = $1';
    const ticketResult = await db.query(ticketQuery, [ticketUuid]);
    
    if (ticketResult.rows.length === 0) {
        logger.error(`[SERVICE] Ticket with UUID ${ticketUuid} not found`);
        throw new Error('Ticket not found');
    }
    
    // Préparer l'insertion par lots pour les watchers
    const watcherValues = watchList.map((personUuid, index) => {
        return `($1, NULL, $${index + 2}, 'WATCHER')`;
    }).join(', ');
    
    const watcherQuery = `
        INSERT INTO core.rel_tickets_groups_persons (
            rel_ticket,
            rel_assigned_to_group,
            rel_assigned_to_person,
            type
        ) VALUES ${watcherValues}
        RETURNING uuid
    `;
    
    const watcherParams = [ticketUuid, ...watchList];
    const result = await db.query(watcherQuery, watcherParams);
    
    logger.info(`[SERVICE] Successfully added ${result.rows.length} watchers to ticket ${ticketUuid}`);
    
    return { 
        success: true, 
        message: `${result.rows.length} watchers added to ticket`, 
        data: result.rows 
    };
};

// Supprime un watcher d'un ticket spécifique (en mettant à jour ended_at)
// @param {string} ticketUuid - UUID du ticket
// @param {string} userUuid - UUID de la personne à retirer des watchers
// @returns {Promise<Object>} - Résultat de l'opération
const removeWatcher = async (ticketUuid, userUuid) => {
    logger.info(`[SERVICE] Removing watcher ${userUuid} from ticket ${ticketUuid}`);
    
    // Vérifier que le ticket existe
    const ticketQuery = 'SELECT uuid FROM core.tickets WHERE uuid = $1';
    const ticketResult = await db.query(ticketQuery, [ticketUuid]);
    
    if (ticketResult.rows.length === 0) {
        logger.error(`[SERVICE] Ticket with UUID ${ticketUuid} not found`);
        throw new Error('Ticket not found');
    }
    
    // Mettre à jour la date de fin pour le watcher (ne pas supprimer la ligne)
    const updateQuery = `
        UPDATE core.rel_tickets_groups_persons
        SET ended_at = CURRENT_TIMESTAMP
        WHERE rel_ticket = $1
        AND rel_assigned_to_person = $2
        AND type = 'WATCHER'
        AND ended_at IS NULL
        RETURNING uuid
    `;
    
    const result = await db.query(updateQuery, [ticketUuid, userUuid]);
    
    if (result.rows.length === 0) {
        logger.warn(`[SERVICE] Watcher ${userUuid} not found for ticket ${ticketUuid} or already removed`);
        return { 
            success: false, 
            message: 'Watcher not found or already removed' 
        };
    }
    
    logger.info(`[SERVICE] Successfully removed watcher ${userUuid} from ticket ${ticketUuid}`);
    
    return { 
        success: true, 
        message: 'Watcher removed from ticket', 
        data: result.rows[0] 
    };
};

/**
 * Ajoute des groupes d'accès à un ticket spécifique
 * @param {string} ticketUuid - UUID du ticket
 * @param {Array<string>} groups - Liste des UUIDs des groupes à ajouter
 * @returns {Promise<Object>} - Résultat de l'opération
 */
const addAccessGroups = async (ticketUuid, groups) => {
    logger.info(`[SERVICE] Adding access groups to ticket ${ticketUuid}`);
    
    try {
        // Vérifier que le ticket existe
        const ticketCheck = await db.query('SELECT uuid FROM core.tickets WHERE uuid = $1', [ticketUuid]);
        if (ticketCheck.rows.length === 0) {
            throw new Error('Ticket not found');
        }
        
        // Valider les données d'entrée
        if (!groups || !Array.isArray(groups) || groups.length === 0) {
            return {
                success: false,
                message: 'Access groups list is required and must be a non-empty array'
            };
        }
        
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');
            
            const insertedGroups = [];
            
            for (const groupUuid of groups) {
                // Vérifier si la relation existe déjà et n'est pas terminée
                const existingCheck = await client.query(
                    `SELECT uuid FROM core.rel_tickets_groups_persons 
                     WHERE rel_ticket = $1 AND rel_assigned_to_group = $2 AND type = 'ACCESS_GRANTED' AND ended_at IS NULL`,
                    [ticketUuid, groupUuid]
                );
                
                if (existingCheck.rows.length === 0) {
                    // Insérer la nouvelle relation d'accès
                    const insertQuery = `
                        INSERT INTO core.rel_tickets_groups_persons (
                            uuid, rel_ticket, rel_assigned_to_group, type, created_at
                        ) VALUES (uuid_generate_v4(), $1, $2, 'ACCESS_GRANTED', NOW())
                        RETURNING uuid, rel_assigned_to_group
                    `;
                    
                    const result = await client.query(insertQuery, [ticketUuid, groupUuid]);
                    insertedGroups.push(result.rows[0]);
                    logger.info(`[SERVICE] Added access group ${groupUuid} to ticket ${ticketUuid}`);
                } else {
                    logger.info(`[SERVICE] Access group ${groupUuid} already exists for ticket ${ticketUuid}`);
                }
            }
            
            await client.query('COMMIT');
            
            return {
                success: true,
                message: `Successfully added ${insertedGroups.length} access groups`,
                data: insertedGroups
            };
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        logger.error('[SERVICE] Error in addAccessGroups:', error);
        throw error;
    }
};

/**
 * Supprime un groupe d'accès d'un ticket spécifique
 * @param {string} ticketUuid - UUID du ticket
 * @param {string} groupUuid - UUID du groupe à retirer
 * @returns {Promise<Object>} - Résultat de l'opération
 */
const removeAccessGroup = async (ticketUuid, groupUuid) => {
    logger.info(`[SERVICE] Removing access group ${groupUuid} from ticket ${ticketUuid}`);
    
    try {
        // Vérifier que le ticket existe
        const ticketCheck = await db.query('SELECT uuid FROM core.tickets WHERE uuid = $1', [ticketUuid]);
        if (ticketCheck.rows.length === 0) {
            throw new Error('Ticket not found');
        }
        
        const updateQuery = `
            UPDATE core.rel_tickets_groups_persons 
            SET ended_at = NOW() 
            WHERE rel_ticket = $1 AND rel_assigned_to_group = $2 AND type = 'ACCESS_GRANTED' AND ended_at IS NULL
            RETURNING uuid
        `;
        
        const result = await db.query(updateQuery, [ticketUuid, groupUuid]);
        
        if (result.rows.length === 0) {
            return {
                success: false,
                message: 'Access group not found or already removed'
            };
        }
        
        logger.info(`[SERVICE] Successfully removed access group ${groupUuid} from ticket ${ticketUuid}`);
        
        return {
            success: true,
            message: 'Access group removed successfully'
        };
        
    } catch (error) {
        logger.error('[SERVICE] Error in removeAccessGroup:', error);
        throw error;
    }
};

/**
 * Récupère les groupes d'accès d'un ticket spécifique
 * @param {string} ticketUuid - UUID du ticket
 * @param {string} lang - Code de langue pour les traductions
 * @returns {Promise<Array>} - Liste des groupes d'accès
 */
const getAccessGroups = async (ticketUuid, lang = 'en') => {
    logger.info(`[SERVICE] Getting access groups for ticket ${ticketUuid}`);
    
    try {
        // Vérifier que le ticket existe
        const ticketCheck = await db.query('SELECT uuid FROM core.tickets WHERE uuid = $1', [ticketUuid]);
        if (ticketCheck.rows.length === 0) {
            throw new Error('Ticket not found');
        }
        
        const query = `
            SELECT 
                rtgp.uuid,
                rtgp.rel_assigned_to_group as group_uuid,
                g.name as group_name,
                rtgp.created_at
            FROM core.rel_tickets_groups_persons rtgp
            JOIN configuration.groups g ON g.uuid = rtgp.rel_assigned_to_group
            WHERE rtgp.rel_ticket = $1 
              AND rtgp.type = 'ACCESS_GRANTED' 
              AND rtgp.ended_at IS NULL
            ORDER BY rtgp.created_at DESC
        `;
        
        const result = await db.query(query, [ticketUuid]);
        
        logger.info(`[SERVICE] Found ${result.rows.length} access groups for ticket ${ticketUuid}`);
        
        return result.rows;
        
    } catch (error) {
        logger.error('[SERVICE] Error in getAccessGroups:', error);
        throw error;
    }
};

/**
 * Ajoute des utilisateurs d'accès à un ticket spécifique
 * @param {string} ticketUuid - UUID du ticket
 * @param {Array<string>} users - Liste des UUIDs des utilisateurs à ajouter
 * @returns {Promise<Object>} - Résultat de l'opération
 */
const addAccessUsers = async (ticketUuid, users) => {
    logger.info(`[SERVICE] Adding access users to ticket ${ticketUuid}`);
    
    try {
        // Vérifier que le ticket existe
        const ticketCheck = await db.query('SELECT uuid FROM core.tickets WHERE uuid = $1', [ticketUuid]);
        if (ticketCheck.rows.length === 0) {
            throw new Error('Ticket not found');
        }
        
        // Valider les données d'entrée
        if (!users || !Array.isArray(users) || users.length === 0) {
            return {
                success: false,
                message: 'Access users list is required and must be a non-empty array'
            };
        }
        
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');
            
            const insertedUsers = [];
            
            for (const userUuid of users) {
                // Vérifier si la relation existe déjà et n'est pas terminée
                const existingCheck = await client.query(
                    `SELECT uuid FROM core.rel_tickets_groups_persons 
                     WHERE rel_ticket = $1 AND rel_assigned_to_person = $2 AND type = 'ACCESS_GRANTED' AND ended_at IS NULL`,
                    [ticketUuid, userUuid]
                );
                
                if (existingCheck.rows.length === 0) {
                    // Insérer la nouvelle relation d'accès
                    const insertQuery = `
                        INSERT INTO core.rel_tickets_groups_persons (
                            uuid, rel_ticket, rel_assigned_to_person, type, created_at
                        ) VALUES (uuid_generate_v4(), $1, $2, 'ACCESS_GRANTED', NOW())
                        RETURNING uuid, rel_assigned_to_person
                    `;
                    
                    const result = await client.query(insertQuery, [ticketUuid, userUuid]);
                    insertedUsers.push(result.rows[0]);
                    logger.info(`[SERVICE] Added access user ${userUuid} to ticket ${ticketUuid}`);
                } else {
                    logger.info(`[SERVICE] Access user ${userUuid} already exists for ticket ${ticketUuid}`);
                }
            }
            
            await client.query('COMMIT');
            
            return {
                success: true,
                message: `Successfully added ${insertedUsers.length} access users`,
                data: insertedUsers
            };
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        logger.error('[SERVICE] Error in addAccessUsers:', error);
        throw error;
    }
};

/**
 * Supprime un utilisateur d'accès d'un ticket spécifique
 * @param {string} ticketUuid - UUID du ticket
 * @param {string} userUuid - UUID de l'utilisateur à retirer
 * @returns {Promise<Object>} - Résultat de l'opération
 */
const removeAccessUser = async (ticketUuid, userUuid) => {
    logger.info(`[SERVICE] Removing access user ${userUuid} from ticket ${ticketUuid}`);
    
    try {
        // Vérifier que le ticket existe
        const ticketCheck = await db.query('SELECT uuid FROM core.tickets WHERE uuid = $1', [ticketUuid]);
        if (ticketCheck.rows.length === 0) {
            throw new Error('Ticket not found');
        }
        
        const updateQuery = `
            UPDATE core.rel_tickets_groups_persons 
            SET ended_at = NOW() 
            WHERE rel_ticket = $1 AND rel_assigned_to_person = $2 AND type = 'ACCESS_GRANTED' AND ended_at IS NULL
            RETURNING uuid
        `;
        
        const result = await db.query(updateQuery, [ticketUuid, userUuid]);
        
        if (result.rows.length === 0) {
            return {
                success: false,
                message: 'Access user not found or already removed'
            };
        }
        
        logger.info(`[SERVICE] Successfully removed access user ${userUuid} from ticket ${ticketUuid}`);
        
        return {
            success: true,
            message: 'Access user removed successfully'
        };
        
    } catch (error) {
        logger.error('[SERVICE] Error in removeAccessUser:', error);
        throw error;
    }
};

/**
 * Récupère les utilisateurs d'accès d'un ticket spécifique
 * @param {string} ticketUuid - UUID du ticket
 * @param {string} lang - Code de langue pour les traductions
 * @returns {Promise<Array>} - Liste des utilisateurs d'accès
 */
const getAccessUsers = async (ticketUuid, lang = 'en') => {
    logger.info(`[SERVICE] Getting access users for ticket ${ticketUuid}`);
    
    try {
        // Vérifier que le ticket existe
        const ticketCheck = await db.query('SELECT uuid FROM core.tickets WHERE uuid = $1', [ticketUuid]);
        if (ticketCheck.rows.length === 0) {
            throw new Error('Ticket not found');
        }
        
        const query = `
            SELECT 
                rtgp.uuid,
                rtgp.rel_assigned_to_person as user_uuid,
                p.first_name,
                p.last_name,
                p.email,
                rtgp.created_at
            FROM core.rel_tickets_groups_persons rtgp
            JOIN configuration.persons p ON p.uuid = rtgp.rel_assigned_to_person
            WHERE rtgp.rel_ticket = $1 
              AND rtgp.type = 'ACCESS_GRANTED' 
              AND rtgp.ended_at IS NULL
            ORDER BY rtgp.created_at DESC
        `;
        
        const result = await db.query(query, [ticketUuid]);
        
        logger.info(`[SERVICE] Found ${result.rows.length} access users for ticket ${ticketUuid}`);
        
        return result.rows;
        
    } catch (error) {
        logger.error('[SERVICE] Error in getAccessUsers:', error);
        throw error;
    }
};

/**
 * Ajoute des relations parent-enfant entre tickets
 * @param {string} parentUuid - UUID du ticket parent
 * @param {string} dependencyType - Type de dépendance (ex: DEPENDENCY_CODE)
 * @param {Array<string>} childrenUuids - Liste des UUIDs des tickets enfants
 * @returns {Promise<Object>} - Résultat de l'opération
 */
const addChildrenTickets = async (parentUuid, dependencyType, childrenUuids) => {
    logger.info(`[SERVICE] Adding ${childrenUuids.length} child tickets to parent ${parentUuid} with dependency type ${dependencyType}`);
    
    // Start a transaction
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        // Préparer la requête pour l'insertion multiple
        const insertPromises = childrenUuids.map(childUuid => {
            const insertQuery = `
                INSERT INTO core.rel_parent_child_tickets (
                    rel_parent_ticket_uuid,
                    rel_child_ticket_uuid,
                    dependency_code
                ) VALUES ($1, $2, $3)
            `;
            
            return client.query(insertQuery, [parentUuid, childUuid, dependencyType]);
        });
        
        // Exécuter toutes les insertions
        await Promise.all(insertPromises);
        
        await client.query('COMMIT');
        
        logger.info(`[SERVICE] Successfully added ${childrenUuids.length} child tickets to parent ${parentUuid}`);
        
        return {
            success: true,
            parentUuid,
            dependencyType,
            childrenCount: childrenUuids.length
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('[SERVICE] Error adding children tickets:', error);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Supprime une relation parent-enfant entre tickets (en mettant à jour ended_at)
 * @param {string} parentUuid - UUID du ticket parent
 * @param {string} childUuid - UUID du ticket enfant
 * @returns {Promise<Object>} - Résultat de l'opération
 */
const removeChildTicket = async (parentUuid, childUuid) => {
    logger.info(`[SERVICE] Removing child ticket ${childUuid} from parent ${parentUuid}`);
    
    // Start a transaction
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        // Mettre à jour la relation en ajoutant un timestamp dans ended_at
        const updateQuery = `
            UPDATE core.rel_parent_child_tickets
            SET ended_at = NOW(), updated_at = NOW()
            WHERE rel_parent_ticket_uuid = $1 
            AND rel_child_ticket_uuid = $2
            AND ended_at IS NULL
            RETURNING *
        `;
        
        const result = await client.query(updateQuery, [parentUuid, childUuid]);
        
        await client.query('COMMIT');
        
        if (result.rowCount === 0) {
            logger.warn(`[SERVICE] No active relation found between parent ${parentUuid} and child ${childUuid}`);
            return {
                success: false,
                message: 'No active relation found between parent and child tickets'
            };
        }
        
        logger.info(`[SERVICE] Successfully removed child ticket ${childUuid} from parent ${parentUuid}`);
        
        return {
            success: true,
            message: 'Child ticket relation removed',
            data: result.rows[0]
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('[SERVICE] Error removing child ticket relation:', error);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Fonction générique pour appliquer des mises à jour à un ticket
 * @param {string} uuid - UUID du ticket à mettre à jour
 * @param {Object} updateData - Données à mettre à jour
 * @param {string} ticketType - Type de ticket (ex: 'INCIDENT', 'PROBLEM', 'TASK')
 * @param {Array} standardFields - Liste des champs standards pour ce type de ticket
 * @param {Array} assignmentFields - Liste des champs d'assignation pour ce type de ticket
 * @param {Array} extendedAttributesFields - Liste des attributs étendus pour ce type de ticket (optionnel)
 * @param {Function} getTicketById - Fonction pour récupérer le ticket par son ID
 * @param {string} servicePrefix - Préfixe pour les logs (ex: '[INCIDENT SERVICE]')
 * @returns {Promise<Object>} - Détails du ticket mis à jour
 */
const applyUpdate = async (uuid, updateData, ticketType, standardFields, assignmentFields, extendedAttributesFields, getTicketById, servicePrefix) => {
    try {
        // Vérifier si le ticket existe
        const checkQuery = `
            SELECT uuid FROM core.tickets 
            WHERE uuid = $1 AND ticket_type_code = $2
        `;
        const checkResult = await db.query(checkQuery, [uuid, ticketType]);
        
        if (checkResult.rows.length === 0) {
            logger.error(`${servicePrefix} No ${ticketType.toLowerCase()} found with UUID: ${uuid}`);
            return null;
        }
        
        // Filtrer les champs standards à mettre à jour
        const standardFieldsToUpdate = Object.keys(updateData).filter(field => 
            standardFields.includes(field)
        );
        
        // Filtrer les champs d'assignation à mettre à jour
        const assignmentFieldsToUpdate = Object.keys(updateData).filter(field => 
            assignmentFields.includes(field)
        );
        
        // Filtrer les attributs étendus à mettre à jour (si applicable)
        let extendedAttributesToUpdate = [];
        if (extendedAttributesFields && extendedAttributesFields.length > 0) {
            extendedAttributesToUpdate = Object.keys(updateData).filter(field => 
                extendedAttributesFields.includes(field)
            );
        }
        
        // Vérifier s'il y a des champs à mettre à jour
        if (standardFieldsToUpdate.length === 0 && assignmentFieldsToUpdate.length === 0 && extendedAttributesToUpdate.length === 0) {
            logger.warn(`${servicePrefix} No valid fields to update for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
            return await getTicketById(uuid, 'en'); // Retourner le ticket sans modifications
        }
        
        // Ajouter des logs pour voir les champs à mettre à jour
        logger.info(`${servicePrefix} Updating ${ticketType.toLowerCase()} with UUID: ${uuid}`);
        logger.info(`${servicePrefix} Standard fields to update: ${JSON.stringify(standardFieldsToUpdate)}`);
        logger.info(`${servicePrefix} Assignment fields to update: ${JSON.stringify(assignmentFieldsToUpdate)}`);
        if (extendedAttributesFields && extendedAttributesFields.length > 0) {
            logger.info(`${servicePrefix} Extended attributes to update: ${JSON.stringify(extendedAttributesToUpdate)}`);
        }
        
        // Utiliser une transaction pour garantir l'intégrité des données
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');
            
            let updatedTicket = null;
            
            // Cas 1: Mise à jour des champs standards
            if (standardFieldsToUpdate.length > 0) {
                let setClause = standardFieldsToUpdate.map((field, index) => 
                    `${field} = $${index + 2}`
                ).join(', ');
                
                // Ajouter la mise à jour de updated_at
                setClause += ', updated_at = CURRENT_TIMESTAMP';
                
                const updateQuery = `
                    UPDATE core.tickets
                    SET ${setClause}
                    WHERE uuid = $1
                    RETURNING *
                `;
                
                // Préparer les valeurs pour la requête
                const values = [uuid];
                standardFieldsToUpdate.forEach(field => {
                    values.push(updateData[field]);
                });
                
                logger.info(`${servicePrefix} Executing standard fields update query for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
                const result = await client.query(updateQuery, values);
                
                if (result.rows.length === 0) {
                    logger.error(`${servicePrefix} Failed to update standard fields for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
                    throw new Error('Failed to update standard fields');
                }
                
                updatedTicket = result.rows[0];
                logger.info(`${servicePrefix} Successfully updated standard fields for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
            }
            
            // Cas 2: Mise à jour des attributs étendus (si applicable)
            if (extendedAttributesFields && extendedAttributesToUpdate.length > 0) {
                // Approche optimisée : utiliser jsonb_set pour mettre à jour chaque attribut individuellement
                let setClause = 'core_extended_attributes = ';
                let params = [uuid]; // Premier paramètre est toujours l'UUID
                let paramIndex = 2;
                
                // Construire une chaîne de jsonb_set imbriqués pour mettre à jour tous les attributs en une seule requête
                extendedAttributesToUpdate.forEach((attr, index) => {
                    // Premier attribut : initialiser avec COALESCE pour gérer le cas où core_extended_attributes est NULL
                    if (index === 0) {
                        setClause += `jsonb_set(
                            COALESCE(core_extended_attributes, '{}'::jsonb),
                            '{${attr}}',
                            $${paramIndex}::jsonb,
                            true
                        )`;
                    } else {
                        // Pour les attributs suivants, imbriquer les appels jsonb_set
                        setClause = `jsonb_set(
                            ${setClause},
                            '{${attr}}',
                            $${paramIndex}::jsonb,
                            true
                        )`;
                    }
                    
                    // Ajouter la valeur du paramètre
                    params.push(JSON.stringify(updateData[attr]));
                    paramIndex++;
                });
                
                // Construire la requête SQL complète
                const updateExtendedQuery = `
                    UPDATE core.tickets
                    SET ${setClause},
                        updated_at = CURRENT_TIMESTAMP
                    WHERE uuid = $1
                    RETURNING *
                `;
                
                logger.info(`${servicePrefix} Executing optimized extended attributes update query for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
                const result = await client.query(updateExtendedQuery, params);
                
                if (result.rows.length === 0) {
                    logger.error(`${servicePrefix} Failed to update extended attributes for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
                    throw new Error('Failed to update extended attributes');
                }
                
                updatedTicket = result.rows[0];
                logger.info(`${servicePrefix} Successfully updated extended attributes for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
            }
            
            // Cas 3: Mise à jour des champs d'assignation
            if (assignmentFieldsToUpdate.length > 0) {
                // Déterminer le type de mise à jour
                const isUpdatingGroup = assignmentFieldsToUpdate.includes('assigned_to_group');
                const isUpdatingPerson = assignmentFieldsToUpdate.includes('assigned_to_person');
                
                logger.info(`${servicePrefix} Updating assignment fields for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
                logger.info(`${servicePrefix} Updating group: ${isUpdatingGroup ? 'GROUP' : 'NO'}`);
                logger.info(`${servicePrefix} Updating person: ${isUpdatingPerson ? 'PERSON' : 'NO'}`);
                // Cas A: Si on met à jour uniquement rel_assigned_to_person
                if (isUpdatingPerson && !isUpdatingGroup) {
                    // Récupérer l'assignation courante
                    const getCurrentAssignmentQuery = `
                        SELECT uuid, rel_assigned_to_group
                        FROM core.rel_tickets_groups_persons
                        WHERE rel_ticket = $1 
                          AND type = 'ASSIGNED'
                          AND ended_at IS NULL
                    `;
                    
                    const currentAssignment = await client.query(getCurrentAssignmentQuery, [uuid]);
                    
                    logger.info(`${servicePrefix} Current assignment: ${JSON.stringify(currentAssignment.rows)}`);
                    
                    if (currentAssignment.rows.length === 0) {
                        logger.warn(`${servicePrefix} No current assignment found for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
                        
                        // Si pas d'assignation existante, on ne peut pas mettre à jour uniquement la personne
                        logger.error(`${servicePrefix} Cannot update only person assignment without an existing group assignment for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
                        throw new Error('Cannot update only person assignment without an existing group assignment');
                    }
                    
                    // Mettre à jour l'assignation existante
                    const updateAssignmentQuery = `
                        UPDATE core.rel_tickets_groups_persons
                        SET rel_assigned_to_person = $1, updated_at = CURRENT_TIMESTAMP
                        WHERE uuid = $2
                    `;
                    
                    logger.info(`${servicePrefix} Updating person assignment for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
                    await client.query(updateAssignmentQuery, [
                        updateData.assigned_to_person,
                        currentAssignment.rows[0].uuid
                    ]);
                    
                    logger.info(`${servicePrefix} Successfully updated person assignment for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
                }
                // Cas B: Si on met à jour le groupe (avec ou sans personne)
                else if (isUpdatingGroup) {
                    // Récupérer l'assignation courante
                    const getCurrentAssignmentQuery = `
                        SELECT uuid, rel_assigned_to_group, rel_assigned_to_person
                        FROM core.rel_tickets_groups_persons
                        WHERE rel_ticket = $1 
                          AND type = 'ASSIGNED'
                          AND ended_at IS NULL
                    `;
                    
                    const currentAssignment = await client.query(getCurrentAssignmentQuery, [uuid]);
                    
                    // Si une personne est actuellement assignée, vérifier si elle appartient au nouveau groupe
                    let personInNewGroup = false;
                    if (currentAssignment.rows.length > 0 && currentAssignment.rows[0].rel_assigned_to_person) {
                        const currentPersonId = currentAssignment.rows[0].rel_assigned_to_person;
                        
                        // Vérifier si la personne appartient au nouveau groupe
                        const checkPersonInGroupQuery = `
                            SELECT uuid 
                            FROM configuration.rel_persons_groups 
                            WHERE rel_member = $1 AND rel_group = $2
                        `;
                        
                        const personInGroupResult = await client.query(checkPersonInGroupQuery, [
                            currentPersonId,
                            updateData.assigned_to_group
                        ]);
                        
                        personInNewGroup = personInGroupResult.rows.length > 0;
                    }
                    
                    // Cas B1: Si la personne n'appartient pas au nouveau groupe, terminer l'assignation et en créer une nouvelle
                    if (!personInNewGroup) {
                        // Terminer l'assignation courante
                        const endCurrentAssignmentQuery = `
                            UPDATE core.rel_tickets_groups_persons
                            SET ended_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                            WHERE rel_ticket = $1 
                              AND type = 'ASSIGNED'
                              AND ended_at IS NULL
                        `;
                        
                        logger.info(`${servicePrefix} Ending current assignment for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
                        await client.query(endCurrentAssignmentQuery, [uuid]);
                        
                        // Créer une nouvelle assignation
                        const createAssignmentQuery = `
                            INSERT INTO core.rel_tickets_groups_persons (
                                rel_ticket,
                                rel_assigned_to_group,
                                rel_assigned_to_person,
                                type
                            ) VALUES ($1, $2, $3, 'ASSIGNED')
                        `;
                        
                        logger.info(`${servicePrefix} Creating new assignment for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
                        await client.query(createAssignmentQuery, [
                            uuid,
                            updateData.assigned_to_group,
                            isUpdatingPerson ? updateData.assigned_to_person : null
                        ]);
                        
                        logger.info(`${servicePrefix} Successfully created new assignment for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
                    }
                    // Cas B2: Si la personne appartient au nouveau groupe, mettre à jour l'assignation courante
                    else {
                        const updateAssignmentQuery = `
                            UPDATE core.rel_tickets_groups_persons
                            SET rel_assigned_to_group = $1, updated_at = CURRENT_TIMESTAMP
                            WHERE uuid = $2
                        `;
                        
                        logger.info(`${servicePrefix} Updating group assignment for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
                        await client.query(updateAssignmentQuery, [
                            updateData.assigned_to_group,
                            currentAssignment.rows[0].uuid
                        ]);
                        
                        // Si on met à jour aussi la personne
                        if (isUpdatingPerson) {
                            const updatePersonQuery = `
                                UPDATE core.rel_tickets_groups_persons
                                SET rel_assigned_to_person = $1, updated_at = CURRENT_TIMESTAMP
                                WHERE uuid = $2
                            `;
                            
                            logger.info(`${servicePrefix} Updating person assignment for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
                            await client.query(updatePersonQuery, [
                                updateData.assigned_to_person,
                                currentAssignment.rows[0].uuid
                            ]);
                        }
                        
                        logger.info(`${servicePrefix} Successfully updated assignment for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
                    }
                }
            }
            
            await client.query('COMMIT');
            
            // Récupérer le ticket mis à jour avec toutes ses informations
            logger.info(`${servicePrefix} Retrieving updated ${ticketType.toLowerCase()} with UUID: ${uuid}`);
            return await getTicketById(uuid, 'en');
            
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error(`${servicePrefix} Error in applyUpdate for ${ticketType.toLowerCase()} with UUID ${uuid}:`, error);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        logger.error(`${servicePrefix} Error in applyUpdate:`, error);
        throw error;
    }
};

/**
 * Fonction générique pour appliquer la création d'un ticket
 * @param {Object} ticketData - Données pour la création du ticket
 * @param {string} ticketType - Type de ticket (ex: 'INCIDENT', 'PROBLEM', 'TASK')
 * @param {Object} standardFields - Objet des champs standards pour ce type de ticket
 * @param {Object} assignmentFields - Objet des champs d'assignation pour ce type de ticket
 * @param {Object} extendedAttributesFields - Objet des attributs étendus pour ce type de ticket (optionnel)
 * @param {Array} watchList - Liste des UUIDs des observateurs à ajouter (optionnel)
 * @param {Array} parentChildRelations - Liste des relations parent-enfant à créer (optionnel)
 * @param {Function} getTicketById - Fonction pour récupérer le ticket par son ID
 * @param {string} servicePrefix - Préfixe pour les logs (ex: '[INCIDENT SERVICE]')
 * @returns {Promise<Object>} - Détails du ticket créé
 */
const applyCreation = async (ticketData, ticketType, standardFields, assignmentFields, extendedAttributesFields, watchList, parentChildRelations, getTicketById, servicePrefix) => {
    logger.info(`${servicePrefix} [applyCreation] Creating new ${ticketType.toLowerCase()}`);
    
    // Utiliser une transaction pour garantir l'intégrité des données
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        // Étape 1: Insérer les données de base du ticket
        const insertTicketQuery = `
            INSERT INTO core.tickets (
                title, description, configuration_item_uuid, ticket_type_code,
                ticket_status_code, requested_by_uuid, requested_for_uuid, writer_uuid,
                core_extended_attributes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;
        
        const ticketValues = [
            standardFields.title,
            standardFields.description,
            standardFields.configuration_item_uuid,
            ticketType,
            standardFields.ticket_status_code,
            standardFields.requested_by_uuid,
            standardFields.requested_for_uuid,
            standardFields.writer_uuid,
            extendedAttributesFields || {}
        ];
        
        logger.info(`${servicePrefix} [applyCreation] Executing ticket creation query`);
        const ticketResult = await client.query(insertTicketQuery, ticketValues);
        
        if (ticketResult.rows.length === 0) {
            throw new Error(`Failed to create ${ticketType.toLowerCase()}`);
        }
        
        const newTicket = ticketResult.rows[0];
        logger.info(`${servicePrefix} [applyCreation] Successfully created ${ticketType.toLowerCase()} with UUID: ${newTicket.uuid}`);
        
        // Étape 2: Gérer l'assignation si nécessaire
        if (assignmentFields && (assignmentFields.assigned_to_group || assignmentFields.assigned_to_person)) {
            const insertAssignmentQuery = `
                INSERT INTO core.rel_tickets_groups_persons (
                    rel_ticket, rel_assigned_to_group, rel_assigned_to_person, type
                ) VALUES ($1, $2, $3, 'ASSIGNED')
                RETURNING *
            `;
            
            const assignmentValues = [
                newTicket.uuid,
                assignmentFields.assigned_to_group,
                assignmentFields.assigned_to_person
            ];
            
            logger.info(`${servicePrefix} [applyCreation] Creating assignment for ${ticketType.toLowerCase()} with UUID: ${newTicket.uuid}`);
            await client.query(insertAssignmentQuery, assignmentValues);
            logger.info(`${servicePrefix} [applyCreation] Successfully created assignment for ${ticketType.toLowerCase()} with UUID: ${newTicket.uuid}`);
        }
        
        // Étape 3: Gérer les observateurs (watchers) si fournis
        if (watchList && Array.isArray(watchList) && watchList.length > 0) {
            logger.info(`${servicePrefix} [applyCreation] Processing ${watchList.length} watchers for ${ticketType.toLowerCase()} with UUID: ${newTicket.uuid}`);
            
            // Préparer l'insertion par lot pour les observateurs
            const watcherValues = watchList.map((personUuid, index) => {
                return `($1, NULL, $${index + 2}, 'WATCHER')`;
            }).join(', ');
            
            const watcherQuery = `
                INSERT INTO core.rel_tickets_groups_persons (
                    rel_ticket,
                    rel_assigned_to_group,
                    rel_assigned_to_person,
                    type
                ) VALUES ${watcherValues}
            `;
            
            const watcherParams = [newTicket.uuid, ...watchList];
            await client.query(watcherQuery, watcherParams);
            logger.info(`${servicePrefix} [applyCreation] Successfully added ${watchList.length} watchers for ${ticketType.toLowerCase()} with UUID: ${newTicket.uuid}`);
        }
        
        // Étape 4: Gérer les relations parent-enfant si présentes
        if (parentChildRelations && Array.isArray(parentChildRelations) && parentChildRelations.length > 0) {
            logger.info(`${servicePrefix} [applyCreation] Processing ${parentChildRelations.length} parent-child relations for ${ticketType.toLowerCase()} with UUID: ${newTicket.uuid}`);
            
            for (const relation of parentChildRelations) {
                const relationQuery = `
                    INSERT INTO core.rel_parent_child_tickets (
                        rel_parent_ticket_uuid,
                        rel_child_ticket_uuid,
                        dependency_code
                    ) VALUES ($1, $2, $3)
                `;
                
                await client.query(relationQuery, [newTicket.uuid, relation.childUuid, relation.dependencyCode]);
                logger.info(`${servicePrefix} [applyCreation] Added parent-child relation: ${newTicket.uuid} -> ${relation.childUuid} (${relation.dependencyCode})`);
            }
        }
        
        // Étape 5: Si c'est un article de connaissance, créer la version initiale
        if (ticketType === 'KNOWLEDGE') {
            logger.info(`${servicePrefix} [applyCreation] Creating initial knowledge article version for ticket UUID: ${newTicket.uuid}`);
            
            const versionQuery = `
                INSERT INTO core.knowledge_article_versions (
                    rel_article_uuid,
                    version_number,
                    change_type,
                    change_summary,
                    full_article,
                    created_by
                ) VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING uuid
            `;
            
            // Créer un objet full_article qui contient toutes les informations du ticket
            const fullArticle = {
                ...newTicket,
                extended_attributes: extendedAttributesFields || {}
            };
            
            // Insérer la version initiale (V1) de l'article
            const versionResult = await client.query(versionQuery, [
                newTicket.uuid,                    // rel_article_uuid
                1,                                  // version_number (première version)
                'CREATION',                         // change_type
                'Initial creation of knowledge article', // change_summary
                fullArticle,                        // full_article (JSONB)
                standardFields.writer_uuid          // created_by
            ]);
            
            logger.info(`${servicePrefix} [applyCreation] Created knowledge article version with UUID: ${versionResult.rows[0].uuid}`);
        }
        
        // Valider la transaction
        await client.query('COMMIT');
        logger.info(`${servicePrefix} [applyCreation] Transaction committed successfully for ${ticketType.toLowerCase()} creation with UUID: ${newTicket.uuid}`);
        
        // Récupérer le ticket complet avec toutes ses relations
        return await getTicketById(newTicket.uuid, 'en');
    } catch (error) {
        // En cas d'erreur, annuler la transaction
        await client.query('ROLLBACK');
        logger.error(`${servicePrefix} [applyCreation] Error creating ${ticketType.toLowerCase()}: ${error.message}`);
        throw error;
    } finally {
        // Libérer le client
        client.release();
    }
};

/**
 * Get tickets with lazy search - returns paginated results filtered by search query
 * @param {string} [searchQuery] - Optional search term to filter tickets
 * @param {number} [page=1] - Page number (1-indexed)
 * @param {number} [limit=10] - Number of results per page
 * @param {string} [lang='en'] - Language code for translations
 * @returns {Promise<Object>} Object with data and pagination metadata
 */
const getTicketsLazySearch = async (searchQuery = '', page = 1, limit = 10, lang = 'en') => {
    try {
        logger.info(`[SERVICE] Getting tickets with lazy search: "${searchQuery}", page: ${page}, limit: ${limit}, lang: ${lang}`);
        
        // Validate and sanitize pagination parameters
        const validPage = Math.max(1, parseInt(page) || 1);
        const validLimit = Math.min(15, Math.max(1, parseInt(limit) || 10)); // Max 15 per page
        const offset = (validPage - 1) * validLimit;
        
        // Separate WHERE clauses for COUNT and main query
        let countWhereClause = `WHERE 1=1`;
        let mainWhereClause = `WHERE 1=1`;
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
                        unaccent(LOWER(p3.first_name || ' ' || p3.last_name)) LIKE unaccent(LOWER($${countParamIndex})) OR
                        unaccent(LOWER(ci.name)) LIKE unaccent(LOWER($${countParamIndex}))
                    )`);
                    countParamIndex++;
                    
                    // For main query
                    queryParams.push(`%${term}%`);
                    mainConditions.push(`(
                        unaccent(LOWER(t.title)) LIKE unaccent(LOWER($${paramIndex})) OR
                        unaccent(LOWER(p3.first_name || ' ' || p3.last_name)) LIKE unaccent(LOWER($${paramIndex})) OR
                        unaccent(LOWER(ci.name)) LIKE unaccent(LOWER($${paramIndex}))
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
            JOIN configuration.persons p3 ON t.writer_uuid = p3.uuid
            LEFT JOIN data.configuration_items ci ON t.configuration_item_uuid = ci.uuid
            ${countWhereClause}
        `;
        const { rows: countRows } = await db.query(countQuery, countParams);
        const total = parseInt(countRows[0].total);
        
        // Main query to fetch tickets
        const query = `
            SELECT 
                t.uuid,
                t.title,
                t.ticket_type_code,
                COALESCE(ttt.label, tt.code) as ticket_type_label,
                t.ticket_status_code,
                COALESCE(tst.label, ts.code) as ticket_status_label,
                p3.first_name || ' ' || p3.last_name as writer_name,
                ci.name as configuration_item_name,
                t.created_at,
                t.updated_at,
                t.closed_at
            FROM core.tickets t
            JOIN configuration.persons p3 ON t.writer_uuid = p3.uuid
            JOIN configuration.ticket_types tt ON t.ticket_type_code = tt.code
            JOIN configuration.ticket_status ts ON t.ticket_status_code = ts.code AND ts.rel_ticket_type = tt.code
            LEFT JOIN translations.ticket_types_translation ttt ON tt.uuid = ttt.ticket_type_uuid AND ttt.lang = $1
            LEFT JOIN translations.ticket_status_translation tst ON ts.uuid = tst.ticket_status_uuid AND tst.lang = $1
            LEFT JOIN data.configuration_items ci ON t.configuration_item_uuid = ci.uuid
            ${mainWhereClause}
            ORDER BY t.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        queryParams.push(validLimit, offset);
        
        const { rows } = await db.query(query, queryParams);
        
        // Calculate pagination metadata
        const totalPages = Math.ceil(total / validLimit);
        const hasMore = validPage < totalPages;
        
        logger.info(`[SERVICE] Found ${rows.length} tickets (total: ${total}, page: ${validPage}/${totalPages})`);
        
        return {
            data: rows,
            pagination: {
                page: validPage,
                limit: validLimit,
                total,
                totalPages,
                hasMore
            }
        };
    } catch (error) {
        logger.error('[SERVICE] Error in getTicketsLazySearch:', error);
        throw error;
    }
};

module.exports = {
    getTickets,
    createTicket,
    getTicketTeam,
    getTicketById,
    getProjectEpics,
    getProjectSprints,
    getTicketTeamMembers,
    updateTicket,
    addWatchers,
    removeWatcher,
    addAccessGroups,
    removeAccessGroup,
    getAccessGroups,
    addAccessUsers,
    removeAccessUser,
    getAccessUsers,
    addChildrenTickets,
    removeChildTicket,
    applyUpdate,
    applyCreation,
    getTicketsLazySearch
};
