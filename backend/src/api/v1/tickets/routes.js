const express = require('express');
const router = express.Router();
const ticketController = require('./controller');
const { validateGetTickets, validateCreateTicket, validateUpdateTicket, validateAddWatchers, validateRemoveWatcher } = require('./validation');
const logger = require('../../../config/logger');

router.get('/', validateGetTickets, (req, res, next) => {
    logger.info('[ROUTES] Handling GET /tickets request');
    ticketController.getTickets(req, res);
});

router.post('/', validateCreateTicket, (req, res, next) => {
    // Vérifier si le type de ticket est INCIDENT depuis les query params
    const isIncidentFromQuery = req.query.ticket_types === 'INCIDENT';
    
    // Vérifier si le type de ticket est INCIDENT depuis le body
    const isIncidentFromBody = req.body && req.body.ticket_type_code === 'INCIDENT';
    
    // Vérifier si le type de ticket est PROBLEM depuis les query params
    const isProblemFromQuery = req.query.ticket_types === 'PROBLEM';
    
    // Vérifier si le type de ticket est PROBLEM depuis le body
    const isProblemFromBody = req.body && req.body.ticket_type_code === 'PROBLEM';
    
    // Vérifier si le type de ticket est CHANGE depuis les query params
    const isChangeFromQuery = req.query.ticket_types === 'CHANGE';
    
    // Vérifier si le type de ticket est CHANGE depuis le body
    const isChangeFromBody = req.body && req.body.ticket_type_code === 'CHANGE';
    
    // Vérifier si le type de ticket est KNOWLEDGE depuis les query params
    const isKnowledgeFromQuery = req.query.ticket_types === 'KNOWLEDGE';
    
    // Vérifier si le type de ticket est KNOWLEDGE depuis le body
    const isKnowledgeFromBody = req.body && req.body.ticket_type_code === 'KNOWLEDGE';
    
    // Vérifier si le type de ticket est PROJECT depuis les query params
    const isProjectFromQuery = req.query.ticket_types === 'PROJECT';
    
    // Vérifier si le type de ticket est PROJECT depuis le body
    const isProjectFromBody = req.body && req.body.ticket_type_code === 'PROJECT';
    
    // Vérifier si le type de ticket est SPRINT depuis les query params
    const isSprintFromQuery = req.query.ticket_type === 'SPRINT';
    
    // Vérifier si le type de ticket est SPRINT depuis le body
    const isSprintFromBody = req.body && req.body.ticket_type_code === 'SPRINT';
    
    // Vérifier si le type de ticket est EPIC depuis les query params
    const isEpicFromQuery = req.query.ticket_type === 'EPIC';
    
    // Vérifier si le type de ticket est EPIC depuis le body
    const isEpicFromBody = req.body && req.body.ticket_type_code === 'EPIC';

    // Vérifier si le type de ticket est USER_STORY depuis les query params
    const isUserStoryFromQuery = req.query.ticket_type === 'USER_STORY';
    // Vérifier si le type de ticket est USER_STORY depuis le body
    const isUserStoryFromBody = req.body && req.body.ticket_type_code === 'USER_STORY';
    
    // Vérifier si le type de ticket est DEFECT depuis les query params
    const isDefectFromQuery = req.query.ticket_type === 'DEFECT';
    // Vérifier si le type de ticket est DEFECT depuis le body
    const isDefectFromBody = req.body && req.body.ticket_type_code === 'DEFECT';
    
    // Log détaillé pour le debugging
    logger.info(`[ROUTES] Handling POST /tickets request${isIncidentFromQuery ? ' for INCIDENT type (from query)' : ''}${isIncidentFromBody ? ' for INCIDENT type (from body)' : ''}${isProblemFromQuery ? ' for PROBLEM type (from query)' : ''}${isProblemFromBody ? ' for PROBLEM type (from body)' : ''}${isChangeFromQuery ? ' for CHANGE type (from query)' : ''}${isChangeFromBody ? ' for CHANGE type (from body)' : ''}${isKnowledgeFromQuery ? ' for KNOWLEDGE type (from query)' : ''}${isKnowledgeFromBody ? ' for KNOWLEDGE type (from body)' : ''}${isProjectFromQuery ? ' for PROJECT type (from query)' : ''}${isProjectFromBody ? ' for PROJECT type (from body)' : ''}${isSprintFromQuery ? ' for SPRINT type (from query)' : ''}${isSprintFromBody ? ' for SPRINT type (from body)' : ''}${isEpicFromQuery ? ' for EPIC type (from query)' : ''}${isEpicFromBody ? ' for EPIC type (from body)' : ''}${isUserStoryFromQuery ? ' for USER_STORY type (from query)' : ''}${isUserStoryFromBody ? ' for USER_STORY type (from body)' : ''}${isDefectFromQuery ? ' for DEFECT type (from query)' : ''}${isDefectFromBody ? ' for DEFECT type (from body)' : ''}`);
    
    ticketController.createTicket(req, res);
});

