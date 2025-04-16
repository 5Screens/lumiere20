const Joi = require('joi');
const logger = require('../../../config/logger');
const db = require('../../../config/database');

// Schema for validating query parameters
const getChangeSetupQuerySchema = Joi.object({
    lang: Joi.string()
        .optional()
        .messages({
            'string.empty': 'Language code cannot be empty'
        }),
    metadata: Joi.string()
        .optional()
        .messages({
            'string.empty': 'Metadata parameter cannot be empty'
        })
}).options({
    abortEarly: false,
    stripUnknown: true
});

// Validation function for query parameters
const validateGetChangeSetupQuery = async (req, res, next) => {
    logger.info('[VALIDATION] Validating get change setup request');
    
    const { error } = getChangeSetupQuerySchema.validate(req.query);
    
    if (error) {
        logger.error(`[VALIDATION] Validation error: ${error.details[0].message}`);
        return res.status(400).json({ error: error.details[0].message });
    }

    // If language is provided, check if it exists and is active
    if (req.query.lang) {
        try {
            const query = `
                SELECT code 
                FROM translations.languages 
                WHERE code = $1 
                AND is_active = true
            `;
            const result = await db.pool.query(query, [req.query.lang]);

            if (result.rows.length === 0) {
                logger.error(`[VALIDATION] Language ${req.query.lang} not found or not active`);
                return res.status(400).json({ error: 'Invalid or inactive language code' });
            }
        } catch (error) {
            logger.error(`[VALIDATION] Database error during language validation: ${error.message}`);
            return res.status(500).json({ error: 'Internal server error during validation' });
        }
    }

    logger.info('[VALIDATION] Get change setup request validation successful');
    next();
};

module.exports = {
    validateGetChangeSetupQuery
};
