const Joi = require('joi');

// Validation schema for query parameters
const getPersonsQuerySchema = Joi.object({
    lang: Joi.string().min(2).max(5).optional()
});

// Validation schema for person UUID parameter
const personUuidParamSchema = Joi.object({
    uuid: Joi.string().guid({ version: 'uuidv4' }).required()
});

// Validation schema for creating a person
const createPersonSchema = Joi.object({
    first_name: Joi.string().max(100).required(),
    last_name: Joi.string().max(100).required(),
    job_role: Joi.string().max(255).optional(),
    ref_entity_uuid: Joi.string().guid({ version: 'uuidv4' }).optional(),
    password: Joi.string().max(255).optional(),
    password_needs_reset: Joi.boolean().optional(),
    locked_out: Joi.boolean().optional(),
    active: Joi.boolean().optional(),
    critical_user: Joi.boolean().optional(),
    external_user: Joi.boolean().optional(),
    date_format: Joi.string().max(50).optional(),
    internal_id: Joi.string().max(100).optional(),
    email: Joi.string().email().max(255).required(),
    notification: Joi.boolean().optional(),
    time_zone: Joi.string().max(100).optional(),
    ref_location_uuid: Joi.string().guid({ version: 'uuidv4' }).optional(),
    floor: Joi.string().max(50).optional(),
    room: Joi.string().max(50).optional(),
    ref_approving_manager_uuid: Joi.string().guid({ version: 'uuidv4' }).optional(),
    business_phone: Joi.string().max(50).optional(),
    business_mobile_phone: Joi.string().max(50).optional(),
    personal_mobile_phone: Joi.string().max(50).optional(),
    language: Joi.string().max(10).optional(),
    roles: Joi.any().optional(), // JSONB field
    photo: Joi.string().optional(),
    groups: Joi.array().items(Joi.string().guid({ version: 'uuidv4' })).optional()
});

// Validation schema for updating a person
const updatePersonSchema = Joi.object({
    first_name: Joi.string().max(100).optional(),
    last_name: Joi.string().max(100).optional(),
    job_role: Joi.string().max(255).optional(),
    ref_entity_uuid: Joi.string().guid({ version: 'uuidv4' }).optional(),
    password: Joi.string().max(255).optional(),
    password_needs_reset: Joi.boolean().optional(),
    locked_out: Joi.boolean().optional(),
    active: Joi.boolean().optional(),
    critical_user: Joi.boolean().optional(),
    external_user: Joi.boolean().optional(),
    date_format: Joi.string().max(50).optional(),
    internal_id: Joi.string().max(100).optional(),
    email: Joi.string().email().max(255).optional(),
    notification: Joi.boolean().optional(),
    time_zone: Joi.string().max(100).optional(),
    ref_location_uuid: Joi.string().guid({ version: 'uuidv4' }).optional(),
    floor: Joi.string().max(50).optional(),
    room: Joi.string().max(50).optional(),
    ref_approving_manager_uuid: Joi.string().guid({ version: 'uuidv4' }).optional(),
    business_phone: Joi.string().max(50).optional(),
    business_mobile_phone: Joi.string().max(50).optional(),
    personal_mobile_phone: Joi.string().max(50).optional(),
    language: Joi.string().max(10).optional(),
    roles: Joi.any().optional(), // JSONB field
    photo: Joi.string().optional(),
    groups: Joi.array().items(Joi.string().guid({ version: 'uuidv4' })).optional()
}).min(1); // Au moins un champ doit être fourni pour la mise à jour

// Validation schema for adding groups to a person
const addPersonGroupsSchema = Joi.object({
    groups: Joi.array().items(Joi.string().guid({ version: 'uuidv4' })).min(1).required()
});

// Validation schema for person and group UUID parameters
const personGroupUuidParamSchema = Joi.object({
    uuid: Joi.string().guid({ version: 'uuidv4' }).required(),
    group_uuid: Joi.string().guid({ version: 'uuidv4' }).required()
});

module.exports = {
    getPersonsQuerySchema,
    personUuidParamSchema,
    createPersonSchema,
    updatePersonSchema,
    addPersonGroupsSchema,
    personGroupUuidParamSchema
};