// Route pour récupérer un ticket spécifique par son UUID
router.get('/:uuid', (req, res, next) => {
    logger.info(`[ROUTES] Handling GET /tickets/${req.params.uuid} request`);
    ticketController.getTicketById(req, res);
});

// Route pour récupérer l'équipe assignée à un ticket
router.get('/:uuid/team', (req, res, next) => {
    logger.info(`[ROUTES] Handling GET /tickets/${req.params.uuid}/team request`);
    ticketController.getTicketTeam(req, res);
});

// Route pour récupérer les membres de l'équipe assignée à un ticket
router.get('/:uuid/team/members', (req, res, next) => {
    logger.info(`[ROUTES] Handling GET /tickets/${req.params.uuid}/team/members request`);
    ticketController.getTicketTeamMembers(req, res);
});

// Route pour récupérer les epics liés à un projet
router.get('/:uuid/epics', (req, res, next) => {
    logger.info(`[ROUTES] Handling GET /tickets/${req.params.uuid}/epics request`);
    ticketController.getProjectEpics(req, res);
});

// Route pour récupérer les sprints liés à un projet
router.get('/:uuid/sprints', (req, res, next) => {
    logger.info(`[ROUTES] Handling GET /tickets/${req.params.uuid}/sprints request`);
    ticketController.getProjectSprints(req, res);
});

// Route pour mettre à jour partiellement un ticket (PATCH)
router.patch('/:uuid', validateUpdateTicket, (req, res, next) => {
    logger.info(`[ROUTES] Handling PATCH /tickets/${req.params.uuid} request`);
    ticketController.updateTicket(req, res);
});

// Route pour ajouter des watchers à un ticket
router.post('/:uuid/watchers', validateAddWatchers, (req, res, next) => {
    logger.info(`[ROUTES] Handling POST /tickets/${req.params.uuid}/watchers request`);
    ticketController.addWatchers(req, res);
});

// Route pour supprimer un watcher d'un ticket
router.delete('/:uuid/watchers/:user_uuid', validateRemoveWatcher, (req, res, next) => {
    logger.info(`[ROUTES] Handling DELETE /tickets/${req.params.uuid}/watchers/${req.params.user_uuid} request`);
    ticketController.removeWatcher(req, res);
});

// Route pour ajouter des relations parent-enfant entre tickets
router.post('/:parent_uuid/children', (req, res, next) => {
    logger.info(`[ROUTES] Handling POST /tickets/${req.params.parent_uuid}/children request`);
    ticketController.addChildrenTickets(req, res);
});

// Route pour supprimer une relation parent-enfant entre tickets
router.delete('/:parent_uuid/children/:children_uuid', (req, res) => {
    logger.info(`[ROUTES] Handling DELETE /tickets/${req.params.parent_uuid}/children/${req.params.children_uuid} request`);
    
    try {
        const parentUuid = req.params.parent_uuid;
        const childUuid = req.params.children_uuid;
        
        ticketController.removeChildTicket(req, res, parentUuid, childUuid);
    } catch (error) {
        logger.error('[ROUTES] Error in DELETE /:parent_uuid/children/:children_uuid route:', error);
        return res.status(500).json({
            success: false,
            message: 'Une erreur est survenue lors de la suppression de la relation parent-enfant',
            error: error.message
        });
    }
});

module.exports = router;
