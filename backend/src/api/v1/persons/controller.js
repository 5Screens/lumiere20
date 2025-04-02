const service = require('./service');
const logger = require('../../../config/logger');

/**
 * Get all persons
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPersons = async (req, res) => {
    try {
        logger.info('Controller - Getting all persons');
        const { lang } = req.query;
        const persons = await service.getAllPersons(lang);
        logger.info('Controller - Successfully retrieved persons');
        res.json(persons);
    } catch (error) {
        logger.error('Controller - Error getting persons:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
};

/**
 * Get all groups for a specific person
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPersonGroups = async (req, res) => {
    try {
        const { uuid } = req.params;
        logger.info(`Controller - Getting groups for person with UUID: ${uuid}`);
        
        const groups = await service.getPersonGroups(uuid);
        logger.info(`Controller - Successfully retrieved ${groups.length} groups for person with UUID: ${uuid}`);
        
        res.json(groups);
    } catch (error) {
        logger.error(`Controller - Error getting groups for person with UUID: ${req.params.uuid}:`, error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
};

module.exports = {
    getPersons,
    getPersonGroups
};
