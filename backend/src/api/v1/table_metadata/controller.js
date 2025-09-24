const tableMetadataService = require('./service');
const logger = require('../../../config/logger');

/**
 * Get filter configuration for a table
 */
async function getFilterConfig(req, res) {
  try {
    const { tableName } = req.params;
    logger.info(`[TABLE_METADATA CONTROLLER] Getting filter config for table: ${tableName}`);
    
    const filterConfig = await tableMetadataService.getFilterConfig(tableName);
    
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
 * Get filter values for a specific column
 */
async function getFilterValues(req, res) {
  try {
    const { tableName, columnName } = req.params;
    const { q: searchQuery } = req.query;
    
    logger.info(`[TABLE_METADATA CONTROLLER] Getting filter values for ${tableName}.${columnName}`, {
      searchQuery
    });
    
    const filterValues = await tableMetadataService.getFilterValues(
      tableName, 
      columnName, 
      searchQuery
    );
    
    res.status(200).json(filterValues);
  } catch (error) {
    logger.error('[TABLE_METADATA CONTROLLER] Error getting filter values:', error);
    res.status(500).json({ 
      error: 'Error getting filter values',
      message: error.message 
    });
  }
}

/**
 * Search persons with filters
 */
async function searchPersons(req, res) {
  try {
    logger.info('[TABLE_METADATA CONTROLLER] Searching persons with body:', req.body);
    
    const searchResults = await tableMetadataService.searchPersons(req.body);
    
    res.status(200).json(searchResults);
  } catch (error) {
    logger.error('[TABLE_METADATA CONTROLLER] Error searching persons:', error);
    res.status(500).json({ 
      error: 'Error searching persons',
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
  getFilterValues,
  searchPersons,
  getAllTableMetadata,
  getTableMetadata
};
