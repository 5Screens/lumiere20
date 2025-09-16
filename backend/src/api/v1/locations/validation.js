const Joi = require('joi');
const logger = require('../../../config/logger');

const locationSchema = Joi.object({
    uuid: Joi.string().uuid(),
    name: Joi.string().required(),
    site_id: Joi.string().allow(null, ''),
    type: Joi.string().allow(null, ''),
    rel_status_uuid: Joi.string().uuid().allow(null),
    business_criticality: Joi.string().allow(null, ''),
    opening_hours: Joi.string().allow(null, ''),
    time_zone: Joi.string().allow(null, ''),
    street: Joi.string().allow(null, ''),
    city: Joi.string().allow(null, ''),
    state_province: Joi.string().allow(null, ''),
    country: Joi.string().allow(null, ''),
    postal_code: Joi.string().allow(null, ''),
    phone: Joi.string().allow(null, ''),
    comments: Joi.string().allow(null, ''),
    site_created_on: Joi.date().allow(null),
    alternative_site_reference: Joi.string().allow(null, ''),
    wan_design: Joi.string().allow(null, ''),
    network_telecom_service: Joi.string().allow(null, ''),
    parent_uuid: Joi.string().uuid().allow(null),
    primary_entity_uuid: Joi.string().uuid().allow(null),
    field_service_group_uuid: Joi.string().uuid().allow(null),
    occupants_list: Joi.array().items(Joi.string().uuid()).allow(null)
}).options({ 
    abortEarly: false,
    stripUnknown: true 
});

const locationPatchSchema = Joi.object({
    name: Joi.string(),
    site_id: Joi.string().allow(null, ''),
    type: Joi.string().allow(null, ''),
    rel_status_uuid: Joi.string().uuid().allow(null),
    business_criticality: Joi.string().allow(null, ''),
    opening_hours: Joi.string().allow(null, ''),
    time_zone: Joi.string().allow(null, ''),
    street: Joi.string().allow(null, ''),
    city: Joi.string().allow(null, ''),
    state_province: Joi.string().allow(null, ''),
    country: Joi.string().allow(null, ''),
    postal_code: Joi.string().allow(null, ''),
    phone: Joi.string().allow(null, ''),
    comments: Joi.string().allow(null, ''),
    site_created_on: Joi.date().allow(null),
    alternative_site_reference: Joi.string().allow(null, ''),
    wan_design: Joi.string().allow(null, ''),
    network_telecom_service: Joi.string().allow(null, ''),
    parent_uuid: Joi.string().uuid().allow(null),
    primary_entity_uuid: Joi.string().uuid().allow(null),
    field_service_group_uuid: Joi.string().uuid().allow(null)
}).min(1).options({
    abortEarly: false,
    stripUnknown: true
});

const addOccupantSchema = Joi.object({
    type: Joi.string().valid('occupant').required(),
    occupants: Joi.array().items(Joi.string().uuid()).required()
}).options({
    abortEarly: false,
    stripUnknown: true
});

const validateLocation = (location) => {
    logger.info('[VALIDATION] Starting location validation');
    const { error, value } = locationSchema.validate(location);
    if (error) {
        logger.error(`[VALIDATION] Location validation failed: ${error.details.map(d => d.message).join(', ')}`);
        return { error };
    }
    logger.info('[VALIDATION] Location validation successful');
    return { value };
};

const validateLocationPatch = (locationPatch) => {
    logger.info('[VALIDATION] Starting location patch validation');
    const { error, value } = locationPatchSchema.validate(locationPatch);
    if (error) {
        logger.error(`[VALIDATION] Location patch validation failed: ${error.details.map(d => d.message).join(', ')}`);
        return { error };
    }
    logger.info('[VALIDATION] Location patch validation successful');
    return { value };
};

const validateAddOccupants = (occupantData) => {
    logger.info('[VALIDATION] Starting add occupants validation');
    const { error, value } = addOccupantSchema.validate(occupantData);
    if (error) {
        logger.error(`[VALIDATION] Add occupants validation failed: ${error.details.map(d => d.message).join(', ')}`);
        return { error };
    }
    logger.info('[VALIDATION] Add occupants validation successful');
    return { value };
};

const validateUuid = (uuid) => {
    logger.info(`[VALIDATION] Starting UUID validation for: ${uuid}`);
    const uuidSchema = Joi.string().uuid().required();
    const { error, value } = uuidSchema.validate(uuid);
    if (error) {
        logger.error(`[VALIDATION] UUID validation failed: ${error.message}`);
        return { error };
    }
    logger.info('[VALIDATION] UUID validation successful');
    return { value };
};

module.exports = {
    validateLocation,
    validateLocationPatch,
    validateAddOccupants,
    validateUuid
};
