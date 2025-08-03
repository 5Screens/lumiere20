const Joi = require('joi');
const logger = require('../../../config/logger');

// Schema for creating knowledge setup label
const createKnowledgeSetupLabelSchema = Joi.object({
    label: Joi.string().required(),
    parent_uuid: Joi.string().uuid().required(),
    lang_code: Joi.string().length(2).required()
});

// Schema for patching knowledge setup label
const patchKnowledgeSetupLabelSchema = Joi.object({
    label: Joi.string().required()
});

const validateBody = (schema) => {
    return (req, res, next) => {
        logger.info('[VALIDATION] Validating request body for knowledge setup label');
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
    logger.info('[VALIDATION] Validating UUID parameter for knowledge setup label');
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

module.exports = {
    createKnowledgeSetupLabel: validateBody(createKnowledgeSetupLabelSchema),
    patchKnowledgeSetupLabel: [validateParams, validateBody(patchKnowledgeSetupLabelSchema)]
};
