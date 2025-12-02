const service = require('./service');
const logger = require('../../../config/logger');

/**
 * Get object type metadata with fields
 * GET /api/v1/metadata/:code
 */
const getObjectType = async (req, res, next) => {
  try {
    const { code } = req.params;
    const objectType = await service.getObjectType(code);

    if (!objectType) {
      return res.status(404).json({
        error: 'Not found',
        message: `Object type '${code}' not found`,
      });
    }

    res.json(objectType);
  } catch (error) {
    logger.error('Error getting object type:', error);
    next(error);
  }
};

/**
 * Get all active object types
 * GET /api/v1/metadata
 */
const getAllObjectTypes = async (req, res, next) => {
  try {
    const objectTypes = await service.getAllObjectTypes();
    res.json(objectTypes);
  } catch (error) {
    logger.error('Error getting object types:', error);
    next(error);
  }
};

/**
 * Get table columns for an object type
 * GET /api/v1/metadata/:code/columns
 */
const getTableColumns = async (req, res, next) => {
  try {
    const { code } = req.params;
    const columns = await service.getTableColumns(code);
    res.json(columns);
  } catch (error) {
    logger.error('Error getting table columns:', error);
    next(error);
  }
};

/**
 * Get form fields for an object type
 * GET /api/v1/metadata/:code/form-fields
 */
const getFormFields = async (req, res, next) => {
  try {
    const { code } = req.params;
    const fields = await service.getFormFields(code);
    res.json(fields);
  } catch (error) {
    logger.error('Error getting form fields:', error);
    next(error);
  }
};

module.exports = {
  getObjectType,
  getAllObjectTypes,
  getTableColumns,
  getFormFields,
};
