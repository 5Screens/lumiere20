const db = require('../../../config/database');
const logger = require('../../../config/logger');

const getTickets = async (lang, ticket_type) => {
    logger.info(`[SERVICE] Fetching tickets${ticket_type ? ` of type ${ticket_type}` : ''}${lang ? ` with language ${lang}` : ''}`);
    
    const params = [lang || 'en'];
    let typeCondition = '';
    
    if (ticket_type) {
        typeCondition = 'AND t.ticket_type_code = $2';
        params.push(ticket_type);
    }
    
    const query = `
        SELECT 
            t.*,
            p1.first_name || ' ' || p1.last_name as requested_by_name,
            p2.first_name || ' ' || p2.last_name as requested_for_name,
            p3.first_name || ' ' || p3.last_name as writer_name,
            COALESCE(ttt.label, tt.code) as ticket_type_label,
            COALESCE(tst.label, ts.code) as ticket_status_label,
            tt.code as ticket_type_code,
            ts.code as ticket_status_code
        FROM core.tickets t
        JOIN configuration.persons p1 ON t.requested_by_uuid = p1.uuid
        JOIN configuration.persons p2 ON t.requested_for_uuid = p2.uuid
        JOIN configuration.persons p3 ON t.writer_uuid = p3.uuid
        JOIN configuration.ticket_types tt ON t.ticket_type_code = tt.code
        JOIN configuration.ticket_status ts ON t.ticket_status_code = ts.code
        LEFT JOIN translations.ticket_types_translation ttt ON tt.uuid = ttt.ticket_type_uuid 
            AND ttt.lang = $1
        LEFT JOIN translations.ticket_status_translation tst ON ts.uuid = tst.ticket_status_uuid 
            AND tst.lang = $1
        WHERE 1=1 ${typeCondition}
        ORDER BY t.created_at DESC
    `;
    
    try {
        const result = await db.query(query, params);
        return result.rows;
    } catch (error) {
        logger.error('[SERVICE] Error in getTickets:', error);
        throw error;
    }
};

