const Joi = require('joi');
const logger = require('../../../config/logger');
const db = require('../../../config/database');

// Schema for validating UUID parameter
const uuidSchema = Joi.object({
    uuid: Joi.string().uuid().required().messages({
        'string.uuid': 'UUID must be a valid UUID format',
        'any.required': 'UUID is required'
    })
}).options({
    abortEarly: false,
    stripUnknown: true
});

// Schema for validating create change option label data
const createChangeOptionLabelSchema = Joi.object({
    label: Joi.string().max(255).required().messages({
        'string.max': 'Label cannot exceed 255 characters',
        'any.required': 'Label is required'
    }),
    parent_uuid: Joi.string().uuid().required().messages({
        'string.uuid': 'Parent UUID must be a valid UUID format',
        'any.required': 'Parent UUID is required'
    }),
    lang_code: Joi.string().max(10).required().messages({
        'string.max': 'Language code cannot exceed 10 characters',
        'any.required': 'Language code is required'
    })
}).options({
    abortEarly: false,
    stripUnknown: true
});

// Schema for validating patch change option label data
const patchChangeOptionLabelSchema = Joi.object({
    label: Joi.string().max(255).required().messages({
        'string.max': 'Label cannot exceed 255 characters',
        'any.required': 'Label is required'
    })
}).options({
    abortEarly: false,
    stripUnknown: true
});

/**
 * Validation function for create change option label
 */
const validateCreateChangeOptionLabel = async (req, res, next) => {
    logger.info('[VALIDATION] validateCreateChangeOptionLabel - Validating request');
    
    const { error } = createChangeOptionLabelSchema.validate(req.body);
    
    if (error) {
        logger.error(`[VALIDATION] validateCreateChangeOptionLabel - Validation error: ${error.details[0].message}`);
        return res.status(400).json({ error: error.details[0].message });
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
                logger.error(`[VALIDATION] validateCreateChangeOptionLabel - Language ${req.body.lang_code} not found or not active`);
                return res.status(400).json({ error: 'Invalid or inactive language code' });
            }
        } catch (error) {
            logger.error(`[VALIDATION] validateCreateChangeOptionLabel - Database error during language validation: ${error.message}`);
            return res.status(500).json({ error: 'Internal server error during validation' });
        }
    }

    // Validate parent_uuid exists
    if (req.body.parent_uuid) {
        try {
            const query = `
                SELECT uuid 
                FROM configuration.change_options_codes 
                WHERE uuid = $1
            `;
            const result = await db.pool.query(query, [req.body.parent_uuid]);

            if (result.rows.length === 0) {
                logger.error(`[VALIDATION] validateCreateChangeOptionLabel - Parent change option ${req.body.parent_uuid} not found`);
                return res.status(400).json({ error: 'Parent change option not found' });
            }
        } catch (error) {
            logger.error(`[VALIDATION] validateCreateChangeOptionLabel - Database error during parent validation: ${error.message}`);
            return res.status(500).json({ error: 'Internal server error during validation' });
        }
    }

    logger.info('[VALIDATION] validateCreateChangeOptionLabel - Validation passed');
    next();
};

/**
 * Validation function for patch change option label
 */
const validatePatchChangeOptionLabel = async (req, res, next) => {
    logger.info(`[VALIDATION] validatePatchChangeOptionLabel - Validating request for UUID: ${req.params.uuid}`);
    
    // Validate UUID parameter
    const { error: paramError } = uuidSchema.validate(req.params);
    if (paramError) {
        logger.error(`[VALIDATION] validatePatchChangeOptionLabel - UUID validation error: ${paramError.details[0].message}`);
        return res.status(400).json({ error: paramError.details[0].message });
    }
    
    // Validate body data
    const { error: bodyError } = patchChangeOptionLabelSchema.validate(req.body);
    if (bodyError) {
        logger.error(`[VALIDATION] validatePatchChangeOptionLabel - Body validation error: ${bodyError.details[0].message}`);
        return res.status(400).json({ error: bodyError.details[0].message });
    }

    logger.info('[VALIDATION] validatePatchChangeOptionLabel - Validation passed');
    next();
};

module.exports = {
    validateCreateChangeOptionLabel,
    validatePatchChangeOptionLabel
};
