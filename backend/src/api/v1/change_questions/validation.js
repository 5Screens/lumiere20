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

// Schema for validating UUID parameter
const getChangeQuestionByUuidSchema = Joi.object({
    uuid: Joi.string()
        .uuid()
        .required()
        .messages({
            'string.uuid': 'UUID must be a valid UUID format',
            'any.required': 'UUID is required'
        })
}).options({
    abortEarly: false,
    stripUnknown: true
});

// Schema for validating update data
const updateChangeQuestionSchema = Joi.object({
    code: Joi.string()
        .max(50)
        .optional()
        .messages({
            'string.max': 'Code must not exceed 50 characters'
        }),
    metadata: Joi.string()
        .max(50)
        .optional()
        .messages({
            'string.max': 'Metadata must not exceed 50 characters'
        }),
    question_id: Joi.string()
        .max(100)
        .optional()
        .messages({
            'string.max': 'Question ID must not exceed 100 characters'
        })
}).options({
    abortEarly: false,
    stripUnknown: true
});

// Schema for validating create data
const createChangeQuestionSchema = Joi.object({
    code: Joi.string()
        .max(50)
        .required()
        .messages({
            'string.max': 'Code must not exceed 50 characters',
            'any.required': 'Code is required'
        }),
    metadata: Joi.string()
        .max(50)
        .required()
        .messages({
            'string.max': 'Metadata must not exceed 50 characters',
            'any.required': 'Metadata is required'
        }),
    question_id: Joi.string()
        .max(100)
        .required()
        .messages({
            'string.max': 'Question ID must not exceed 100 characters',
            'any.required': 'Question ID is required'
        }),
    labels: Joi.array()
        .items(
            Joi.object({
                label_lang_code: Joi.string()
                    .max(10)
                    .required()
                    .messages({
                        'string.max': 'Language code must not exceed 10 characters',
                        'any.required': 'Language code is required'
                    }),
                label: Joi.string()
                    .max(255)
                    .required()
                    .messages({
                        'string.max': 'Label must not exceed 255 characters',
                        'any.required': 'Label is required'
                    })
            })
        )
        .optional()
        .messages({
            'array.base': 'Labels must be an array'
        })
}).options({
    abortEarly: false,
    stripUnknown: true
});

// Validation function for query parameters
const validateGetChangeQuestionsQuery = async (req, res, next) => {
    logger.info('[VALIDATION] validateGetChangeQuestionsQuery - Validating get change questions request');
    
    const { error } = getChangeQuestionsQuerySchema.validate(req.query);
    
    if (error) {
        logger.error(`[VALIDATION] validateGetChangeQuestionsQuery - Validation error: ${error.details[0].message}`);
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
                logger.error(`[VALIDATION] validateGetChangeQuestionsQuery - Language ${req.query.lang} not found or not active`);
                return res.status(400).json({ error: 'Invalid or inactive language code' });
            }
        } catch (error) {
            logger.error(`[VALIDATION] validateGetChangeQuestionsQuery - Database error during language validation: ${error.message}`);
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

    logger.info('[VALIDATION] validateGetChangeQuestionsQuery - Validation successful');
    next();
};

// Validation function for UUID parameter
const validateGetChangeQuestionByUuid = async (req, res, next) => {
    logger.info(`[VALIDATION] validateGetChangeQuestionByUuid - Validating UUID: ${req.params.uuid}`);
    
    const { error } = getChangeQuestionByUuidSchema.validate(req.params);
    
    if (error) {
        logger.error(`[VALIDATION] validateGetChangeQuestionByUuid - Validation error: ${error.details[0].message}`);
        return res.status(400).json({ error: error.details[0].message });
    }

    logger.info('[VALIDATION] validateGetChangeQuestionByUuid - Validation successful');
    next();
};

// Validation function for update data
const validateUpdateChangeQuestion = async (req, res, next) => {
    logger.info(`[VALIDATION] validateUpdateChangeQuestion - Validating update data for UUID: ${req.params.uuid}`);
    
    // Validate UUID
    const { error: uuidError } = getChangeQuestionByUuidSchema.validate(req.params);
    if (uuidError) {
        logger.error(`[VALIDATION] validateUpdateChangeQuestion - UUID validation error: ${uuidError.details[0].message}`);
        return res.status(400).json({ error: uuidError.details[0].message });
    }
    
    // Validate body
    const { error: bodyError } = updateChangeQuestionSchema.validate(req.body);
    if (bodyError) {
        logger.error(`[VALIDATION] validateUpdateChangeQuestion - Body validation error: ${bodyError.details[0].message}`);
        return res.status(400).json({ error: bodyError.details[0].message });
    }

    logger.info('[VALIDATION] validateUpdateChangeQuestion - Validation successful');
    next();
};

// Validation function for create data
const validateCreateChangeQuestion = async (req, res, next) => {
    logger.info('[VALIDATION] validateCreateChangeQuestion - Validating create data');
    
    const { error } = createChangeQuestionSchema.validate(req.body);
    
    if (error) {
        logger.error(`[VALIDATION] validateCreateChangeQuestion - Validation error: ${error.details[0].message}`);
        return res.status(400).json({ error: error.details[0].message });
    }

    // If labels are provided, validate language codes
    if (req.body.labels && Array.isArray(req.body.labels)) {
        try {
            const langCodes = req.body.labels.map(label => label.label_lang_code);
            const query = `
                SELECT code 
                FROM translations.languages 
                WHERE code = ANY($1) 
                AND is_active = true
            `;
            const result = await db.query(query, [langCodes]);
            
            const validLangCodes = result.rows.map(row => row.code);
            const invalidLangCodes = langCodes.filter(code => !validLangCodes.includes(code));
            
            if (invalidLangCodes.length > 0) {
                logger.error(`[VALIDATION] validateCreateChangeQuestion - Invalid language codes: ${invalidLangCodes.join(', ')}`);
                return res.status(400).json({ error: `Invalid or inactive language codes: ${invalidLangCodes.join(', ')}` });
            }
        } catch (error) {
            logger.error(`[VALIDATION] validateCreateChangeQuestion - Database error during language validation: ${error.message}`);
            return res.status(500).json({ error: 'Internal server error during validation' });
        }
    }

    logger.info('[VALIDATION] validateCreateChangeQuestion - Validation successful');
    next();
};

module.exports = {
    validateGetChangeQuestionsQuery,
    validateGetChangeQuestionByUuid,
    validateUpdateChangeQuestion,
    validateCreateChangeQuestion
};
