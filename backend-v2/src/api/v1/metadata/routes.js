const express = require('express');
const router = express.Router();
const controller = require('./controller');

// Routes
router.get('/', controller.getAllObjectTypes);
router.get('/:code', controller.getObjectType);
router.get('/:code/columns', controller.getTableColumns);
router.get('/:code/form-fields', controller.getFormFields);

module.exports = router;
