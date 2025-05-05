const Joi = require('joi');
const logger = require('../../../config/logger');

const getDefectSetupSchema = Joi.object({
    lang: Joi.string().length(2).required(),
    metadata: Joi.string().required()
});

const validate = (schema) => {
    return (req, res, next) => {
        logger.info('[VALIDATION] Validating request parameters for defect setup');
        const { error } = schema.validate(req.query);
        if (error) {
            logger.error(`[VALIDATION] Validation error: ${error.details[0].message}`);
            return res.status(400).json({ error: error.details[0].message });
        }
        next();
    };
};

module.exports = {
    getDefectSetup: validate(getDefectSetupSchema)
};
