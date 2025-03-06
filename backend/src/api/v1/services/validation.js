const Joi = require('joi');

const getServicesPerEntityCount = {
    query: Joi.object({
        uuid: Joi.string().uuid().required()
    })
};

module.exports = {
    getServicesPerEntityCount
};
