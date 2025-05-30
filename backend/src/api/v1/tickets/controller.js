const ticketService = require('./service');
const incidentService = require('./incidentService');
const taskService = require('./taskService');
const problemService = require('./problemService');
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
        // Vérifier si le type de ticket est INCIDENT depuis les query params
        const isIncidentFromQuery = req.query.ticket_types === 'INCIDENT';
        
        // Vérifier si le type de ticket est INCIDENT depuis le body
        const isIncidentFromBody = req.body && req.body.ticket_type_code === 'INCIDENT';
        
        // Vérifier si le type de ticket est PROBLEM depuis les query params
        const isProblemFromQuery = req.query.ticket_types === 'PROBLEM';
        
        // Vérifier si le type de ticket est PROBLEM depuis le body
        const isProblemFromBody = req.body && req.body.ticket_type_code === 'PROBLEM';
        
        // Vérifier si le type de ticket est CHANGE depuis les query params
        const isChangeFromQuery = req.query.ticket_types === 'CHANGE';
        
        // Vérifier si le type de ticket est CHANGE depuis le body
        const isChangeFromBody = req.body && req.body.ticket_type_code === 'CHANGE';
        
        // Vérifier si le type de ticket est KNOWLEDGE depuis les query params
        const isKnowledgeFromQuery = req.query.ticket_types === 'KNOWLEDGE';
        
        // Vérifier si le type de ticket est KNOWLEDGE depuis le body
        const isKnowledgeFromBody = req.body && req.body.ticket_type_code === 'KNOWLEDGE';
        
        // Vérifier si le type de ticket est PROJECT depuis les query params
        const isProjectFromQuery = req.query.ticket_types === 'PROJECT';
        
        // Vérifier si le type de ticket est PROJECT depuis le body
        const isProjectFromBody = req.body && req.body.ticket_type_code === 'PROJECT';
        
        // Vérifier si le type de ticket est SPRINT depuis les query params
        const isSprintFromQuery = req.query.ticket_type === 'SPRINT';
        
        // Vérifier si le type de ticket est SPRINT depuis le body
        const isSprintFromBody = req.body && req.body.ticket_type_code === 'SPRINT';
        
        // Vérifier si le type de ticket est EPIC depuis les query params
        const isEpicFromQuery = req.query.ticket_type === 'EPIC';
        
        // Vérifier si le type de ticket est EPIC depuis le body
        const isEpicFromBody = req.body && req.body.ticket_type_code === 'EPIC';
        
        // Vérifier si le type de ticket est DEFECT depuis les query params
        const isDefectFromQuery = req.query.ticket_type === 'DEFECT';
        
        // Vérifier si le type de ticket est DEFECT depuis le body
        const isDefectFromBody = req.body && req.body.ticket_type_code === 'DEFECT';
        
        // Log détaillé pour le debugging
        logger.info(`[CONTROLLER] Processing POST /tickets request${isIncidentFromQuery ? ' for INCIDENT type (from query)' : ''}${isIncidentFromBody ? ' for INCIDENT type (from body)' : ''}${isProblemFromQuery ? ' for PROBLEM type (from query)' : ''}${isProblemFromBody ? ' for PROBLEM type (from body)' : ''}${isChangeFromQuery ? ' for CHANGE type (from query)' : ''}${isChangeFromBody ? ' for CHANGE type (from body)' : ''}${isKnowledgeFromQuery ? ' for KNOWLEDGE type (from query)' : ''}${isKnowledgeFromBody ? ' for KNOWLEDGE type (from body)' : ''}${isProjectFromQuery ? ' for PROJECT type (from query)' : ''}${isProjectFromBody ? ' for PROJECT type (from body)' : ''}${isSprintFromQuery ? ' for SPRINT type (from query)' : ''}${isSprintFromBody ? ' for SPRINT type (from body)' : ''}${isEpicFromQuery ? ' for EPIC type (from query)' : ''}${isEpicFromBody ? ' for EPIC type (from body)' : ''}${isDefectFromQuery ? ' for DEFECT type (from query)' : ''}${isDefectFromBody ? ' for DEFECT type (from body)' : ''}`);
        
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

module.exports = {
    getTickets,
    createTicket,
    getTicketTeam,
    getTicketTeamMembers,
    getProjectEpics,
    getProjectSprints,
    getTicketById,
    updateTicket,
    addWatchers,
    removeWatcher
};
