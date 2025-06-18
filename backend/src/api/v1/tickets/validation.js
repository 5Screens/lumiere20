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
    
    // Récupérer le type de ticket depuis req.body.ticket_type_code
    const ticketType = req.body && req.body.ticket_type_code;
    
    // Vérifier les différents types de tickets
    const isIncident = ticketType === 'INCIDENT';
    const isProblem = ticketType === 'PROBLEM';
    const isChange = ticketType === 'CHANGE';
    const isKnowledge = ticketType === 'KNOWLEDGE';
    const isProject = ticketType === 'PROJECT';
    const isSprint = ticketType === 'SPRINT';
    const isEpic = ticketType === 'EPIC';
    const isUserStory = ticketType === 'USER_STORY';
    const isDefect = ticketType === 'DEFECT';
    
    // Log du type de ticket trouvé
    if (isIncident) logger.info('[VALIDATION] Ticket type found: INCIDENT');
    else if (isProblem) logger.info('[VALIDATION] Ticket type found: PROBLEM');
    else if (isChange) logger.info('[VALIDATION] Ticket type found: CHANGE');
    else if (isKnowledge) logger.info('[VALIDATION] Ticket type found: KNOWLEDGE');
    else if (isProject) logger.info('[VALIDATION] Ticket type found: PROJECT');
    else if (isSprint) logger.info('[VALIDATION] Ticket type found: SPRINT');
    else if (isEpic) logger.info('[VALIDATION] Ticket type found: EPIC');
    else if (isUserStory) logger.info('[VALIDATION] Ticket type found: USER_STORY');
    else if (isDefect) logger.info('[VALIDATION] Ticket type found: DEFECT');
    else logger.warn('[VALIDATION] No valid ticket type found');
    
    // Schéma de base pour tous les types de tickets
    const baseSchema = {
        uuid: Joi.string().uuid().allow(null),
        title: Joi.string().required(),
        description: Joi.string().allow('', null),
        writer_uuid: Joi.string().uuid().required(),
        ticket_type_code: Joi.string().required(),
        ticket_status_code: Joi.string().required(),
        configuration_item_uuid: Joi.string().uuid().allow(null, ''),
        requested_by_uuid: Joi.string().uuid().allow(null, ''),
        requested_for_uuid: Joi.string().uuid().allow(null, ''),
        created_at: Joi.date().allow(null),
        updated_at: Joi.date().allow(null),
        assigned_to_group: Joi.string().uuid().allow(null, ''),
        assigned_to_person: Joi.string().uuid().allow(null, ''),
        watch_list: Joi.array().items(Joi.string().uuid()).allow(null)
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
    
    // Champs spécifiques aux user stories
    const userStorySchema = {
        // Champs principaux (requis ou optionnels)
        title: Joi.string().required(),
        description: Joi.string().allow('', null),
        configuration_item_uuid: Joi.string().uuid().allow(null, ''),
        writer_uuid: Joi.string().uuid().required(),
        ticket_type_code: Joi.string().valid('USER_STORY').required(),
        ticket_status_code: Joi.string().required(),
        requested_for_uuid: Joi.string().uuid().allow(null, ''),
        requested_by_uuid: Joi.string().uuid().allow(null, ''),
        project_id: Joi.string().uuid().allow(null, ''),
        epic_id: Joi.string().uuid().allow(null, ''),
        sprint_id: Joi.string().uuid().allow(null, ''),
        rel_assigned_to_person: Joi.string().uuid().allow(null, ''),
        rel_assigned_to_group: Joi.string().uuid().allow(null, ''),
        story_points: Joi.number().integer().allow(null),
        priority: Joi.string().allow(null, ''),
        acceptance_criteria: Joi.string().allow('', null),
        tags: Joi.array().items(Joi.string()).allow(null),
        core_extended_attributes: Joi.object().unknown(true).allow(null),
        watch_list: Joi.array().items(Joi.string().uuid()).allow(null),
        created_at: Joi.date().allow(null),
        updated_at: Joi.date().allow(null)
    };
    
    // Champs spécifiques aux defects
    const defectSchema = {
        // Champs principaux (requis ou optionnels)
        title: Joi.string().required(),
        description: Joi.string().allow('', null),
        configuration_item_uuid: Joi.string().uuid().allow(null, ''),
        writer_uuid: Joi.string().uuid().required(),
        ticket_type_code: Joi.string().valid('DEFECT').required(),
        ticket_status_code: Joi.string().required(),
        requested_for_uuid: Joi.string().uuid().allow(null, ''),
        requested_by_uuid: Joi.string().uuid().allow(null, ''),
        project_id: Joi.string().uuid().allow(null, ''),
        rel_assigned_to_person: Joi.string().uuid().allow(null, ''),
        severity: Joi.string().allow(null, ''),
        impact_area: Joi.string().allow(null, ''),
        environment: Joi.string().allow(null, ''),
        steps_to_reproduce: Joi.string().allow('', null),
        expected_behavior: Joi.string().allow('', null),
        workaround: Joi.string().allow('', null),
        tags: Joi.array().items(Joi.string()).allow(null),
        watch_list: Joi.array().items(Joi.string().uuid()).allow(null),
        created_at: Joi.date().allow(null),
        updated_at: Joi.date().allow(null)
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
        project_id: Joi.string().uuid().allow(null, ''),  // Champ accepté pour les epics
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
    } else if (isUserStory) {
        schemaObj = { ...baseSchema, ...userStorySchema };
    } else if (isDefect) {
        schemaObj = { ...baseSchema, ...defectSchema };
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

/**
 * Définit les schémas de validation pour les différents types de tickets
 * Facilite la maintenance en centralisant les définitions
 */
const ticketValidationSchemas = {
    // Champs standards communs à tous les tickets
    standard: {
        title: Joi.string(),
        description: Joi.string().allow('', null),
        configuration_item_uuid: Joi.string().uuid().allow(null, ''),
        ticket_status_code: Joi.string(),
        requested_by_uuid: Joi.string().uuid().allow(null, ''),
        requested_for_uuid: Joi.string().uuid().allow(null, ''),
        assigned_to_person: Joi.string().uuid().allow(null, ''),
        assigned_to_group: Joi.string().uuid().allow(null, '')
    },
    
    // Champs étendus pour les incidents
    INCIDENT: {
        // Impact et priorité
        impact: Joi.string(),
        urgency: Joi.string(),
        priority: Joi.number().integer(),
        rel_service: Joi.string().uuid().allow(null, ''),
        rel_service_offerings: Joi.alternatives().try(
            Joi.string().uuid().allow(null, ''),
            Joi.array().items(Joi.string().uuid())
        ),
        contact_type: Joi.string(),
        
        // Informations de résolution
        resolution_notes: Joi.string().allow('', null),
        resolution_code: Joi.string().allow(null, ''),
        cause_code: Joi.string().allow(null, ''),
        rel_problem_id: Joi.string().uuid().allow(null, ''),
        rel_change_request: Joi.string().uuid().allow(null, ''),
        
        // SLA et timing
        sla_pickup_due_at: Joi.date().allow(null),
        assigned_to_at: Joi.date().allow(null),
        sla_resolution_due_at: Joi.date().allow(null),
        resolved_at: Joi.date().allow(null),
        
        // Compteurs
        reopen_count: Joi.number().integer().min(0),
        assignment_count: Joi.number().integer().min(0),
        assignment_to_count: Joi.number().integer().min(0),
        standby_count: Joi.number().integer().min(0)
    },
    
    // Champs étendus pour les problèmes
    PROBLEM: {
        // Informations de base
        rel_problem_categories_code: Joi.string().allow(null, ''),
        closed_at: Joi.date().allow(null),
        target_resolution_date: Joi.date().allow(null),
        actual_resolution_date: Joi.date().allow(null),
        actual_resolution_workload: Joi.number().allow(null),
        impact: Joi.string().allow(null, ''),
        urgency: Joi.string().allow(null, ''),
        rel_service: Joi.string().uuid().allow(null, ''),
        rel_service_offerings: Joi.alternatives().try(
            Joi.string().uuid().allow(null, ''),
            Joi.array().items(Joi.string().uuid())
        ),
        
        // Description des symptômes et contournement
        symptoms_description: Joi.string().allow('', null),
        workaround: Joi.string().allow('', null),
        
        // Informations de résolution
        root_cause: Joi.string().allow('', null),
        definitive_solution: Joi.string().allow('', null),
        closure_justification: Joi.string().allow('', null),
        
        // Liste de surveillance
        watch_list: Joi.alternatives().try(
            Joi.string().uuid().allow(null, ''),
            Joi.array().items(Joi.string().uuid())
        ),
        
        // Relations
        knownerrors_list: Joi.alternatives().try(
            Joi.string().uuid().allow(null, ''),
            Joi.array().items(Joi.string().uuid())
        ),
        changes_list: Joi.alternatives().try(
            Joi.string().uuid().allow(null, ''),
            Joi.array().items(Joi.string().uuid())
        ),
        incidents_list: Joi.alternatives().try(
            Joi.string().uuid().allow(null, ''),
            Joi.array().items(Joi.string().uuid())
        )
    },
    
    // Ajoutez d'autres types de tickets selon les besoins
    CHANGE: {
        requested_by_uuid: Joi.string().uuid().allow(null, ''),
        requested_for_uuid: Joi.string().uuid().allow(null, ''),
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
    },
    // KNOWLEDGE: { ... },
    // etc.
};

/**
 * Valide les données de mise à jour d'un ticket
 * Utilise une approche modulaire qui facilite l'ajout de nouveaux types de tickets
 */
const validateUpdateTicket = async (req, res, next) => {
    logger.info('[VALIDATION] Validating PATCH /tickets/:uuid request');
    
    try {
        // Créer un schéma de base avec les champs standards
        let validationSchema = {
            ...ticketValidationSchemas.standard
        };

        // Ajouter les validations spécifiques des types de ticket 
        validationSchema = {
            ...validationSchema,
            ...ticketValidationSchemas.INCIDENT,
            ...ticketValidationSchemas.PROBLEM,
            ...ticketValidationSchemas.CHANGE
        };

        // Créer le schéma final et valider
        const updateSchema = Joi.object(validationSchema).min(1); // Au moins un champ doit être fourni
        
        const { error } = updateSchema.validate(req.body);
        if (error) {
            logger.error('[VALIDATION] Invalid request body for PATCH:', error.details[0].message);
            return res.status(400).json({ error: error.details[0].message });
        }
        
        next();
    } catch (error) {
        logger.error('[VALIDATION] Error validating update ticket request:', error);
        return res.status(500).json({ error: 'Internal server error during validation' });
    }
};

const validateAddWatchers = (req, res, next) => {
    logger.info('[VALIDATION] Validating POST /tickets/:uuid/watchers request');
    
    const schema = Joi.object({
        watch_list: Joi.array().items(Joi.string().uuid()).required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        logger.error('[VALIDATION] Invalid request body:', error.details[0].message);
        return res.status(400).json({ error: error.details[0].message });
    }

    // Vérifier que l'UUID du ticket est valide
    const ticketUuidValidation = Joi.string().uuid().validate(req.params.uuid);
    if (!req.params.uuid || ticketUuidValidation.error) {
        logger.error('[VALIDATION] Invalid ticket UUID provided:', req.params.uuid);
        return res.status(400).json({ error: 'Invalid ticket UUID' });
    }

    next();
};

const validateRemoveWatcher = (req, res, next) => {
    logger.info('[VALIDATION] Validating DELETE /tickets/:uuid/watchers/:user_uuid request');
    
    // Vérifier que l'UUID du ticket est valide
    const ticketUuidValidation = Joi.string().uuid().validate(req.params.uuid);
    if (!req.params.uuid || ticketUuidValidation.error) {
        logger.error('[VALIDATION] Invalid ticket UUID provided:', req.params.uuid);
        return res.status(400).json({ error: 'Invalid ticket UUID' });
    }

    // Vérifier que l'UUID de l'utilisateur est valide
    const userUuidValidation = Joi.string().uuid().validate(req.params.user_uuid);
    if (!req.params.user_uuid || userUuidValidation.error) {
        logger.error('[VALIDATION] Invalid user UUID provided:', req.params.user_uuid);
        return res.status(400).json({ error: 'Invalid user UUID' });
    }

    next();
};

module.exports = {
    validateGetTickets,
    validateCreateTicket,
    validateUpdateTicket,
    validateAddWatchers,
    validateRemoveWatcher
};
