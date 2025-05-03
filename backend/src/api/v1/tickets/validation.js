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
                      
    // Vérifier si le type de ticket est CHANGE
    const isChange = req.query.ticket_types === 'CHANGE' || 
                     (req.body && req.body.ticket_type_code === 'CHANGE');
                     
    // Vérifier si le type de ticket est KNOWLEDGE
    const isKnowledge = req.query.ticket_types === 'KNOWLEDGE' || 
                        (req.body && req.body.ticket_type_code === 'KNOWLEDGE');
                        
    // Vérifier si le type de ticket est PROJECT
    const isProject = req.query.ticket_types === 'PROJECT' || 
                      (req.body && req.body.ticket_type_code === 'PROJECT');
                      
    // Vérifier si le type de ticket est SPRINT depuis les query params
    const isSprint = req.query.ticket_type === 'SPRINT' || 
                     (req.body && req.body.ticket_type_code === 'SPRINT');
                     
    // Vérifier si le type de ticket est EPIC depuis les query params
    const isEpic = req.query.ticket_type === 'EPIC' || 
                   (req.body && req.body.ticket_type_code === 'EPIC');
    
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
        requested_by_uuid: Joi.string().uuid().allow(null, ''),
        requested_for_uuid: Joi.string().uuid().allow(null, ''),
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
    
    // Champs spécifiques aux changements
    const changeSchema = {
        requested_by_uuid: Joi.string().uuid().required(),
        requested_for_uuid: Joi.string().uuid().required(),
        rel_services: Joi.string().uuid().allow(null, ''),
        rel_service_offerings: Joi.string().uuid().allow(null, ''),
        rel_change_type_code: Joi.string().allow(null, ''),
        r_q1: Joi.string().allow(null, ''),
        r_q2: Joi.string().allow(null, ''),
        r_q3: Joi.string().allow(null, ''),
        r_q4: Joi.string().allow(null, ''),
        r_q5: Joi.string().allow(null, ''),
        i_q1: Joi.string().allow(null, ''),
        i_q2: Joi.string().allow(null, ''),
        i_q3: Joi.string().allow(null, ''),
        i_q4: Joi.string().allow(null, ''),
        requested_start_date_at: Joi.date().allow(null),
        requested_end_date_at: Joi.date().allow(null),
        planned_start_date_at: Joi.date().allow(null),
        planned_end_date_at: Joi.date().allow(null),
        rel_change_justifications_code: Joi.string().allow(null, ''),
        rel_change_objective: Joi.string().allow(null, ''),
        test_plan: Joi.string().allow(null, ''),
        implementation_plan: Joi.string().allow(null, ''),
        rollbcak_plan: Joi.string().allow(null, ''),
        post_implementation_plan: Joi.string().allow(null, ''),
        cab_comments: Joi.string().allow(null, ''),
        rel_cab_validation_status: Joi.string().allow(null, ''),
        required_validations: Joi.array().items(Joi.string()).allow(null),
        validated_at: Joi.date().allow(null),
        related_tickets: Joi.array().items(Joi.string().uuid()).allow(null),
        actual_start_date_at: Joi.date().allow(null),
        actual_end_date_at: Joi.date().allow(null),
        elapsed_time: Joi.number().allow(null),
        success_criteria: Joi.string().allow(null, ''),
        post_change_evaluation: Joi.string().allow(null, ''),
        post_change_comment: Joi.string().allow(null, ''),
        closed_at: Joi.date().allow(null)
    };
    
    // Champs spécifiques aux articles de connaissance
    const knowledgeSchema = {
        requested_by_uuid: Joi.string().uuid().forbidden(),
        requested_for_uuid: Joi.string().uuid().forbidden(),
        extended_attributes: Joi.object({
            rel_category: Joi.string().allow(null, ''),
            keywords: Joi.array().items(Joi.string()).allow(null),
            rel_service: Joi.string().uuid().allow(null, ''),
            rel_service_offerings: Joi.string().uuid().allow(null, ''),
            rel_target_audience: Joi.array().items(Joi.string()).allow(null),
            rel_lang: Joi.string().allow(null, ''),
            rel_confidentiality_level: Joi.string().allow(null, ''),
            summary: Joi.string().allow(null, ''),
            prerequisites: Joi.string().allow(null, ''),
            limitations: Joi.string().allow(null, ''),
            security_notes: Joi.string().allow(null, ''),
            rel_ticket_type: Joi.string().allow(null, ''),
            tickets_list: Joi.array().items(Joi.string().uuid()).allow(null),
            business_scope: Joi.array().items(Joi.string()).allow(null),
            version: Joi.string().allow(null, ''),
            last_review_at: Joi.date().allow(null),
            next_review_at: Joi.date().allow(null),
            license_type: Joi.string().allow(null, ''),
            rel_involved_process: Joi.string().allow(null, '')
        }).allow(null)
    };
    
    // Champs spécifiques aux projets
    const projectSchema = {
        requested_by_uuid: Joi.string().uuid().forbidden(),
        requested_for_uuid: Joi.string().uuid().forbidden(),
        rel_assigned_to_group: Joi.string().uuid().allow(null, ''),
        rel_assigned_to_person: Joi.string().uuid().allow(null, ''),
        access_to_users: Joi.array().items(Joi.string().uuid()).allow(null),
        access_to_groups: Joi.array().items(Joi.string().uuid()).allow(null),
        key: Joi.string().allow(null, ''),
        start_date: Joi.date().allow(null),
        end_date: Joi.date().allow(null),
        issue_type_scheme_id: Joi.array().items(Joi.string()).allow(null),
        visibility: Joi.string().allow(null, ''),
        project_type: Joi.string().allow(null, '')
    };
    
    // Champs spécifiques aux sprints
    const sprintSchema = {
        requested_by_uuid: Joi.string().uuid().forbidden(),
        requested_for_uuid: Joi.string().uuid().forbidden(),
        uuid: Joi.string().uuid().forbidden(),
        created_at: Joi.date().forbidden(),
        updated_at: Joi.date().forbidden(),
        project_id: Joi.string().uuid().allow(null, ''),
        start_date: Joi.date().allow(null),
        end_date: Joi.date().allow(null),
        actual_velocity: Joi.number().allow(null),
        estimated_velocity: Joi.number().allow(null)
    };
    
    // Champs spécifiques aux epics
    const epicSchema = {
        requested_by_uuid: Joi.string().uuid().forbidden(),
        requested_for_uuid: Joi.string().uuid().forbidden(),
        uuid: Joi.string().uuid().forbidden(),
        created_at: Joi.date().forbidden(),
        updated_at: Joi.date().forbidden(),
        project_id: Joi.string().uuid().allow(null, ''),
        start_date: Joi.date().allow(null),
        end_date: Joi.date().allow(null),
        progress_percent: Joi.number().min(0).max(100).allow(null),
        color: Joi.string().allow(null, ''),
        tags: Joi.array().items(Joi.string()).allow(null)
    };
    
    // Combiner les schémas en fonction du type de ticket
    let schemaObj;
    if (isIncident) {
        schemaObj = { ...baseSchema, ...incidentSchema };
    } else if (isProblem) {
        schemaObj = { ...baseSchema, ...problemSchema };
    } else if (isChange) {
        schemaObj = { ...baseSchema, ...changeSchema };
    } else if (isKnowledge) {
        schemaObj = { ...baseSchema, ...knowledgeSchema };
    } else if (isProject) {
        schemaObj = { ...baseSchema, ...projectSchema };
    } else if (isSprint) {
        schemaObj = { ...baseSchema, ...sprintSchema };
    } else if (isEpic) {
        schemaObj = { ...baseSchema, ...epicSchema };
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
