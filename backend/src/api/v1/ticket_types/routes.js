const express = require('express');
const router = express.Router();
const ticketTypeController = require('./controller');
const logger = require('../../../config/logger');
const { validateLanguageCode } = require('./validation');

// GET /api/v1/ticket_types
router.get('/', validateLanguageCode, (req, res) => {
    logger.info(`[ROUTES] GET /api/v1/ticket_types - Route handler started - Language: ${req.query.lang}`);
    return ticketTypeController.getTicketTypes(req, res);
});

module.exports = router;
