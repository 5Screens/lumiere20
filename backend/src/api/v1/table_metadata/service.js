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
        filter_type,
        filter_options
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
        filterConfig[row.column_name] = { type: 'none' };
      } else {
        filterConfig[row.column_name] = {
          type: row.filter_type,
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
 * Get filter values for a specific column
 * @param {string} tableName - Name of the table
 * @param {string} columnName - Name of the column
 * @param {string} searchQuery - Optional search query for dynamic filters
 * @returns {Object} Filter values
 */
async function getFilterValues(tableName, columnName, searchQuery = null) {
  try {
    logger.info(`[TABLE_METADATA SERVICE] Getting filter values for ${tableName}.${columnName}`);
    
    // First, get the metadata for this column
    const metadataQuery = `
      SELECT 
        filter_type,
        filter_options,
        is_foreign_key,
        related_table,
        related_column
      FROM administration.table_metadata
      WHERE table_name = $1 AND column_name = $2
    `;
    
    const metadataResult = await db.query(metadataQuery, [tableName, columnName]);
    
    if (metadataResult.rows.length === 0) {
      throw new Error(`No metadata found for ${tableName}.${columnName}`);
    }
    
    const metadata = metadataResult.rows[0];
    let values = [];
    
    // Handle different filter types
    switch (metadata.filter_type) {
      case 'checkbox':
        // Get distinct values for checkbox filter
        if (metadata.is_foreign_key && metadata.related_table) {
          // If it's a foreign key, get values from related table
          
          const fkQuery = `
            SELECT DISTINCT
              r.uuid as value,
              r.name as label
            FROM ${metadata.related_table} r
            INNER JOIN ${getTableWithSchema(tableName)} t ON t.${columnName} = r.${metadata.related_column || 'uuid'}
            WHERE r.name IS NOT NULL
            ORDER BY r.name
          `;
          const fkResult = await db.query(fkQuery);
          values = fkResult.rows;
        } else {
          // Get distinct values from the column itself
          const distinctQuery = `
            SELECT DISTINCT ${columnName} as value
            FROM ${getTableWithSchema(tableName)}
            WHERE ${columnName} IS NOT NULL
            ORDER BY ${columnName}
          `;
          const distinctResult = await db.query(distinctQuery);
          values = distinctResult.rows.map(row => ({
            value: row.value,
            label: row.value
          }));
        }
        break;
        
      case 'search':
        // Dynamic search filter
        if (!searchQuery || searchQuery.length < (metadata.filter_options?.minChars || 2)) {
          return { [columnName]: [] };
        }
        
        if (metadata.is_foreign_key && metadata.related_table) {
          // Search in related table
          const searchFkQuery = `
            SELECT DISTINCT
              r.uuid as value,
              r.name as label
            FROM ${metadata.related_table} r
            WHERE LOWER(r.name) LIKE LOWER($1)
            ORDER BY r.name
            LIMIT 20
          `;
          const searchFkResult = await db.query(searchFkQuery, [`%${searchQuery}%`]);
          values = searchFkResult.rows;
        } else {
          // Search in the column itself
          const searchColumnQuery = `
            SELECT DISTINCT ${columnName} as value
            FROM ${getTableWithSchema(tableName)}
            WHERE LOWER(CAST(${columnName} AS TEXT)) LIKE LOWER($1)
              AND ${columnName} IS NOT NULL
            ORDER BY ${columnName}
            LIMIT 20
          `;
          const searchColumnResult = await db.query(searchColumnQuery, [`%${searchQuery}%`]);
          values = searchColumnResult.rows.map(row => ({
            value: row.value,
            label: row.value
          }));
        }
        break;
        
      case 'select':
        // Similar to checkbox but usually for foreign keys
        if (metadata.is_foreign_key && metadata.related_table) {
          const selectQuery = `
            SELECT 
              uuid as value,
              name as label
            FROM ${metadata.related_table}
            ORDER BY name
          `;
          const selectResult = await db.query(selectQuery);
          values = selectResult.rows;
        }
        break;
        
      case 'date_range':
        // Return min and max dates
        const dateRangeQuery = `
          SELECT 
            MIN(${columnName}) as min_date,
            MAX(${columnName}) as max_date
          FROM ${getTableWithSchema(tableName)}
          WHERE ${columnName} IS NOT NULL
        `;
        const dateRangeResult = await db.query(dateRangeQuery);
        return {
          [columnName]: {
            min: dateRangeResult.rows[0].min_date,
            max: dateRangeResult.rows[0].max_date
          }
        };
        
      default:
        logger.warn(`[TABLE_METADATA SERVICE] Unknown filter type: ${metadata.filter_type}`);
        return { [columnName]: [] };
    }
    
    logger.info(`[TABLE_METADATA SERVICE] Found ${values.length} values for ${columnName}`);
    return { [columnName]: values };
    
  } catch (error) {
    logger.error('[TABLE_METADATA SERVICE] Error getting filter values:', error);
    throw error;
  }
}

/**
 * Search persons with filters
 * @param {Object} searchParams - Search parameters including filters, sort, and pagination
 * @returns {Object} Search results with data and metadata
 */
async function searchPersons(searchParams) {
  try {
    logger.info('[TABLE_METADATA SERVICE] Searching persons with params:', searchParams);
    
    const { filters = {}, sort = {}, pagination = {} } = searchParams;
    const { page = 1, limit = 20 } = pagination;
    const { by = 'created_at', direction = 'desc' } = sort;
    
    // Build WHERE clause from filters
    const whereConditions = [];
    const queryParams = [];
    let paramIndex = 1;
    
    // Process each filter
    for (const [column, value] of Object.entries(filters)) {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        continue;
      }
      
      // Get column metadata to know how to handle the filter
      const metadataQuery = `
        SELECT filter_type, data_type 
        FROM administration.table_metadata 
        WHERE table_name = $1 AND column_name = $2
      `;
      const metadataResult = await db.query(metadataQuery, ['persons', column]);
      
      if (metadataResult.rows.length === 0) {
        logger.warn(`[TABLE_METADATA SERVICE] No metadata for column ${column}, skipping filter`);
        continue;
      }
      
      const { filter_type, data_type } = metadataResult.rows[0];
      
      // Handle different filter types
      if (Array.isArray(value)) {
        // Multiple values (OR condition)
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
        whereConditions.push(`${column} IN (${placeholders})`);
        queryParams.push(...value);
      } else if (typeof value === 'object' && (value.gte || value.lte)) {
        // Range filter (for dates, numbers)
        if (value.gte) {
          whereConditions.push(`${column} >= $${paramIndex++}`);
          queryParams.push(value.gte);
        }
        if (value.lte) {
          whereConditions.push(`${column} <= $${paramIndex++}`);
          queryParams.push(value.lte);
        }
      } else if (filter_type === 'search') {
        // Text search
        whereConditions.push(`LOWER(CAST(${column} AS TEXT)) LIKE LOWER($${paramIndex++})`);
        queryParams.push(`%${value}%`);
      } else {
        // Exact match
        whereConditions.push(`${column} = $${paramIndex++}`);
        queryParams.push(value);
      }
    }
    
    // Build the main query
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';
    
    // Count total results
    const countQuery = `
      SELECT COUNT(*) as total
      FROM configuration.persons p
      ${whereClause}
    `;
    
    const countResult = await db.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].total);
    
    // Get paginated results
    const offset = (page - 1) * limit;
    const dataQuery = `
      SELECT 
        p.uuid,
        p.first_name,
        p.last_name,
        p.email,
        p.job_role,
        p.active,
        p.critical_user,
        p.external_user,
        p.business_phone,
        p.business_mobile_phone,
        p.language,
        p.notification,
        p.internal_id,
        p.created_at,
        p.updated_at,
        e.name as entity_name,
        p.ref_location_uuid as location_uuid,
        m.first_name || ' ' || m.last_name as manager_name
      FROM configuration.persons p
      LEFT JOIN configuration.entities e ON p.ref_entity_uuid = e.uuid
      LEFT JOIN configuration.persons m ON p.ref_approving_manager_uuid = m.uuid
      ${whereClause}
      ORDER BY ${by} ${direction.toUpperCase()}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    queryParams.push(limit, offset);
    const dataResult = await db.query(dataQuery, queryParams);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    
    logger.info(`[TABLE_METADATA SERVICE] Found ${dataResult.rows.length} persons (total: ${totalCount})`);
    
    return {
      data: dataResult.rows,
      metadata: {
        total: totalCount,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrev
      }
    };
    
  } catch (error) {
    logger.error('[TABLE_METADATA SERVICE] Error searching persons:', error);
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
  getFilterValues,
  searchPersons,
  getAllTableMetadata,
  getTableMetadata
};
