const express = require('express');
const router = express.Router();
const controller = require('./controller');
const upload = require('../../../middleware/fileUpload');
const { authenticate } = require('../../../middleware/auth');

// Get all attachments for an entity
router.get('/:entityType/:entityUuid', controller.getByEntity);

// Get single attachment by UUID
router.get('/file/:uuid', controller.getByUuid);

// Download attachment
router.get('/download/:uuid', controller.download);

// Upload attachments (multiple files) - requires authentication
router.post('/:entityType/:entityUuid', authenticate, upload.array('files', 10), controller.upload);

// Delete attachment
router.delete('/:uuid', controller.remove);

module.exports = router;
