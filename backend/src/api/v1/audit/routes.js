const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { validate, primeVueFilterSchema } = require('../../../middleware/validate');
const { authenticate } = require('../../../middleware/auth');

// All audit routes require authentication
router.use(authenticate);

// Routes
router.post('/search', validate(primeVueFilterSchema), controller.search);
router.get('/', controller.getAll);
router.get('/object/:uuid', controller.getByObjectUuid);

module.exports = router;
