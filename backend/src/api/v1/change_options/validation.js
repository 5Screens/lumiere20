const Joi = require('joi');
const logger = require('../../../config/logger');
const db = require('../../../config/database');

// Schema for validating query parameters for GET all
const getChangeOptionsQuerySchema = Joi.object({
    lang: Joi.string()
        .optional()
        .messages({
            'string.empty': 'Language code cannot be empty'
        })
}).options({
    abortEarly: false,
    stripUnknown: true
});

// Schema for validating UUID parameter
const getChangeOptionByUuidSchema = Joi.object({
    uuid: Joi.string().uuid().required().messages({
        'string.uuid': 'UUID must be a valid UUID format',
        'any.required': 'UUID is required'
    })
}).options({
    abortEarly: false,
    stripUnknown: true
});

// Schema for validating query parameters for GET by UUID
const getChangeOptionByUuidQuerySchema = Joi.object({
    lang: Joi.string()
        .optional()
        .messages({
            'string.empty': 'Language code cannot be empty'
        })
}).options({
    abortEarly: false,
    stripUnknown: true
});

// Schema for validating create change option data
const createChangeOptionSchema = Joi.object({
    code: Joi.string().max(50).required().messages({
        'string.max': 'Code cannot exceed 50 characters',
        'any.required': 'Code is required'
    }),
    metadata: Joi.string().max(50).optional().allow('').messages({
        'string.max': 'Metadata cannot exceed 50 characters'
    }),
    question_id: Joi.string().max(100).optional().allow('').messages({
        'string.max': 'Question ID cannot exceed 100 characters'
    }),
    weight: Joi.number().integer().min(0).optional().messages({
        'number.integer': 'Weight must be an integer',
        'number.min': 'Weight must be greater than or equal to 0'
    }),
    labels: Joi.array().items(
        Joi.object({
            label_lang_code: Joi.string().max(10).required().messages({
                'string.max': 'Language code cannot exceed 10 characters',
                'any.required': 'Language code is required for each label'
            }),
            label: Joi.string().max(255).required().messages({
                'string.max': 'Label cannot exceed 255 characters',
                'any.required': 'Label is required'
            })
        })
    ).optional().messages({
        'array.base': 'Labels must be an array'
    })
}).options({
    abortEarly: false,
    stripUnknown: true
});

// Schema for validating update change option data
const updateChangeOptionSchema = Joi.object({
    code: Joi.string().max(50).optional().messages({
        'string.max': 'Code cannot exceed 50 characters'
    }),
    metadata: Joi.string().max(50).optional().allow('').messages({
        'string.max': 'Metadata cannot exceed 50 characters'
    }),
    question_id: Joi.string().max(100).optional().allow('').messages({
        'string.max': 'Question ID cannot exceed 100 characters'
    }),
    weight: Joi.number().integer().min(0).optional().messages({
        'number.integer': 'Weight must be an integer',
        'number.min': 'Weight must be greater than or equal to 0'
    })
}).options({
    abortEarly: false,
    stripUnknown: true
});

// Validation function for query parameters
const validateGetChangeOptionsQuery = async (req, res, next) => {
    logger.info('[VALIDATION] validateGetChangeOptionsQuery - Validating request');
    
    const { error } = getChangeOptionsQuerySchema.validate(req.query);
    
    if (error) {
        logger.error(`[VALIDATION] validateGetChangeOptionsQuery - Validation error: ${error.details[0].message}`);
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
                logger.error(`[VALIDATION] validateGetChangeOptionsQuery - Language ${req.query.lang} not found or not active`);
                return res.status(400).json({ error: 'Invalid or inactive language code' });
            }
        } catch (error) {
            logger.error(`[VALIDATION] validateGetChangeOptionsQuery - Database error during language validation: ${error.message}`);
            return res.status(500).json({ error: 'Internal server error during validation' });
        }
    }

    logger.info('[VALIDATION] validateGetChangeOptionsQuery - Validation passed');
    next();
};

