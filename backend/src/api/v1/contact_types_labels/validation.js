const Joi = require('joi');
const logger = require('../../../config/logger');

const createContactTypeLabel = {
    body: Joi.object({
        label: Joi.string().max(255).required(),
        parent_uuid: Joi.string().uuid().required(),
        lang_code: Joi.string().max(10).required()
    }).options({ 
        abortEarly: false,
        stripUnknown: true 
    })
};

const patchContactTypeLabel = {
    params: Joi.object({
        uuid: Joi.string().uuid().required()
    }).options({ 
        abortEarly: false,
        stripUnknown: true 
    }),
    body: Joi.object({
        label: Joi.string().max(255).required()
    }).options({ 
        abortEarly: false,
        stripUnknown: true 
    })
};

const validateContactTypeLabel = (schema, data) => {
    logger.info('[VALIDATION] Starting contact type label validation');
    const { error, value } = schema.validate(data);
    
    if (error) {
        logger.error(`[VALIDATION] Validation error: ${error.message}`);
        throw new Error(`Validation error: ${error.message}`);
    }
    
    return value;
};

module.exports = {
    createContactTypeLabel,
    patchContactTypeLabel,
    validateContactTypeLabel
};