const createTicket = async (ticketData) => {
    logger.info('[SERVICE] Creating new ticket');
    
    // Start a transaction
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        // Déterminer si c'est un ticket de type INCIDENT
        const isIncident = ticketData.ticket_type_code === 'INCIDENT';
        // Déterminer si c'est un ticket de type PROBLEM
        const isProblem = ticketData.ticket_type_code === 'PROBLEM';
        // Déterminer si c'est un ticket de type CHANGE
        const isChange = ticketData.ticket_type_code === 'CHANGE';
        // Déterminer si c'est un ticket de type KNOWLEDGE
        const isKnowledge = ticketData.ticket_type_code === 'KNOWLEDGE';
        
        logger.info(`[SERVICE] Ticket type is ${isIncident ? 'INCIDENT' : isProblem ? 'PROBLEM' : isChange ? 'CHANGE' : isKnowledge ? 'KNOWLEDGE' : ticketData.ticket_type_code}`);
        
        // Préparer les attributs étendus pour le core
        let coreExtendedAttributes = {};
        
        // Si c'est un incident, ajouter les attributs spécifiques aux incidents
        if (isIncident) {
            // Champs à inclure dans core_extended_attributes pour les incidents
            const incidentFields = [
                'impact', 'urgency', 'priority', 'rel_service', 'rel_service_offerings',
                'resolution_notes', 'resolution_code', 'cause_code', 'rel_problem_id',
                'rel_change_request', 'sla_pickup_due_at', 'assigned_to_at', 
                'sla_resolution_due_at', 'resolved_at', 'reopen_count', 'assignment_count',
                'assignment_to_count', 'standby_count', 'closed_at', 'contact_type'
            ];
            
            // Ajouter chaque champ présent dans ticketData aux attributs étendus
            incidentFields.forEach(field => {
                if (ticketData[field] !== undefined) {
                    coreExtendedAttributes[field] = ticketData[field];
                }
            });
            
            logger.info('[SERVICE] Prepared core_extended_attributes for INCIDENT ticket');
        }
        
        // Si c'est un problème, ajouter les attributs spécifiques aux problèmes
        if (isProblem) {
            // Champs à inclure dans core_extended_attributes pour les problèmes
            const problemFields = [
                'rel_problem_categories_code', 'rel_service', 'rel_service_offerings',
                'impact', 'urgency', 'symptoms_description', 'workaround',
                'knownerrors_list', 'changes_list', 'incidents_list', 'root_cause',
                'definitive_solution', 'target_resolution_date', 'actual_resolution_date',
                'actual_resolution_workload', 'closure_justification', 'closed_at'
            ];
            
            // Ajouter chaque champ présent dans ticketData aux attributs étendus
            problemFields.forEach(field => {
                if (ticketData[field] !== undefined) {
                    coreExtendedAttributes[field] = ticketData[field];
                }
            });
            
            logger.info('[SERVICE] Prepared core_extended_attributes for PROBLEM ticket');
        }
        
        // Si c'est un changement, ajouter les attributs spécifiques aux changements
        if (isChange) {
            // Champs à inclure dans core_extended_attributes pour les changements
            const changeFields = [
                'rel_services', 'rel_service_offerings', 'rel_change_type_code',
                'r_q1', 'r_q2', 'r_q3', 'r_q4', 'r_q5',
                'i_q1', 'i_q2', 'i_q3', 'i_q4',
                'requested_start_date_at', 'requested_end_date_at', 'planned_start_date_at', 'planned_end_date_at',
                'rel_change_justifications_code', 'rel_change_objective', 'test_plan', 'implementation_plan',
                'rollbcak_plan', 'post_implementation_plan', 'cab_comments', 'rel_cab_validation_status',
                'required_validations', 'validated_at', 'related_tickets', 'actual_start_date_at',
                'actual_end_date_at', 'elapsed_time', 'subscribers', 'success_criteria',
                'post_change_evaluation', 'post_change_comment', 'closed_at'
            ];
            
            // Ajouter chaque champ présent dans ticketData aux attributs étendus
            changeFields.forEach(field => {
                if (ticketData[field] !== undefined) {
                    coreExtendedAttributes[field] = ticketData[field];
                }
            });
            
            logger.info('[SERVICE] Prepared core_extended_attributes for CHANGE ticket');
        }
        
        // Si c'est un article de connaissance, utiliser directement les attributs étendus fournis
        if (isKnowledge) {
            logger.info('[SERVICE] Using extended_attributes for KNOWLEDGE ticket');
        }
        
        // 1. Create the ticket
        const ticketQuery = `
            INSERT INTO core.tickets (
                title,
                description,
                configuration_item_uuid,
                requested_by_uuid,
                requested_for_uuid,
                writer_uuid,
                ticket_type_code,
                ticket_status_code,
                core_extended_attributes,
                user_extended_attributes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        
        // Pour les problèmes et les connaissances, requested_by_uuid = requested_for_uuid = le uuid du rédacteur
        const requestedByUuid = (isProblem || isKnowledge) ? ticketData.writer_uuid : ticketData.requested_by_uuid;
        const requestedForUuid = (isProblem || isKnowledge) ? ticketData.writer_uuid : ticketData.requested_for_uuid;

        const ticketResult = await client.query(ticketQuery, [
            ticketData.title,
            ticketData.description,
            ticketData.configuration_item_uuid,
            requestedByUuid,
            requestedForUuid,
            ticketData.writer_uuid,
            ticketData.ticket_type_code,
            ticketData.ticket_status_code,
            isKnowledge && ticketData.extended_attributes ? ticketData.extended_attributes : Object.keys(coreExtendedAttributes).length > 0 ? coreExtendedAttributes : null,
            ticketData.user_extended_attributes || null
        ]);

        const createdTicket = ticketResult.rows[0];
        
        // 2. Si c'est un article de connaissance, créer une entrée dans knowledge_article_versions
        if (isKnowledge) {
            logger.info('[SERVICE] Creating knowledge article version for ticket UUID:', createdTicket.uuid);
            
            const versionQuery = `
                INSERT INTO core.knowledge_article_versions (
                    rel_article_uuid,
                    version_number,
                    change_type,
                    change_summary,
                    full_article,
                    created_by
                ) VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING uuid
            `;
            
            // Créer un objet full_article qui contient toutes les informations du ticket
            // On crée une copie du ticket créé sans le champ core_extended_attributes pour éviter la duplication
            const { core_extended_attributes, ...ticketWithoutCoreExt } = createdTicket;
            const fullArticle = {
                ...ticketWithoutCoreExt,
                extended_attributes: ticketData.extended_attributes || {}
            };
            
            // Insérer la version initiale (V1) de l'article
            const versionResult = await client.query(versionQuery, [
                createdTicket.uuid,                // rel_article_uuid
                1,                                  // version_number (première version)
                'CREATION',                         // change_type
                'Initial creation of knowledge article', // change_summary
                fullArticle,                       // full_article (JSONB)
                ticketData.writer_uuid             // created_by
            ]);
            
            logger.info('[SERVICE] Created knowledge article version with UUID:', versionResult.rows[0].uuid);
        }
        
        // 3. Handle assignment if provided
        if (ticketData.assigned_to_group) {
            logger.info('[SERVICE] Processing ticket assignment');
            
            const assignmentQuery = `
                INSERT INTO core.rel_tickets_groups_persons (
                    rel_ticket,
                    rel_assigned_to_group,
                    rel_assigned_to_person,
                    type
                ) VALUES ($1, $2, $3, 'ASSIGNED')
            `;
            
            await client.query(assignmentQuery, [
                createdTicket.uuid,
                ticketData.assigned_to_group,
                ticketData.assigned_to_person || null
            ]);
        }
        
        // 3. Handle watchers if provided
        if (ticketData.watch_list && Array.isArray(ticketData.watch_list) && ticketData.watch_list.length > 0) {
            logger.info(`[SERVICE] Processing ${ticketData.watch_list.length} ticket watchers`);
            
            // Prepare batch insert for watchers
            const watcherValues = ticketData.watch_list.map((personUuid, index) => {
                return `($1, NULL, $${index + 2}, 'WATCHER')`;
            }).join(', ');
            
            const watcherQuery = `
                INSERT INTO core.rel_tickets_groups_persons (
                    rel_ticket,
                    rel_assigned_to_group,
                    rel_assigned_to_person,
                    type
                ) VALUES ${watcherValues}
            `;
            
            const watcherParams = [createdTicket.uuid, ...ticketData.watch_list];
            await client.query(watcherQuery, watcherParams);
        }
        
        await client.query('COMMIT');
        return createdTicket;
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('[SERVICE] Error creating ticket:', error);
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    getTickets,
    createTicket
};
