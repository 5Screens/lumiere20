const logger = require('../../../config/logger');
const configurationItemsService = require('./service');

const getAllConfigurationItems = async (req, res) => {
    try {
        logger.info('[CONTROLLER] Getting all configuration items');
        const { lang } = req.query;
        const configurationItems = await configurationItemsService.getAllConfigurationItems(lang);
        res.json(configurationItems);
    } catch (error) {
        logger.error('[CONTROLLER] Error getting configuration items:', error);
        res.status(500).json({ error: 'Failed to get configuration items' });
    }
};

module.exports = {
    getAllConfigurationItems
};
