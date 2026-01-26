/**
 * OCR Documents Controller
 * HTTP handlers for OCR document endpoints
 */

const service = require('./service');
const logger = require('../../../config/logger');

/**
 * GET /ocr-documents
 * Get all OCR documents for the current user
 */
const getAll = async (req, res) => {
  try {
    const userUuid = req.user?.uuid;
    if (!userUuid) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const documents = await service.getByUser(userUuid);

    return res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    logger.error(`[OCR_DOCUMENTS] getAll error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve documents'
    });
  }
};

/**
 * GET /ocr-documents/:uuid
 * Get a specific OCR document
 */
const getByUuid = async (req, res) => {
  try {
    const userUuid = req.user?.uuid;
    const documentUuid = req.params.uuid;

    if (!userUuid) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const document = await service.getByUuid(documentUuid, userUuid);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Return document with markdown content (already loaded by service)
    return res.json({
      success: true,
      data: document
    });
  } catch (error) {
    logger.error(`[OCR_DOCUMENTS] getByUuid error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve document'
    });
  }
};

/**
 * POST /ocr-documents
 * Create a new OCR document
 */
const create = async (req, res) => {
  try {
    const userUuid = req.user?.uuid;
    if (!userUuid) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { originalName, mimeType, fileSize, markdown, pageCount } = req.body;

    if (!originalName || !markdown) {
      return res.status(400).json({
        success: false,
        error: 'originalName and markdown are required'
      });
    }

    const document = await service.create({
      originalName,
      mimeType,
      fileSize,
      markdown,
      pageCount
    }, userUuid);

    return res.status(201).json({
      success: true,
      data: document
    });
  } catch (error) {
    logger.error(`[OCR_DOCUMENTS] create error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Failed to create document'
    });
  }
};

/**
 * DELETE /ocr-documents/:uuid
 * Delete an OCR document
 */
const remove = async (req, res) => {
  try {
    const userUuid = req.user?.uuid;
    const documentUuid = req.params.uuid;

    if (!userUuid) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const deleted = await service.remove(documentUuid, userUuid);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    return res.json({
      success: true,
      message: 'Document deleted'
    });
  } catch (error) {
    logger.error(`[OCR_DOCUMENTS] remove error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete document'
    });
  }
};

module.exports = {
  getAll,
  getByUuid,
  create,
  remove
};
