/**
 * Routes pour la gestion des attachments
 */
const express = require('express');
const router = express.Router();
const attachmentsController = require('./controller');
const upload = require('../../../middleware/fileUpload');
const { 
  validateUploadFile, 
  validateUploadMultipleFiles,
  validateGetAttachmentsByObject,
  validateGetAttachmentsByObjectUuid,
  validateAttachmentUuid
} = require('./validation');

// Route pour l'upload d'un seul fichier
router.post('/upload', upload.single('file'), validateUploadFile, attachmentsController.uploadFile);

// Route pour l'upload de plusieurs fichiers
router.post('/upload-multiple', upload.array('files', 10), validateUploadMultipleFiles, attachmentsController.uploadMultipleFiles);

// Route pour récupérer un fichier
router.get('/:uuid', validateAttachmentUuid, attachmentsController.getFile);

// Route pour supprimer un fichier
router.delete('/:uuid', validateAttachmentUuid, attachmentsController.deleteFile);

// Route pour récupérer les attachments d'un objet par son UUID
router.get('/object/:objectUuid', validateGetAttachmentsByObjectUuid, attachmentsController.getAttachmentsByObjectUuid);

module.exports = router;
