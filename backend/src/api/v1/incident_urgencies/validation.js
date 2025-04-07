const Joi = require('joi');
const logger = require('../../../config/logger');
const db = require('../../../config/database');

const validateGetIncidentUrgencies = async (req, res, next) => {
    logger.info('[VALIDATION] Validating get incident urgencies request');
    
    const schema = Joi.object({
        lang: Joi.string()
            .required()
            .messages({
                'string.empty': 'Language code cannot be empty',
                'any.required': 'Language code is required'
            })
    });

    const { error } = schema.validate(req.query);
    
    if (error) {
        logger.error(`[VALIDATION] Validation error: ${error.details[0].message}`);
        return res.status(400).json({ error: error.details[0].message });
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
            return res.status(400).json({ error: 'Invalid or inactive language code' });
        }

        logger.info('[VALIDATION] Get incident urgencies request validation successful');
        next();
    } catch (error) {
        logger.error(`[VALIDATION] Database error during language validation: ${error.message}`);
        return res.status(500).json({ error: 'Internal server error during validation' });
    }
};

module.exports = {
    validateGetIncidentUrgencies
};
