const { getContactTypes } = require('./service');
const logger = require('../../../config/logger');

async function handleGetContactTypes(req, res) {
    logger.info('[CONTROLLER] Handling get contact types request');
    try {
        const { lang, toSelect } = req.query;
        const contactTypes = await getContactTypes(lang, toSelect);
        logger.info('[CONTROLLER] Successfully retrieved contact types');
        res.json(contactTypes);
    } catch (error) {
        logger.error(`[CONTROLLER] Error in get contact types: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    handleGetContactTypes
};
