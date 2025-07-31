const Joi = require('joi');
const logger = require('../../../config/logger');

const patchSymptomTranslation = {
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

const validateSymptomTranslation = (schema, data) => {
    logger.info('[VALIDATION] Starting symptom translation validation');
    const { error, value } = schema.validate(data);
    
    if (error) {
        logger.error(`[VALIDATION] Validation error: ${error.message}`);
        throw new Error(`Validation error: ${error.message}`);
    }
    
    return value;
};

module.exports = {
    patchSymptomTranslation,
    validateSymptomTranslation
};
