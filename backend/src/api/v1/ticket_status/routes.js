const express = require('express');
const router = express.Router();
const { getTicketStatus } = require('./controller');
const validate = require('../../../middleware/validate');
const { getTicketStatusSchema } = require('./validation');
const logger = require('../../../config/logger');

logger.info('[ROUTES] Setting up ticket status routes');

// GET /api/v1/ticket_status?lang=fr
router.get('/', 
    validate(getTicketStatusSchema, 'query'),
    getTicketStatus
);

module.exports = router;
