const ticketTypeService = require('./service');
const logger = require('../../../config/logger');

class TicketTypeController {
    async getTicketTypes(req, res) {
        try {
            const lang = req.query.lang;
            const ticketTypes = await ticketTypeService.getTicketTypes(lang);
            
            logger.info(`[CONTROLLER] Successfully retrieved ticket types for language ${lang}`);
            return res.status(200).json(ticketTypes);
        } catch (error) {
            logger.error('[CONTROLLER] Error while retrieving ticket types:', error);
            return res.status(500).json({
                error: 'Internal server error',
                message: 'An error occurred while retrieving ticket types'
            });
        }
    }
}

module.exports = new TicketTypeController();
