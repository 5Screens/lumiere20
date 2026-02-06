const express = require('express');
const controller = require('./controller');

const router = express.Router();

// Search request catalog items (POST for complex filters)
router.post('/search', controller.search);

// Delete multiple request catalog items
router.post('/delete-many', controller.removeMany);

// CRUD routes
router.get('/', controller.getAll);
router.get('/:uuid', controller.getByUuid);
router.post('/', controller.create);
router.put('/:uuid', controller.update);
router.delete('/:uuid', controller.remove);

module.exports = router;
