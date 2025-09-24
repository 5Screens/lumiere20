const express = require('express');
const router = express.Router();
const controller = require('./controller');
const validation = require('./validation');
const logger = require('../../../config/logger');

// Log all requests to this router
router.use((req, res, next) => {
  logger.info(`[TABLE_METADATA ROUTES] ${req.method} ${req.originalUrl}`);
  next();
});

// Get filter configuration for a table
router.get(
  '/filter_config/:tableName',
  validation.validateTableName,
  controller.getFilterConfig
);

// Get filter values for a specific column
router.get(
  '/filters/:tableName/:columnName',
  validation.validateTableName,
  validation.validateColumnName,
  validation.validateSearchQuery,
  controller.getFilterValues
);


// Get all table metadata
router.get(
  '/',
  controller.getAllTableMetadata
);

// Get metadata for a specific table
router.get(
  '/:tableName',
  validation.validateTableName,
  controller.getTableMetadata
);

module.exports = router;
