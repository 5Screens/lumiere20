const Joi = require('joi');
const logger = require('../../../config/logger');

const getContactTypesSchema = Joi.object({
    lang: Joi.string()
        .required()
        .length(2)
        .messages({
            'any.required': 'Language parameter is required',
            'string.length': 'Language must be exactly 2 characters'
        })
});

function validateGetContactTypes(req, res, next) {
    logger.info('[VALIDATION] Validating get contact types request');
    const { error } = getContactTypesSchema.validate(req.query);
    
    if (error) {
        logger.error(`[VALIDATION] Validation error: ${error.details[0].message}`);
        return res.status(400).json({ error: error.details[0].message });
    }
    
    next();
}

module.exports = {
    validateGetContactTypes
};
