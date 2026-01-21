const express = require('express');
const controller = require('./controller');
const { authenticate } = require('../../../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/global-search?q=<query>&limit=5
router.get('/', controller.search);

module.exports = router;
