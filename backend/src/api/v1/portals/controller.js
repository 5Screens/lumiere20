const portalsService = require('./service');
const logger = require('../../../config/logger');

class PortalsController {
    /**
     * List all portals with optional filters
     * GET /api/v1/portals?is_active=true&q=hello
     */
    async list(req, res, next) {
        logger.info('[CONTROLLER] portals:list - Starting request');
        try {
            const { is_active, q } = req.query;
            
            const filters = {};
            if (is_active !== undefined) {
                filters.is_active = is_active === 'true' || is_active === true;
            }
            if (q) {
                filters.q = q;
            }

            logger.info(`[CONTROLLER] portals:list - Filters: ${JSON.stringify(filters)}`);
            const portals = await portalsService.list(filters);

            logger.info(`[CONTROLLER] portals:list - Successfully retrieved ${portals.length} portals`);
            return res.status(200).json(portals);
        } catch (error) {
            logger.error(`[CONTROLLER] portals:list - Error: ${error.message}`);
            return next(error);
        }
    }

    /**
     * Create a new portal
     * POST /api/v1/portals
     */
    async create(req, res, next) {
        logger.info('[CONTROLLER] portals:create - Starting request');
        try {
            const { code, name, base_url, thumbnail_url } = req.body;

            logger.info(`[CONTROLLER] portals:create - Creating portal with code: ${code}`);
            const portal = await portalsService.create({
                code,
                name,
                base_url,
                thumbnail_url
            });

            logger.info(`[CONTROLLER] portals:create - Portal created successfully: ${portal.uuid}`);
            return res.status(201).json(portal);
        } catch (error) {
            if (error.code === 'CONFLICT') {
                logger.error(`[CONTROLLER] portals:create - Conflict: ${error.message}`);
                return res.status(409).json({
                    success: false,
                    message: error.message
                });
            }

            logger.error(`[CONTROLLER] portals:create - Error: ${error.message}`);
            return next(error);
        }
    }

    /**
     * Activate or deactivate a portal
     * PATCH /api/v1/portals/:uuid/activate
     */
    async activate(req, res, next) {
        logger.info('[CONTROLLER] portals:activate - Starting request');
        try {
            const { uuid } = req.params;
            const { is_active } = req.body;

            logger.info(`[CONTROLLER] portals:activate - Updating portal ${uuid} to is_active=${is_active}`);
            const portal = await portalsService.activate(uuid, is_active);

            logger.info(`[CONTROLLER] portals:activate - Portal updated successfully: ${portal.uuid}`);
            return res.status(200).json(portal);
        } catch (error) {
            if (error.code === 'NOT_FOUND') {
                logger.error(`[CONTROLLER] portals:activate - Not found: ${error.message}`);
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            logger.error(`[CONTROLLER] portals:activate - Error: ${error.message}`);
            return next(error);
        }
    }

    /**
     * List actions for a specific portal
     * GET /api/v1/portals/:uuid/actions
     */
    async listActions(req, res, next) {
        logger.info('[CONTROLLER] portals:listActions - Starting request');
        try {
            const { uuid } = req.params;

            logger.info(`[CONTROLLER] portals:listActions - Fetching actions for portal ${uuid}`);
            const actions = await portalsService.listActions(uuid);

            // Mask sensitive values in headers_json
            const maskedActions = actions.map(action => {
                if (action.headers_json && typeof action.headers_json === 'object') {
                    const maskedHeaders = { ...action.headers_json };
                    
                    // List of sensitive header keys to mask
                    const sensitiveKeys = [
                        'authorization',
                        'Authorization',
                        'api-key',
                        'Api-Key',
                        'API-Key',
                        'x-api-key',
                        'X-API-Key',
                        'token',
                        'Token',
                        'bearer',
                        'Bearer'
                    ];

                    // Mask sensitive values
                    Object.keys(maskedHeaders).forEach(key => {
                        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive.toLowerCase()))) {
                            maskedHeaders[key] = '***';
                        }
                    });

                    return {
                        ...action,
                        headers_json: maskedHeaders
                    };
                }
                return action;
            });

            logger.info(`[CONTROLLER] portals:listActions - Successfully retrieved ${maskedActions.length} actions`);
            return res.status(200).json(maskedActions);
        } catch (error) {
            if (error.code === 'NOT_FOUND') {
                logger.error(`[CONTROLLER] portals:listActions - Not found: ${error.message}`);
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            logger.error(`[CONTROLLER] portals:listActions - Error: ${error.message}`);
            return next(error);
        }
    }

    /**
     * Get full portal configuration (v1) with actions, alerts, and widgets
     * GET /api/v1/portals/:code
     */
    async getFull(req, res, next) {
        logger.info('[CONTROLLER] portals:getFull - Starting request');
        try {
            const { code } = req.params;

            logger.info(`[CONTROLLER] portals:getFull - Fetching full config for portal: ${code}`);
            const portal = await portalsService.getFull(code);

            logger.info(`[CONTROLLER] portals:getFull - Portal loaded successfully: ${portal.uuid}`);
            return res.status(200).json(portal);
        } catch (error) {
            if (error.code === 'NOT_FOUND') {
                logger.error(`[CONTROLLER] portals:getFull - Not found: ${error.message}`);
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            logger.error(`[CONTROLLER] portals:getFull - Error: ${error.message}`);
            return next(error);
        }
    }

    /**
     * Resolve a portal by code
     * GET /api/v1/portals/resolve?code=hello-portal
     */
    async resolve(req, res, next) {
        logger.info('[CONTROLLER] portals:resolve - Starting request');
        try {
            const { code } = req.query;

            logger.info(`[CONTROLLER] portals:resolve - Resolving with code=${code}`);
            const portal = await portalsService.resolve(code);

            // Mask sensitive values in actions headers_json
            if (portal.actions && Array.isArray(portal.actions)) {
                portal.actions = portal.actions.map(action => {
                    if (action.headers_json && typeof action.headers_json === 'object') {
                        const maskedHeaders = { ...action.headers_json };
                        
                        const sensitiveKeys = [
                            'authorization',
                            'Authorization',
                            'api-key',
                            'Api-Key',
                            'API-Key',
                            'x-api-key',
                            'X-API-Key',
                            'token',
                            'Token',
                            'bearer',
                            'Bearer'
                        ];

                        Object.keys(maskedHeaders).forEach(key => {
                            if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive.toLowerCase()))) {
                                maskedHeaders[key] = '***';
                            }
                        });

                        return {
                            ...action,
                            headers_json: maskedHeaders
                        };
                    }
                    return action;
                });
            }

            logger.info(`[CONTROLLER] portals:resolve - Portal resolved successfully: ${portal.uuid}`);
            return res.status(200).json(portal);
        } catch (error) {
            if (error.code === 'NOT_FOUND') {
                logger.error(`[CONTROLLER] portals:resolve - Not found: ${error.message}`);
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            logger.error(`[CONTROLLER] portals:resolve - Error: ${error.message}`);
            return next(error);
        }
    }
}

module.exports = new PortalsController();
