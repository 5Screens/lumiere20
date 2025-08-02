const Joi = require('joi');
const logger = require('../../../config/logger');

// Schema for getting all defect setup
const getAllDefectSetupSchema = Joi.object({
    lang: Joi.string().length(2).optional()
});

// Schema for getting defect setup by UUID
const getDefectSetupByUuidSchema = Joi.object({
    lang: Joi.string().length(2).optional()
});

// Schema for updating defect setup
const updateDefectSetupSchema = Joi.object({
    code: Joi.string().optional(),
    metadata: Joi.string().optional()
});

// Schema for creating defect setup
const createDefectSetupSchema = Joi.object({
    code: Joi.string().required(),
    metadata: Joi.string().optional(),
    labels: Joi.array().items(
        Joi.object({
            label_lang_code: Joi.string().length(2).required(),
            label: Joi.string().required()
        })
    ).optional()
});

// Legacy schema
const getDefectSetupSchema = Joi.object({
    lang: Joi.string().length(2).required(),
    metadata: Joi.string().required()
});

const validateQuery = (schema) => {
    return (req, res, next) => {
        logger.info('[VALIDATION] Validating query parameters for defect setup');
        const { error } = schema.validate(req.query);
        if (error) {
            logger.error(`[VALIDATION] Query validation error: ${error.details[0].message}`);
            return res.status(400).json({ 
                success: false,
                message: error.details[0].message 
            });
        }
        logger.info('[VALIDATION] Query parameters validation passed');
        next();
    };
};

const validateBody = (schema) => {
    return (req, res, next) => {
        logger.info('[VALIDATION] Validating request body for defect setup');
        const { error } = schema.validate(req.body);
        if (error) {
            logger.error(`[VALIDATION] Body validation error: ${error.details[0].message}`);
            return res.status(400).json({ 
                success: false,
                message: error.details[0].message 
            });
        }
        logger.info('[VALIDATION] Request body validation passed');
        next();
    };
};

const validateParams = (req, res, next) => {
    logger.info('[VALIDATION] Validating UUID parameter for defect setup');
    const uuidSchema = Joi.string().uuid().required();
    const { error } = uuidSchema.validate(req.params.uuid);
    if (error) {
        logger.error(`[VALIDATION] UUID validation error: ${error.details[0].message}`);
        return res.status(400).json({ 
            success: false,
            message: 'Invalid UUID format' 
        });
    }
    logger.info('[VALIDATION] UUID parameter validation passed');
    next();
};

// Legacy validation function
const validate = (schema) => {
    return (req, res, next) => {
        logger.info('[VALIDATION] Legacy - Validating request parameters for defect setup');
        const { error } = schema.validate(req.query);
        if (error) {
            logger.error(`[VALIDATION] Legacy - Validation error: ${error.details[0].message}`);
            return res.status(400).json({ error: error.details[0].message });
        }
        next();
    };
};

module.exports = {
    getAllDefectSetup: validateQuery(getAllDefectSetupSchema),
    getDefectSetupByUuid: [validateParams, validateQuery(getDefectSetupByUuidSchema)],
    updateDefectSetup: [validateParams, validateBody(updateDefectSetupSchema)],
    createDefectSetup: validateBody(createDefectSetupSchema),
    getDefectSetup: validate(getDefectSetupSchema) // Legacy validation
};
