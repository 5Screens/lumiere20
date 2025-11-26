const logger = require('../../../config/logger');
const service = require('./service.prisma');

/**
 * Get all configuration items with pagination and filters
 */
const getConfigurationItems = async (req, res) => {
    try {
        logger.info('[CMDB CONTROLLER] Getting configuration items');
        const options = {
            search: req.query.search || '',
            ci_type: req.query.ci_type || null,
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 50,
            sortBy: req.query.sortBy || 'name',
            sortDirection: req.query.sortDirection || 'asc'
        };
        
        const result = await service.getConfigurationItems(options);
        res.json(result);
    } catch (error) {
        logger.error('[CMDB CONTROLLER] Error getting configuration items:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get configuration item by UUID
 */
const getConfigurationItemById = async (req, res) => {
    try {
        const { uuid } = req.params;
        logger.info(`[CMDB CONTROLLER] Getting configuration item: ${uuid}`);
        
        const item = await service.getConfigurationItemById(uuid);
        
        if (!item) {
            return res.status(404).json({ error: 'Configuration item not found' });
        }
        
        res.json(item);
    } catch (error) {
        logger.error('[CMDB CONTROLLER] Error getting configuration item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Create new configuration item
 */
const createConfigurationItem = async (req, res) => {
    try {
        logger.info('[CMDB CONTROLLER] Creating configuration item');
        const item = await service.createConfigurationItem(req.body);
        res.status(201).json(item);
    } catch (error) {
        logger.error('[CMDB CONTROLLER] Error creating configuration item:', error);
        res.status(400).json({ error: error.message || 'Failed to create configuration item' });
    }
};

/**
 * Update configuration item
 */
const updateConfigurationItem = async (req, res) => {
    try {
        const { uuid } = req.params;
        logger.info(`[CMDB CONTROLLER] Updating configuration item: ${uuid}`);
        
        const item = await service.updateConfigurationItem(uuid, req.body);
        
        if (!item) {
            return res.status(404).json({ error: 'Configuration item not found' });
        }
        
        res.json(item);
    } catch (error) {
        logger.error('[CMDB CONTROLLER] Error updating configuration item:', error);
        res.status(400).json({ error: error.message || 'Failed to update configuration item' });
    }
};

/**
 * Delete configuration item
 */
const deleteConfigurationItem = async (req, res) => {
    try {
        const { uuid } = req.params;
        logger.info(`[CMDB CONTROLLER] Deleting configuration item: ${uuid}`);
        
        const success = await service.deleteConfigurationItem(uuid);
        
        if (!success) {
            return res.status(404).json({ error: 'Configuration item not found' });
        }
        
        res.status(204).send();
    } catch (error) {
        logger.error('[CMDB CONTROLLER] Error deleting configuration item:', error);
        res.status(400).json({ error: error.message || 'Failed to delete configuration item' });
    }
};

/**
 * Search configuration items with advanced filters
 */
const searchConfigurationItems = async (req, res) => {
    try {
        logger.info('[CMDB CONTROLLER] Searching configuration items with filters');
        const searchParams = req.body;
        
        const result = await service.searchConfigurationItems(searchParams);
        res.json(result);
    } catch (error) {
        logger.error('[CMDB CONTROLLER] Error searching configuration items:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get CI type schemas
 */
const getCITypeSchemas = async (req, res) => {
    try {
        logger.info('[CMDB CONTROLLER] Getting CI type schemas');
        const schemas = service.getCITypeSchemas();
        res.json(schemas);
    } catch (error) {
        logger.error('[CMDB CONTROLLER] Error getting CI type schemas:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getConfigurationItems,
    getConfigurationItemById,
    createConfigurationItem,
    updateConfigurationItem,
    deleteConfigurationItem,
    searchConfigurationItems,
    getCITypeSchemas
};
