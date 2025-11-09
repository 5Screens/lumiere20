const { pool } = require('../../../config/database');
const logger = require('../../../config/logger');

class PortalsService {
    /**
     * List all portals with optional filters
     * @param {Object} filters - { is_active: boolean, q: string }
     * @returns {Promise<Array>} List of portals
     */
    async list(filters = {}) {
        logger.info('[SERVICE] portals:list - Starting query');
        try {
            const { is_active, q } = filters;
            const params = [];
            const conditions = [];

            // Filter by is_active
            if (is_active !== undefined) {
                params.push(is_active);
                conditions.push(`is_active = $${params.length}`);
            }

            // Search by code or name (ILIKE)
            if (q && q.trim()) {
                params.push(`%${q.trim()}%`);
                conditions.push(`(code ILIKE $${params.length} OR name ILIKE $${params.length})`);
            }

            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

            const query = `
                SELECT 
                    uuid,
                    code,
                    name,
                    base_url,
                    thumbnail_url,
                    is_active,
                    created_at,
                    updated_at
                FROM core.portals
                ${whereClause}
                ORDER BY created_at DESC
            `;

            const result = await pool.query(query, params);
            logger.info(`[SERVICE] portals:list - Found ${result.rows.length} portals`);
            return result.rows;
        } catch (error) {
            logger.error(`[SERVICE] portals:list - Error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create a new portal
     * @param {Object} portalData - { code, name, base_url, thumbnail_url }
     * @returns {Promise<Object>} Created portal
     */
    async create(portalData) {
        logger.info(`[SERVICE] portals:create - Creating portal with code: ${portalData.code}`);
        try {
            // Check if code already exists
            const checkQuery = `
                SELECT 1 FROM core.portals WHERE code = $1
            `;
            const checkResult = await pool.query(checkQuery, [portalData.code]);

            if (checkResult.rows.length > 0) {
                logger.error(`[SERVICE] portals:create - Code already exists: ${portalData.code}`);
                const error = new Error('Portal code already exists');
                error.code = 'CONFLICT';
                throw error;
            }

            // Insert new portal
            const insertQuery = `
                INSERT INTO core.portals (
                    code,
                    name,
                    base_url,
                    thumbnail_url,
                    is_active
                )
                VALUES ($1, $2, $3, $4, false)
                RETURNING 
                    uuid,
                    code,
                    name,
                    base_url,
                    thumbnail_url,
                    is_active,
                    created_at,
                    updated_at
            `;

            const values = [
                portalData.code,
                portalData.name,
                portalData.base_url,
                portalData.thumbnail_url || null
            ];

            const result = await pool.query(insertQuery, values);
            logger.info(`[SERVICE] portals:create - Portal created successfully with UUID: ${result.rows[0].uuid}`);
            return result.rows[0];
        } catch (error) {
            logger.error(`[SERVICE] portals:create - Error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Activate or deactivate a portal
     * @param {string} uuid - Portal UUID
     * @param {boolean} is_active - Active status
     * @returns {Promise<Object>} Updated portal
     */
    async activate(uuid, is_active) {
        logger.info(`[SERVICE] portals:activate - Updating portal ${uuid} to is_active=${is_active}`);
        try {
            const updateQuery = `
                UPDATE core.portals
                SET 
                    is_active = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE uuid = $2
                RETURNING 
                    uuid,
                    code,
                    name,
                    base_url,
                    thumbnail_url,
                    is_active,
                    created_at,
                    updated_at
            `;

            const result = await pool.query(updateQuery, [is_active, uuid]);

            if (result.rows.length === 0) {
                logger.error(`[SERVICE] portals:activate - Portal not found: ${uuid}`);
                const error = new Error('Portal not found');
                error.code = 'NOT_FOUND';
                throw error;
            }

            logger.info(`[SERVICE] portals:activate - Portal ${uuid} updated successfully`);
            return result.rows[0];
        } catch (error) {
            logger.error(`[SERVICE] portals:activate - Error: ${error.message}`);
            throw error;
        }
    }

    /**
     * List actions for a specific portal
     * @param {string} portalUuid - Portal UUID
     * @returns {Promise<Array>} List of actions
     */
    async listActions(portalUuid) {
        logger.info(`[SERVICE] portal_actions:list - Fetching actions for portal ${portalUuid}`);
        try {
            // Check if portal exists
            const checkQuery = `
                SELECT 1 FROM core.portals WHERE uuid = $1
            `;
            const checkResult = await pool.query(checkQuery, [portalUuid]);

            if (checkResult.rows.length === 0) {
                logger.error(`[SERVICE] portal_actions:list - Portal not found: ${portalUuid}`);
                const error = new Error('Portal not found');
                error.code = 'NOT_FOUND';
                throw error;
            }

            // Fetch actions
            const query = `
                SELECT 
                    uuid,
                    rel_portal_uuid,
                    action_code,
                    http_method,
                    endpoint,
                    payload_json,
                    headers_json,
                    created_at,
                    updated_at
                FROM core.portal_actions
                WHERE rel_portal_uuid = $1
                ORDER BY action_code ASC
            `;

            const result = await pool.query(query, [portalUuid]);
            logger.info(`[SERVICE] portal_actions:list - Found ${result.rows.length} actions for portal ${portalUuid}`);
            return result.rows;
        } catch (error) {
            logger.error(`[SERVICE] portal_actions:list - Error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get full portal configuration (v1) with actions, alerts, and widgets
     * @param {string} code - Portal code
     * @returns {Promise<Object>} Complete portal configuration
     */
    async getFull(code) {
        logger.info(`[SERVICE] portals:getFull - Fetching full config for portal: ${code}`);
        try {
            // Get portal with all v1 fields
            const portalQuery = `
                SELECT 
                    uuid,
                    code,
                    name,
                    base_url,
                    thumbnail_url,
                    is_active,
                    view_component,
                    title,
                    subtitle,
                    welcome_template,
                    logo_url,
                    theme_primary_color,
                    theme_secondary_color,
                    show_chat,
                    show_alerts,
                    chat_default_message,
                    created_at,
                    updated_at
                FROM core.portals
                WHERE code = $1 AND is_active = true
            `;
            
            const portalResult = await pool.query(portalQuery, [code]);
            
            if (portalResult.rows.length === 0) {
                logger.error(`[SERVICE] portals:getFull - Portal not found or inactive: ${code}`);
                const error = new Error('Portal not found or inactive');
                error.code = 'NOT_FOUND';
                throw error;
            }
            
            const portal = portalResult.rows[0];
            
            // Get quick actions (ordered by display_order)
            const actionsQuery = `
                SELECT 
                    uuid,
                    action_code,
                    http_method,
                    endpoint,
                    payload_json,
                    headers_json,
                    display_title,
                    description,
                    icon_type,
                    icon_value,
                    display_order
                FROM core.portal_actions
                WHERE rel_portal_uuid = $1 
                  AND is_quick_action = true 
                  AND is_visible = true
                ORDER BY display_order ASC
            `;
            
            const actionsResult = await pool.query(actionsQuery, [portal.uuid]);
            
            // Get active alerts (within date range)
            const alertsQuery = `
                SELECT 
                    uuid,
                    message,
                    alert_type,
                    start_date,
                    end_date,
                    display_order
                FROM core.portal_alerts
                WHERE rel_portal_uuid = $1 
                  AND is_active = true
                  AND start_date <= CURRENT_TIMESTAMP
                  AND (end_date IS NULL OR end_date >= CURRENT_TIMESTAMP)
                ORDER BY display_order ASC
            `;
            
            const alertsResult = await pool.query(alertsQuery, [portal.uuid]);
            
            // Get visible widgets (ordered by display_order)
            const widgetsQuery = `
                SELECT 
                    uuid,
                    widget_code,
                    display_title,
                    widget_type,
                    api_endpoint,
                    api_method,
                    api_params,
                    refresh_interval,
                    display_order
                FROM core.portal_widgets
                WHERE rel_portal_uuid = $1 
                  AND is_visible = true
                ORDER BY display_order ASC
            `;
            
            const widgetsResult = await pool.query(widgetsQuery, [portal.uuid]);
            
            logger.info(`[SERVICE] portals:getFull - Portal loaded: ${actionsResult.rows.length} actions, ${alertsResult.rows.length} alerts, ${widgetsResult.rows.length} widgets`);
            
            return {
                ...portal,
                quick_actions: actionsResult.rows,
                alerts: alertsResult.rows,
                widgets: widgetsResult.rows
            };
        } catch (error) {
            logger.error(`[SERVICE] portals:getFull - Error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Resolve a portal by code
     * @param {string} code - Portal code
     * @returns {Promise<Object>} Portal with actions
     */
    async resolve(code) {
        logger.info(`[SERVICE] portals:resolve - Resolving portal with code: ${code}`);
        try {
            const query = `
                SELECT 
                    uuid,
                    code,
                    name,
                    base_url,
                    thumbnail_url,
                    is_active,
                    created_at,
                    updated_at
                FROM core.portals
                WHERE code = $1 AND is_active = true
            `;

            const result = await pool.query(query, [code]);

            if (result.rows.length === 0) {
                logger.error(`[SERVICE] portals:resolve - No active portal found for code: ${code}`);
                const error = new Error('Portal not found or inactive');
                error.code = 'NOT_FOUND';
                throw error;
            }

            const portal = result.rows[0];

            // Fetch actions for this portal
            const actionsQuery = `
                SELECT 
                    uuid,
                    rel_portal_uuid,
                    action_code,
                    http_method,
                    endpoint,
                    payload_json,
                    headers_json,
                    created_at,
                    updated_at
                FROM core.portal_actions
                WHERE rel_portal_uuid = $1
                ORDER BY action_code ASC
            `;

            const actionsResult = await pool.query(actionsQuery, [portal.uuid]);

            logger.info(`[SERVICE] portals:resolve - Portal resolved with ${actionsResult.rows.length} actions`);

            return {
                ...portal,
                actions: actionsResult.rows
            };
        } catch (error) {
            logger.error(`[SERVICE] portals:resolve - Error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new PortalsService();
