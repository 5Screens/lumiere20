const ticketService = require('./service');
const incidentService = require('./incidentService');
const taskService = require('./taskService');
const problemService = require('./problemService');
const changeService = require('./changeService');
const knowledgeService = require('./knowledgeService');
const projectService = require('./projectService');
const defectService = require('./defectService');
const sprintService = require('./sprintService');
const logger = require('../../../config/logger');

const getTickets = async (req, res) => {
    try {
        logger.info('[CONTROLLER] Processing GET /tickets request');
        const { lang, ticket_type } = req.query;
        
        let tickets;
        
        // Utiliser le service approprié selon le type de ticket
        switch (ticket_type) {
            case 'INCIDENT':
                logger.info('[CONTROLLER] Calling incidentService.getIncidents');
                tickets = await incidentService.getIncidents(lang);
                break;
            case 'PROBLEM':
                logger.info('[CONTROLLER] Calling problemService.getProblems');
                tickets = await problemService.getProblems(lang);
                break;
            case 'CHANGE':
                logger.info('[CONTROLLER] Calling changeService.getChanges');
                tickets = await changeService.getChanges(lang);
                break;
            case 'KNOWLEDGE':
                logger.info('[CONTROLLER] Calling knowledgeService.getKnowledgeArticles');
                tickets = await knowledgeService.getKnowledgeArticles(lang);
                break;
            case 'PROJECT':
                logger.info('[CONTROLLER] Calling projectService.getProjects');
                tickets = await projectService.getProjects(lang);
                break;
            case 'DEFECT':
                logger.info('[CONTROLLER] Calling defectService.getDefects');
                tickets = await defectService.getDefects(lang);
                break;
            case 'SPRINT':
                logger.info('[CONTROLLER] Calling sprintService.getSprints');
                tickets = await sprintService.getSprints(lang);
                break;
            default:
                logger.info(`[CONTROLLER] Calling ticketService.getTickets for type: ${ticket_type || 'all'}`);
                tickets = await ticketService.getTickets(lang, ticket_type);
                break;
        }
        
        res.json(tickets);
    } catch (error) {
        logger.error('[CONTROLLER] Error in getTickets:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const createTicket = async (req, res) => {
    try {
        // Récupérer le type de ticket depuis req.body.ticket_type_code
        const ticketType = req.body && req.body.ticket_type_code;
        
        // Log pour le debugging
        logger.info(`[CONTROLLER] Processing POST /tickets request for type: ${ticketType || 'UNKNOWN'}`);
        
        // Créer le ticket
        const ticket = await ticketService.createTicket(req.body);
        
        // Log de succès avec l'UUID du ticket créé
        logger.info(`[CONTROLLER] Successfully created ticket with UUID: ${ticket.uuid}`);
        
        res.status(201).json(ticket);
    } catch (error) {
        logger.error('[CONTROLLER] Error in createTicket:', error);
        if (error.constraint) {
            res.status(400).json({ error: 'Invalid reference data' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

const getTicketTeam = async (req, res) => {
    try {
        logger.info(`[CONTROLLER] Processing GET /tickets/${req.params.uuid}/team request`);
        const ticketUuid = req.params.uuid;
        
        // Vérifier que l'UUID est valide
        if (!ticketUuid || ticketUuid.trim() === '') {
            logger.error('[CONTROLLER] Invalid ticket UUID provided');
            return res.status(400).json({ error: 'Invalid ticket UUID' });
        }
        
        const team = await ticketService.getTicketTeam(ticketUuid);
        res.json(team);
    } catch (error) {
        logger.error('[CONTROLLER] Error in getTicketTeam:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getProjectEpics = async (req, res) => {
    try {
        logger.info(`[CONTROLLER] Processing GET /tickets/${req.params.uuid}/epics request`);
        const projectUuid = req.params.uuid;
        
        // Vérifier que l'UUID est valide
        if (!projectUuid || projectUuid.trim() === '') {
            logger.error('[CONTROLLER] Invalid project UUID provided');
            return res.status(400).json({ error: 'Invalid project UUID' });
        }
        
        const epics = await ticketService.getProjectEpics(projectUuid);
        res.json(epics);
    } catch (error) {
        logger.error('[CONTROLLER] Error in getProjectEpics:', error);
        if (error.message === 'Project not found') {
            res.status(404).json({ error: 'Project not found' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

const getProjectSprints = async (req, res) => {
    try {
        logger.info(`[CONTROLLER] Processing GET /tickets/${req.params.uuid}/sprints request`);
        const projectUuid = req.params.uuid;
        
        // Vérifier que l'UUID est valide
        if (!projectUuid || projectUuid.trim() === '') {
            logger.error('[CONTROLLER] Invalid project UUID provided');
            return res.status(400).json({ error: 'Invalid project UUID' });
        }
        
        const sprints = await ticketService.getProjectSprints(projectUuid);
        res.json(sprints);
    } catch (error) {
        logger.error('[CONTROLLER] Error in getProjectSprints:', error);
        if (error.message === 'Project not found') {
            res.status(404).json({ error: 'Project not found' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

const getTicketTeamMembers = async (req, res) => {
    try {
        logger.info(`[CONTROLLER] Processing GET /tickets/${req.params.uuid}/team/members request`);
        const ticketUuid = req.params.uuid;
        
        // Vérifier que l'UUID est valide
        if (!ticketUuid || ticketUuid.trim() === '') {
            logger.error('[CONTROLLER] Invalid ticket UUID provided');
            return res.status(400).json({ error: 'Invalid ticket UUID' });
        }
        
        const members = await ticketService.getTicketTeamMembers(ticketUuid);
        res.json(members);
    } catch (error) {
        logger.error('[CONTROLLER] Error in getTicketTeamMembers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getTicketById = async (req, res) => {
    try {
        logger.info(`[CONTROLLER] Processing GET /tickets/${req.params.uuid} request`);
        const ticketUuid = req.params.uuid;
        const { lang, ticket_type } = req.query;
        
        // Vérifier que l'UUID est valide
        if (!ticketUuid || ticketUuid.trim() === '') {
            logger.error('[CONTROLLER] Invalid ticket UUID provided');
            return res.status(400).json({ error: 'Invalid ticket UUID' });
        }
        
        let ticket;
        
        // Utiliser le service approprié selon le type de ticket
        switch (ticket_type) {
            case 'TASK':
                logger.info(`[CONTROLLER] Calling taskService.getTaskById for UUID: ${ticketUuid}`);
                ticket = await taskService.getTaskById(ticketUuid, lang || 'en');
                break;
            case 'PROBLEM':
                logger.info(`[CONTROLLER] Calling problemService.getProblemById for UUID: ${ticketUuid}`);
                ticket = await problemService.getProblemById(ticketUuid, lang || 'en');
                break;
            case 'CHANGE':
                logger.info(`[CONTROLLER] Calling changeService.getChangeById for UUID: ${ticketUuid}`);
                ticket = await changeService.getChangeById(ticketUuid, lang || 'en');
                break;
            case 'INCIDENT':
                logger.info(`[CONTROLLER] Calling incidentService.getIncidentById for UUID: ${ticketUuid}`);
                ticket = await incidentService.getIncidentById(ticketUuid, lang || 'en');
                break;
            // Ajouter d'autres cas pour les différents types de tickets si nécessaire
            default:
                logger.info(`[CONTROLLER] Calling ticketService.getTicketById for UUID: ${ticketUuid}`);
                ticket = await ticketService.getTicketById(ticketUuid, lang || 'en');
                break;
        }
        
        if (!ticket) {
            logger.warn(`[CONTROLLER] No ticket found with UUID: ${ticketUuid}`);
            return res.status(404).json({ error: 'Ticket not found' });
        }
        
        res.json(ticket);
    } catch (error) {
        logger.error('[CONTROLLER] Error in getTicketById:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateTicket = async (req, res) => {
    try {
        logger.info(`[CONTROLLER] Processing PATCH /tickets/${req.params.uuid} request`);
        const ticketUuid = req.params.uuid;
        
        // Vérifier que l'UUID est valide
        if (!ticketUuid || ticketUuid.trim() === '') {
            logger.error('[CONTROLLER] Invalid ticket UUID provided');
            return res.status(400).json({ error: 'Invalid ticket UUID' });
        }
        
        // Déléguer la mise à jour au service
        const updatedTicket = await ticketService.updateTicket(ticketUuid, req.body);
        
        if (!updatedTicket) {
            logger.error(`[CONTROLLER] Failed to update ticket with UUID: ${ticketUuid}`);
            return res.status(404).json({ error: 'Ticket not found or update failed' });
        }
        
        logger.info(`[CONTROLLER] Successfully updated ticket with UUID: ${ticketUuid}`);
        res.json(updatedTicket);
    } catch (error) {
        logger.error('[CONTROLLER] Error in updateTicket:', error);
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
        logger.info(`[CONTROLLER] Processing POST /tickets/${req.params.uuid}/watchers request`);
        const ticketUuid = req.params.uuid;
        const { watch_list } = req.body;
        
        const result = await ticketService.addWatchers(ticketUuid, watch_list);
        res.status(201).json(result);
    } catch (error) {
        logger.error('[CONTROLLER] Error in addWatchers:', error);
        if (error.message === 'Ticket not found') {
            res.status(404).json({ error: 'Ticket not found' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

const removeWatcher = async (req, res) => {
    try {
        logger.info(`[CONTROLLER] Processing DELETE /tickets/${req.params.uuid}/watchers/${req.params.user_uuid} request`);
        const ticketUuid = req.params.uuid;
        const userUuid = req.params.user_uuid;
        
        const result = await ticketService.removeWatcher(ticketUuid, userUuid);
        
        if (!result.success && result.message === 'Watcher not found or already removed') {
            return res.status(404).json({ error: result.message });
        }
        
        res.json(result);
    } catch (error) {
        logger.error('[CONTROLLER] Error in removeWatcher:', error);
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
        logger.info(`[CONTROLLER] Processing POST /tickets/${req.params.parent_uuid}/children request`);
        const parentUuid = req.params.parent_uuid;
        const { type, children } = req.body;
        
        // Vérifier que l'UUID parent est valide
        if (!parentUuid || parentUuid.trim() === '') {
            logger.error('[CONTROLLER] Invalid parent ticket UUID provided');
            return res.status(400).json({ error: 'Invalid parent ticket UUID' });
        }
        
        // Vérifier que le type de dépendance est fourni
        if (!type || type.trim() === '') {
            logger.error('[CONTROLLER] Dependency type not provided');
            return res.status(400).json({ error: 'Dependency type is required' });
        }
        
        // Vérifier que la liste des enfants est fournie et valide
        if (!children || !Array.isArray(children) || children.length === 0) {
            logger.error('[CONTROLLER] Children UUIDs not provided or invalid');
            return res.status(400).json({ error: 'Children UUIDs must be a non-empty array' });
        }
        
        // Ajouter les relations parent-enfant
        const result = await ticketService.addChildrenTickets(parentUuid, type, children);
        
        res.status(201).json(result);
    } catch (error) {
        logger.error('[CONTROLLER] Error in addChildrenTickets:', error);
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
        logger.info(`[CONTROLLER] Processing DELETE /tickets/${parentUuid}/children/${childUuid} request`);
        
        // Vérifier que les UUIDs sont valides
        if (!parentUuid || parentUuid.trim() === '' || !childUuid || childUuid.trim() === '') {
            logger.error('[CONTROLLER] Invalid parent or child UUID provided');
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
        logger.error('[CONTROLLER] Error in removeChildTicket:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
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
    addChildrenTickets,
    removeChildTicket
};
