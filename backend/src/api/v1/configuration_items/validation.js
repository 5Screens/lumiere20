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

module.exports = {
    validateGetAll
};
