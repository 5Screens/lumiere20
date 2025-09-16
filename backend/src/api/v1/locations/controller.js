const locationService = require('./service');
const logger = require('../../../config/logger');
const { validateLocation, validateLocationPatch, validateAddOccupants, validateUuid } = require('./validation');

class LocationController {
    async getAllLocations(req, res) {
        logger.info('[CONTROLLER] getAllLocations - Starting to process request');
        
        const lang = req.query.lang;
        if (!lang) {
            logger.warn('[CONTROLLER] getAllLocations - Missing lang parameter');
            return res.status(400).json({
                error: 'lang parameter is required (e.g., ?lang=fr)'
            });
        }
        
        try {
            const locations = await locationService.getAllLocations(lang);
            logger.info(`[CONTROLLER] getAllLocations - Successfully retrieved ${locations.length} locations`);
            res.json(locations);
        } catch (error) {
            logger.error(`[CONTROLLER] getAllLocations - Error: ${error.message}`);
            res.status(500).json({ 
                error: 'An error occurred while retrieving locations' 
            });
        }
    }

    async getLocationByUuid(req, res) {
        const uuid = req.params.uuid;
        const lang = req.query.lang || 'fr'; // Default to French if not specified
        
        logger.info(`[CONTROLLER] getLocationByUuid - Processing request for UUID: ${uuid} with language: ${lang}`);
        try {
            const location = await locationService.getLocationByUuid(uuid, lang);
            
            if (!location) {
                logger.warn(`[CONTROLLER] getLocationByUuid - Location not found with UUID: ${uuid}`);
                return res.status(404).json({
                    error: 'Location not found'
                });
            }
            
            logger.info(`[CONTROLLER] getLocationByUuid - Successfully retrieved location with UUID: ${uuid}`);
            return res.json(location);
        } catch (error) {
            logger.error(`[CONTROLLER] getLocationByUuid - Error: ${error.message}`);
            return res.status(500).json({
                error: 'Error while retrieving location'
            });
        }
    }

    async getActiveLocations(req, res) {
        logger.info('[CONTROLLER] getActiveLocations - Starting to process request');
        
        const lang = req.query.lang;
        if (!lang) {
            logger.warn('[CONTROLLER] getActiveLocations - Missing lang parameter');
            return res.status(400).json({
                error: 'lang parameter is required (e.g., ?lang=fr)'
            });
        }
        
        try {
            const activeLocations = await locationService.getActiveLocations(lang);
            logger.info(`[CONTROLLER] getActiveLocations - Successfully retrieved ${activeLocations.length} active locations`);
            res.json(activeLocations);
        } catch (error) {
            logger.error(`[CONTROLLER] getActiveLocations - Error: ${error.message}`);
            res.status(500).json({ 
                error: 'An error occurred while retrieving active locations' 
            });
        }
    }

    async getChildLocationsCount(req, res) {
        const uuid = req.query.uuid;
        
        if (!uuid) {
            logger.warn('[CONTROLLER] getChildLocationsCount - Missing UUID parameter');
            return res.status(400).json({
                error: 'UUID parameter is required'
            });
        }
        
        // UUID format validation
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(uuid)) {
            logger.warn(`[CONTROLLER] getChildLocationsCount - Invalid UUID format: ${uuid}`);
            return res.status(400).json({
                error: `Invalid UUID format: "${uuid}". UUID must be in the format of 8-4-4-4-12 hexadecimal characters.`
            });
        }
        
