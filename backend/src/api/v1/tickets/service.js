const db = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Récupère les tickets avec possibilité d'ajouter des attributs spécifiques et des jointures
 * @param {string} lang - Code de langue pour les traductions
 * @param {string} ticket_type - Type de ticket à récupérer (optionnel)
 * @param {string} baseQuery - Partie de la requête SQL spécifique au type de ticket (optionnel)
 * @param {string} additionalJoins - Jointures supplémentaires spécifiques au type de ticket (optionnel)
 * @param {Array} additionalParams - Paramètres supplémentaires pour la requête SQL (optionnel)
 * @param {string} servicePrefix - Préfixe pour les logs (optionnel)
 * @returns {Promise<Array>} - Liste des tickets avec leurs attributs
 */
const getTickets = async (lang, ticket_type, baseQuery = '', additionalJoins = '', additionalParams = [], servicePrefix = '[SERVICE]') => {
    logger.info(`${servicePrefix} Fetching tickets${ticket_type ? ` of type ${ticket_type}` : ''}${lang ? ` with language ${lang}` : ''}`);
    
    const params = [lang || 'en', ...additionalParams];
    let typeCondition = '';
    let paramIndex = params.length + 1;
    
    if (ticket_type) {
        typeCondition = `AND t.ticket_type_code = $${paramIndex}`;
        params.push(ticket_type);
    }
    
    const query = `
        SELECT t.uuid,
            t.title,
            t.description,
            t.configuration_item_uuid,
            ci.name as configuration_item_name,
            t.created_at,
            t.updated_at,
            t.closed_at,
            p1.first_name || ' ' || p1.last_name as requested_by_name,
            p2.first_name || ' ' || p2.last_name as requested_for_name,
            p3.first_name || ' ' || p3.last_name as writer_name,
            COALESCE(ttt.label, tt.code) as ticket_type_label,
            COALESCE(tst.label, ts.code) as ticket_status_label,
            tt.code as ticket_type_code,
            ts.code as ticket_status_code,
            g.group_name as assigned_group_name,
            g.uuid as assigned_group_uuid,
            p4.first_name || ' ' || p4.last_name as assigned_person_name,
            p4.uuid as assigned_person_uuid
            ${baseQuery ? `,${baseQuery}` : ''}
        FROM core.tickets t
        LEFT JOIN configuration.persons p1 ON t.requested_by_uuid = p1.uuid
        LEFT JOIN configuration.persons p2 ON t.requested_for_uuid = p2.uuid
        JOIN configuration.persons p3 ON t.writer_uuid = p3.uuid
        JOIN configuration.ticket_types tt ON t.ticket_type_code = tt.code
        JOIN configuration.ticket_status ts ON t.ticket_status_code = ts.code AND ts.rel_ticket_type = tt.code 
        LEFT JOIN data.configuration_items ci ON t.configuration_item_uuid = ci.uuid 
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
        ${additionalJoins ? additionalJoins : ''}
        WHERE 1=1 ${typeCondition}
        ORDER BY t.created_at DESC
    `;
    
    try {
        const result = await db.query(query, params);
        return result.rows;
    } catch (error) {
        logger.error(`${servicePrefix} Error in getTickets:`, error);
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
        
        // Si c'est un incident, utiliser le service d'incident pour la création
        if (isIncident) {
            logger.info('[SERVICE] Using incidentService.createIncident for INCIDENT ticket');
            const incidentService = require('./incidentService');
            
            // Utiliser createIncident pour préparer les données
            const incidentData = incidentService.createIncident(ticketData);
            
            // Utiliser applyCreation pour créer le ticket
            return await applyCreation(
                ticketData,
                'INCIDENT',
                incidentData.standardFields,
                incidentData.assignmentFields,
                incidentData.extendedAttributesFields,
                incidentData.watchList,
                incidentData.parentChildRelations,
                incidentService.getIncidentById,
                '[INCIDENT SERVICE]'
            );
        }
        
        // Si c'est un problème, utiliser le service de problème pour la création
        if (isProblem) {
            logger.info('[SERVICE] Using problemService.createProblem for PROBLEM ticket');
            const problemService = require('./problemService');
            
            // Utiliser createProblem pour préparer les données
            const problemData = problemService.createProblem(ticketData);
            
            // Utiliser applyCreation pour créer le ticket
            return await applyCreation(
                ticketData,
                'PROBLEM',
                problemData.standardFields,
                problemData.assignmentFields,
                problemData.extendedAttributesFields,
                problemData.watchList,
                problemData.parentChildRelations,
                problemService.getProblemById,
                '[PROBLEM SERVICE]'
            );
        }
        
        // Si c'est un changement, utiliser le service de changement pour la création
        if (isChange) {
            logger.info('[SERVICE] Using changeService.createChange for CHANGE ticket');
            const changeService = require('./changeService');
            
            // Utiliser createChange pour préparer les données
            const changeData = changeService.createChange(ticketData);
            
            // Utiliser applyCreation pour créer le ticket
            return await applyCreation(
                ticketData,
                'CHANGE',
                changeData.standardFields,
                changeData.assignmentFields,
                changeData.extendedAttributesFields,
                changeData.watchList,
                changeData.parentChildRelations,
                changeService.getChangeById,
                '[CHANGE SERVICE]'
            );
        }
        
        // Si c'est un article de connaissance, utiliser le service de connaissance pour la création
        if (isKnowledge) {
            logger.info('[SERVICE] Using knowledgeService.createKnowledge for KNOWLEDGE ticket');
            const knowledgeService = require('./knowledgeService');
            
            // Utiliser createKnowledge pour préparer les données
            const knowledgeData = knowledgeService.createKnowledge(ticketData);
            
            // Utiliser applyCreation pour créer le ticket
            return await applyCreation(
                ticketData,
                'KNOWLEDGE',
                knowledgeData.standardFields,
                knowledgeData.assignmentFields,
                knowledgeData.extendedAttributesFields,
                knowledgeData.watchList,
                knowledgeData.parentChildRelations,
                knowledgeService.getKnowledgeById,
                '[KNOWLEDGE SERVICE]'
            );
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
        
        // Pour les problèmes, les projets, les sprints et les epics, requested_by_uuid = requested_for_uuid = le uuid du rédacteur
        let requestedByUuid = (isProblem || isProject || isSprint || isEpic) ? ticketData.writer_uuid : ticketData.requested_by_uuid;
        let requestedForUuid = (isProblem || isProject || isSprint || isEpic) ? ticketData.writer_uuid : ticketData.requested_for_uuid;
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
            Object.keys(coreExtendedAttributes).length > 0 ? coreExtendedAttributes : null,
            ticketData.user_extended_attributes || null,
            ticketData.closed_at || null
        ]);

        const createdTicket = ticketResult.rows[0];
        
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

// Les imports sont déplacés après l'export du module pour éviter les dépendances circulaires

/**
 * Récupère un ticket par son UUID
 * @param {string} uuid - UUID du ticket
 * @param {string} lang - Code de langue pour les traductions (fr, en, etc.)
 * @returns {Promise<Object>} - Détails du ticket
 */
const getTicketById = async (uuid, lang = 'en') => {
    logger.info(`[SERVICE] Fetching ticket with UUID: ${uuid} and language: ${lang}`);
    
    try {
        // D'abord, récupérer le type de ticket
        const ticketTypeQuery = `
            SELECT ticket_type_code
            FROM core.tickets
            WHERE uuid = $1
        `;
        
        const ticketTypeResult = await db.query(ticketTypeQuery, [uuid]);
        
        if (ticketTypeResult.rows.length === 0) {
            logger.warn(`[SERVICE] No ticket found with UUID: ${uuid}`);
            return null;
        }
        
        const ticketType = ticketTypeResult.rows[0].ticket_type_code;
        logger.info(`[SERVICE] Ticket type: ${ticketType}`);
        
        // Selon le type de ticket, importer dynamiquement le service approprié et appeler la fonction spécifique
        // Cette approche évite les dépendances circulaires
        let result = null;
        
        switch (ticketType) {
            case 'TASK':
                const taskService = require('./taskService');
                result = await taskService.getTaskById(uuid, lang);
                break;
            case 'INCIDENT':
                const incidentService = require('./incidentService');
                result = await incidentService.getIncidentById(uuid, lang);
                break;
            case 'PROBLEM':
                const problemService = require('./problemService');
                result = await problemService.getProblemById(uuid, lang);
                break;
            case 'CHANGE':
                const changeService = require('./changeService');
                result = await changeService.getChangeById(uuid, lang);
                break;
            case 'KNOWLEDGE':
                const knowledgeService = require('./knowledgeService');
                result = await knowledgeService.getKnowledgeById(uuid, lang);
                break;
            case 'DEFECT':
                const defectService = require('./defectService');
                result = await defectService.getDefectById(uuid, lang);
                break;
            case 'USER_STORY':
                const storyService = require('./storyService');
                result = await storyService.getStoryById(uuid, lang);
                break;
            case 'EPIC':
                const epicService = require('./epicService');
                result = await epicService.getEpicById(uuid, lang);
                break;
            case 'PROJECT':
                const projectService = require('./projectService');
                result = await projectService.getProjectById(uuid, lang);
                break;
            case 'SPRINT':
                const sprintService = require('./sprintService');
                result = await sprintService.getSprintById(uuid, lang);
                break;
            case 'REQUEST':
                // Pour REQUEST, utiliser la requête générique
                logger.info(`[SERVICE] Using generic query for REQUEST type`);
                break;
            default:
                logger.warn(`[SERVICE] Unsupported ticket type: ${ticketType}`);
                return null;
        }
        
        if (ticketType !== 'REQUEST') {
            return result;
        }
        
        // Requête générique pour REQUEST et types non reconnus
        const query = `
            SELECT 
                t.*,
                p1.first_name || ' ' || p1.last_name as requested_by_name,
                p2.first_name || ' ' || p2.last_name as requested_for_name,
                p3.first_name || ' ' || p3.last_name as writer_name,
                COALESCE(ttt.label, tt.code) as ticket_type_label,
                COALESCE(tst.label, ts.code) as ticket_status_label,
                tt.code as ticket_type_code,
                ts.code as ticket_status_code,
                
                -- Informations sur l'équipe assignée
                g.group_name as assigned_group_name,
                g.uuid as assigned_to_group,
                
                -- Informations sur la personne assignée
                p4.uuid as assigned_to_person,
                p4.first_name || ' ' || p4.last_name as assigned_person_name,
                
                -- Informations sur les observateurs (watchers)
                (
                    SELECT json_agg(json_build_object(
                        'uuid', w.uuid,
                        'person_uuid', p5.uuid,
                        'person_name', p5.first_name || ' ' || p5.last_name,
                        'created_at', w.created_at
                    ))
                    FROM core.rel_tickets_groups_persons w
                    JOIN configuration.persons p5 ON w.rel_assigned_to_person = p5.uuid
                    WHERE w.rel_ticket = t.uuid AND w.type = 'WATCHER' AND (w.ended_at IS NULL OR w.ended_at > NOW())
                ) as watchers
                
            FROM core.tickets t
            LEFT JOIN configuration.persons p1 ON t.requested_by_uuid = p1.uuid
            LEFT JOIN configuration.persons p2 ON t.requested_for_uuid = p2.uuid
            JOIN configuration.persons p3 ON t.writer_uuid = p3.uuid
            JOIN configuration.ticket_types tt ON t.ticket_type_code = tt.code
            JOIN configuration.ticket_status ts ON t.ticket_status_code = ts.code AND ts.rel_ticket_type = tt.code 
            LEFT JOIN translations.ticket_types_translation ttt ON tt.uuid = ttt.ticket_type_uuid 
                AND ttt.lang = $2
            LEFT JOIN translations.ticket_status_translation tst ON ts.uuid = tst.ticket_status_uuid 
                AND tst.lang = $2
                
            -- Jointure pour l'assignation (équipe et personne)
            LEFT JOIN (
                SELECT rel_ticket, rel_assigned_to_group, rel_assigned_to_person
                FROM core.rel_tickets_groups_persons
                WHERE type = 'ASSIGNED' AND (ended_at IS NULL OR ended_at > NOW())
            ) rtgp ON t.uuid = rtgp.rel_ticket
            LEFT JOIN configuration.groups g ON rtgp.rel_assigned_to_group = g.uuid
            LEFT JOIN configuration.persons p4 ON rtgp.rel_assigned_to_person = p4.uuid
            
            WHERE t.uuid = $1
        `;
        
        const genericResult = await db.query(query, [uuid, lang]);
        
        if (genericResult.rows.length === 0) {
            logger.warn(`[SERVICE] No ticket found with UUID: ${uuid}`);
            return null;
        }
        
        logger.info(`[SERVICE] Successfully retrieved ticket with UUID: ${uuid}`);
        return genericResult.rows[0];
    } catch (error) {
        logger.error(`[SERVICE] Error fetching ticket with UUID ${uuid}:`, error);
        throw error;
    }
};

const getTicketTeam = async (ticketUuid) => {
    logger.info(`[SERVICE] Fetching team for ticket with UUID: ${ticketUuid}`);
    
    try {
        // Requête pour récupérer l'équipe assignée au ticket
        const query = `
            SELECT 
                g.uuid,
                g.group_name,
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
                g.group_name as group_name
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

/**
 * Met à jour partiellement un ticket par son UUID
 * @param {string} uuid - UUID du ticket à mettre à jour
 * @param {Object} updateData - Données à mettre à jour
 * @returns {Promise<Object>} - Détails du ticket mis à jour
 */
const updateTicket = async (uuid, updateData) => {
    logger.info(`[SERVICE] Updating ticket with UUID: ${uuid}`);
    
    try {
        // Vérifier le type de ticket
        const ticketTypeQuery = 'SELECT ticket_type_code FROM core.tickets WHERE uuid = $1';
        const ticketTypeResult = await db.query(ticketTypeQuery, [uuid]);
        
        if (ticketTypeResult.rows.length === 0) {
            logger.error(`[SERVICE] No ticket found with UUID: ${uuid}`);
            return null;
        }
        
        const ticketType = ticketTypeResult.rows[0].ticket_type_code;
        logger.info(`[SERVICE] Ticket type for UUID ${uuid}: ${ticketType}`);
        
        // Importer les services nécessaires
        const taskService = require('./taskService');
        const incidentService = require('./incidentService');
        
        // Utiliser le service approprié selon le type de ticket
        let updatedTicket = null;
        
        // TASK
        if (ticketType === 'TASK') {
            logger.info(`[SERVICE] Calling taskService.updateTask for UUID: ${uuid}`);
            updatedTicket = await taskService.updateTask(uuid, updateData);
        }
        // INCIDENT
        else if (ticketType === 'INCIDENT') {
            logger.info(`[SERVICE] Calling incidentService.updateIncident for UUID: ${uuid}`);
            updatedTicket = await incidentService.updateIncident(uuid, updateData);
        }
        // CHANGE
        else if (ticketType === 'CHANGE') {
            logger.info(`[SERVICE] Calling changeService.updateChange for UUID: ${uuid}`);
            const changeService = require('./changeService');
            updatedTicket = await changeService.updateChange(uuid, updateData);
        }
        // DEFECT
        else if (ticketType === 'DEFECT') {
            logger.info(`[SERVICE] Calling defectService.updateDefect for UUID: ${uuid}`);
            const defectService = require('./defectService');
            updatedTicket = await defectService.updateDefect(uuid, updateData);
        }
        // EPIC
        else if (ticketType === 'EPIC') {
            logger.info(`[SERVICE] Calling epicService.updateEpic for UUID: ${uuid}`);
            const epicService = require('./epicService');
            updatedTicket = await epicService.updateEpic(uuid, updateData);
        }
        // KNOWLEDGE
        else if (ticketType === 'KNOWLEDGE') {
            logger.info(`[SERVICE] Calling knowledgeService.updateKnowledge for UUID: ${uuid}`);
            const knowledgeService = require('./knowledgeService');
            updatedTicket = await knowledgeService.updateKnowledge(uuid, updateData);
        }
        // PROBLEM
        else if (ticketType === 'PROBLEM') {
            logger.info(`[SERVICE] Calling problemService.updateProblem for UUID: ${uuid}`);
            const problemService = require('./problemService');
            updatedTicket = await problemService.updateProblem(uuid, updateData);
        }
        // PROJECT
        else if (ticketType === 'PROJECT') {
            logger.info(`[SERVICE] Calling projectService.updateProject for UUID: ${uuid}`);
            const projectService = require('./projectService');
            updatedTicket = await projectService.updateProject(uuid, updateData);
        }
        // SPRINT
        else if (ticketType === 'SPRINT') {
            logger.info(`[SERVICE] Calling sprintService.updateSprint for UUID: ${uuid}`);
            const sprintService = require('./sprintService');
            updatedTicket = await sprintService.updateSprint(uuid, updateData);
        }
        // STORY
        else if (ticketType === 'STORY') {
            logger.info(`[SERVICE] Calling storyService.updateStory for UUID: ${uuid}`);
            const storyService = require('./storyService');
            updatedTicket = await storyService.updateStory(uuid, updateData);
        }
        // Type de ticket non pris en charge
        else {
            logger.error(`[SERVICE] PATCH not implemented for ticket type: ${ticketType}`);
            throw new Error(`Update not implemented for ticket type: ${ticketType}`);
        }
        
        return updatedTicket;
    } catch (error) {
        logger.error(`[SERVICE] Error updating ticket with UUID ${uuid}:`, error);
        throw error;
    }
};

// Ajoute des watchers à un ticket spécifique
// @param {string} ticketUuid - UUID du ticket
// @param {Array<string>} watchList - Liste des UUIDs des personnes à ajouter comme watchers
// @returns {Promise<Object>} - Résultat de l'opération
const addWatchers = async (ticketUuid, watchList) => {
    logger.info(`[SERVICE] Adding ${watchList.length} watchers to ticket ${ticketUuid}`);
    
    // Vérifier que le ticket existe
    const ticketQuery = 'SELECT uuid FROM core.tickets WHERE uuid = $1';
    const ticketResult = await db.query(ticketQuery, [ticketUuid]);
    
    if (ticketResult.rows.length === 0) {
        logger.error(`[SERVICE] Ticket with UUID ${ticketUuid} not found`);
        throw new Error('Ticket not found');
    }
    
    // Préparer l'insertion par lots pour les watchers
    const watcherValues = watchList.map((personUuid, index) => {
        return `($1, NULL, $${index + 2}, 'WATCHER')`;
    }).join(', ');
    
    const watcherQuery = `
        INSERT INTO core.rel_tickets_groups_persons (
            rel_ticket,
            rel_assigned_to_group,
            rel_assigned_to_person,
            type
        ) VALUES ${watcherValues}
        RETURNING uuid
    `;
    
    const watcherParams = [ticketUuid, ...watchList];
    const result = await db.query(watcherQuery, watcherParams);
    
    logger.info(`[SERVICE] Successfully added ${result.rows.length} watchers to ticket ${ticketUuid}`);
    
    return { 
        success: true, 
        message: `${result.rows.length} watchers added to ticket`, 
        data: result.rows 
    };
};

// Supprime un watcher d'un ticket spécifique (en mettant à jour ended_at)
// @param {string} ticketUuid - UUID du ticket
// @param {string} userUuid - UUID de la personne à retirer des watchers
// @returns {Promise<Object>} - Résultat de l'opération
const removeWatcher = async (ticketUuid, userUuid) => {
    logger.info(`[SERVICE] Removing watcher ${userUuid} from ticket ${ticketUuid}`);
    
    // Vérifier que le ticket existe
    const ticketQuery = 'SELECT uuid FROM core.tickets WHERE uuid = $1';
    const ticketResult = await db.query(ticketQuery, [ticketUuid]);
    
    if (ticketResult.rows.length === 0) {
        logger.error(`[SERVICE] Ticket with UUID ${ticketUuid} not found`);
        throw new Error('Ticket not found');
    }
    
    // Mettre à jour la date de fin pour le watcher (ne pas supprimer la ligne)
    const updateQuery = `
        UPDATE core.rel_tickets_groups_persons
        SET ended_at = CURRENT_TIMESTAMP
        WHERE rel_ticket = $1
        AND rel_assigned_to_person = $2
        AND type = 'WATCHER'
        AND ended_at IS NULL
        RETURNING uuid
    `;
    
    const result = await db.query(updateQuery, [ticketUuid, userUuid]);
    
    if (result.rows.length === 0) {
        logger.warn(`[SERVICE] Watcher ${userUuid} not found for ticket ${ticketUuid} or already removed`);
        return { 
            success: false, 
            message: 'Watcher not found or already removed' 
        };
    }
    
    logger.info(`[SERVICE] Successfully removed watcher ${userUuid} from ticket ${ticketUuid}`);
    
    return { 
        success: true, 
        message: 'Watcher removed from ticket', 
        data: result.rows[0] 
    };
};

/**
 * Ajoute des relations parent-enfant entre tickets
 * @param {string} parentUuid - UUID du ticket parent
 * @param {string} dependencyType - Type de dépendance (ex: DEPENDENCY_CODE)
 * @param {Array<string>} childrenUuids - Liste des UUIDs des tickets enfants
 * @returns {Promise<Object>} - Résultat de l'opération
 */
const addChildrenTickets = async (parentUuid, dependencyType, childrenUuids) => {
    logger.info(`[SERVICE] Adding ${childrenUuids.length} child tickets to parent ${parentUuid} with dependency type ${dependencyType}`);
    
    // Start a transaction
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        // Préparer la requête pour l'insertion multiple
        const insertPromises = childrenUuids.map(childUuid => {
            const relationQuery = `
                INSERT INTO core.rel_parent_child_tickets (
                    rel_parent_ticket_uuid,
                    rel_child_ticket_uuid,
                    dependency_code
                ) VALUES ($1, $2, $3)
                ON CONFLICT (rel_parent_ticket_uuid, rel_child_ticket_uuid) 
                DO UPDATE SET dependency_code = $3, updated_at = NOW()
            `;
            
            return client.query(relationQuery, [parentUuid, childUuid, dependencyType]);
        });
        
        // Exécuter toutes les insertions
        await Promise.all(insertPromises);
        
        await client.query('COMMIT');
        
        logger.info(`[SERVICE] Successfully added ${childrenUuids.length} child tickets to parent ${parentUuid}`);
        
        return {
            success: true,
            parentUuid,
            dependencyType,
            childrenCount: childrenUuids.length
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('[SERVICE] Error adding children tickets:', error);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Supprime une relation parent-enfant entre tickets (en mettant à jour ended_at)
 * @param {string} parentUuid - UUID du ticket parent
 * @param {string} childUuid - UUID du ticket enfant
 * @returns {Promise<Object>} - Résultat de l'opération
 */
const removeChildTicket = async (parentUuid, childUuid) => {
    logger.info(`[SERVICE] Removing child ticket ${childUuid} from parent ${parentUuid}`);
    
    // Start a transaction
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        // Mettre à jour la relation en ajoutant un timestamp dans ended_at
        const updateQuery = `
            UPDATE core.rel_parent_child_tickets
            SET ended_at = NOW(), updated_at = NOW()
            WHERE rel_parent_ticket_uuid = $1 
            AND rel_child_ticket_uuid = $2
            AND ended_at IS NULL
            RETURNING *
        `;
        
        const result = await client.query(updateQuery, [parentUuid, childUuid]);
        
        await client.query('COMMIT');
        
        if (result.rowCount === 0) {
            logger.warn(`[SERVICE] No active relation found between parent ${parentUuid} and child ${childUuid}`);
            return {
                success: false,
                message: 'No active relation found between parent and child tickets'
            };
        }
        
        logger.info(`[SERVICE] Successfully removed child ticket ${childUuid} from parent ${parentUuid}`);
        
        return {
            success: true,
            message: 'Child ticket relation removed',
            data: result.rows[0]
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('[SERVICE] Error removing child ticket relation:', error);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Fonction générique pour appliquer des mises à jour à un ticket
 * @param {string} uuid - UUID du ticket à mettre à jour
 * @param {Object} updateData - Données à mettre à jour
 * @param {string} ticketType - Type de ticket (ex: 'INCIDENT', 'PROBLEM', 'TASK')
 * @param {Array} standardFields - Liste des champs standards pour ce type de ticket
 * @param {Array} assignmentFields - Liste des champs d'assignation pour ce type de ticket
 * @param {Array} extendedAttributesFields - Liste des attributs étendus pour ce type de ticket (optionnel)
 * @param {Function} getTicketById - Fonction pour récupérer le ticket par son ID
 * @param {string} servicePrefix - Préfixe pour les logs (ex: '[INCIDENT SERVICE]')
 * @returns {Promise<Object>} - Détails du ticket mis à jour
 */
const applyUpdate = async (uuid, updateData, ticketType, standardFields, assignmentFields, extendedAttributesFields, getTicketById, servicePrefix) => {
    try {
        // Vérifier si le ticket existe
        const checkQuery = `
            SELECT uuid FROM core.tickets 
            WHERE uuid = $1 AND ticket_type_code = $2
        `;
        const checkResult = await db.query(checkQuery, [uuid, ticketType]);
        
        if (checkResult.rows.length === 0) {
            logger.error(`${servicePrefix} No ${ticketType.toLowerCase()} found with UUID: ${uuid}`);
            return null;
        }
        
        // Filtrer les champs standards à mettre à jour
        const standardFieldsToUpdate = Object.keys(updateData).filter(field => 
            standardFields.includes(field)
        );
        
        // Filtrer les champs d'assignation à mettre à jour
        const assignmentFieldsToUpdate = Object.keys(updateData).filter(field => 
            assignmentFields.includes(field)
        );
        
        // Filtrer les attributs étendus à mettre à jour (si applicable)
        let extendedAttributesToUpdate = [];
        if (extendedAttributesFields && extendedAttributesFields.length > 0) {
            extendedAttributesToUpdate = Object.keys(updateData).filter(field => 
                extendedAttributesFields.includes(field)
            );
        }
        
        // Vérifier s'il y a des champs à mettre à jour
        if (standardFieldsToUpdate.length === 0 && assignmentFieldsToUpdate.length === 0 && extendedAttributesToUpdate.length === 0) {
            logger.warn(`${servicePrefix} No valid fields to update for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
            return await getTicketById(uuid, 'en'); // Retourner le ticket sans modifications
        }
        
        // Ajouter des logs pour voir les champs à mettre à jour
        logger.info(`${servicePrefix} Updating ${ticketType.toLowerCase()} with UUID: ${uuid}`);
        logger.info(`${servicePrefix} Standard fields to update: ${JSON.stringify(standardFieldsToUpdate)}`);
        logger.info(`${servicePrefix} Assignment fields to update: ${JSON.stringify(assignmentFieldsToUpdate)}`);
        if (extendedAttributesFields && extendedAttributesFields.length > 0) {
            logger.info(`${servicePrefix} Extended attributes to update: ${JSON.stringify(extendedAttributesToUpdate)}`);
        }
        
        // Utiliser une transaction pour garantir l'intégrité des données
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');
            
            let updatedTicket = null;
            
            // Cas 1: Mise à jour des champs standards
            if (standardFieldsToUpdate.length > 0) {
                let setClause = standardFieldsToUpdate.map((field, index) => 
                    `${field} = $${index + 2}`
                ).join(', ');
                
                // Ajouter la mise à jour de updated_at
                setClause += ', updated_at = CURRENT_TIMESTAMP';
                
                const updateQuery = `
                    UPDATE core.tickets
                    SET ${setClause}
                    WHERE uuid = $1
                    RETURNING *
                `;
                
                // Préparer les valeurs pour la requête
                const values = [uuid];
                standardFieldsToUpdate.forEach(field => {
                    values.push(updateData[field]);
                });
                
                logger.info(`${servicePrefix} Executing standard fields update query for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
                const result = await client.query(updateQuery, values);
                
                if (result.rows.length === 0) {
                    logger.error(`${servicePrefix} Failed to update standard fields for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
                    throw new Error('Failed to update standard fields');
                }
                
                updatedTicket = result.rows[0];
                logger.info(`${servicePrefix} Successfully updated standard fields for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
            }
            
            // Cas 2: Mise à jour des attributs étendus (si applicable)
            if (extendedAttributesFields && extendedAttributesToUpdate.length > 0) {
                // Approche optimisée : utiliser jsonb_set pour mettre à jour chaque attribut individuellement
                let setClause = 'core_extended_attributes = ';
                let params = [uuid]; // Premier paramètre est toujours l'UUID
                let paramIndex = 2;
                
                // Construire une chaîne de jsonb_set imbriqués pour mettre à jour tous les attributs en une seule requête
                extendedAttributesToUpdate.forEach((attr, index) => {
                    // Premier attribut : initialiser avec COALESCE pour gérer le cas où core_extended_attributes est NULL
                    if (index === 0) {
                        setClause += `jsonb_set(
                            COALESCE(core_extended_attributes, '{}'::jsonb),
                            '{${attr}}',
                            $${paramIndex}::jsonb,
                            true
                        )`;
                    } else {
                        // Pour les attributs suivants, imbriquer les appels jsonb_set
                        setClause = `jsonb_set(
                            ${setClause},
                            '{${attr}}',
                            $${paramIndex}::jsonb,
                            true
                        )`;
                    }
                    
                    // Ajouter la valeur du paramètre
                    params.push(JSON.stringify(updateData[attr]));
                    paramIndex++;
                });
                
                // Construire la requête SQL complète
                const updateExtendedQuery = `
                    UPDATE core.tickets
                    SET ${setClause},
                        updated_at = CURRENT_TIMESTAMP
                    WHERE uuid = $1
                    RETURNING *
                `;
                
                logger.info(`${servicePrefix} Executing optimized extended attributes update query for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
                const result = await client.query(updateExtendedQuery, params);
                
                if (result.rows.length === 0) {
                    logger.error(`${servicePrefix} Failed to update extended attributes for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
                    throw new Error('Failed to update extended attributes');
                }
                
                updatedTicket = result.rows[0];
                logger.info(`${servicePrefix} Successfully updated extended attributes for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
            }
            
            // Cas 3: Mise à jour des champs d'assignation
            if (assignmentFieldsToUpdate.length > 0) {
                // Déterminer le type de mise à jour
                const isUpdatingGroup = assignmentFieldsToUpdate.includes('assigned_to_group');
                const isUpdatingPerson = assignmentFieldsToUpdate.includes('assigned_to_person');
                
                // Cas A: Si on met à jour uniquement rel_assigned_to_person
                if (isUpdatingPerson && !isUpdatingGroup) {
                    // Récupérer l'assignation courante
                    const getCurrentAssignmentQuery = `
                        SELECT uuid, rel_assigned_to_group
                        FROM core.rel_tickets_groups_persons
                        WHERE rel_ticket = $1 
                          AND type = 'ASSIGNED'
                          AND ended_at IS NULL
                    `;
                    
                    const currentAssignment = await client.query(getCurrentAssignmentQuery, [uuid]);
                    
                    if (currentAssignment.rows.length === 0) {
                        logger.warn(`${servicePrefix} No current assignment found for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
                        
                        // Si pas d'assignation existante, on ne peut pas mettre à jour uniquement la personne
                        logger.error(`${servicePrefix} Cannot update only person assignment without an existing group assignment for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
                        throw new Error('Cannot update only person assignment without an existing group assignment');
                    }
                    
                    // Mettre à jour l'assignation existante
                    const updateAssignmentQuery = `
                        UPDATE core.rel_tickets_groups_persons
                        SET rel_assigned_to_person = $1, updated_at = CURRENT_TIMESTAMP
                        WHERE uuid = $2
                    `;
                    
                    logger.info(`${servicePrefix} Updating person assignment for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
                    await client.query(updateAssignmentQuery, [
                        updateData.assigned_to_person,
                        currentAssignment.rows[0].uuid
                    ]);
                    
                    logger.info(`${servicePrefix} Successfully updated person assignment for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
                }
                // Cas B: Si on met à jour le groupe (avec ou sans personne)
                else if (isUpdatingGroup) {
                    // Récupérer l'assignation courante
                    const getCurrentAssignmentQuery = `
                        SELECT uuid, rel_assigned_to_group, rel_assigned_to_person
                        FROM core.rel_tickets_groups_persons
                        WHERE rel_ticket = $1 
                          AND type = 'ASSIGNED'
                          AND ended_at IS NULL
                    `;
                    
                    const currentAssignment = await client.query(getCurrentAssignmentQuery, [uuid]);
                    
                    // Si une personne est actuellement assignée, vérifier si elle appartient au nouveau groupe
                    let personInNewGroup = false;
                    if (currentAssignment.rows.length > 0 && currentAssignment.rows[0].rel_assigned_to_person) {
                        const currentPersonId = currentAssignment.rows[0].rel_assigned_to_person;
                        
                        // Vérifier si la personne appartient au nouveau groupe
                        const checkPersonInGroupQuery = `
                            SELECT uuid 
                            FROM configuration.rel_persons_groups 
                            WHERE rel_member = $1 AND rel_group = $2
                        `;
                        
                        const personInGroupResult = await client.query(checkPersonInGroupQuery, [
                            currentPersonId,
                            updateData.assigned_to_group
                        ]);
                        
                        personInNewGroup = personInGroupResult.rows.length > 0;
                    }
                    
                    // Cas B1: Si la personne n'appartient pas au nouveau groupe, terminer l'assignation et en créer une nouvelle
                    if (!personInNewGroup) {
                        // Terminer l'assignation courante
                        const endCurrentAssignmentQuery = `
                            UPDATE core.rel_tickets_groups_persons
                            SET ended_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                            WHERE rel_ticket = $1 
                              AND type = 'ASSIGNED'
                              AND ended_at IS NULL
                        `;
                        
                        logger.info(`${servicePrefix} Ending current assignment for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
                        await client.query(endCurrentAssignmentQuery, [uuid]);
                        
                        // Créer une nouvelle assignation
                        const createAssignmentQuery = `
                            INSERT INTO core.rel_tickets_groups_persons (
                                rel_ticket,
                                rel_assigned_to_group,
                                rel_assigned_to_person,
                                type
                            ) VALUES ($1, $2, $3, 'ASSIGNED')
                        `;
                        
                        logger.info(`${servicePrefix} Creating new assignment for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
                        await client.query(createAssignmentQuery, [
                            uuid,
                            updateData.assigned_to_group,
                            isUpdatingPerson ? updateData.assigned_to_person : null
                        ]);
                        
                        logger.info(`${servicePrefix} Successfully created new assignment for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
                    }
                    // Cas B2: Si la personne appartient au nouveau groupe, mettre à jour l'assignation courante
                    else {
                        const updateAssignmentQuery = `
                            UPDATE core.rel_tickets_groups_persons
                            SET rel_assigned_to_group = $1, updated_at = CURRENT_TIMESTAMP
                            WHERE uuid = $2
                        `;
                        
                        logger.info(`${servicePrefix} Updating group assignment for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
                        await client.query(updateAssignmentQuery, [
                            updateData.assigned_to_group,
                            currentAssignment.rows[0].uuid
                        ]);
                        
                        // Si on met à jour aussi la personne
                        if (isUpdatingPerson) {
                            const updatePersonQuery = `
                                UPDATE core.rel_tickets_groups_persons
                                SET rel_assigned_to_person = $1, updated_at = CURRENT_TIMESTAMP
                                WHERE uuid = $2
                            `;
                            
                            logger.info(`${servicePrefix} Updating person assignment for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
                            await client.query(updatePersonQuery, [
                                updateData.assigned_to_person,
                                currentAssignment.rows[0].uuid
                            ]);
                        }
                        
                        logger.info(`${servicePrefix} Successfully updated assignment for ${ticketType.toLowerCase()} with UUID: ${uuid}`);
                    }
                }
            }
            
            await client.query('COMMIT');
            
            // Récupérer le ticket mis à jour avec toutes ses informations
            logger.info(`${servicePrefix} Retrieving updated ${ticketType.toLowerCase()} with UUID: ${uuid}`);
            return await getTicketById(uuid, 'en');
            
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error(`${servicePrefix} Error in applyUpdate for ${ticketType.toLowerCase()} with UUID ${uuid}:`, error);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        logger.error(`${servicePrefix} Error in applyUpdate:`, error);
        throw error;
    }
};

/**
 * Fonction générique pour appliquer la création d'un ticket
 * @param {Object} ticketData - Données pour la création du ticket
 * @param {string} ticketType - Type de ticket (ex: 'INCIDENT', 'PROBLEM', 'TASK')
 * @param {Object} standardFields - Objet des champs standards pour ce type de ticket
 * @param {Object} assignmentFields - Objet des champs d'assignation pour ce type de ticket
 * @param {Object} extendedAttributesFields - Objet des attributs étendus pour ce type de ticket (optionnel)
 * @param {Array} watchList - Liste des UUIDs des observateurs à ajouter (optionnel)
 * @param {Array} parentChildRelations - Liste des relations parent-enfant à créer (optionnel)
 * @param {Function} getTicketById - Fonction pour récupérer le ticket par son ID
 * @param {string} servicePrefix - Préfixe pour les logs (ex: '[INCIDENT SERVICE]')
 * @returns {Promise<Object>} - Détails du ticket créé
 */
const applyCreation = async (ticketData, ticketType, standardFields, assignmentFields, extendedAttributesFields, watchList, parentChildRelations, getTicketById, servicePrefix) => {
    logger.info(`${servicePrefix} [applyCreation] Creating new ${ticketType.toLowerCase()}`);
    
    // Utiliser une transaction pour garantir l'intégrité des données
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        // Étape 1: Insérer les données de base du ticket
        const insertTicketQuery = `
            INSERT INTO core.tickets (
                title, description, configuration_item_uuid, ticket_type_code,
                ticket_status_code, requested_by_uuid, requested_for_uuid, writer_uuid,
                core_extended_attributes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;
        
        const ticketValues = [
            standardFields.title,
            standardFields.description,
            standardFields.configuration_item_uuid,
            ticketType,
            standardFields.ticket_status_code,
            standardFields.requested_by_uuid,
            standardFields.requested_for_uuid,
            standardFields.writer_uuid,
            extendedAttributesFields || {}
        ];
        
        logger.info(`${servicePrefix} [applyCreation] Executing ticket creation query`);
        const ticketResult = await client.query(insertTicketQuery, ticketValues);
        
        if (ticketResult.rows.length === 0) {
            throw new Error(`Failed to create ${ticketType.toLowerCase()}`);
        }
        
        const newTicket = ticketResult.rows[0];
        logger.info(`${servicePrefix} [applyCreation] Successfully created ${ticketType.toLowerCase()} with UUID: ${newTicket.uuid}`);
        
        // Étape 2: Gérer l'assignation si nécessaire
        if (assignmentFields && (assignmentFields.assigned_to_group || assignmentFields.assigned_to_person)) {
            const insertAssignmentQuery = `
                INSERT INTO core.rel_tickets_groups_persons (
                    rel_ticket, rel_assigned_to_group, rel_assigned_to_person, type
                ) VALUES ($1, $2, $3, 'ASSIGNED')
                RETURNING *
            `;
            
            const assignmentValues = [
                newTicket.uuid,
                assignmentFields.assigned_to_group,
                assignmentFields.assigned_to_person
            ];
            
            logger.info(`${servicePrefix} [applyCreation] Creating assignment for ${ticketType.toLowerCase()} with UUID: ${newTicket.uuid}`);
            await client.query(insertAssignmentQuery, assignmentValues);
            logger.info(`${servicePrefix} [applyCreation] Successfully created assignment for ${ticketType.toLowerCase()} with UUID: ${newTicket.uuid}`);
        }
        
        // Étape 3: Gérer les observateurs (watchers) si fournis
        if (watchList && Array.isArray(watchList) && watchList.length > 0) {
            logger.info(`${servicePrefix} [applyCreation] Processing ${watchList.length} watchers for ${ticketType.toLowerCase()} with UUID: ${newTicket.uuid}`);
            
            // Préparer l'insertion par lot pour les observateurs
            const watcherValues = watchList.map((personUuid, index) => {
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
            
            const watcherParams = [newTicket.uuid, ...watchList];
            await client.query(watcherQuery, watcherParams);
            logger.info(`${servicePrefix} [applyCreation] Successfully added ${watchList.length} watchers for ${ticketType.toLowerCase()} with UUID: ${newTicket.uuid}`);
        }
        
        // Étape 4: Gérer les relations parent-enfant si présentes
        if (parentChildRelations && Array.isArray(parentChildRelations) && parentChildRelations.length > 0) {
            logger.info(`${servicePrefix} [applyCreation] Processing ${parentChildRelations.length} parent-child relations for ${ticketType.toLowerCase()} with UUID: ${newTicket.uuid}`);
            
            for (const relation of parentChildRelations) {
                const relationQuery = `
                    INSERT INTO core.rel_parent_child_tickets (
                        rel_parent_ticket_uuid,
                        rel_child_ticket_uuid,
                        dependency_code
                    ) VALUES ($1, $2, $3)
                    ON CONFLICT (rel_parent_ticket_uuid, rel_child_ticket_uuid) 
                    DO UPDATE SET dependency_code = $3, updated_at = NOW()
                `;
                
                await client.query(relationQuery, [newTicket.uuid, relation.childUuid, relation.dependencyCode]);
                logger.info(`${servicePrefix} [applyCreation] Added parent-child relation: ${newTicket.uuid} -> ${relation.childUuid} (${relation.dependencyCode})`);
            }
        }
        
        // Étape 5: Si c'est un article de connaissance, créer la version initiale
        if (ticketType === 'KNOWLEDGE') {
            logger.info(`${servicePrefix} [applyCreation] Creating initial knowledge article version for ticket UUID: ${newTicket.uuid}`);
            
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
            const fullArticle = {
                ...newTicket,
                extended_attributes: extendedAttributesFields || {}
            };
            
            // Insérer la version initiale (V1) de l'article
            const versionResult = await client.query(versionQuery, [
                newTicket.uuid,                    // rel_article_uuid
                1,                                  // version_number (première version)
                'CREATION',                         // change_type
                'Initial creation of knowledge article', // change_summary
                fullArticle,                        // full_article (JSONB)
                standardFields.writer_uuid          // created_by
            ]);
            
            logger.info(`${servicePrefix} [applyCreation] Created knowledge article version with UUID: ${versionResult.rows[0].uuid}`);
        }
        
        // Valider la transaction
        await client.query('COMMIT');
        logger.info(`${servicePrefix} [applyCreation] Transaction committed successfully for ${ticketType.toLowerCase()} creation with UUID: ${newTicket.uuid}`);
        
        // Récupérer le ticket complet avec toutes ses relations
        return await getTicketById(newTicket.uuid, 'en');
    } catch (error) {
        // En cas d'erreur, annuler la transaction
        await client.query('ROLLBACK');
        logger.error(`${servicePrefix} [applyCreation] Error creating ${ticketType.toLowerCase()}: ${error.message}`);
        throw error;
    } finally {
        // Libérer le client
        client.release();
    }
};

module.exports = {
    getTickets,
    createTicket,
    getTicketTeam,
    getTicketById,
    getProjectEpics,
    getProjectSprints,
    getTicketTeamMembers,
    updateTicket,
    addWatchers,
    removeWatcher,
    addChildrenTickets,
    removeChildTicket,
    applyUpdate,
    applyCreation
};
