const Joi = require('joi');
const logger = require('../../../config/logger');

const validateGetTickets = (req, res, next) => {
    logger.info('[VALIDATION] Validating GET /tickets request');
    
    const schema = Joi.object({
        lang: Joi.string().min(2).max(5)
    });

    const { error } = schema.validate(req.query);
    if (error) {
        logger.error('[VALIDATION] Invalid query parameters:', error.details[0].message);
        return res.status(400).json({ error: error.details[0].message });
    }

    next();
};

const validateCreateTicket = (req, res, next) => {
    logger.info('[VALIDATION] Validating POST /tickets request');
    
    const schema = Joi.object({
        titre: Joi.string().required(),
        description: Joi.string().allow('', null),
        configuration_item_uuid: Joi.string().uuid().required(),
        requested_by_uuid: Joi.string().uuid().required(),
        requested_for_uuid: Joi.string().uuid().required(),
        writer_uuid: Joi.string().uuid().required(),
        ticket_type_code: Joi.string().required(),
        ticket_status_code: Joi.string().required(),
        core_extended_attributes: Joi.object().allow(null),
        user_extended_attributes: Joi.object().allow(null),
        // Nouveaux champs pour l'assignation et les observateurs
        assigned_to_group: Joi.string().uuid(),
        assigned_to_person: Joi.string().uuid(),
        watch_list: Joi.array().items(Joi.string().uuid())
    });

    const { error } = schema.validate(req.body);
    if (error) {
        logger.error('[VALIDATION] Invalid request body:', error.details[0].message);
        return res.status(400).json({ error: error.details[0].message });
    }

    next();
};

module.exports = {
    validateGetTickets,
    validateCreateTicket
};
