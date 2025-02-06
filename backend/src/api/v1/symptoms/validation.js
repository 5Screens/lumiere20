const Joi = require('joi');

const getSymptoms = {
    query: Joi.object({
        langue: Joi.string().length(2).required()
    })
};

const createSymptom = {
    body: Joi.object({
        code: Joi.string().max(50).required(),
        translations: Joi.array().items(
            Joi.object({
                langue: Joi.string().length(2).required(),
                libelle: Joi.string().max(255).required()
            })
        ).min(1).required()
    })
};

module.exports = {
    getSymptoms,
    createSymptom
};
