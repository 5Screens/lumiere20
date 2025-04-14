const Joi = require('joi');
const logger = require('../../../config/logger');
const db = require('../../../config/database');

const validateTicketType = async (ticket_type) => {
    if (!ticket_type) return true;

    const query = 'SELECT code FROM configuration.ticket_types WHERE code = $1';
    const result = await db.query(query, [ticket_type]);
    return result.rows.length > 0;
};

const validateGetTickets = async (req, res, next) => {
    logger.info('[VALIDATION] Validating GET /tickets request');
    
    const schema = Joi.object({
        lang: Joi.string().min(2).max(5),
        ticket_type: Joi.string()
    });

    const { error } = schema.validate(req.query);
    if (error) {
        logger.error('[VALIDATION] Invalid query parameters:', error.details[0].message);
        return res.status(400).json({ error: error.details[0].message });
    }

    if (req.query.ticket_type) {
        const isValidType = await validateTicketType(req.query.ticket_type);
        if (!isValidType) {
            logger.error('[VALIDATION] Invalid ticket type:', req.query.ticket_type);
            return res.status(400).json({ error: 'Invalid ticket type' });
        }
    }

    next();
};

const validateCreateTicket = (req, res, next) => {
    logger.info('[VALIDATION] Validating POST /tickets request');
    
    // Vérifier si le type de ticket est INCIDENT
    const isIncident = req.query.ticket_types === 'INCIDENT' || 
                       (req.body && req.body.ticket_type_code === 'INCIDENT');
                       
    // Vérifier si le type de ticket est PROBLEM
    const isProblem = req.query.ticket_types === 'PROBLEM' || 
                      (req.body && req.body.ticket_type_code === 'PROBLEM');
    
    // Schéma de base pour tous les types de tickets
    const baseSchema = {
        uuid: Joi.string().uuid().allow(null),
        title: Joi.string().required(),
        description: Joi.string().allow('', null),
        writer_uuid: Joi.string().uuid().required(),
        ticket_type_code: Joi.string().required(),
        ticket_status_code: Joi.string().required(),
        configuration_item_uuid: Joi.string().uuid().allow(null, ''),
        assigned_to_group: Joi.string().uuid().allow(null, ''),
        assigned_to_person: Joi.string().uuid().allow(null, ''),
        watch_list: Joi.array().items(Joi.string().uuid()).allow(null),
        created_at: Joi.date().allow(null),
        updated_at: Joi.date().allow(null)
    };
    
    // Champs spécifiques aux incidents
    const incidentSchema = {
        requested_by_uuid: Joi.string().uuid().required(),
        requested_for_uuid: Joi.string().uuid().required(),
        impact: Joi.string().allow(null, ''),
        urgency: Joi.string().allow(null, ''),
        priority: Joi.number().allow(null),
        rel_service: Joi.string().uuid().allow(null, ''),
        rel_service_offerings: Joi.string().uuid().allow(null, ''),
        resolution_notes: Joi.string().allow(null, ''),
        resolution_code: Joi.string().allow(null, ''),
        cause_code: Joi.string().allow(null, ''),
        rel_problem_id: Joi.string().uuid().allow(null, ''),
        rel_change_request: Joi.string().uuid().allow(null, ''),
        sla_pickup_due_at: Joi.date().allow(null),
        assigned_to_at: Joi.date().allow(null),
        sla_resolution_due_at: Joi.date().allow(null),
        resolved_at: Joi.date().allow(null),
        reopen_count: Joi.number().allow(null),
        assignment_count: Joi.number().allow(null),
        assignment_to_count: Joi.number().allow(null),
        standby_count: Joi.number().allow(null),
        closed_at: Joi.date().allow(null),
        contact_type: Joi.string().allow(null, '')
    };
    
    // Champs spécifiques aux problèmes
    const problemSchema = {
        requested_by_uuid: Joi.string().uuid().forbidden(),
        requested_for_uuid: Joi.string().uuid().forbidden(),
        rel_problem_categories_code: Joi.string().allow(null, ''),
        rel_service: Joi.string().uuid().allow(null, ''),
        rel_service_offerings: Joi.string().uuid().allow(null, ''),
        impact: Joi.string().allow(null, ''),
        urgency: Joi.string().allow(null, ''),
        symptoms_description: Joi.string().allow(null, ''),
        workaround: Joi.string().allow(null, ''),
        knownerrors_list: Joi.array().items(Joi.string().uuid()).allow(null),
        changes_list: Joi.array().items(Joi.string().uuid()).allow(null),
        incidents_list: Joi.array().items(Joi.string().uuid()).allow(null),
        root_cause: Joi.string().allow(null, ''),
        definitive_solution: Joi.string().allow(null, ''),
        target_resolution_date: Joi.date().allow(null),
        actual_resolution_date: Joi.date().allow(null),
        actual_resolution_workload: Joi.number().allow(null),
        closure_justification: Joi.string().allow(null, ''),
        closed_at: Joi.date().allow(null)
    };
    
    // Combiner les schémas en fonction du type de ticket
    let schemaObj;
    if (isIncident) {
        schemaObj = { ...baseSchema, ...incidentSchema };
    } else if (isProblem) {
        schemaObj = { ...baseSchema, ...problemSchema };
    } else {
        schemaObj = baseSchema;
    }
    
    const schema = Joi.object(schemaObj);

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
