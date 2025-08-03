const Joi = require('joi');
const logger = require('../../../config/logger');
const db = require('../../../config/database');

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

// Schema for validating project setup label creation
const createProjectSetupLabelSchema = Joi.object({
    label: Joi.string().max(255).required().messages({
        'string.empty': 'Label cannot be empty',
        'string.max': 'Label cannot exceed 255 characters',
        'any.required': 'Label is required'
    }),
    parent_uuid: Joi.string().uuid().required().messages({
        'string.uuid': 'Invalid parent UUID format',
        'any.required': 'Parent UUID is required'
    }),
    lang_code: Joi.string().max(10).required().messages({
        'string.empty': 'Language code cannot be empty',
        'string.max': 'Language code cannot exceed 10 characters',
        'any.required': 'Language code is required'
    })
}).options({
    abortEarly: false,
    stripUnknown: true
});

// Schema for validating project setup label update
const updateProjectSetupLabelSchema = Joi.object({
    label: Joi.string().max(255).optional().messages({
        'string.empty': 'Label cannot be empty',
        'string.max': 'Label cannot exceed 255 characters'
    })
}).options({
    abortEarly: false,
    stripUnknown: true
});

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

// Validation function for project setup label creation
const validateCreateProjectSetupLabel = async (req, res, next) => {
    logger.info('[VALIDATION] Validating create project setup label request');
    
    const { error } = createProjectSetupLabelSchema.validate(req.body);
    
    if (error) {
        logger.error(`[VALIDATION] Create validation error: ${error.details[0].message}`);
        return res.status(400).json({ 
            success: false,
            message: error.details[0].message 
        });
    }
    
    // Validate language code
    if (req.body.lang_code) {
        try {
            const query = `
                SELECT code 
                FROM translations.languages 
                WHERE code = $1 
                AND is_active = true
            `;
            const result = await db.pool.query(query, [req.body.lang_code]);
            
            if (result.rows.length === 0) {
                logger.error(`[VALIDATION] Language code ${req.body.lang_code} not found or not active`);
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid or inactive language code' 
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
    
    logger.info('[VALIDATION] Create project setup label request validation successful');
    next();
};

// Validation function for project setup label update
const validateUpdateProjectSetupLabel = async (req, res, next) => {
    logger.info('[VALIDATION] Validating update project setup label request');
    
    const { error } = updateProjectSetupLabelSchema.validate(req.body);
    
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
    
    logger.info('[VALIDATION] Update project setup label request validation successful');
    next();
};

module.exports = {
    validateUuidParam,
    validateCreateProjectSetupLabel,
    validateUpdateProjectSetupLabel
};
