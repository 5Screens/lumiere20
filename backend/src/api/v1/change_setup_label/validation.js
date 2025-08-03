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

// Schema for validating create change setup label data
const createChangeSetupLabelSchema = Joi.object({
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

// Schema for validating patch change setup label data
const patchChangeSetupLabelSchema = Joi.object({
    label: Joi.string().max(255).required().messages({
        'string.max': 'Label cannot exceed 255 characters',
        'any.required': 'Label is required'
    })
}).options({
    abortEarly: false,
    stripUnknown: true
});

/**
 * Validation function for create change setup label
 */
const validateCreateChangeSetupLabel = async (req, res, next) => {
    logger.info('[VALIDATION] validateCreateChangeSetupLabel - Validating request');
    
    const { error } = createChangeSetupLabelSchema.validate(req.body);
    
    if (error) {
        logger.error(`[VALIDATION] validateCreateChangeSetupLabel - Validation error: ${error.details[0].message}`);
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
                logger.error(`[VALIDATION] validateCreateChangeSetupLabel - Invalid or inactive language code: ${req.body.lang_code}`);
                return res.status(400).json({ error: 'Invalid or inactive language code' });
            }
        } catch (dbError) {
            logger.error(`[VALIDATION] validateCreateChangeSetupLabel - Database error during language validation: ${dbError.message}`);
            return res.status(500).json({ error: 'Database error during validation' });
        }
    }

    // Validate parent_uuid exists in change_setup_codes
    if (req.body.parent_uuid) {
        try {
            const query = `
                SELECT uuid 
                FROM configuration.change_setup_codes 
                WHERE uuid = $1
            `;
            const result = await db.pool.query(query, [req.body.parent_uuid]);
            
            if (result.rows.length === 0) {
                logger.error(`[VALIDATION] validateCreateChangeSetupLabel - Change setup with UUID ${req.body.parent_uuid} not found`);
                return res.status(400).json({ error: 'Change setup parent not found' });
            }
        } catch (dbError) {
            logger.error(`[VALIDATION] validateCreateChangeSetupLabel - Database error during parent validation: ${dbError.message}`);
            return res.status(500).json({ error: 'Database error during validation' });
        }
    }
    
    logger.info('[VALIDATION] validateCreateChangeSetupLabel - Validation passed');
    next();
};

/**
 * Validation function for patch change setup label
 */
const validatePatchChangeSetupLabel = async (req, res, next) => {
    logger.info('[VALIDATION] validatePatchChangeSetupLabel - Validating request');
    
    // Validate UUID parameter
    const { error: paramError } = uuidSchema.validate(req.params);
    if (paramError) {
        logger.error(`[VALIDATION] validatePatchChangeSetupLabel - UUID validation error: ${paramError.details[0].message}`);
        return res.status(400).json({ error: paramError.details[0].message });
    }
    
    // Validate body data
    const { error: bodyError } = patchChangeSetupLabelSchema.validate(req.body);
    if (bodyError) {
        logger.error(`[VALIDATION] validatePatchChangeSetupLabel - Body validation error: ${bodyError.details[0].message}`);
        return res.status(400).json({ error: bodyError.details[0].message });
    }
    
    logger.info('[VALIDATION] validatePatchChangeSetupLabel - Validation passed');
    next();
};

module.exports = {
    validateCreateChangeSetupLabel,
    validatePatchChangeSetupLabel
};
