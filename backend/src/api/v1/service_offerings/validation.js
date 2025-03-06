const Joi = require('joi');

const getSubscribedOfferingsCount = {
    query: Joi.object({
        uuid: Joi.string().uuid().required()
    })
};

module.exports = {
    getSubscribedOfferingsCount
};