// Validation function for get change option by UUID
const validateGetChangeOptionByUuid = async (req, res, next) => {
    logger.info(`[VALIDATION] validateGetChangeOptionByUuid - Validating request for UUID: ${req.params.uuid}`);
    
    // Validate UUID parameter
    const { error: paramError } = getChangeOptionByUuidSchema.validate(req.params);
    if (paramError) {
        logger.error(`[VALIDATION] validateGetChangeOptionByUuid - UUID validation error: ${paramError.details[0].message}`);
        return res.status(400).json({ error: paramError.details[0].message });
    }
    
    // Validate query parameters
    const { error: queryError } = getChangeOptionByUuidQuerySchema.validate(req.query);
    if (queryError) {
        logger.error(`[VALIDATION] validateGetChangeOptionByUuid - Query validation error: ${queryError.details[0].message}`);
        return res.status(400).json({ error: queryError.details[0].message });
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
                logger.error(`[VALIDATION] validateGetChangeOptionByUuid - Language ${req.query.lang} not found or not active`);
                return res.status(400).json({ error: 'Invalid or inactive language code' });
            }
        } catch (error) {
            logger.error(`[VALIDATION] validateGetChangeOptionByUuid - Database error during language validation: ${error.message}`);
            return res.status(500).json({ error: 'Internal server error during validation' });
        }
    }

    logger.info('[VALIDATION] validateGetChangeOptionByUuid - Validation passed');
    next();
};

// Validation function for create change option
const validateCreateChangeOption = async (req, res, next) => {
    logger.info('[VALIDATION] validateCreateChangeOption - Validating request');
    
    const { error } = createChangeOptionSchema.validate(req.body);
    
    if (error) {
        logger.error(`[VALIDATION] validateCreateChangeOption - Validation error: ${error.details[0].message}`);
        return res.status(400).json({ error: error.details[0].message });
    }

    // Validate language codes in labels if provided
    if (req.body.labels && req.body.labels.length > 0) {
        try {
            const langCodes = req.body.labels.map(label => label.label_lang_code);
            const query = `
                SELECT code 
                FROM translations.languages 
                WHERE code = ANY($1) 
                AND is_active = true
            `;
            const result = await db.pool.query(query, [langCodes]);
            
            const validLangCodes = result.rows.map(row => row.code);
            const invalidLangCodes = langCodes.filter(code => !validLangCodes.includes(code));
            
            if (invalidLangCodes.length > 0) {
                logger.error(`[VALIDATION] validateCreateChangeOption - Invalid language codes: ${invalidLangCodes.join(', ')}`);
                return res.status(400).json({ error: `Invalid or inactive language codes: ${invalidLangCodes.join(', ')}` });
            }
        } catch (error) {
            logger.error(`[VALIDATION] validateCreateChangeOption - Database error during language validation: ${error.message}`);
            return res.status(500).json({ error: 'Internal server error during validation' });
        }
    }

    logger.info('[VALIDATION] validateCreateChangeOption - Validation passed');
    next();
};

// Validation function for update change option
const validateUpdateChangeOption = async (req, res, next) => {
    logger.info(`[VALIDATION] validateUpdateChangeOption - Validating request for UUID: ${req.params.uuid}`);
    
    // Validate UUID parameter
    const { error: paramError } = getChangeOptionByUuidSchema.validate(req.params);
    if (paramError) {
        logger.error(`[VALIDATION] validateUpdateChangeOption - UUID validation error: ${paramError.details[0].message}`);
        return res.status(400).json({ error: paramError.details[0].message });
    }
    
    // Validate body data
    const { error: bodyError } = updateChangeOptionSchema.validate(req.body);
    if (bodyError) {
        logger.error(`[VALIDATION] validateUpdateChangeOption - Body validation error: ${bodyError.details[0].message}`);
        return res.status(400).json({ error: bodyError.details[0].message });
    }

    logger.info('[VALIDATION] validateUpdateChangeOption - Validation passed');
    next();
};

module.exports = {
    validateGetChangeOptionsQuery,
    validateGetChangeOptionByUuid,
    validateCreateChangeOption,
    validateUpdateChangeOption
};
