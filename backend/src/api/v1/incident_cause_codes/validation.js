const Joi = require('joi');
const logger = require('../../../config/logger');

// Validation schema for query parameters
const getIncidentCauseCodesSchema = Joi.object({
    lang: Joi.string()
        .required()
        .min(2)
        .max(10)
        .pattern(/^[a-zA-Z-]+$/)
        .messages({
            'string.base': 'Language must be a string',
            'string.empty': 'Language is required',
            'string.min': 'Language code must be at least 2 characters',
            'string.max': 'Language code must not exceed 10 characters',
            'string.pattern.base': 'Language code must only contain letters and hyphens',
            'any.required': 'Language parameter is required'
        })
});

// Validation middleware
const validateGetIncidentCauseCodes = (req, res, next) => {
    logger.info('[VALIDATION] Validating get incident cause codes request parameters');
    
    const { error } = getIncidentCauseCodesSchema.validate(req.query);
    
    if (error) {
        logger.error(`[VALIDATION] Validation error: ${error.details[0].message}`);
        return res.status(400).json({
            status: 'error',
            message: error.details[0].message
        });
    }

    logger.info('[VALIDATION] Request parameters validation successful');
    next();
};

module.exports = {
    validateGetIncidentCauseCodes
};
