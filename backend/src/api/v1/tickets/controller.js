const ticketService = require('./service');
const incidentService = require('./incidentService');
const taskService = require('./taskService');
const problemService = require('./problemService');
const changeService = require('./changeService');
const knowledgeService = require('./knowledgeService');
const projectService = require('./projectService');
const defectService = require('./defectService');
const sprintService = require('./sprintService');
const storyService = require('./storyService');
const epicService = require('./epicService');
const logger = require('../../../config/logger');

const getTickets = async (req, res) => {
    try {
        logger.info('[TICKETS CONTROLLER] Processing GET /tickets request');
        const { lang, ticket_type } = req.query;
        
        let tickets;
        
        // Utiliser le service approprié selon le type de ticket
        switch (ticket_type) {
            case 'INCIDENT':
                logger.info('[TICKETS CONTROLLER] Calling incidentService.getIncidents');
                tickets = await incidentService.getIncidents(lang);
                break;
            case 'PROBLEM':
                logger.info('[TICKETS CONTROLLER] Calling problemService.getProblems');
                tickets = await problemService.getProblems(lang);
                break;
            case 'CHANGE':
                logger.info('[TICKETS CONTROLLER] Calling changeService.getChanges');
                tickets = await changeService.getChanges(lang);
                break;
            case 'KNOWLEDGE':
                logger.info('[TICKETS CONTROLLER] Calling knowledgeService.getKnowledgeArticles');
                tickets = await knowledgeService.getKnowledgeArticles(lang);
                break;
            case 'PROJECT':
                logger.info('[TICKETS CONTROLLER] Calling projectService.getProjects');
                tickets = await projectService.getProjects(lang);
                break;
            case 'DEFECT':
                logger.info('[TICKETS CONTROLLER] Calling defectService.getDefects');
                tickets = await defectService.getDefects(lang);
                break;
            case 'SPRINT':
                logger.info('[TICKETS CONTROLLER] Calling sprintService.getSprints');
                tickets = await sprintService.getSprints(lang);
                break;
            case 'EPIC':
                logger.info('[TICKETS CONTROLLER] Calling epicService.getEpics');
                tickets = await epicService.getEpics(lang);
                break;
            case 'USER_STORY':
                logger.info('[TICKETS CONTROLLER] Calling storyService.getUserStories');
                tickets = await storyService.getUserStories(lang);
                break;
            default:
                logger.info(`[TICKETS CONTROLLER] Calling ticketService.getTickets for type: ${ticket_type || 'all'}`);
                tickets = await ticketService.getTickets(lang, ticket_type);
                break;
        }
        
        res.json(tickets);
    } catch (error) {
        logger.error('[TICKETS CONTROLLER] Error in getTickets:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Search tickets with advanced filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const searchTickets = async (req, res) => {
  try {
    logger.info('[TICKETS CONTROLLER] Searching tickets with body:', req.body);
    
    const searchResults = await taskService.searchTickets(req.body);
    
    res.status(200).json(searchResults);
  } catch (error) {
    logger.error('[TICKETS CONTROLLER] Error in searchTickets:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

const createTicket = async (req, res) => {
    try {
        // Récupérer le type de ticket depuis req.body.ticket_type_code
        const ticketType = req.body && req.body.ticket_type_code;
        
        // Log pour le debugging
        logger.info(`[TICKETS CONTROLLER] Processing POST /tickets request for type: ${ticketType || 'UNKNOWN'}`);
        
        // Créer le ticket
        const ticket = await ticketService.createTicket(req.body);
        
        // Log de succès avec l'UUID du ticket créé
        logger.info(`[TICKETS CONTROLLER] Successfully created ticket with UUID: ${ticket.uuid}`);
        
        res.status(201).json(ticket);
    } catch (error) {
        logger.error('[TICKETS CONTROLLER] Error in createTicket:', error);
        if (error.constraint) {
            res.status(400).json({ error: 'Invalid reference data' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

const getTicketTeam = async (req, res) => {
    try {
        logger.info(`[TICKETS CONTROLLER] Processing GET /tickets/${req.params.uuid}/team request`);
        const ticketUuid = req.params.uuid;
        
        // Vérifier que l'UUID est valide
        if (!ticketUuid || ticketUuid.trim() === '') {
            logger.error('[TICKETS CONTROLLER] Invalid ticket UUID provided');
            return res.status(400).json({ error: 'Invalid ticket UUID' });
        }
        
        const team = await ticketService.getTicketTeam(ticketUuid);
        res.json(team);
    } catch (error) {
        logger.error('[TICKETS CONTROLLER] Error in getTicketTeam:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getProjectEpics = async (req, res) => {
    try {
        logger.info(`[TICKETS CONTROLLER] Processing GET /tickets/${req.params.uuid}/epics request`);
        const projectUuid = req.params.uuid;
        
        // Vérifier que l'UUID est valide
        if (!projectUuid || projectUuid.trim() === '') {
            logger.error('[TICKETS CONTROLLER] Invalid project UUID provided');
            return res.status(400).json({ error: 'Invalid project UUID' });
        }
        
        const epics = await ticketService.getProjectEpics(projectUuid);
        res.json(epics);
    } catch (error) {
        logger.error('[TICKETS CONTROLLER] Error in getProjectEpics:', error);
        if (error.message === 'Project not found') {
            res.status(404).json({ error: 'Project not found' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

const getProjectSprints = async (req, res) => {
    try {
        logger.info(`[TICKETS CONTROLLER] Processing GET /tickets/${req.params.uuid}/sprints request`);
        const projectUuid = req.params.uuid;
        
        // Vérifier que l'UUID est valide
        if (!projectUuid || projectUuid.trim() === '') {
            logger.error('[TICKETS CONTROLLER] Invalid project UUID provided');
            return res.status(400).json({ error: 'Invalid project UUID' });
        }
        
        const sprints = await ticketService.getProjectSprints(projectUuid);
        res.json(sprints);
    } catch (error) {
        logger.error('[TICKETS CONTROLLER] Error in getProjectSprints:', error);
        if (error.message === 'Project not found') {
            res.status(404).json({ error: 'Project not found' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

const getTicketTeamMembers = async (req, res) => {
    try {
        logger.info(`[TICKETS CONTROLLER] Processing GET /tickets/${req.params.uuid}/team/members request`);
        const ticketUuid = req.params.uuid;
        
        // Vérifier que l'UUID est valide
        if (!ticketUuid || ticketUuid.trim() === '') {
            logger.error('[TICKETS CONTROLLER] Invalid ticket UUID provided');
            return res.status(400).json({ error: 'Invalid ticket UUID' });
        }
        
        const members = await ticketService.getTicketTeamMembers(ticketUuid);
        res.json(members);
    } catch (error) {
        logger.error('[TICKETS CONTROLLER] Error in getTicketTeamMembers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getTicketById = async (req, res) => {
    try {
        logger.info(`[TICKETS CONTROLLER] Processing GET /tickets/${req.params.uuid} request`);
        const ticketUuid = req.params.uuid;
        const { lang, ticket_type } = req.query;
        
        // Vérifier que l'UUID est valide
        if (!ticketUuid || ticketUuid.trim() === '') {
            logger.error('[TICKETS CONTROLLER] Invalid ticket UUID provided');
            return res.status(400).json({ error: 'Invalid ticket UUID' });
        }
        
        let ticket;
        
        // Utiliser le service approprié selon le type de ticket
        switch (ticket_type) {
            case 'TASK':
                logger.info(`[TICKETS CONTROLLER] Calling taskService.getTaskById for UUID: ${ticketUuid}`);
                ticket = await taskService.getTaskById(ticketUuid, lang || 'en');
                break;
            case 'PROBLEM':
                logger.info(`[TICKETS CONTROLLER] Calling problemService.getProblemById for UUID: ${ticketUuid}`);
                ticket = await problemService.getProblemById(ticketUuid, lang || 'en');
                break;
            case 'CHANGE':
                logger.info(`[TICKETS CONTROLLER] Calling changeService.getChangeById for UUID: ${ticketUuid}`);
                ticket = await changeService.getChangeById(ticketUuid, lang || 'en');
                break;
            case 'INCIDENT':
                logger.info(`[TICKETS CONTROLLER] Calling incidentService.getIncidentById for UUID: ${ticketUuid}`);
                ticket = await incidentService.getIncidentById(ticketUuid, lang || 'en');
                break;
            // Ajouter d'autres cas pour les différents types de tickets si nécessaire
            default:
                logger.info(`[TICKETS CONTROLLER] Calling ticketService.getTicketById for UUID: ${ticketUuid}`);
                ticket = await ticketService.getTicketById(ticketUuid, lang || 'en');
                break;
        }
        
        if (!ticket) {
            logger.warn(`[TICKETS CONTROLLER] No ticket found with UUID: ${ticketUuid}`);
            return res.status(404).json({ error: 'Ticket not found' });
        }
        
        res.json(ticket);
    } catch (error) {
        logger.error('[TICKETS CONTROLLER] Error in getTicketById:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateTicket = async (req, res) => {
    try {
        logger.info(`[TICKETS CONTROLLER] Processing PATCH /tickets/${req.params.uuid} request`);
        const ticketUuid = req.params.uuid;
        
        // Vérifier que l'UUID est valide
        if (!ticketUuid || ticketUuid.trim() === '') {
            logger.error('[TICKETS CONTROLLER] Invalid ticket UUID provided');
            return res.status(400).json({ error: 'Invalid ticket UUID' });
        }
        
        // Déléguer la mise à jour au service
        const updatedTicket = await ticketService.updateTicket(ticketUuid, req.body);
        
        if (!updatedTicket) {
            logger.error(`[TICKETS CONTROLLER] Failed to update ticket with UUID: ${ticketUuid}`);
            return res.status(404).json({ error: 'Ticket not found or update failed' });
        }
        
        logger.info(`[TICKETS CONTROLLER] Successfully updated ticket with UUID: ${ticketUuid}`);
        res.json(updatedTicket);
    } catch (error) {
        logger.error('[TICKETS CONTROLLER] Error in updateTicket:', error);
        if (error.constraint) {
            res.status(400).json({ error: 'Invalid reference data' });
        } else if (error.message === 'Not implemented') {
            res.status(501).json({ error: 'PATCH not implemented for this ticket type' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

const addWatchers = async (req, res) => {
    try {
        logger.info(`[TICKETS CONTROLLER] Processing POST /tickets/${req.params.uuid}/watchers request`);
        const ticketUuid = req.params.uuid;
        const { watch_list } = req.body;
        
        const result = await ticketService.addWatchers(ticketUuid, watch_list);
        res.status(201).json(result);
    } catch (error) {
        logger.error('[TICKETS CONTROLLER] Error in addWatchers:', error);
        if (error.message === 'Ticket not found') {
            res.status(404).json({ error: 'Ticket not found' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

const removeWatcher = async (req, res) => {
    try {
        logger.info(`[TICKETS CONTROLLER] Processing DELETE /tickets/${req.params.uuid}/watchers/${req.params.user_uuid} request`);
        const ticketUuid = req.params.uuid;
        const userUuid = req.params.user_uuid;
        
        const result = await ticketService.removeWatcher(ticketUuid, userUuid);
        
        if (!result.success && result.message === 'Watcher not found or already removed') {
            return res.status(404).json({ error: result.message });
        }
        
        res.json(result);
    } catch (error) {
        logger.error('[TICKETS CONTROLLER] Error in removeWatcher:', error);
        if (error.message === 'Ticket not found') {
            res.status(404).json({ error: 'Ticket not found' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

// Add access groups to a project
const addAccessGroups = async (req, res) => {
    try {
        logger.info(`[TICKETS CONTROLLER] Processing POST /tickets/${req.params.uuid}/access-groups request`);
        const ticketUuid = req.params.uuid;
        const { 'access-groups': access_groups } = req.body;
        
        const result = await ticketService.addAccessGroups(ticketUuid, access_groups);
        res.status(201).json(result);
    } catch (error) {
        logger.error('[TICKETS CONTROLLER] Error in addAccessGroups:', error);
        if (error.message === 'Ticket not found') {
            res.status(404).json({ error: 'Ticket not found' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

// Remove access group from a project
const removeAccessGroup = async (req, res) => {
    try {
        logger.info(`[TICKETS CONTROLLER] Processing DELETE /tickets/${req.params.uuid}/access-groups/${req.params.group_uuid} request`);
        const ticketUuid = req.params.uuid;
        const groupUuid = req.params.group_uuid;
        
        const result = await ticketService.removeAccessGroup(ticketUuid, groupUuid);
        
        if (!result.success && result.message === 'Access group not found or already removed') {
            return res.status(404).json({ error: result.message });
        }
        
        res.json(result);
    } catch (error) {
        logger.error('[TICKETS CONTROLLER] Error in removeAccessGroup:', error);
        if (error.message === 'Ticket not found') {
            res.status(404).json({ error: 'Ticket not found' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

// Get access groups for a project
const getAccessGroups = async (req, res) => {
    try {
        logger.info(`[TICKETS CONTROLLER] Processing GET /tickets/${req.params.uuid}/access-groups request`);
        const ticketUuid = req.params.uuid;
        const { lang = 'en' } = req.query;
        
        const result = await ticketService.getAccessGroups(ticketUuid, lang);
        res.json(result);
    } catch (error) {
        logger.error('[TICKETS CONTROLLER] Error in getAccessGroups:', error);
        if (error.message === 'Ticket not found') {
            res.status(404).json({ error: 'Ticket not found' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

// Add access users to a project
const addAccessUsers = async (req, res) => {
    try {
        logger.info(`[TICKETS CONTROLLER] Processing POST /tickets/${req.params.uuid}/access-users request`);
        const ticketUuid = req.params.uuid;
        const { 'access-users': access_users } = req.body;
        
        const result = await ticketService.addAccessUsers(ticketUuid, access_users);
        res.status(201).json(result);
    } catch (error) {
        logger.error('[TICKETS CONTROLLER] Error in addAccessUsers:', error);
        if (error.message === 'Ticket not found') {
            res.status(404).json({ error: 'Ticket not found' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

// Remove access user from a project
const removeAccessUser = async (req, res) => {
    try {
        logger.info(`[TICKETS CONTROLLER] Processing DELETE /tickets/${req.params.uuid}/access-users/${req.params.user_uuid} request`);
        const ticketUuid = req.params.uuid;
        const userUuid = req.params.user_uuid;
        
        const result = await ticketService.removeAccessUser(ticketUuid, userUuid);
        
        if (!result.success && result.message === 'Access user not found or already removed') {
            return res.status(404).json({ error: result.message });
        }
        
        res.json(result);
    } catch (error) {
        logger.error('[TICKETS CONTROLLER] Error in removeAccessUser:', error);
        if (error.message === 'Ticket not found') {
            res.status(404).json({ error: 'Ticket not found' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

// Get access users for a project
const getAccessUsers = async (req, res) => {
    try {
        logger.info(`[TICKETS CONTROLLER] Processing GET /tickets/${req.params.uuid}/access-users request`);
        const ticketUuid = req.params.uuid;
        const { lang = 'en' } = req.query;
        
        const result = await ticketService.getAccessUsers(ticketUuid, lang);
        res.json(result);
    } catch (error) {
        logger.error('[TICKETS CONTROLLER] Error in getAccessUsers:', error);
        if (error.message === 'Ticket not found') {
            res.status(404).json({ error: 'Ticket not found' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

/**
 * Ajoute des relations parent-enfant entre tickets
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
const addChildrenTickets = async (req, res) => {
    try {
        logger.info(`[TICKETS CONTROLLER] Processing POST /tickets/${req.params.parent_uuid}/children request`);
        const parentUuid = req.params.parent_uuid;
        const { type, children } = req.body;
        
        // Vérifier que l'UUID parent est valide
        if (!parentUuid || parentUuid.trim() === '') {
            logger.error('[TICKETS CONTROLLER] Invalid parent ticket UUID provided');
            return res.status(400).json({ error: 'Invalid parent ticket UUID' });
        }
        
        // Vérifier que le type de dépendance est fourni
        if (!type || type.trim() === '') {
            logger.error('[TICKETS CONTROLLER] Dependency type not provided');
            return res.status(400).json({ error: 'Dependency type is required' });
        }
        
        // Vérifier que la liste des enfants est fournie et valide
        if (!children || !Array.isArray(children) || children.length === 0) {
            logger.error('[TICKETS CONTROLLER] Children UUIDs not provided or invalid');
            return res.status(400).json({ error: 'Children UUIDs must be a non-empty array' });
        }
        
        // Ajouter les relations parent-enfant
        const result = await ticketService.addChildrenTickets(parentUuid, type, children);
        
        res.status(201).json(result);
    } catch (error) {
        logger.error('[TICKETS CONTROLLER] Error in addChildrenTickets:', error);
        if (error.constraint) {
            res.status(400).json({ error: 'Invalid reference data' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

/**
 * Supprime une relation parent-enfant entre tickets
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {string} parentUuid - UUID du ticket parent
 * @param {string} childUuid - UUID du ticket enfant
 */
const removeChildTicket = async (req, res, parentUuid, childUuid) => {
    try {
        logger.info(`[TICKETS CONTROLLER] Processing DELETE /tickets/${parentUuid}/children/${childUuid} request`);
        
        // Vérifier que les UUIDs sont valides
        if (!parentUuid || parentUuid.trim() === '' || !childUuid || childUuid.trim() === '') {
            logger.error('[TICKETS CONTROLLER] Invalid parent or child UUID provided');
            return res.status(400).json({ 
                success: false,
                message: 'Invalid parent or child UUID'
            });
        }
        
        const result = await ticketService.removeChildTicket(parentUuid, childUuid);
        
        if (!result.success) {
            return res.status(404).json(result);
        }
        
        return res.status(200).json(result);
    } catch (error) {
        logger.error('[TICKETS CONTROLLER] Error in removeChildTicket:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = {
    getTickets,
    searchTickets,
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
    removeChildTicket
};
