const logger = require('../../../config/logger');

const validateLanguageCode = (req, res, next) => {
    const lang = req.query.lang;
    const toSelect = req.query.toSelect;
    
    if (!lang) {
        logger.warn('[VALIDATION] Missing required lang parameter');
        return res.status(400).json({
            error: 'Missing parameter',
            message: 'The lang parameter is required'
        });
    }

    if (!/^[a-z]{2}$/.test(lang)) {
        logger.warn(`[VALIDATION] Invalid language code format: ${lang}`);
        return res.status(400).json({
            error: 'Invalid parameter',
            message: 'The lang parameter must be a 2-character language code'
        });
    }

    if (toSelect && toSelect !== 'yes') {
        logger.warn(`[VALIDATION] Invalid toSelect parameter value: ${toSelect}`);
        return res.status(400).json({
            error: 'Invalid parameter',
            message: 'The toSelect parameter must be "yes" if provided'
        });
    }

    next();
};

module.exports = {
    validateLanguageCode
};