        logger.info(`[CONTROLLER] getChildLocationsCount - Processing request for UUID: ${uuid}`);
        try {
            const result = await locationService.getChildLocationsCount(uuid);
            
            if (result === null) {
                logger.warn(`[CONTROLLER] getChildLocationsCount - Location not found with UUID: ${uuid}`);
                return res.status(404).json({
                    error: 'Location not found'
                });
            }
            
            logger.info(`[CONTROLLER] getChildLocationsCount - Successfully retrieved child count for location UUID: ${uuid}`);
            return res.json(result);
        } catch (error) {
            logger.error(`[CONTROLLER] getChildLocationsCount - Error: ${error.message}`);
            
            // Specific handling for UUID format errors
            if (error.message.includes('uuid')) {
                return res.status(400).json({
                    error: `Invalid UUID format: "${uuid}". The following error occurred: ${error.message}`
                });
            }
            
            return res.status(500).json({
                error: 'Error while counting child locations',
                details: error.message
            });
        }
    }

    async getEntityLocationsCount(req, res) {
        const entityUuid = req.query.entityUuid;
        
        if (!entityUuid) {
            logger.warn('[CONTROLLER] getEntityLocationsCount - Missing entityUuid parameter');
            return res.status(400).json({
                error: 'entityUuid parameter is required'
            });
        }
        
        // UUID format validation
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(entityUuid)) {
            logger.warn(`[CONTROLLER] getEntityLocationsCount - Invalid UUID format: ${entityUuid}`);
            return res.status(400).json({
                error: `Invalid UUID format: "${entityUuid}". UUID must be in the format of 8-4-4-4-12 hexadecimal characters.`
            });
        }
        
        logger.info(`[CONTROLLER] getEntityLocationsCount - Processing request for entity UUID: ${entityUuid}`);
        try {
            const result = await locationService.getEntityLocationsCount(entityUuid);
            
            if (result === null) {
                logger.warn(`[CONTROLLER] getEntityLocationsCount - Entity not found with UUID: ${entityUuid}`);
                return res.status(404).json({
                    error: 'Entity not found'
                });
            }
            
            logger.info(`[CONTROLLER] getEntityLocationsCount - Successfully retrieved locations count for entity UUID: ${entityUuid}`);
            return res.json(result);
        } catch (error) {
            logger.error(`[CONTROLLER] getEntityLocationsCount - Error: ${error.message}`);
            
            // Specific handling for UUID format errors
            if (error.message.includes('uuid')) {
                return res.status(400).json({
                    error: `Invalid UUID format: "${entityUuid}". The following error occurred: ${error.message}`
                });
            }
            
            return res.status(500).json({
                error: 'Error while counting entity locations',
                details: error.message
            });
        }
    }

    async updateLocationField(req, res) {
        const uuid = req.locationUuid;
        logger.info(`[CONTROLLER] updateLocationField - Processing request for UUID: ${uuid}`);

        try {
            // Validate the location exists
            const existingLocation = await locationService.getLocationByUuid(uuid);
            if (!existingLocation) {
                logger.warn(`[CONTROLLER] updateLocationField - Location not found with UUID: ${uuid}`);
                return res.status(404).json({
                    error: 'Location not found'
                });
            }

            // Validate update data
            const { error, value } = validateLocationPatch(req.body);
            if (error) {
                logger.warn(`[CONTROLLER] updateLocationField - Validation failed: ${error.details.map(d => d.message).join(', ')}`);
                return res.status(400).json({
                    error: 'Invalid update data',
                    details: error.details.map(d => d.message)
                });
            }

            // Update the location
            const updatedLocation = await locationService.updateLocation(uuid, value);
            logger.info(`[CONTROLLER] updateLocationField - Location updated successfully: ${uuid}`);
            
            return res.json(updatedLocation);
        } catch (error) {
            logger.error(`[CONTROLLER] updateLocationField - Error: ${error.message}`);
            return res.status(500).json({
                error: 'An error occurred while updating the location'
            });
        }
    }

    async createLocation(req, res) {
        logger.info('[CONTROLLER] createLocation - Starting to process request');
        try {
            // Validate location data
            const { error, value } = validateLocation(req.body);
            if (error) {
                logger.warn(`[CONTROLLER] createLocation - Validation failed: ${error.details.map(d => d.message).join(', ')}`);
                return res.status(400).json({
                    error: 'Invalid location data',
                    details: error.details.map(d => d.message)
                });
            }

            // Create the location
            const newLocation = await locationService.createLocation(value);
            logger.info(`[CONTROLLER] createLocation - Location created successfully: ${newLocation.uuid}`);
            
            return res.status(201).json(newLocation);
        } catch (error) {
            logger.error(`[CONTROLLER] createLocation - Error: ${error.message}`);
            
            // Handle specific database errors
            if (error.code === '23505') { // Unique constraint violation
                return res.status(409).json({
                    error: 'A location with this name already exists'
                });
            }
            
            return res.status(500).json({
                error: 'An error occurred while creating the location'
            });
        }
    }

    async addOccupantToLocation(req, res) {
        const locationUuid = req.params.location_uuid;
        const personUuid = req.params.user_uuid;
        
        logger.info(`[CONTROLLER] addOccupantToLocation - Adding person ${personUuid} to location ${locationUuid}`);
        
        try {
            // Validate UUIDs
            const locationValidation = validateUuid(locationUuid);
            if (locationValidation.error) {
                logger.warn(`[CONTROLLER] addOccupantToLocation - Invalid location UUID: ${locationUuid}`);
                return res.status(400).json({
                    error: 'Invalid location UUID format'
                });
            }
            
            const personValidation = validateUuid(personUuid);
            if (personValidation.error) {
                logger.warn(`[CONTROLLER] addOccupantToLocation - Invalid person UUID: ${personUuid}`);
                return res.status(400).json({
                    error: 'Invalid person UUID format'
                });
            }

            const result = await locationService.addOccupantToLocation(locationUuid, personUuid);
            logger.info(`[CONTROLLER] addOccupantToLocation - Person added successfully to location`);
            
            return res.status(201).json({
                message: 'Person added to location successfully',
                person: result
            });
        } catch (error) {
            logger.error(`[CONTROLLER] addOccupantToLocation - Error: ${error.message}`);
            
            if (error.message === 'Location not found') {
                return res.status(404).json({ error: 'Location not found' });
            }
            if (error.message === 'Person not found') {
                return res.status(404).json({ error: 'Person not found' });
            }
            
            return res.status(500).json({
                error: 'An error occurred while adding person to location'
            });
        }
    }

    async addMultipleOccupantsToLocation(req, res) {
        const locationUuid = req.params.location_uuid;
        
        logger.info(`[CONTROLLER] addMultipleOccupantsToLocation - Processing request for location ${locationUuid}`);
        
        try {
            // Validate location UUID
            const locationValidation = validateUuid(locationUuid);
            if (locationValidation.error) {
                logger.warn(`[CONTROLLER] addMultipleOccupantsToLocation - Invalid location UUID: ${locationUuid}`);
                return res.status(400).json({
                    error: 'Invalid location UUID format'
                });
            }
            
            // Validate request body
            const { error, value } = validateAddOccupants(req.body);
            if (error) {
                logger.warn(`[CONTROLLER] addMultipleOccupantsToLocation - Validation failed: ${error.details.map(d => d.message).join(', ')}`);
                return res.status(400).json({
                    error: 'Invalid request data',
                    details: error.details.map(d => d.message)
                });
            }

            const result = await locationService.addOccupantsToLocation(locationUuid, value.occupants);
            logger.info(`[CONTROLLER] addMultipleOccupantsToLocation - ${result.length} persons added successfully to location`);
            
            return res.status(201).json({
                message: `${result.length} persons added to location successfully`,
                persons: result
            });
        } catch (error) {
            logger.error(`[CONTROLLER] addMultipleOccupantsToLocation - Error: ${error.message}`);
            
            if (error.message === 'Location not found') {
                return res.status(404).json({ error: 'Location not found' });
            }
            
            return res.status(500).json({
                error: 'An error occurred while adding persons to location'
            });
        }
    }

    async removeOccupantFromLocation(req, res) {
        const locationUuid = req.params.location_uuid;
        const personUuid = req.params.user_uuid;
        
        logger.info(`[CONTROLLER] removeOccupantFromLocation - Removing person ${personUuid} from location ${locationUuid}`);
        
        try {
            // Validate UUIDs
            const locationValidation = validateUuid(locationUuid);
            if (locationValidation.error) {
                logger.warn(`[CONTROLLER] removeOccupantFromLocation - Invalid location UUID: ${locationUuid}`);
                return res.status(400).json({
                    error: 'Invalid location UUID format'
                });
            }
            
            const personValidation = validateUuid(personUuid);
            if (personValidation.error) {
                logger.warn(`[CONTROLLER] removeOccupantFromLocation - Invalid person UUID: ${personUuid}`);
                return res.status(400).json({
                    error: 'Invalid person UUID format'
                });
            }

            const result = await locationService.removeOccupantFromLocation(locationUuid, personUuid);
            logger.info(`[CONTROLLER] removeOccupantFromLocation - Person removed successfully from location`);
            
            return res.json({
                message: 'Person removed from location successfully',
                person: result
            });
        } catch (error) {
            logger.error(`[CONTROLLER] removeOccupantFromLocation - Error: ${error.message}`);
            
            if (error.message === 'Person not found in this location') {
                return res.status(404).json({ error: 'Person not found in this location' });
            }
            
            return res.status(500).json({
                error: 'An error occurred while removing person from location'
            });
        }
    }
}

module.exports = new LocationController();
