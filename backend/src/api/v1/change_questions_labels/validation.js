const Joi = require('joi');
const logger = require('../../../config/logger');
const db = require('../../../config/database').pool;

// Schema for validating create data
const createChangeQuestionLabelSchema = Joi.object({
    label: Joi.string()
        .max(255)
        .required()
        .messages({
            'string.max': 'Label must not exceed 255 characters',
            'any.required': 'Label is required'
        }),
    parent_uuid: Joi.string()
        .uuid()
        .required()
        .messages({
            'string.uuid': 'Parent UUID must be a valid UUID format',
            'any.required': 'Parent UUID is required'
        }),
    lang_code: Joi.string()
        .max(10)
        .required()
        .messages({
            'string.max': 'Language code must not exceed 10 characters',
            'any.required': 'Language code is required'
        })
}).options({
    abortEarly: false,
    stripUnknown: true
});

// Schema for validating patch data
const patchChangeQuestionLabelSchema = Joi.object({
    label: Joi.string()
        .max(255)
        .optional()
        .messages({
            'string.max': 'Label must not exceed 255 characters'
        }),
    lang: Joi.string()
        .max(10)
        .optional()
        .messages({
            'string.max': 'Language code must not exceed 10 characters'
        })
}).options({
    abortEarly: false,
    stripUnknown: true
});

// Schema for validating UUID parameter
const uuidSchema = Joi.object({
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

// Validation function for create data
const validateCreateChangeQuestionLabel = async (req, res, next) => {
    logger.info('[VALIDATION] validateCreateChangeQuestionLabel - Validating create data');
    
    const { error } = createChangeQuestionLabelSchema.validate(req.body);
    
    if (error) {
        logger.error(`[VALIDATION] validateCreateChangeQuestionLabel - Validation error: ${error.details[0].message}`);
        return res.status(400).json({ error: error.details[0].message });
    }

    // Validate language code exists and is active
    try {
        const langQuery = `
            SELECT code 
            FROM translations.languages 
            WHERE code = $1 
            AND is_active = true
        `;
        const langResult = await db.query(langQuery, [req.body.lang_code]);

        if (langResult.rows.length === 0) {
            logger.error(`[VALIDATION] validateCreateChangeQuestionLabel - Language ${req.body.lang_code} not found or not active`);
            return res.status(400).json({ error: 'Invalid or inactive language code' });
        }
    } catch (error) {
        logger.error(`[VALIDATION] validateCreateChangeQuestionLabel - Database error during language validation: ${error.message}`);
        return res.status(500).json({ error: 'Internal server error during validation' });
    }

    logger.info('[VALIDATION] validateCreateChangeQuestionLabel - Validation successful');
    next();
};

// Validation function for patch data
const validatePatchChangeQuestionLabel = async (req, res, next) => {
    logger.info(`[VALIDATION] validatePatchChangeQuestionLabel - Validating patch data for UUID: ${req.params.uuid}`);
    
    // Validate UUID
    const { error: uuidError } = uuidSchema.validate(req.params);
    if (uuidError) {
        logger.error(`[VALIDATION] validatePatchChangeQuestionLabel - UUID validation error: ${uuidError.details[0].message}`);
        return res.status(400).json({ error: uuidError.details[0].message });
    }
    
    // Validate body
    const { error: bodyError } = patchChangeQuestionLabelSchema.validate(req.body);
    if (bodyError) {
        logger.error(`[VALIDATION] validatePatchChangeQuestionLabel - Body validation error: ${bodyError.details[0].message}`);
        return res.status(400).json({ error: bodyError.details[0].message });
    }

    // If lang is provided, validate it exists and is active
    if (req.body.lang) {
        try {
            const langQuery = `
                SELECT code 
                FROM translations.languages 
                WHERE code = $1 
                AND is_active = true
            `;
            const langResult = await db.query(langQuery, [req.body.lang]);

            if (langResult.rows.length === 0) {
                logger.error(`[VALIDATION] validatePatchChangeQuestionLabel - Language ${req.body.lang} not found or not active`);
                return res.status(400).json({ error: 'Invalid or inactive language code' });
            }
        } catch (error) {
            logger.error(`[VALIDATION] validatePatchChangeQuestionLabel - Database error during language validation: ${error.message}`);
            return res.status(500).json({ error: 'Internal server error during validation' });
        }
    }

    logger.info('[VALIDATION] validatePatchChangeQuestionLabel - Validation successful');
    next();
};

module.exports = {
    validateCreateChangeQuestionLabel,
    validatePatchChangeQuestionLabel
};
