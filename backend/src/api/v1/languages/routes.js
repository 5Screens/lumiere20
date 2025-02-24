const express = require('express');
const router = express.Router();
const languageController = require('./controller');
const logger = require('../../../config/logger');

// GET /api/v1/languages?is_active=yes
router.get('/', (req, res) => {
    logger.info('[ROUTES] GET /api/v1/languages - Route handler started');
    if (req.query.is_active === 'yes') {
        return languageController.getActiveLanguages(req, res);
    }
    res.status(400).json({ error: 'Le paramètre is_active=yes est requis' });
});

module.exports = router;
