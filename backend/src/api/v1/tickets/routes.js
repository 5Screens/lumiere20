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
    
    // Log détaillé pour le debugging
    logger.info(`[ROUTES] Handling POST /tickets request${isIncidentFromQuery ? ' for INCIDENT type (from query)' : ''}${isIncidentFromBody ? ' for INCIDENT type (from body)' : ''}`);
    
    ticketController.createTicket(req, res);
});

module.exports = router;
