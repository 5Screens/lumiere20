const Joi = require('joi');
const logger = require('../../../config/logger');
const db = require('../../../config/database');

// Schema for validating query parameters
const getKnowledgeSetupQuerySchema = Joi.object({
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
const knowledgeSetupUuidSchema = Joi.object({
    uuid: Joi.string()
        .uuid()
        .required()
        .messages({
            'string.empty': 'UUID cannot be empty',
            'string.uuid': 'UUID must be a valid UUID format',
            'any.required': 'UUID is required'
        })
}).options({
    abortEarly: false,
    stripUnknown: true
});

// Schema for validating knowledge setup creation
const createKnowledgeSetupSchema = Joi.object({
    code: Joi.string()
        .required()
        .max(50)
        .messages({
            'string.empty': 'Code cannot be empty',
            'string.max': 'Code cannot exceed 50 characters',
            'any.required': 'Code is required'
        }),
    metadata: Joi.string()
        .optional()
        .max(50)
        .messages({
            'string.max': 'Metadata cannot exceed 50 characters'
        }),
    labels: Joi.array()
        .items(
            Joi.object({
                label_lang_code: Joi.string()
                    .required()
                    .messages({
                        'string.empty': 'Label language code cannot be empty',
                        'any.required': 'Label language code is required'
                    }),
                label: Joi.string()
                    .required()
                    .max(255)
                    .messages({
                        'string.empty': 'Label cannot be empty',
                        'string.max': 'Label cannot exceed 255 characters',
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

// Schema for validating knowledge setup update
const updateKnowledgeSetupSchema = Joi.object({
    code: Joi.string()
        .optional()
        .max(50)
        .messages({
            'string.empty': 'Code cannot be empty',
            'string.max': 'Code cannot exceed 50 characters'
        }),
    metadata: Joi.string()
        .optional()
        .max(50)
        .messages({
            'string.max': 'Metadata cannot exceed 50 characters'
        })
}).options({
    abortEarly: false,
    stripUnknown: true
});

// Validation function for query parameters
const validateGetKnowledgeSetupQuery = async (req, res, next) => {
    logger.info('[VALIDATION] validateGetKnowledgeSetupQuery - Starting validation');
    
    const { error } = getKnowledgeSetupQuerySchema.validate(req.query);
    
    if (error) {
        logger.error(`[VALIDATION] validateGetKnowledgeSetupQuery - Validation error: ${error.details[0].message}`);
        return res.status(400).json({ 
            success: false,
            message: error.details[0].message 
        });
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
                logger.error(`[VALIDATION] validateGetKnowledgeSetupQuery - Language ${req.query.lang} not found or not active`);
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid or inactive language code' 
                });
            }
        } catch (error) {
            logger.error(`[VALIDATION] validateGetKnowledgeSetupQuery - Database error during language validation: ${error.message}`);
            return res.status(500).json({ 
                success: false,
                message: 'Internal server error during validation' 
            });
        }
    }

    logger.info('[VALIDATION] validateGetKnowledgeSetupQuery - Validation successful');
    next();
};

// Validation function for UUID parameter
const validateKnowledgeSetupUuid = async (req, res, next) => {
    logger.info('[VALIDATION] validateKnowledgeSetupUuid - Starting validation');
    
    const { error } = knowledgeSetupUuidSchema.validate(req.params);
    
    if (error) {
        logger.error(`[VALIDATION] validateKnowledgeSetupUuid - Validation error: ${error.details[0].message}`);
        return res.status(400).json({ 
            success: false,
            message: error.details[0].message 
        });
    }
    
    logger.info('[VALIDATION] validateKnowledgeSetupUuid - Validation successful');
    next();
};

// Validation function for knowledge setup creation
const validateCreateKnowledgeSetup = async (req, res, next) => {
    logger.info('[VALIDATION] validateCreateKnowledgeSetup - Starting validation');
    
    const { error } = createKnowledgeSetupSchema.validate(req.body);
    
    if (error) {
        logger.error(`[VALIDATION] validateCreateKnowledgeSetup - Validation error: ${error.details[0].message}`);
        return res.status(400).json({ 
            success: false,
            message: error.details[0].message 
        });
    }
    
    logger.info('[VALIDATION] validateCreateKnowledgeSetup - Validation successful');
    next();
};

// Validation function for knowledge setup update
const validateUpdateKnowledgeSetup = async (req, res, next) => {
    logger.info('[VALIDATION] validateUpdateKnowledgeSetup - Starting validation');
    
    const { error } = updateKnowledgeSetupSchema.validate(req.body);
    
    if (error) {
        logger.error(`[VALIDATION] validateUpdateKnowledgeSetup - Validation error: ${error.details[0].message}`);
        return res.status(400).json({ 
            success: false,
            message: error.details[0].message 
        });
    }
    
    logger.info('[VALIDATION] validateUpdateKnowledgeSetup - Validation successful');
    next();
};

module.exports = {
    validateGetKnowledgeSetupQuery,
    validateKnowledgeSetupUuid,
    validateCreateKnowledgeSetup,
    validateUpdateKnowledgeSetup
};
