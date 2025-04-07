const Joi = require('joi');

const getServicesPerEntityCount = {
    query: Joi.object({
        uuid: Joi.string().uuid().required()
    })
};

const getAllServices = {
    query: Joi.object({
        lang: Joi.string().min(2).max(5).optional()
    })
};

module.exports = {
    getServicesPerEntityCount,
    getAllServices
};
