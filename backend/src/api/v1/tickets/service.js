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
        SELECT DISTINCT ON (t.uuid)
            t.*,
            p1.first_name || ' ' || p1.last_name as requested_by_name,
            p2.first_name || ' ' || p2.last_name as requested_for_name,
            p3.first_name || ' ' || p3.last_name as writer_name,
            COALESCE(ttt.label, tt.code) as ticket_type_label,
            COALESCE(tst.label, ts.code) as ticket_status_label,
            tt.code as ticket_type_code,
            ts.code as ticket_status_code,
            g.groupe_name as assigned_group_name,
            g.uuid as assigned_group_uuid,
            p4.first_name || ' ' || p4.last_name as assigned_person_name,
            p4.uuid as assigned_person_uuid
        FROM core.tickets t
        LEFT JOIN configuration.persons p1 ON t.requested_by_uuid = p1.uuid
        LEFT JOIN configuration.persons p2 ON t.requested_for_uuid = p2.uuid
        JOIN configuration.persons p3 ON t.writer_uuid = p3.uuid
        JOIN configuration.ticket_types tt ON t.ticket_type_code = tt.code
        JOIN configuration.ticket_status ts ON t.ticket_status_code = ts.code
        LEFT JOIN translations.ticket_types_translation ttt ON tt.uuid = ttt.ticket_type_uuid 
            AND ttt.lang = $1
        LEFT JOIN translations.ticket_status_translation tst ON ts.uuid = tst.ticket_status_uuid 
            AND tst.lang = $1
        LEFT JOIN (
            SELECT rel_ticket, rel_assigned_to_group, rel_assigned_to_person
            FROM core.rel_tickets_groups_persons
            WHERE type = 'ASSIGNED' AND ended_at IS NULL
        ) rtgp ON t.uuid = rtgp.rel_ticket
        LEFT JOIN configuration.groups g ON rtgp.rel_assigned_to_group = g.uuid
        LEFT JOIN configuration.persons p4 ON rtgp.rel_assigned_to_person = p4.uuid
        WHERE 1=1 ${typeCondition}
        ORDER BY t.uuid, t.created_at ASC
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
        // Déterminer si c'est un ticket de type PROJECT
        const isProject = ticketData.ticket_type_code === 'PROJECT';
        // Déterminer si c'est un ticket de type SPRINT
        const isSprint = ticketData.ticket_type_code === 'SPRINT';
        // Déterminer si c'est un ticket de type EPIC
        const isEpic = ticketData.ticket_type_code === 'EPIC';
        // Déterminer si c'est un ticket de type USER_STORY
        const isUserStory = ticketData.ticket_type_code === 'USER_STORY';
        // Déterminer si c'est un ticket de type DEFECT
        const isDefect = ticketData.ticket_type_code === 'DEFECT';
        
        logger.info(`[SERVICE] Ticket type is ${isIncident ? 'INCIDENT' : isProblem ? 'PROBLEM' : isChange ? 'CHANGE' : isKnowledge ? 'KNOWLEDGE' : isProject ? 'PROJECT' : isSprint ? 'SPRINT' : isEpic ? 'EPIC' : isUserStory ? 'USER_STORY' : isDefect ? 'DEFECT' : ticketData.ticket_type_code}`);
        
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
                'assignment_to_count', 'standby_count', 'contact_type'
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
                'actual_resolution_workload', 'closure_justification'
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
                'post_change_evaluation', 'post_change_comment'
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
        
        // Si c'est un projet, ajouter les attributs spécifiques aux projets
        if (isProject) {
            // Champs à inclure dans core_extended_attributes pour les projets
            const projectFields = [
                'key', 'start_date', 'end_date', 'issue_type_scheme_id',
                'visibility', 'project_type'
            ];
            
            // Ajouter chaque champ présent dans ticketData aux attributs étendus
            projectFields.forEach(field => {
                if (ticketData[field] !== undefined) {
                    coreExtendedAttributes[field] = ticketData[field];
                }
            });
            
            logger.info('[SERVICE] Prepared core_extended_attributes for PROJECT ticket');
        }
        
        // Si c'est un sprint, ajouter les attributs spécifiques aux sprints
        if (isSprint) {
            // Champs à inclure dans core_extended_attributes pour les sprints
            // project_id n'est pas inclus dans les attributs étendus pour les sprints
            const sprintFields = [
                'start_date', 'end_date', 'actual_velocity',
                'estimated_velocity'
            ];
            
            // Ajouter chaque champ présent dans ticketData aux attributs étendus
            sprintFields.forEach(field => {
                if (ticketData[field] !== undefined) {
                    coreExtendedAttributes[field] = ticketData[field];
                }
            });
            
            logger.info('[SERVICE] Prepared core_extended_attributes for SPRINT ticket');
        }
        
        // Si c'est un epic, ajouter les attributs spécifiques aux epics
        if (isEpic) {
            // Champs à inclure dans core_extended_attributes pour les epics
            // project_id n'est pas inclus dans les attributs étendus pour les epics
            const epicFields = [
                'start_date', 'end_date', 'progress_percent',
                'color', 'tags'
            ];
            
            // Ajouter chaque champ présent dans ticketData aux attributs étendus
            epicFields.forEach(field => {
                if (ticketData[field] !== undefined) {
                    coreExtendedAttributes[field] = ticketData[field];
                }
            });
            
            logger.info('[SERVICE] Prepared core_extended_attributes for EPIC ticket');
        }

        // USER_STORY logic
        if (isUserStory) {
            logger.info('[SERVICE] Preparing core_extended_attributes for USER_STORY ticket');
            // Remove forbidden fields
            const forbiddenFields = ['uuid', 'created_at', 'updated_at', 'sprint_id', 'project_id', 'epic_id', 'rel_assigned_to_person'];
            // Fields that go directly in columns
            const columnFields = [
                'title', 'description', 'configuration_item_uuid', 'writer_uuid',
                'ticket_type_code', 'ticket_status_code', 'requested_for_uuid', 'requested_by_uuid'
            ];
            // Everything else goes into core_extended_attributes
            Object.keys(ticketData).forEach(key => {
                if (!forbiddenFields.includes(key) && !columnFields.includes(key)) {
                    coreExtendedAttributes[key] = ticketData[key];
                }
            });
            logger.info('[SERVICE] Prepared core_extended_attributes for USER_STORY ticket');
        }
        
        // Si c'est un defect, ajouter les attributs spécifiques aux defects
        if (isDefect) {
            logger.info('[SERVICE] Preparing core_extended_attributes for DEFECT ticket');
            // Remove forbidden fields
            const forbiddenFields = ['uuid', 'created_at', 'updated_at', 'sprint_id', 'project_id', 'epic_id', 'rel_assigned_to_person'];
            // Fields that go directly in columns
            const columnFields = [
                'title', 'description', 'configuration_item_uuid', 'writer_uuid',
                'ticket_type_code', 'ticket_status_code', 'requested_for_uuid', 'requested_by_uuid'
            ];
            // Everything else goes into core_extended_attributes
            Object.keys(ticketData).forEach(key => {
                if (!forbiddenFields.includes(key) && !columnFields.includes(key)) {
                    coreExtendedAttributes[key] = ticketData[key];
                }
            });
            logger.info('[SERVICE] Prepared core_extended_attributes for DEFECT ticket');
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
                user_extended_attributes,
                closed_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `;
        
        // Pour les problèmes, les connaissances, les projets, les sprints et les epics, requested_by_uuid = requested_for_uuid = le uuid du rédacteur
        let requestedByUuid = (isProblem || isKnowledge || isProject || isSprint || isEpic) ? ticketData.writer_uuid : ticketData.requested_by_uuid;
        let requestedForUuid = (isProblem || isKnowledge || isProject || isSprint || isEpic) ? ticketData.writer_uuid : ticketData.requested_for_uuid;
        // USER_STORY et DEFECT: requested_by_uuid/requested_for_uuid can be empty, use as received
        if (isUserStory || isDefect) {
            requestedByUuid = ticketData.requested_by_uuid || null;
            requestedForUuid = ticketData.requested_for_uuid || null;
        }
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
            ticketData.user_extended_attributes || null,
            ticketData.closed_at || null
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
        if (ticketData.assigned_to_group || ticketData.rel_assigned_to_group) {
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
                ticketData.assigned_to_group || ticketData.rel_assigned_to_group,
                ticketData.assigned_to_person || ticketData.rel_assigned_to_person || null
            ]);
        }
        // USER_STORY: assignment logic
        if (isUserStory) {
            logger.info('[SERVICE] Processing USER_STORY assignment');
            // rel_assigned_to_person from body
            const relAssignedToPerson = ticketData.rel_assigned_to_person || null;
            // rel_assigned_to_group = uuid du groupe assigné au ticket ayant le uuid égal à project_id
            let relAssignedToGroup = null;
            if (ticketData.project_id) {
                const groupQuery = `SELECT rel_assigned_to_group FROM core.rel_tickets_groups_persons WHERE rel_ticket = $1 AND type = 'ASSIGNED' LIMIT 1`;
                const groupResult = await client.query(groupQuery, [ticketData.project_id]);
                if (groupResult.rows.length > 0) {
                    relAssignedToGroup = groupResult.rows[0].rel_assigned_to_group;
                }
            }
            if (relAssignedToGroup || relAssignedToPerson) {
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
                    relAssignedToGroup,
                    relAssignedToPerson
                ]);
                logger.info('[SERVICE] USER_STORY assignment inserted');
            } else {
                logger.warn('[SERVICE] USER_STORY assignment: no group or person found for assignment');
            }
        }
        
        // DEFECT: assignment logic
        if (isDefect) {
            logger.info('[SERVICE] Processing DEFECT assignment');
            // rel_assigned_to_person from body
            const relAssignedToPerson = ticketData.rel_assigned_to_person || null;
            // rel_assigned_to_group = uuid du groupe assigné au ticket ayant le uuid égal à project_id
            let relAssignedToGroup = null;
            if (ticketData.project_id) {
                const groupQuery = `SELECT rel_assigned_to_group FROM core.rel_tickets_groups_persons WHERE rel_ticket = $1 AND type = 'ASSIGNED' LIMIT 1`;
                const groupResult = await client.query(groupQuery, [ticketData.project_id]);
                if (groupResult.rows.length > 0) {
                    relAssignedToGroup = groupResult.rows[0].rel_assigned_to_group;
                }
            }
            if (relAssignedToGroup || relAssignedToPerson) {
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
                    relAssignedToGroup,
                    relAssignedToPerson
                ]);
                logger.info('[SERVICE] DEFECT assignment inserted');
            } else {
                logger.warn('[SERVICE] DEFECT assignment: no group or person found for assignment');
            }
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
        
        // 4. Handle access_to_users for PROJECT type if provided
        if (isProject && ticketData.access_to_users && Array.isArray(ticketData.access_to_users) && ticketData.access_to_users.length > 0) {
            logger.info(`[SERVICE] Processing ${ticketData.access_to_users.length} access_to_users for PROJECT ticket`);
            
            // Prepare batch insert for access_to_users
            const accessUsersValues = ticketData.access_to_users.map((personUuid, index) => {
                return `($1, NULL, $${index + 2}, 'ACCESS_GRANTED')`;
            }).join(', ');
            
            const accessUsersQuery = `
                INSERT INTO core.rel_tickets_groups_persons (
                    rel_ticket,
                    rel_assigned_to_group,
                    rel_assigned_to_person,
                    type
                ) VALUES ${accessUsersValues}
            `;
            
            const accessUsersParams = [createdTicket.uuid, ...ticketData.access_to_users];
            await client.query(accessUsersQuery, accessUsersParams);
        }
        
        // 5. Handle access_to_groups for PROJECT type if provided
        if (isProject && ticketData.access_to_groups && Array.isArray(ticketData.access_to_groups) && ticketData.access_to_groups.length > 0) {
            logger.info(`[SERVICE] Processing ${ticketData.access_to_groups.length} access_to_groups for PROJECT ticket`);
            
            // Prepare batch insert for access_to_groups
            const accessGroupsValues = ticketData.access_to_groups.map((groupUuid, index) => {
                return `($1, $${index + 2}, NULL, 'ACCESS_GRANTED')`;
            }).join(', ');
            
            const accessGroupsQuery = `
                INSERT INTO core.rel_tickets_groups_persons (
                    rel_ticket,
                    rel_assigned_to_group,
                    rel_assigned_to_person,
                    type
                ) VALUES ${accessGroupsValues}
            `;
            
            const accessGroupsParams = [createdTicket.uuid, ...ticketData.access_to_groups];
            await client.query(accessGroupsQuery, accessGroupsParams);
        }
        
        // 6. Handle parent-child relationship for SPRINT and EPIC types
        if ((isSprint || isEpic) && ticketData.project_id) {
            logger.info(`[SERVICE] Creating parent-child relationship for ${isSprint ? 'SPRINT' : 'EPIC'} ticket with PROJECT ${ticketData.project_id}`);
            
            const relationQuery = `
                INSERT INTO core.rel_parent_child_tickets (
                    rel_parent_ticket_uuid,
                    rel_child_ticket_uuid,
                    dependency_code
                ) VALUES ($1, $2, $3)
            `;
            
            const relationParams = [
                ticketData.project_id,
                createdTicket.uuid,
                isSprint ? 'SPRINT' : 'EPIC'
            ];
            
            await client.query(relationQuery, relationParams);
            logger.info(`[SERVICE] Created parent-child relationship for ${isSprint ? 'SPRINT' : 'EPIC'} ticket`);
        }
        // USER_STORY: parent-child relationship
        if (isUserStory) {
            // 5A: epic_id present
            if (ticketData.epic_id) {
                logger.info(`[SERVICE] Creating USER_STORY relationship: epic_id=${ticketData.epic_id}`);
                const relationQuery = `
                    INSERT INTO core.rel_parent_child_tickets (
                        rel_parent_ticket_uuid,
                        rel_child_ticket_uuid,
                        dependency_code
                    ) VALUES ($1, $2, 'STORY')
                `;
                await client.query(relationQuery, [ticketData.epic_id, createdTicket.uuid]);
                logger.info('[SERVICE] USER_STORY relationship with EPIC inserted');
            } else if (ticketData.project_id) {
                // 5B: epic_id vide, story fille du projet
                logger.info(`[SERVICE] Creating USER_STORY relationship: project_id=${ticketData.project_id}`);
                const relationQuery = `
                    INSERT INTO core.rel_parent_child_tickets (
                        rel_parent_ticket_uuid,
                        rel_child_ticket_uuid,
                        dependency_code
                    ) VALUES ($1, $2, 'STORY')
                `;
                await client.query(relationQuery, [ticketData.project_id, createdTicket.uuid]);
                logger.info('[SERVICE] USER_STORY relationship with PROJECT inserted');
            }
            // 5C: sprint_id présent
            if (ticketData.sprint_id) {
                logger.info(`[SERVICE] Creating USER_STORY relationship: sprint_id=${ticketData.sprint_id}`);
                const relationQuery = `
                    INSERT INTO core.rel_parent_child_tickets (
                        rel_parent_ticket_uuid,
                        rel_child_ticket_uuid,
                        dependency_code
                    ) VALUES ($1, $2, 'STORY')
                `;
                await client.query(relationQuery, [ticketData.sprint_id, createdTicket.uuid]);
                logger.info('[SERVICE] USER_STORY relationship with SPRINT inserted');
            }
        }
        
        // DEFECT: parent-child relationship (fille du projet)
        if (isDefect && ticketData.project_id) {
            logger.info(`[SERVICE] Creating DEFECT relationship: project_id=${ticketData.project_id}`);
            const relationQuery = `
                INSERT INTO core.rel_parent_child_tickets (
                    rel_parent_ticket_uuid,
                    rel_child_ticket_uuid,
                    dependency_code
                ) VALUES ($1, $2, 'DEFECT')
            `;
            await client.query(relationQuery, [ticketData.project_id, createdTicket.uuid]);
            logger.info('[SERVICE] DEFECT relationship with PROJECT inserted');
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

const getTicketTeam = async (ticketUuid) => {
    logger.info(`[SERVICE] Fetching team for ticket with UUID: ${ticketUuid}`);
    
    try {
        // Requête pour récupérer l'équipe assignée au ticket
        const query = `
            SELECT 
                g.uuid,
                g.groupe_name,
                s.first_name || ' ' || s.last_name AS supervisor_full_name,
                m.first_name || ' ' || m.last_name AS manager_full_name
            FROM core.rel_tickets_groups_persons rtgp
            JOIN configuration.groups g ON rtgp.rel_assigned_to_group = g.uuid
            LEFT JOIN configuration.persons s ON g.rel_supervisor = s.uuid
            LEFT JOIN configuration.persons m ON g.rel_manager = m.uuid
            WHERE rtgp.rel_ticket = $1
            AND rtgp.type = 'ASSIGNED'
        `;
        
        const result = await db.query(query, [ticketUuid]);
        
        // Si aucune équipe n'est trouvée, retourner un tableau vide
        if (result.rows.length === 0) {
            logger.info(`[SERVICE] No team found for ticket with UUID: ${ticketUuid}`);
            return [];
        }
        
        // Retourner l'équipe trouvée
        logger.info(`[SERVICE] Successfully retrieved team for ticket with UUID: ${ticketUuid}`);
        return result.rows;
    } catch (error) {
        logger.error('[SERVICE] Error in getTicketTeam:', error);
        throw error;
    }
};

const getProjectEpics = async (projectUuid) => {
    logger.info(`[SERVICE] Fetching epics for project with UUID: ${projectUuid}`);
    
    try {
        // Vérifier que le projet existe et est de type PROJECT
        const projectQuery = `
            SELECT uuid 
            FROM core.tickets 
            WHERE uuid = $1 AND ticket_type_code = 'PROJECT'
        `;
        
        const projectResult = await db.query(projectQuery, [projectUuid]);
        
        if (projectResult.rows.length === 0) {
            logger.error(`[SERVICE] No project found with UUID: ${projectUuid}`);
            throw new Error('Project not found');
        }
        
        // Requête pour récupérer les epics liés au projet
        const epicsQuery = `
            SELECT 
                t.uuid,
                t.title
            FROM core.tickets t
            JOIN core.rel_parent_child_tickets rpc ON t.uuid = rpc.rel_child_ticket_uuid
            WHERE rpc.rel_parent_ticket_uuid = $1
            AND rpc.dependency_code = 'EPIC'
            AND t.ticket_type_code = 'EPIC'
        `;
        
        const result = await db.query(epicsQuery, [projectUuid]);
        
        logger.info(`[SERVICE] Found ${result.rows.length} epics for project with UUID: ${projectUuid}`);
        return result.rows;
    } catch (error) {
        logger.error('[SERVICE] Error in getProjectEpics:', error);
        throw error;
    }
};

/**
 * Récupère les sprints liés à un projet spécifique
 * @param {string} projectUuid - UUID du projet
 * @returns {Promise<Array>} - Liste des sprints avec leur uuid et titre
 */
const getProjectSprints = async (projectUuid) => {
    logger.info(`[SERVICE] Fetching sprints for project with UUID: ${projectUuid}`);
    
    try {
        // Vérifier que le projet existe et est de type PROJECT
        const projectQuery = `
            SELECT uuid 
            FROM core.tickets 
            WHERE uuid = $1 AND ticket_type_code = 'PROJECT'
        `;
        
        const projectResult = await db.query(projectQuery, [projectUuid]);
        
        if (projectResult.rows.length === 0) {
            logger.error(`[SERVICE] No project found with UUID: ${projectUuid}`);
            throw new Error('Project not found');
        }
        
        // Requête pour récupérer les sprints liés au projet
        const sprintsQuery = `
            SELECT 
                t.uuid,
                t.title
            FROM core.tickets t
            JOIN core.rel_parent_child_tickets rpc ON t.uuid = rpc.rel_child_ticket_uuid
            WHERE rpc.rel_parent_ticket_uuid = $1
            AND rpc.dependency_code = 'SPRINT'
            AND t.ticket_type_code = 'SPRINT'
        `;
        
        const result = await db.query(sprintsQuery, [projectUuid]);
        
        logger.info(`[SERVICE] Found ${result.rows.length} sprints for project with UUID: ${projectUuid}`);
        return result.rows;
    } catch (error) {
        logger.error('[SERVICE] Error in getProjectSprints:', error);
        throw error;
    }
};

/**
 * Récupère les membres de l'équipe assignée à un ticket spécifique
 * @param {string} ticketUuid - UUID du ticket
 * @returns {Promise<Array>} - Liste des membres de l'équipe avec leurs informations
 */
const getTicketTeamMembers = async (ticketUuid) => {
    logger.info(`[SERVICE] Fetching team members for ticket with UUID: ${ticketUuid}`);
    
    try {
        // Requête pour récupérer tous les membres des groupes assignés au ticket
        const query = `
            SELECT DISTINCT
                p.uuid,
                p.first_name,
                p.last_name,
                p.first_name || ' ' || p.last_name as full_name,
                p.email,
                p.business_phone,
                p.business_mobile_phone,
                p.personal_mobile_phone,
                p.job_role,
                p.ref_entity_uuid,
                g.uuid as group_uuid,
                g.groupe_name as group_name
            FROM core.rel_tickets_groups_persons rtgp
            JOIN configuration.groups g ON rtgp.rel_assigned_to_group = g.uuid
            JOIN configuration.rel_persons_groups rpg ON g.uuid = rpg.rel_group
            JOIN configuration.persons p ON rpg.rel_member = p.uuid
            WHERE rtgp.rel_ticket = $1
            AND rtgp.type = 'ASSIGNED'
            AND (rtgp.ended_at IS NULL OR rtgp.ended_at > CURRENT_TIMESTAMP)
            ORDER BY p.last_name, p.first_name
        `;
        
        const result = await db.query(query, [ticketUuid]);
        
        // Si aucun membre n'est trouvé, retourner un tableau vide
        if (result.rows.length === 0) {
            logger.info(`[SERVICE] No team members found for ticket with UUID: ${ticketUuid}`);
            return [];
        }
        
        // Retourner les membres trouvés
        logger.info(`[SERVICE] Successfully retrieved ${result.rows.length} team members for ticket with UUID: ${ticketUuid}`);
        return result.rows;
    } catch (error) {
        logger.error('[SERVICE] Error in getTicketTeamMembers:', error);
        throw error;
    }
};

module.exports = {
    getTickets,
    createTicket,
    getTicketTeam,
    getTicketTeamMembers,
    getProjectEpics,
    getProjectSprints
};
