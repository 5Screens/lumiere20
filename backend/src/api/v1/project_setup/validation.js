const Joi = require('joi');
const logger = require('../../../config/logger');
const db = require('../../../config/database');

// Schema for validating query parameters
const getProjectSetupQuerySchema = Joi.object({
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

// Schema for validating UUID parameter
const uuidParamSchema = Joi.object({
    uuid: Joi.string().uuid().required().messages({
        'string.uuid': 'Invalid UUID format',
        'any.required': 'UUID is required'
    })
}).options({
    abortEarly: false,
    stripUnknown: true
});

// Schema for validating project setup creation
const createProjectSetupSchema = Joi.object({
    code: Joi.string().max(50).required().messages({
        'string.empty': 'Code cannot be empty',
        'string.max': 'Code cannot exceed 50 characters',
        'any.required': 'Code is required'
    }),
    metadata: Joi.string().max(50).optional().messages({
        'string.max': 'Metadata cannot exceed 50 characters'
    }),
    labels: Joi.array().items(
        Joi.object({
            label_lang_code: Joi.string().max(10).required().messages({
                'string.empty': 'Language code cannot be empty',
                'string.max': 'Language code cannot exceed 10 characters',
                'any.required': 'Language code is required'
            }),
            label: Joi.string().max(255).required().messages({
                'string.empty': 'Label cannot be empty',
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

// Schema for validating project setup update
const updateProjectSetupSchema = Joi.object({
    code: Joi.string().max(50).optional().messages({
        'string.empty': 'Code cannot be empty',
        'string.max': 'Code cannot exceed 50 characters'
    }),
    metadata: Joi.string().max(50).optional().messages({
        'string.max': 'Metadata cannot exceed 50 characters'
    })
}).options({
    abortEarly: false,
    stripUnknown: true
});

// Validation function for query parameters
const validateGetProjectSetupQuery = async (req, res, next) => {
    logger.info('[VALIDATION] Validating get project setup request');
    
    const { error } = getProjectSetupQuerySchema.validate(req.query);
    
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

    logger.info('[VALIDATION] Get project setup request validation successful');
    next();
};

// Validation function for UUID parameter
const validateUuidParam = async (req, res, next) => {
    logger.info(`[VALIDATION] Validating UUID parameter: ${req.params.uuid}`);
    
    const { error } = uuidParamSchema.validate(req.params);
    
    if (error) {
        logger.error(`[VALIDATION] UUID validation error: ${error.details[0].message}`);
        return res.status(400).json({ 
            success: false,
            message: error.details[0].message 
        });
    }
    
    logger.info('[VALIDATION] UUID parameter validation successful');
    next();
};

// Validation function for project setup creation
const validateCreateProjectSetup = async (req, res, next) => {
    logger.info('[VALIDATION] Validating create project setup request');
    
    const { error } = createProjectSetupSchema.validate(req.body);
    
    if (error) {
        logger.error(`[VALIDATION] Create validation error: ${error.details[0].message}`);
        return res.status(400).json({ 
            success: false,
            message: error.details[0].message 
        });
    }
    
    // Validate language codes in labels if provided
    if (req.body.labels && req.body.labels.length > 0) {
        try {
            const langCodes = req.body.labels.map(label => label.label_lang_code);
            const uniqueLangCodes = [...new Set(langCodes)];
            
            const query = `
                SELECT code 
                FROM translations.languages 
                WHERE code = ANY($1) 
                AND is_active = true
            `;
            const result = await db.pool.query(query, [uniqueLangCodes]);
            
            const validLangCodes = result.rows.map(row => row.code);
            const invalidLangCodes = uniqueLangCodes.filter(code => !validLangCodes.includes(code));
            
            if (invalidLangCodes.length > 0) {
                logger.error(`[VALIDATION] Invalid or inactive language codes: ${invalidLangCodes.join(', ')}`);
                return res.status(400).json({ 
                    success: false,
                    message: `Invalid or inactive language codes: ${invalidLangCodes.join(', ')}` 
                });
            }
        } catch (error) {
            logger.error(`[VALIDATION] Database error during language validation: ${error.message}`);
            return res.status(500).json({ 
                success: false,
                message: 'Internal server error during validation' 
            });
        }
    }
    
    logger.info('[VALIDATION] Create project setup request validation successful');
    next();
};

// Validation function for project setup update
const validateUpdateProjectSetup = async (req, res, next) => {
    logger.info('[VALIDATION] Validating update project setup request');
    
    const { error } = updateProjectSetupSchema.validate(req.body);
    
    if (error) {
        logger.error(`[VALIDATION] Update validation error: ${error.details[0].message}`);
        return res.status(400).json({ 
            success: false,
            message: error.details[0].message 
        });
    }
    
    // Check if at least one field is provided for update
    if (Object.keys(req.body).length === 0) {
        logger.error('[VALIDATION] No fields provided for update');
        return res.status(400).json({ 
            success: false,
            message: 'At least one field must be provided for update' 
        });
    }
    
    logger.info('[VALIDATION] Update project setup request validation successful');
    next();
};

module.exports = {
    validateGetProjectSetupQuery,
    validateUuidParam,
    validateCreateProjectSetup,
    validateUpdateProjectSetup
};
