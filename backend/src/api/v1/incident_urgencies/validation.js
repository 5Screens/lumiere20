const Joi = require('joi');
const logger = require('../../../config/logger');

const validateGetIncidentUrgencies = (req, res, next) => {
    logger.info('[VALIDATION] Validating get incident urgencies request');
    
    const schema = Joi.object({
        lang: Joi.string()
            .required()
            .messages({
                'string.empty': 'Language code cannot be empty',
                'any.required': 'Language code is required'
            })
    });

    const { error } = schema.validate(req.query);
    
    if (error) {
        logger.error(`[VALIDATION] Validation error: ${error.details[0].message}`);
        return res.status(400).json({ error: error.details[0].message });
    }

    logger.info('[VALIDATION] Get incident urgencies request validation successful');
    next();
};

module.exports = {
    validateGetIncidentUrgencies
};
