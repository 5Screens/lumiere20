const express = require('express');
const router = express.Router();
const contactTypesLabelsController = require('./controller');
const validate = require('../../../middleware/validate');
const contactTypesLabelsValidation = require('./validation');
const logger = require('../../../config/logger');

// Route PATCH pour mettre à jour le label d'un type de contact par son UUID
//http://localhost:3000/api/v1/contact_types_labels/bbd05e49-34d9-47bd-add8-fceaacaca6e2
router.patch(
    '/:uuid',
    (req, res, next) => {
        logger.info(`[ROUTES] PATCH /api/v1/contact_types_labels/${req.params.uuid} - Route handler started`);
        next();
    },
    validate(contactTypesLabelsValidation.patchContactTypeLabel),
    contactTypesLabelsController.patchContactTypeLabel
);

module.exports = router;
