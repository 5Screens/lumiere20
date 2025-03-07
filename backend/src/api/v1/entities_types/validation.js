const Joi = require('joi');
const logger = require('../../../config/logger');

/**
 * Validates query parameters for entity types requests
 * @param {Object} req - Express Request
 * @returns {Object} Validation result
 */
const validateLanguageParam = (req) => {
    const schema = Joi.object({
        langue: Joi.string().min(2).max(5).required(),
        toSelect: Joi.string().valid('yes').optional()
    });

    const result = schema.validate(req.query);
    
    if (result.error) {
        logger.warn(`[VALIDATION] validateLanguageParam - Validation failed: ${result.error.message}`);
    } else {
        logger.info(`[VALIDATION] validateLanguageParam - Validation successful for langue: ${req.query.langue}`);
    }
    
    return result;
};

module.exports = {
    validateLanguageParam
};
