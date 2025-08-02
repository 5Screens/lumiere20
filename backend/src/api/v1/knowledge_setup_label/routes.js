const express = require('express');
const router = express.Router();
const knowledgeSetupLabelsController = require('./controller');
const knowledgeSetupLabelsValidation = require('./validation');
const logger = require('../../../config/logger');

// POST new knowledge setup label
router.post('/', 
    knowledgeSetupLabelsValidation.createKnowledgeSetupLabel,
    (req, res, next) => {
        logger.info(`[ROUTES] POST request received for creating new knowledge setup label`);
        next();
    },
    knowledgeSetupLabelsController.createKnowledgeSetupLabel
);

// PATCH knowledge setup label by UUID
router.patch('/:uuid', 
    knowledgeSetupLabelsValidation.patchKnowledgeSetupLabel,
    (req, res, next) => {
        logger.info(`[ROUTES] PATCH request received for knowledge setup label UUID: ${req.params.uuid}`);
        next();
    },
    knowledgeSetupLabelsController.patchKnowledgeSetupLabel
);

module.exports = router;
