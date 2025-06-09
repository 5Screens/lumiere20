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
    // Récupérer le type de ticket depuis req.body.ticket_type_code
    const ticketType = req.body && req.body.ticket_type_code;
    
    // Log pour le debugging
    logger.info(`[ROUTES] Handling POST /tickets request for type: ${ticketType || 'UNKNOWN'}`);
    
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
