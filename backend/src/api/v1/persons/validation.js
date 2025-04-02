const Joi = require('joi');

// Validation schema for query parameters
const getPersonsQuerySchema = Joi.object({
    lang: Joi.string().min(2).max(5).optional()
});

// Validation schema for person UUID parameter
const personUuidParamSchema = Joi.object({
    uuid: Joi.string().guid({ version: 'uuidv4' }).required()
});

module.exports = {
    getPersonsQuerySchema,
    personUuidParamSchema
};
