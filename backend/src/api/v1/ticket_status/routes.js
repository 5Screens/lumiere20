const express = require('express');
const router = express.Router();
const { getTicketStatus } = require('./controller');
const { validateGetTicketStatus } = require('./validation');
const logger = require('../../../config/logger');

logger.info('[ROUTES] Setting up ticket status routes');

// GET /api/v1/ticket_status?lang=fr
router.get('/', validateGetTicketStatus, getTicketStatus);

module.exports = router;
