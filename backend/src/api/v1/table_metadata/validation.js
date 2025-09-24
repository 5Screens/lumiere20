const Joi = require('joi');
const logger = require('../../../config/logger');


// Schema for table name parameter (simple table name without schema)
const tableNameSchema = Joi.string()
  .pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
  .required();

// Schema for column name parameter
const columnNameSchema = Joi.string()
  .pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
  .required();

// Validation middleware for table name
function validateTableName(req, res, next) {
  const { tableName } = req.params;
  
  logger.info(`[TABLE_METADATA VALIDATION] Validating table name: ${tableName}`);
  
  const { error } = tableNameSchema.validate(tableName);
  
  if (error) {
    logger.error('[TABLE_METADATA VALIDATION] Invalid table name:', error.details);
    return res.status(400).json({ 
      error: 'Invalid table name',
      details: error.details.map(d => d.message) 
    });
  }
  
  next();
}

// Validation middleware for column name
function validateColumnName(req, res, next) {
  const { columnName } = req.params;
  
  logger.info(`[TABLE_METADATA VALIDATION] Validating column name: ${columnName}`);
  
  const { error } = columnNameSchema.validate(columnName);
  
  if (error) {
    logger.error('[TABLE_METADATA VALIDATION] Invalid column name:', error.details);
    return res.status(400).json({ 
      error: 'Invalid column name',
      details: error.details.map(d => d.message) 
    });
  }
  
  next();
}

// Schema for search query parameter
const searchQuerySchema = Joi.string().min(1).max(100).optional();

// Validation middleware for search query
function validateSearchQuery(req, res, next) {
  const { q } = req.query;
  
  if (q !== undefined) {
    logger.info(`[TABLE_METADATA VALIDATION] Validating search query: ${q}`);
    
    const { error } = searchQuerySchema.validate(q);
    
    if (error) {
      logger.error('[TABLE_METADATA VALIDATION] Invalid search query:', error.details);
      return res.status(400).json({ 
        error: 'Invalid search query',
        details: error.details.map(d => d.message) 
      });
    }
  }
  
  next();
}

module.exports = {
  validateTableName,
  validateColumnName,
  validateSearchQuery
};
