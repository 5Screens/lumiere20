const Joi = require('joi');

const getAuditChangesByObjectUuid = {
    query: Joi.object({
        uuid: Joi.string().uuid().required()
    })
};

module.exports = {
    getAuditChangesByObjectUuid
};
