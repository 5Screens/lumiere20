const express = require('express');
const router = express.Router();
const ticketController = require('./controller');
const { validateGetTickets, validateCreateTicket } = require('./validation');
const logger = require('../../../config/logger');

router.get('/', validateGetTickets, (req, res, next) => {
    logger.info('[ROUTES] Handling GET /tickets request');
    ticketController.getTickets(req, res);
});

router.post('/', validateCreateTicket, (req, res, next) => {
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
    
    // Log détaillé pour le debugging
    logger.info(`[ROUTES] Handling POST /tickets request${isIncidentFromQuery ? ' for INCIDENT type (from query)' : ''}${isIncidentFromBody ? ' for INCIDENT type (from body)' : ''}${isProblemFromQuery ? ' for PROBLEM type (from query)' : ''}${isProblemFromBody ? ' for PROBLEM type (from body)' : ''}${isChangeFromQuery ? ' for CHANGE type (from query)' : ''}${isChangeFromBody ? ' for CHANGE type (from body)' : ''}${isKnowledgeFromQuery ? ' for KNOWLEDGE type (from query)' : ''}${isKnowledgeFromBody ? ' for KNOWLEDGE type (from body)' : ''}${isProjectFromQuery ? ' for PROJECT type (from query)' : ''}${isProjectFromBody ? ' for PROJECT type (from body)' : ''}`);
    
    ticketController.createTicket(req, res);
});

module.exports = router;
