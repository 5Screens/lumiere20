const Joi = require('joi');

const getSymptoms = {
    query: Joi.object({
        langue: Joi.string().length(2).required()
    })
};

module.exports = {
    getSymptoms
};
