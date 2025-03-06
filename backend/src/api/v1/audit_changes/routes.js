const express = require('express');
const router = express.Router();
const auditChangesController = require('./controller');
const validate = require('../../../middleware/validate');
const auditChangesValidation = require('./validation');
const logger = require('../../../config/logger');

// Route to get audit changes for a specific object UUID
// http://localhost:3000/api/v1/audit_changes?uuid=4af6f1dd-d5fa-45d7-a902-59ab7ad532b6
router.get(
    '/',
    (req, res, next) => {
        logger.info(`[ROUTES] GET /api/v1/audit_changes - Route handler started with uuid=${req.query.uuid}`);
        next();
    },
    validate(auditChangesValidation.getAuditChangesByObjectUuid),
    auditChangesController.getAuditChangesByObjectUuid
);

module.exports = router;
