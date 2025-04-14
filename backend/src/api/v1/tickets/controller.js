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
        
        // Log détaillé pour le debugging
        logger.info(`[CONTROLLER] Processing POST /tickets request${isIncidentFromQuery ? ' for INCIDENT type (from query)' : ''}${isIncidentFromBody ? ' for INCIDENT type (from body)' : ''}${isProblemFromQuery ? ' for PROBLEM type (from query)' : ''}${isProblemFromBody ? ' for PROBLEM type (from body)' : ''}`);
        
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

module.exports = {
    getTickets,
    createTicket
};
