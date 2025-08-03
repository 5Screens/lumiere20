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
        }),
    toSelect: Joi.string()
        .valid('yes')
        .optional()
        .messages({
            'any.only': 'toSelect parameter must be "yes" if provided'
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

// Schema for validating UUID parameter
const getChangeSetupByUuidSchema = Joi.object({
    uuid: Joi.string().uuid().required().messages({
        'string.uuid': 'UUID must be a valid UUID format',
        'any.required': 'UUID is required'
    })
});

// Schema for validating query parameters in getByUuid
const getChangeSetupByUuidQuerySchema = Joi.object({
    lang: Joi.string().optional().messages({
        'string.empty': 'Language code cannot be empty'
    })
}).options({
    abortEarly: false,
    stripUnknown: true
});

// Schema for validating update change setup data
const updateChangeSetupSchema = Joi.object({
    code: Joi.string().max(50).optional().messages({
        'string.max': 'Code cannot exceed 50 characters'
    }),
    metadata: Joi.string().max(50).optional().messages({
        'string.max': 'Metadata cannot exceed 50 characters'
    })
}).options({
    abortEarly: false,
    stripUnknown: true
});

// Schema for validating create change setup data
const createChangeSetupSchema = Joi.object({
    code: Joi.string().max(50).required().messages({
        'string.max': 'Code cannot exceed 50 characters',
        'any.required': 'Code is required'
    }),
    metadata: Joi.string().max(50).optional().messages({
        'string.max': 'Metadata cannot exceed 50 characters'
    }),
    labels: Joi.array().items(
        Joi.object({
            label_lang_code: Joi.string().max(10).required().messages({
                'string.max': 'Language code cannot exceed 10 characters',
                'any.required': 'Language code is required for each label'
            }),
            label: Joi.string().max(255).required().messages({
                'string.max': 'Label cannot exceed 255 characters',
                'any.required': 'Label is required for each translation'
            })
        })
    ).optional().messages({
        'array.base': 'Labels must be an array'
    })
}).options({
    abortEarly: false,
    stripUnknown: true
});

// Validation function for getChangeSetupByUuid
const validateGetChangeSetupByUuid = async (req, res, next) => {
    logger.info('[VALIDATION] Validating get change setup by UUID request');
    
    // Validate UUID parameter
    const { error: paramError } = getChangeSetupByUuidSchema.validate(req.params);
    if (paramError) {
        logger.error(`[VALIDATION] UUID validation error: ${paramError.details[0].message}`);
        return res.status(400).json({ error: paramError.details[0].message });
    }
    
    // Validate query parameters
    const { error: queryError } = getChangeSetupByUuidQuerySchema.validate(req.query);
    if (queryError) {
        logger.error(`[VALIDATION] Query validation error: ${queryError.details[0].message}`);
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
                logger.error(`[VALIDATION] Invalid or inactive language code: ${req.query.lang}`);
                return res.status(400).json({ error: 'Invalid or inactive language code' });
            }
        } catch (dbError) {
            logger.error(`[VALIDATION] Database error during language validation: ${dbError.message}`);
            return res.status(500).json({ error: 'Database error during validation' });
        }
    }
    
    logger.info('[VALIDATION] Get change setup by UUID validation passed');
    next();
};

// Validation function for updateChangeSetup
const validateUpdateChangeSetup = async (req, res, next) => {
    logger.info('[VALIDATION] Validating update change setup request');
    
    // Validate UUID parameter
    const { error: paramError } = getChangeSetupByUuidSchema.validate(req.params);
    if (paramError) {
        logger.error(`[VALIDATION] UUID validation error: ${paramError.details[0].message}`);
        return res.status(400).json({ error: paramError.details[0].message });
    }
    
    // Validate body data
    const { error: bodyError } = updateChangeSetupSchema.validate(req.body);
    if (bodyError) {
        logger.error(`[VALIDATION] Body validation error: ${bodyError.details[0].message}`);
        return res.status(400).json({ error: bodyError.details[0].message });
    }
    
    logger.info('[VALIDATION] Update change setup validation passed');
    next();
};

// Validation function for createChangeSetup
const validateCreateChangeSetup = async (req, res, next) => {
    logger.info('[VALIDATION] Validating create change setup request');
    
    // Validate body data
    const { error } = createChangeSetupSchema.validate(req.body);
    if (error) {
        logger.error(`[VALIDATION] Body validation error: ${error.details[0].message}`);
        return res.status(400).json({ error: error.details[0].message });
    }
    
    // If labels are provided, validate language codes
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
                logger.error(`[VALIDATION] Invalid or inactive language codes: ${invalidLangCodes.join(', ')}`);
                return res.status(400).json({ 
                    error: `Invalid or inactive language codes: ${invalidLangCodes.join(', ')}` 
                });
            }
        } catch (dbError) {
            logger.error(`[VALIDATION] Database error during language validation: ${dbError.message}`);
            return res.status(500).json({ error: 'Database error during validation' });
        }
    }
    
    logger.info('[VALIDATION] Create change setup validation passed');
    next();
};

module.exports = {
    validateGetChangeSetupQuery,
    validateGetChangeSetupByUuid,
    validateUpdateChangeSetup,
    validateCreateChangeSetup
};
