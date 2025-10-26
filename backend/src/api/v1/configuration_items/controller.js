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

const searchConfigurationItems = async (req, res) => {
    try {
        logger.info('[CONTROLLER] Searching configuration items');
        const { search, page, limit, sortBy, sortDirection, lang } = req.query;
        
        const result = await configurationItemsService.searchConfigurationItems({
            search,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
            sortBy: sortBy || 'name',
            sortDirection: sortDirection || 'asc',
            lang: lang || 'en'
        });
        
        res.json(result);
    } catch (error) {
        logger.error('[CONTROLLER] Error searching configuration items:', error);
        res.status(500).json({ error: 'Failed to search configuration items' });
    }
};

module.exports = {
    getAllConfigurationItems,
    searchConfigurationItems
};
