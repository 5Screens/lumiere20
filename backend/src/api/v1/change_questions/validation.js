const Joi = require('joi');
const logger = require('../../../config/logger');
const db = require('../../../config/database').pool;

// Schema for validating query parameters
const getChangeQuestionsQuerySchema = Joi.object({
    lang: Joi.string()
        .optional()
        .messages({
            'string.empty': 'Language code cannot be empty'
        }),
    question_id: Joi.string()
        .optional()
        .messages({
            'string.empty': 'Question ID cannot be empty'
        })
}).options({
    abortEarly: false,
    stripUnknown: true
});

// Validation function for query parameters
const validateGetChangeQuestionsQuery = async (req, res, next) => {
    logger.info('[VALIDATION] Validating get change questions request');
    
    const { error } = getChangeQuestionsQuerySchema.validate(req.query);
    
    if (error) {
        logger.error(`[VALIDATION] Validation error: ${error.details[0].message}`);
        return res.status(400).json({ error: error.details[0].message });
    }

    // If lang is provided, check if it exists and is active
    if (req.query.lang) {
        try {
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
        } catch (error) {
            logger.error(`[VALIDATION] Database error during language validation: ${error.message}`);
            return res.status(500).json({ error: 'Internal server error during validation' });
        }
    }

    // If question_id is provided, check if it exists
    if (req.query.question_id) {
        try {
            const query = `
                SELECT question_id 
                FROM configuration.change_questions_codes 
                WHERE question_id = UPPER($1)
            `;
            const result = await db.query(query, [req.query.question_id]);

            if (result.rows.length === 0) {
                logger.error(`[VALIDATION] Question ID ${req.query.question_id} not found`);
                return res.status(400).json({ error: 'Invalid question ID' });
            }
        } catch (error) {
            logger.error(`[VALIDATION] Database error during question_id validation: ${error.message}`);
            return res.status(500).json({ error: 'Internal server error during validation' });
        }
    }

    logger.info('[VALIDATION] Get change questions request validation successful');
    next();
};

module.exports = {
    validateGetChangeQuestionsQuery
};
