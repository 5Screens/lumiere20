const service = require('./service');
const logger = require('../../../config/logger');

/**
 * Get persons with lazy search (max 10 results)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPersonsLazySearch = async (req, res) => {
    try {
        const { search = '' } = req.query;
        logger.info(`[CONTROLLER] - Getting persons with lazy search: "${search}"`);
        
        const persons = await service.getPersonsLazySearch(search);
        
        logger.info(`[CONTROLLER] - Successfully retrieved ${persons.length} persons`);
        res.json(persons);
    } catch (error) {
        logger.error('[CONTROLLER] - Error in lazy search:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
};

/**
 * DEPRECATED - Get persons with pagination support for infinite scroll
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @deprecated
 */
const getPersonsPaginated = async (req, res) => {
    try {
        logger.info('[CONTROLLER] - Getting persons paginated');
        
        const {
            offset = 0,
            limit = 50,
            sortBy = 'updated_at',
            sortDirection = 'desc',
            search = '',
            lang
        } = req.query;

        // Parse filters from query parameters
        const filters = {};
        Object.keys(req.query).forEach(key => {
            if (key.startsWith('filter_') && req.query[key]) {
                const filterKey = key.replace('filter_', '');
                filters[filterKey] = req.query[key];
            }
        });

        const options = {
            offset: parseInt(offset) || 0,
            limit: Math.min(parseInt(limit) || 50, 100), // Max 100 items per request
            sortBy,
            sortDirection,
            filters,
            search
        };

        logger.info(`[CONTROLLER] - Pagination options: ${JSON.stringify(options)}`);
        
        const result = await service.getPersonsPaginated(options, lang);
        
        logger.info(`[CONTROLLER] - Successfully retrieved ${result.data.length} persons (${result.pagination.offset + 1}-${result.pagination.offset + result.data.length} of ${result.total})`);
        
        res.json(result);
    } catch (error) {
        logger.error('[CONTROLLER] - Error getting persons paginated:', error);
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

/**
 * Add groups to a person
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addPersonGroups = async (req, res) => {
    try {
        const { uuid } = req.params;
        const { groups } = req.body;
        
        logger.info(`[CONTROLLER] - Adding groups to person with UUID: ${uuid}`);
        
        const result = await service.addPersonGroups(uuid, groups);
        
        logger.info(`[CONTROLLER] - Successfully processed group addition for person: ${uuid}`);
        res.status(200).json(result);
    } catch (error) {
        logger.error(`[CONTROLLER] - Error adding groups to person with UUID: ${req.params.uuid}:`, error);
        
        if (error.message === 'Person not found') {
            return res.status(404).json({
                error: 'Person not found',
                message: `No person found with UUID: ${req.params.uuid}`
            });
        }
        
        if (error.message.startsWith('Groups not found:')) {
            return res.status(404).json({
                error: 'Groups not found',
                message: error.message
            });
        }
        
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
};

/**
 * Remove a group from a person
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const removePersonGroup = async (req, res) => {
    try {
        const { uuid, group_uuid } = req.params;
        
        logger.info(`[CONTROLLER] - Removing group ${group_uuid} from person with UUID: ${uuid}`);
        
        const result = await service.removePersonGroup(uuid, group_uuid);
        
        if (!result.success) {
            logger.info(`[CONTROLLER] - No relation found between person ${uuid} and group ${group_uuid}`);
            return res.status(404).json({
                error: 'Relation not found',
                message: result.message
            });
        }
        
        logger.info(`[CONTROLLER] - Successfully removed group ${group_uuid} from person: ${uuid}`);
        res.status(200).json(result);
    } catch (error) {
        logger.error(`[CONTROLLER] - Error removing group from person with UUID: ${req.params.uuid}:`, error);
        
        if (error.message === 'Person not found') {
            return res.status(404).json({
                error: 'Person not found',
                message: `No person found with UUID: ${req.params.uuid}`
            });
        }
        
        if (error.message === 'Group not found') {
            return res.status(404).json({
                error: 'Group not found',
                message: `No group found with UUID: ${req.params.group_uuid}`
            });
        }
        
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
};

/**
 * Add approver entities to a person
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addApproverEntities = async (req, res) => {
    try {
        const { uuid } = req.params;
        const { 'approver-entities': entities } = req.body;
        
        logger.info(`[CONTROLLER] - Setting person ${uuid} as budget approver for entities`);
        
        const result = await service.addApproverEntities(uuid, entities);
        
        logger.info(`[CONTROLLER] - Successfully processed approver entities assignment for person: ${uuid}`);
        res.status(200).json(result);
    } catch (error) {
        logger.error(`[CONTROLLER] - Error setting person as budget approver with UUID: ${req.params.uuid}:`, error);
        
        if (error.message === 'Person not found') {
            return res.status(404).json({
                error: 'Person not found',
                message: `No person found with UUID: ${req.params.uuid}`
            });
        }
        
        if (error.message.startsWith('Entities not found:')) {
            return res.status(404).json({
                error: 'Entities not found',
                message: error.message
            });
        }
        
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
};

/**
 * Remove a person as budget approver from an entity
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const removeApproverEntity = async (req, res) => {
    try {
        const { uuid, entity_uuid } = req.params;
        
        logger.info(`[CONTROLLER] - Removing person ${uuid} as budget approver from entity ${entity_uuid}`);
        
        const result = await service.removeApproverEntity(uuid, entity_uuid);
        
        if (!result.success) {
            logger.info(`[CONTROLLER] - Person ${uuid} is not budget approver for entity ${entity_uuid}`);
            return res.status(404).json({
                error: 'Approver relation not found',
                message: result.message
            });
        }
        
        logger.info(`[CONTROLLER] - Successfully removed person ${uuid} as budget approver from entity: ${entity_uuid}`);
        res.status(200).json(result);
    } catch (error) {
        logger.error(`[CONTROLLER] - Error removing person as budget approver with UUID: ${req.params.uuid}:`, error);
        
        if (error.message === 'Person not found') {
            return res.status(404).json({
                error: 'Person not found',
                message: `No person found with UUID: ${req.params.uuid}`
            });
        }
        
        if (error.message === 'Entity not found') {
            return res.status(404).json({
                error: 'Entity not found',
                message: `No entity found with UUID: ${req.params.entity_uuid}`
            });
        }
        
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
};

/**
 * Search persons with filters, sorting and pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const searchPersons = async (req, res) => {
  try {
    logger.info('[PERSONS CONTROLLER] Searching persons with body:', req.body);
    
    const searchResults = await service.searchPersons(req.body);
    
    res.status(200).json(searchResults);
  } catch (error) {
    logger.error('[PERSONS CONTROLLER] Error searching persons:', error);
    res.status(500).json({ 
      error: 'Error searching persons',
      message: error.message 
    });
  }
};

/**
 * Get filter values for a specific column in persons table
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPersonsFilterValues = async (req, res) => {
  try {
    const { columnName } = req.params;
    const { q: searchQuery } = req.query;
    
    logger.info(`[PERSONS CONTROLLER] Getting filter values for column: ${columnName}`);
    
    const filterValues = await service.getPersonsFilterValues(columnName, searchQuery);
    
    res.status(200).json(filterValues);
  } catch (error) {
    logger.error('[PERSONS CONTROLLER] Error getting filter values:', error);
    
    if (error.message.includes('No metadata found')) {
      return res.status(404).json({
        error: 'Column not found',
        message: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Error getting filter values',
      message: error.message 
    });
  }
};

module.exports = {
    getPersonsLazySearch,
    getPersonByUuid,
    getPersonGroups,
    updatePerson,
    createPerson,
    addPersonGroups,
    removePersonGroup,
    addApproverEntities,
    removeApproverEntity,
    searchPersons,
    getPersonsFilterValues
};
