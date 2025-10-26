const logger = require('../../../config/logger');

const validateGetAll = (req, res, next) => {
    logger.info('[VALIDATION] Validating get all configuration items request');
    const { lang } = req.query;
    
    if (lang && !['fr', 'en'].includes(lang)) {
        logger.warn(`[VALIDATION] Invalid language parameter: ${lang}`);
        return res.status(400).json({ error: 'Invalid language parameter' });
    }
    
    next();
};

const validateSearch = (req, res, next) => {
    logger.info('[VALIDATION] Validating search configuration items request');
    const { search, page, limit, sortBy, sortDirection, lang } = req.query;
    
    // Validate language
    if (lang && !['fr', 'en'].includes(lang)) {
        logger.warn(`[VALIDATION] Invalid language parameter: ${lang}`);
        return res.status(400).json({ error: 'Invalid language parameter' });
    }
    
    // Validate page
    if (page && (isNaN(page) || parseInt(page) < 1)) {
        logger.warn(`[VALIDATION] Invalid page parameter: ${page}`);
        return res.status(400).json({ error: 'Page must be a positive integer' });
    }
    
    // Validate limit
    if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
        logger.warn(`[VALIDATION] Invalid limit parameter: ${limit}`);
        return res.status(400).json({ error: 'Limit must be between 1 and 100' });
    }
    
    // Validate sortBy
    const validSortColumns = ['name', 'uuid', 'created_at', 'updated_at'];
    if (sortBy && !validSortColumns.includes(sortBy)) {
        logger.warn(`[VALIDATION] Invalid sortBy parameter: ${sortBy}`);
        return res.status(400).json({ error: `sortBy must be one of: ${validSortColumns.join(', ')}` });
    }
    
    // Validate sortDirection
    if (sortDirection && !['asc', 'desc'].includes(sortDirection.toLowerCase())) {
        logger.warn(`[VALIDATION] Invalid sortDirection parameter: ${sortDirection}`);
        return res.status(400).json({ error: 'sortDirection must be asc or desc' });
    }
    
    logger.info('[VALIDATION] Search validation passed');
    next();
};

module.exports = {
    validateGetAll,
    validateSearch
};
