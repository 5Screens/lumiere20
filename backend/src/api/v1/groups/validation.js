const Joi = require('joi');
const logger = require('../../../config/logger');

const groupSchema = Joi.object({
    uuid: Joi.string().uuid(),
    groupe_name: Joi.string().required(),
    support_level: Joi.number().integer().min(0).allow(null),
    description: Joi.string().allow(null, ''),
    rel_supervisor: Joi.string().uuid().allow(null),
    rel_manager: Joi.string().uuid().allow(null),
    rel_schedule: Joi.string().uuid().allow(null),
    email: Joi.string().email().allow(null, ''),
    phone: Joi.string().allow(null, '')
}).options({ 
    abortEarly: false,
    stripUnknown: true 
});

const groupPatchSchema = Joi.object({
    groupe_name: Joi.string(),
    support_level: Joi.number().integer().min(0).allow(null),
    description: Joi.string().allow(null, ''),
    rel_supervisor: Joi.string().uuid().allow(null),
    rel_manager: Joi.string().uuid().allow(null),
    rel_schedule: Joi.string().uuid().allow(null),
    email: Joi.string().email().allow(null, ''),
    phone: Joi.string().allow(null, '')
}).min(1).options({
    abortEarly: false,
    stripUnknown: true
});

const validateGroup = (group) => {
    logger.info('[VALIDATION] Starting group validation');
    const { error, value } = groupSchema.validate(group);
    if (error) {
        logger.error(`[VALIDATION] Group validation failed: ${error.details.map(d => d.message).join(', ')}`);
        return { error };
    }
    logger.info('[VALIDATION] Group validation successful');
    return { value };
};

const validateGroupPatch = (groupPatch) => {
    logger.info('[VALIDATION] Starting group patch validation');
    const { error, value } = groupPatchSchema.validate(groupPatch);
    if (error) {
        logger.error(`[VALIDATION] Group patch validation failed: ${error.details.map(d => d.message).join(', ')}`);
        return { error };
    }
    logger.info('[VALIDATION] Group patch validation successful');
    return { value };
};

module.exports = {
    groupSchema,
    validateGroup,
    validateGroupPatch
};
