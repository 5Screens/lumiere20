const Joi = require('joi');

// Validation schema for query parameters
const getPersonsQuerySchema = Joi.object({
    lang: Joi.string().min(2).max(5).optional()
});

module.exports = {
    getPersonsQuerySchema
};
