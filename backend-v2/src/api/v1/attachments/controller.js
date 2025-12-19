const service = require('./service');
const logger = require('../../../config/logger');

const getByEntity = async (req, res, next) => {
  try {
    const { entityType, entityUuid } = req.params;
    const attachments = await service.getByEntity(entityType, entityUuid);
    res.json(attachments);
  } catch (error) {
    logger.error('[ATTACHMENTS CONTROLLER] Error in getByEntity:', error);
    next(error);
  }
};

const getByUuid = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const attachment = await service.getByUuid(uuid);
    
    if (!attachment) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Attachment not found',
      });
    }
    
    res.json(attachment);
  } catch (error) {
    logger.error('[ATTACHMENTS CONTROLLER] Error in getByUuid:', error);
    next(error);
  }
};

const upload = async (req, res, next) => {
  try {
    const { entityType, entityUuid } = req.params;
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'No files uploaded',
      });
    }
    
    // Get user UUID from auth (assuming it's set by auth middleware)
    const uploadedByUuid = req.user?.uuid;
    
    if (!uploadedByUuid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }
    
    // Create attachments for each file
    const attachments = [];
    for (const file of files) {
      const attachment = await service.create(
        { entity_type: entityType, entity_uuid: entityUuid },
        file,
        uploadedByUuid
      );
      attachments.push(attachment);
    }
    
    res.status(201).json(attachments);
  } catch (error) {
    logger.error('[ATTACHMENTS CONTROLLER] Error in upload:', error);
    next(error);
  }
};

const download = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const fileInfo = await service.getFilePath(uuid);
    
    if (!fileInfo) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Attachment not found',
      });
    }
    
    res.setHeader('Content-Type', fileInfo.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.originalName}"`);
    res.sendFile(fileInfo.path);
  } catch (error) {
    logger.error('[ATTACHMENTS CONTROLLER] Error in download:', error);
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const success = await service.remove(uuid);
    
    if (!success) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Attachment not found',
      });
    }
    
    res.status(204).send();
  } catch (error) {
    logger.error('[ATTACHMENTS CONTROLLER] Error in remove:', error);
    next(error);
  }
};

module.exports = {
  getByEntity,
  getByUuid,
  upload,
  download,
  remove,
};
