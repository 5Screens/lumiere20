const { getAllTicketStatus } = require('./service');
const logger = require('../../../config/logger');

/**
 * Get all ticket statuses with translations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTicketStatus = async (req, res) => {
    try {
        logger.info('[CONTROLLER] Processing request to get ticket statuses');
        const { lang, toSelect, ticket_type } = req.query;
        
        const ticketStatuses = await getAllTicketStatus(lang, { toSelect, ticket_type });
        logger.info(`[CONTROLLER] Successfully retrieved ticket statuses for language: ${lang}${ticket_type ? ` and ticket type: ${ticket_type}` : ''}`);
        
        res.json(ticketStatuses);
    } catch (error) {
        logger.error('[CONTROLLER] Error in getTicketStatus controller:', error);
        res.status(500).json({ 
            error: 'Internal server error while fetching ticket statuses'
        });
    }
};

module.exports = {
    getTicketStatus
};
