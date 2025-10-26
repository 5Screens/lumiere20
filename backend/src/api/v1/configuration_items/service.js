const db = require('../../../config/database');
const logger = require('../../../config/logger');

const getAllConfigurationItems = async (lang) => {
    try {
        logger.info('[SERVICE] Fetching all configuration items from database');
        const query = `
            SELECT 
                ci.uuid,
                ci.name,
                ci.description,
                ci.created_at,
                ci.updated_at
            FROM data.configuration_items ci
            ORDER BY ci.name ASC
        `;
        
        const result = await db.query(query);
        logger.info(`[SERVICE] Retrieved ${result.rows.length} configuration items`);
        return result.rows;
    } catch (error) {
        logger.error('[SERVICE] Error in getAllConfigurationItems service:', error);
        throw error;
    }
};

/**
 * Search configuration items with pagination and filtering
 * @param {Object} params - Search parameters
 * @param {string} [params.search] - Search term for name and description
 * @param {number} [params.page=1] - Page number (1-indexed)
 * @param {number} [params.limit=10] - Number of results per page
 * @param {string} [params.sortBy='name'] - Column to sort by
 * @param {string} [params.sortDirection='asc'] - Sort direction (asc/desc)
 * @param {string} [params.lang='en'] - Language for translations
 * @returns {Promise<Object>} Object with data, total, hasMore, and pagination metadata
 */
const searchConfigurationItems = async ({ search = '', page = 1, limit = 10, sortBy = 'name', sortDirection = 'asc', lang = 'en' }) => {
    try {
        logger.info(`[CI SERVICE] Searching configuration items: search="${search}", page=${page}, limit=${limit}, sortBy=${sortBy}, sortDirection=${sortDirection}`);
        
        // Validate and sanitize pagination parameters
        const validPage = Math.max(1, parseInt(page) || 1);
        const validLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));
        const offset = (validPage - 1) * validLimit;
        
        // Validate sort direction
        const validSortDirection = ['asc', 'desc'].includes(sortDirection.toLowerCase()) ? sortDirection.toLowerCase() : 'asc';
        
        // Sort column mapping (only name for now)
        const sortColumnMapping = {
            'name': 'ci.name',
            'uuid': 'ci.uuid',
            'created_at': 'ci.created_at',
            'updated_at': 'ci.updated_at'
        };
        
        const sortExpression = sortColumnMapping[sortBy] || 'ci.name';
        
        logger.info(`[CI SERVICE] Sort expression: ${sortExpression} ${validSortDirection.toUpperCase()}`);
        
        // Build WHERE clause for search
        const queryParams = [];
        let whereClause = '';
        
        if (search && search.trim()) {
            const searchTerm = `%${search.trim()}%`;
            whereClause = `
                WHERE (
                    LOWER(ci.name) LIKE LOWER($1) OR
                    LOWER(ci.description) LIKE LOWER($1)
                )
            `;
            queryParams.push(searchTerm);
            logger.info(`[CI SERVICE] Search filter applied: "${search}"`);
        }
        
        // Count total results
        const countQuery = `
            SELECT COUNT(*) as total
            FROM data.configuration_items ci
            ${whereClause}
        `;
        
        logger.info(`[CI SERVICE] Count query: ${countQuery}`);
        const countResult = await db.query(countQuery, queryParams);
        const total = parseInt(countResult.rows[0].total);
        
        // Get paginated results
        const dataQuery = `
            SELECT 
                ci.uuid,
                ci.name,
                ci.description,
                ci.created_at,
                ci.updated_at
            FROM data.configuration_items ci
            ${whereClause}
            ORDER BY ${sortExpression} ${validSortDirection.toUpperCase()}
            LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
        `;
        
        queryParams.push(validLimit, offset);
        
        logger.info(`[CI SERVICE] Data query: ${dataQuery}`);
        logger.info(`[CI SERVICE] Query params: ${JSON.stringify(queryParams)}`);
        
        const dataResult = await db.query(dataQuery, queryParams);
        
        // Calculate pagination metadata
        const hasMore = offset + validLimit < total;
        
        logger.info(`[CI SERVICE] Found ${dataResult.rows.length} configuration items (total: ${total})`);
        
        // Return in the format expected by frontend (same as searchPersons)
        return {
            data: dataResult.rows,
            pagination: {
                page: validPage,
                limit: validLimit,
                total: total,
                hasMore: hasMore
            }
        };
        
    } catch (error) {
        logger.error('[CI SERVICE] Error searching configuration items:', error);
        throw error;
    }
};

module.exports = {
    getAllConfigurationItems,
    searchConfigurationItems
};
