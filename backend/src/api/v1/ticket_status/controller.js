const { getAllTicketStatus } = require('./service');
const logger = require('../../../config/logger');

/**
 * Get all ticket statuses with translations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTicketStatus = async (req, res) => {
    try {
        logger.info('[CONTROLLER] Processing request to get all ticket statuses');
        const { lang, toSelect } = req.query;
        
        const ticketStatuses = await getAllTicketStatus(lang, { toSelect });
        logger.info(`[CONTROLLER] Successfully retrieved ticket statuses for language: ${lang}`);
        
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
