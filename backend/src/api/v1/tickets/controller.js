const ticketService = require('./service');
const logger = require('../../../config/logger');

const getTickets = async (req, res) => {
    try {
        logger.info('[CONTROLLER] Processing GET /tickets request');
        const { lang, ticket_type } = req.query;
        const tickets = await ticketService.getTickets(lang, ticket_type);
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
        
        // Log détaillé pour le debugging
        logger.info(`[CONTROLLER] Processing POST /tickets request${isIncidentFromQuery ? ' for INCIDENT type (from query)' : ''}${isIncidentFromBody ? ' for INCIDENT type (from body)' : ''}${isProblemFromQuery ? ' for PROBLEM type (from query)' : ''}${isProblemFromBody ? ' for PROBLEM type (from body)' : ''}${isChangeFromQuery ? ' for CHANGE type (from query)' : ''}${isChangeFromBody ? ' for CHANGE type (from body)' : ''}${isKnowledgeFromQuery ? ' for KNOWLEDGE type (from query)' : ''}${isKnowledgeFromBody ? ' for KNOWLEDGE type (from body)' : ''}${isProjectFromQuery ? ' for PROJECT type (from query)' : ''}${isProjectFromBody ? ' for PROJECT type (from body)' : ''}${isSprintFromQuery ? ' for SPRINT type (from query)' : ''}${isSprintFromBody ? ' for SPRINT type (from body)' : ''}${isEpicFromQuery ? ' for EPIC type (from query)' : ''}${isEpicFromBody ? ' for EPIC type (from body)' : ''}`);
        
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

module.exports = {
    getTickets,
    createTicket,
    getTicketTeam,
    getProjectEpics
};
