const express = require('express');
const router = express.Router();
const controller = require('./controller');
const upload = require('../../../middleware/fileUpload');
const { authenticate } = require('../../../middleware/auth');

// IMPORTANT: Specific routes must come BEFORE parameterized routes

// Get single attachment by UUID
router.get('/file/:uuid', controller.getByUuid);

// Download attachment
router.get('/download/:uuid', controller.download);

// Get all attachments for an entity (must be after /file and /download)
router.get('/:entityType/:entityUuid', controller.getByEntity);

// Upload attachments (multiple files) - requires authentication
router.post('/:entityType/:entityUuid', authenticate, upload.array('files', 10), controller.upload);

// Delete attachment
router.delete('/:uuid', controller.remove);

module.exports = router;
