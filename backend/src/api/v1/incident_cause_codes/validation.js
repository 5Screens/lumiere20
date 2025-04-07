const Joi = require('joi');
const logger = require('../../../config/logger');
const db = require('../../../config/database');

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
const validateGetIncidentCauseCodes = async (req, res, next) => {
    logger.info('[VALIDATION] Validating get incident cause codes request parameters');
    
    const { error } = getIncidentCauseCodesSchema.validate(req.query);
    
    if (error) {
        logger.error(`[VALIDATION] Validation error: ${error.details[0].message}`);
        return res.status(400).json({
            status: 'error',
            message: error.details[0].message
        });
    }

    try {
        // Check if language exists and is active
        const query = `
            SELECT code 
            FROM translations.languages 
            WHERE code = $1 
            AND is_active = true
        `;
        const result = await db.query(query, [req.query.lang]);

        if (result.rows.length === 0) {
            logger.error(`[VALIDATION] Language ${req.query.lang} not found or not active`);
            return res.status(400).json({
                status: 'error',
                message: 'Invalid or inactive language code'
            });
        }

        logger.info('[VALIDATION] Request parameters validation successful');
        next();
    } catch (error) {
        logger.error(`[VALIDATION] Database error during language validation: ${error.message}`);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error during validation'
        });
    }
};

module.exports = {
    validateGetIncidentCauseCodes
};
