const Joi = require('joi');
const logger = require('../../../config/logger');

// Validation schema for GET request query parameters
const getTicketStatusSchema = Joi.object({
    lang: Joi.string()
        .required()
        .min(2)
        .max(5)
        .pattern(/^[a-zA-Z-]+$/)
        .messages({
            'string.base': 'Language must be a string',
            'string.empty': 'Language is required',
            'string.min': 'Language code must be at least 2 characters',
            'string.max': 'Language code must not exceed 5 characters',
            'string.pattern.base': 'Language code must contain only letters and hyphens',
            'any.required': 'Language is required'
        }),
    toSelect: Joi.string()
        .valid('yes')
        .optional()
        .messages({
            'any.only': 'toSelect parameter must be "yes" if provided'
        })
});

logger.info('[VALIDATION] Ticket status validation schemas loaded');

module.exports = {
    getTicketStatusSchema
};
