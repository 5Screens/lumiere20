const prisma = require('../../../config/prisma');
const logger = require('../../../config/logger');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;

const ENTITY_TYPE = 'ocr_document';
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');
const OCR_SUBDIR = 'ocr_documents';

/**
 * Ensure OCR documents directory exists
 */
const ensureOcrDir = async () => {
  const ocrDir = path.join(UPLOAD_DIR, OCR_SUBDIR);
  try {
    await fs.mkdir(ocrDir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
  return ocrDir;
};

/**
 * Get all OCR documents for a user
 * @param {string} userUuid - User UUID
 * @returns {Promise<Array>} List of OCR documents
 */
const getByUser = async (userUuid) => {
  const documents = await prisma.attachments.findMany({
    where: {
      entity_type: ENTITY_TYPE,
      uploaded_by_uuid: userUuid
    },
    orderBy: { created_at: 'desc' }
  });

  return documents;
};

/**
 * Get an OCR document by UUID
 * @param {string} uuid - Document UUID
 * @param {string} userUuid - User UUID (for authorization)
 * @returns {Promise<Object|null>} Document or null with markdown content
 */
const getByUuid = async (uuid, userUuid) => {
  const document = await prisma.attachments.findFirst({
    where: {
      uuid,
      entity_type: ENTITY_TYPE,
      uploaded_by_uuid: userUuid
    }
  });

  if (!document) {
    return null;
  }

  // Read markdown content from file
  try {
    const filePath = path.join(UPLOAD_DIR, document.file_path);
    const markdown = await fs.readFile(filePath, 'utf8');
    return {
      ...document,
      markdown
    };
  } catch (error) {
    logger.error(`[OCR_DOCUMENTS] Failed to read file: ${document.file_path}`, error);
    return {
      ...document,
      markdown: null
    };
  }
};

/**
 * Create a new OCR document
 * @param {Object} data - Document data
 * @param {string} data.originalName - Original file name
 * @param {string} data.mimeType - MIME type of source file
 * @param {number} data.fileSize - File size in bytes
 * @param {string} data.markdown - Extracted markdown content
 * @param {number} data.pageCount - Number of pages
 * @param {string} userUuid - User UUID
 * @returns {Promise<Object>} Created document
 */
const create = async (data, userUuid) => {
  const documentUuid = crypto.randomUUID();
  const fileName = `${documentUuid}.md`;
  const relativePath = path.join(OCR_SUBDIR, fileName);
  
  // Ensure directory exists
  const ocrDir = await ensureOcrDir();
  
  // Write markdown content to file
  const fullPath = path.join(ocrDir, fileName);
  await fs.writeFile(fullPath, data.markdown, 'utf8');
  
  const markdownSize = Buffer.byteLength(data.markdown, 'utf8');
  
  // Create attachment record
  const document = await prisma.attachments.create({
    data: {
      uuid: documentUuid,
      entity_type: ENTITY_TYPE,
      entity_uuid: documentUuid, // Self-referencing for OCR documents
      file_name: fileName,
      original_name: data.originalName,
      mime_type: 'text/markdown',
      file_size: markdownSize,
      file_path: relativePath,
      uploaded_by_uuid: userUuid
    }
  });

  logger.info(`[OCR_DOCUMENTS] Created OCR document: ${documentUuid} for user ${userUuid}, file: ${relativePath}`);
  
  return {
    ...document,
    markdown: data.markdown,
    pageCount: data.pageCount || 1
  };
};

/**
 * Delete an OCR document
 * @param {string} uuid - Document UUID
 * @param {string} userUuid - User UUID (for authorization)
 * @returns {Promise<boolean>} True if deleted
 */
const remove = async (uuid, userUuid) => {
  const document = await prisma.attachments.findFirst({
    where: {
      uuid,
      entity_type: ENTITY_TYPE,
      uploaded_by_uuid: userUuid
    }
  });

  if (!document) {
    return false;
  }

  // Delete file from disk
  try {
    const filePath = path.join(UPLOAD_DIR, document.file_path);
    await fs.unlink(filePath);
  } catch (error) {
    logger.warn(`[OCR_DOCUMENTS] Could not delete file: ${document.file_path}`, error);
  }

  // Delete from database
  await prisma.attachments.delete({
    where: { uuid }
  });

  logger.info(`[OCR_DOCUMENTS] Deleted OCR document: ${uuid}`);
  return true;
};

module.exports = {
  getByUser,
  getByUuid,
  create,
  remove
};
