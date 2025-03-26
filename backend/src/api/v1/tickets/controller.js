const ticketService = require('./service');
const logger = require('../../../config/logger');

const getTickets = async (req, res) => {
    try {
        logger.info('[CONTROLLER] Processing GET /tickets request');
        const { lang } = req.query;
        const tickets = await ticketService.getTickets(lang);
        res.json(tickets);
    } catch (error) {
        logger.error('[CONTROLLER] Error in getTickets:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getTickets
};
