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
 * Get a person by UUID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPersonByUuid = async (req, res) => {
    try {
        const { uuid } = req.params;
        const { lang } = req.query;
        
        logger.info(`[CONTROLLER] - Getting person with UUID: ${uuid}`);
        
        const person = await service.getPersonByUuid(uuid, lang);
        
        if (!person) {
            logger.info(`[CONTROLLER] - Person not found with UUID: ${uuid}`);
            return res.status(404).json({ 
                error: 'Person not found',
                message: `No person found with UUID: ${uuid}`
            });
        }
        
        logger.info(`[CONTROLLER] - Successfully retrieved person with UUID: ${uuid}`);
        res.json(person);
    } catch (error) {
        logger.error(`[CONTROLLER] - Error getting person with UUID: ${req.params.uuid}:`, error);
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

/**
 * Update a person by UUID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updatePerson = async (req, res) => {
    try {
        const { uuid } = req.params;
        const personData = req.body;
        
        logger.info(`[CONTROLLER] - Updating person with UUID: ${uuid}`);
        
        const updatedPerson = await service.updatePerson(uuid, personData);
        
        if (!updatedPerson) {
            logger.info(`[CONTROLLER] - Person not found with UUID: ${uuid}`);
            return res.status(404).json({ 
                error: 'Person not found',
                message: `No person found with UUID: ${uuid}`
            });
        }
        
        logger.info(`[CONTROLLER] - Successfully updated person with UUID: ${uuid}`);
        res.json(updatedPerson);
    } catch (error) {
        logger.error(`[CONTROLLER] - Error updating person with UUID: ${req.params.uuid}:`, error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
};

/**
 * Create a new person
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createPerson = async (req, res) => {
    try {
        const personData = req.body;
        
        logger.info('[CONTROLLER] - Creating new person');
        
        const newPerson = await service.createPerson(personData);
        
        logger.info(`[CONTROLLER] - Successfully created person with UUID: ${newPerson.uuid}`);
        res.status(201).json(newPerson);
    } catch (error) {
        logger.error('[CONTROLLER] - Error creating person:', error);
        
        // Gestion spécifique des erreurs de contrainte unique (email)
        if (error.code === '23505') {
            return res.status(409).json({
                error: 'Conflict',
                message: 'A person with this email already exists',
                details: error.detail
            });
        }
        
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
};

module.exports = {
    getPersons,
    getPersonByUuid,
    getPersonGroups,
    updatePerson,
    createPerson
};
