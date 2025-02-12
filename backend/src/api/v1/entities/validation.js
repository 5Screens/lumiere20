const Joi = require('joi');
const logger = require('../../../config/logger');

const entitySchema = Joi.object({
    uuid: Joi.string().uuid(),
    name: Joi.string().required(),
    entity_id: Joi.string().required(),
    external_id: Joi.string().allow(null),
    entity_type: Joi.string().valid('COMPANY', 'BRANCH', 'DEPARTMENT', 'SUPPLIER', 'CUSTOMER').required(),
    budget_approver_uuid: Joi.string().uuid().allow(null),
    headquarters_location: Joi.string().allow(null),
    is_active: Joi.boolean().default(true),
    parent_uuid: Joi.string().uuid().allow(null)
}).options({ 
    abortEarly: false,
    stripUnknown: true 
});

const validateEntity = (entity) => {
    logger.info('[VALIDATION] Starting entity validation');
    const { error, value } = entitySchema.validate(entity);
    if (error) {
        logger.error(`[VALIDATION] Entity validation failed: ${error.details.map(d => d.message).join(', ')}`);
        return { error };
    }
    logger.info('[VALIDATION] Entity validation successful');
    return { value };
};

module.exports = {
    entitySchema,
    validateEntity
};
