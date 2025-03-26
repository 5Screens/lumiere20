const express = require('express');
const router = express.Router();
const ticketController = require('./controller');
const { validateGetTickets } = require('./validation');
const logger = require('../../../config/logger');

router.get('/', validateGetTickets, (req, res, next) => {
    logger.info('[ROUTES] Handling GET /tickets request');
    ticketController.getTickets(req, res);
});

module.exports = router;
