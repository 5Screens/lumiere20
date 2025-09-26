const db = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Map table name to schema for SQL queries
 * @param {string} tableName - Simple table name
 * @returns {string} Table name with schema
 */
function getTableWithSchema(tableName) {
  const schemaMap = {
    'persons': 'configuration.persons',
    'entities': 'configuration.entities',
    'groups': 'configuration.groups',
    'tickets': 'core.tickets',
    'symptoms': 'configuration.symptoms',
    'services': 'data.services',
    'service_offerings': 'data.service_offerings',
    'configuration_items': 'data.configuration_items'
  };
  
  return schemaMap[tableName] || `configuration.${tableName}`;
}

/**
 * Get filter configuration for a specific table
 * @param {string} tableName - Name of the table
 * @returns {Object} Filter configuration
 */
async function getFilterConfig(tableName) {
  try {
    logger.info(`[TABLE_METADATA SERVICE] Getting filter config for table: ${tableName}`);
    
    const query = `
      SELECT 
        column_name,
        column_label,
        filter_type,
        filter_options,
        data_type
      FROM administration.table_metadata
      WHERE table_name = $1
        AND data_is_filterable = true
        AND column_name IS NOT NULL
      ORDER BY form_order, column_name
    `;
    
    const result = await db.query(query, [tableName]);
    
    // Transform to expected format
    const filterConfig = {};
    result.rows.forEach(row => {
      if (row.filter_type === 'none' || !row.filter_type) {
        filterConfig[row.column_name] = { 
          type: 'none',
          data_type: row.data_type,
          label: row.column_label
        };
      } else {
        filterConfig[row.column_name] = {
          type: row.filter_type,
          data_type: row.data_type,
          label: row.column_label,
          ...(row.filter_options || {})
        };
      }
    });
    
    logger.info(`[TABLE_METADATA SERVICE] Found ${Object.keys(filterConfig).length} filterable columns`);
    return filterConfig;
    
  } catch (error) {
    logger.error('[TABLE_METADATA SERVICE] Error getting filter config:', error);
    throw error;
  }
}

/**
 * Get all table metadata
 * @returns {Array} All table metadata records
 */
async function getAllTableMetadata() {
  try {
    logger.info('[TABLE_METADATA SERVICE] Getting all table metadata');
    
    const query = `
      SELECT * FROM administration.table_metadata
      ORDER BY table_name, form_order, column_name
    `;
    
    const result = await db.query(query);
    logger.info(`[TABLE_METADATA SERVICE] Found ${result.rows.length} metadata records`);
    
    return result.rows;
  } catch (error) {
    logger.error('[TABLE_METADATA SERVICE] Error getting all metadata:', error);
    throw error;
  }
}

/**
 * Get metadata for a specific table
 * @param {string} tableName - Name of the table
 * @returns {Array} Table metadata records
 */
async function getTableMetadata(tableName) {
  try {
    logger.info(`[TABLE_METADATA SERVICE] Getting metadata for table: ${tableName}`);
    
    const query = `
      SELECT * FROM administration.table_metadata
      WHERE table_name = $1
      ORDER BY form_order, column_name
    `;
    
    const result = await db.query(query, [tableName]);
    logger.info(`[TABLE_METADATA SERVICE] Found ${result.rows.length} metadata records for ${tableName}`);
    
    return result.rows;
  } catch (error) {
    logger.error('[TABLE_METADATA SERVICE] Error getting table metadata:', error);
    throw error;
  }
}

module.exports = {
  getFilterConfig,
  getAllTableMetadata,
  getTableMetadata
};
