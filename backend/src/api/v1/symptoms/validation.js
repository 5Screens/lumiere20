const Joi = require('joi');
const logger = require('../../../config/logger');

const getSymptoms = {
    query: Joi.object({
        langue: Joi.string().length(2).required()
    }).options({ 
        abortEarly: false,
        stripUnknown: true 
    })
};

const createSymptom = {
    body: Joi.object({
        code: Joi.string().max(50).required(),
        translations: Joi.array().items(
            Joi.object({
                langue: Joi.string().length(2).required(),
                libelle: Joi.string().max(255).required()
            })
        ).min(1).required()
    }).options({ 
        abortEarly: false,
        stripUnknown: true 
    })
};

const validateSymptom = (schema, data) => {
    logger.info('[VALIDATION] Starting symptom validation');
    const { error, value } = schema.validate(data);
    if (error) {
        logger.error(`[VALIDATION] Symptom validation failed: ${error.details.map(d => d.message).join(', ')}`);
        return { error };
    }
    logger.info('[VALIDATION] Symptom validation successful');
    return { value };
};

module.exports = {
    getSymptoms,
    createSymptom,
    validateSymptom
};
