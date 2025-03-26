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
    logger.info('[ROUTES] Handling POST /tickets request');
    ticketController.createTicket(req, res);
});

module.exports = router;
