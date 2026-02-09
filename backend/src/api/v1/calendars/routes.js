const express = require('express');
const controller = require('./controller');

const router = express.Router();

// Search calendars (POST for complex filters)
router.post('/search', controller.search);

// Delete multiple calendars
router.post('/delete-many', controller.removeMany);

// CRUD routes
router.get('/', controller.getAll);
router.get('/:uuid', controller.getByUuid);
router.post('/', controller.create);
router.put('/:uuid', controller.update);
router.delete('/:uuid', controller.remove);

module.exports = router;
