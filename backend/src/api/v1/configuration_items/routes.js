const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { validate, primeVueFilterSchema } = require('../../../middleware/validate');

// Routes
router.post('/search', validate(primeVueFilterSchema), controller.search);
router.get('/models/:ciTypeCode', controller.getModelsForType);
router.get('/', controller.getAll);
router.get('/:uuid', controller.getByUuid);
router.post('/', controller.create);
router.put('/:uuid', controller.update);
router.delete('/:uuid', controller.remove);
router.post('/delete-many', controller.removeMany);

module.exports = router;
