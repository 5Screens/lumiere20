const tableMetadataService = require('./service');
const logger = require('../../../config/logger');

/**
 * Get filter configuration for an object
 */
async function getFilterConfig(req, res) {
  try {
    const { objectName } = req.params;
    logger.info(`[TABLE_METADATA CONTROLLER] Getting filter config for object: ${objectName}`);
    
    const filterConfig = await tableMetadataService.getFilterConfig(objectName);
    
    res.status(200).json(filterConfig);
  } catch (error) {
    logger.error('[TABLE_METADATA CONTROLLER] Error getting filter config:', error);
    res.status(500).json({ 
      error: 'Error getting filter configuration',
      message: error.message 
    });
  }
}

/**
 * Get all table metadata
 */
async function getAllTableMetadata(req, res) {
  try {
    logger.info('[TABLE_METADATA CONTROLLER] Getting all table metadata');
    
    const metadata = await tableMetadataService.getAllTableMetadata();
    
    res.status(200).json(metadata);
  } catch (error) {
    logger.error('[TABLE_METADATA CONTROLLER] Error getting all metadata:', error);
    res.status(500).json({ 
      error: 'Error getting table metadata',
      message: error.message 
    });
  }
}

/**
 * Get metadata for a specific table
 */
async function getTableMetadata(req, res) {
  try {
    const { tableName } = req.params;
    logger.info(`[TABLE_METADATA CONTROLLER] Getting metadata for table: ${tableName}`);
    
    const metadata = await tableMetadataService.getTableMetadata(tableName);
    
    res.status(200).json(metadata);
  } catch (error) {
    logger.error('[TABLE_METADATA CONTROLLER] Error getting table metadata:', error);
    res.status(500).json({ 
      error: 'Error getting table metadata',
      message: error.message 
    });
  }
}

module.exports = {
  getFilterConfig,
  getAllTableMetadata,
  getTableMetadata
};
