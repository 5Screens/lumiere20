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
     * Get a portal by UUID
     * @param {string} uuid - Portal UUID
     * @returns {Promise<Object>} Portal data
     */
    async getByUuid(uuid) {
        logger.info(`[SERVICE] portals:getByUuid - Fetching portal with UUID: ${uuid}`);
        try {
            const query = `
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
                    show_actions,
                    show_widgets,
                    chat_default_message,
                    created_at,
                    updated_at
                FROM core.portals
                WHERE uuid = $1
            `;
            
            const result = await pool.query(query, [uuid]);
            
            if (result.rows.length === 0) {
                logger.error(`[SERVICE] portals:getByUuid - Portal not found: ${uuid}`);
                const error = new Error('Portal not found');
                error.code = 'NOT_FOUND';
                throw error;
            }
            
            logger.info(`[SERVICE] portals:getByUuid - Portal found: ${result.rows[0].code}`);
            return result.rows[0];
        } catch (error) {
            logger.error(`[SERVICE] portals:getByUuid - Error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update a portal
     * @param {string} uuid - Portal UUID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated portal
     */
    async update(uuid, updateData) {
        logger.info(`[SERVICE] portals:update - Updating portal ${uuid}`);
        try {
            // Check if portal exists
            const checkQuery = `SELECT uuid, code FROM core.portals WHERE uuid = $1`;
            const checkResult = await pool.query(checkQuery, [uuid]);
            
            if (checkResult.rows.length === 0) {
                logger.error(`[SERVICE] portals:update - Portal not found: ${uuid}`);
                const error = new Error('Portal not found');
                error.code = 'NOT_FOUND';
                throw error;
            }
            
            const currentPortal = checkResult.rows[0];
            
            // If code is being updated, check uniqueness
            if (updateData.code && updateData.code !== currentPortal.code) {
                const codeCheckQuery = `SELECT 1 FROM core.portals WHERE code = $1 AND uuid != $2`;
                const codeCheckResult = await pool.query(codeCheckQuery, [updateData.code, uuid]);
                
                if (codeCheckResult.rows.length > 0) {
                    logger.error(`[SERVICE] portals:update - Code already exists: ${updateData.code}`);
                    const error = new Error('Portal code already exists');
                    error.code = 'CONFLICT';
                    throw error;
                }
            }
            
            // Build dynamic update query
            const fields = [];
            const values = [];
            let paramCount = 1;
            
            const allowedFields = [
                'code', 'name', 'base_url', 'thumbnail_url', 'view_component',
                'title', 'subtitle', 'welcome_template', 'logo_url',
                'theme_primary_color', 'theme_secondary_color',
                'show_chat', 'show_alerts', 'show_actions', 'show_widgets', 'chat_default_message'
            ];
            
            for (const field of allowedFields) {
                if (updateData.hasOwnProperty(field)) {
                    fields.push(`${field} = $${paramCount}`);
                    values.push(updateData[field]);
                    paramCount++;
                }
            }
            
            if (fields.length === 0) {
                logger.warn(`[SERVICE] portals:update - No fields to update`);
                return currentPortal;
            }
            
            // Add updated_at
            fields.push(`updated_at = CURRENT_TIMESTAMP`);
            
            // Add UUID as last parameter
            values.push(uuid);
            
            const updateQuery = `
                UPDATE core.portals
                SET ${fields.join(', ')}
                WHERE uuid = $${paramCount}
                RETURNING 
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
                    show_actions,
                    show_widgets,
                    chat_default_message,
                    created_at,
                    updated_at
            `;
            
            const result = await pool.query(updateQuery, values);
            const updatedPortal = result.rows[0];
            logger.info(`[SERVICE] portals:update - Portal ${uuid} updated successfully`);
            
            // Update junction tables if provided
            if (updateData.selected_actions !== undefined) {
                await this.updatePortalActions(uuid, updateData.selected_actions);
            }
            
            if (updateData.selected_alerts !== undefined) {
                await this.updatePortalAlerts(uuid, updateData.selected_alerts);
            }
            
            if (updateData.selected_widgets !== undefined) {
                await this.updatePortalWidgets(uuid, updateData.selected_widgets);
            }
            
            return updatedPortal;
        } catch (error) {
            logger.error(`[SERVICE] portals:update - Error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update portal actions junction table
     * @param {string} portalUuid - Portal UUID
     * @param {Array} actionUuids - Array of action UUIDs to link
     */
    async updatePortalActions(portalUuid, actionUuids) {
        logger.info(`[SERVICE] portals:updatePortalActions - Updating actions for portal ${portalUuid}`);
        try {
            // Delete existing links
            await pool.query('DELETE FROM core.portal__portal_actions WHERE rel_portal = $1', [portalUuid]);
            
            // Insert new links
            if (actionUuids && actionUuids.length > 0) {
                for (let i = 0; i < actionUuids.length; i++) {
                    await pool.query(
                        'INSERT INTO core.portal__portal_actions (rel_portal, rel_portal_action, display_order) VALUES ($1, $2, $3)',
                        [portalUuid, actionUuids[i], i + 1]
                    );
                }
                logger.info(`[SERVICE] portals:updatePortalActions - Linked ${actionUuids.length} actions`);
            }
        } catch (error) {
            logger.error(`[SERVICE] portals:updatePortalActions - Error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update portal alerts junction table
     * @param {string} portalUuid - Portal UUID
     * @param {Array} alertUuids - Array of alert UUIDs to link
     */
    async updatePortalAlerts(portalUuid, alertUuids) {
        logger.info(`[SERVICE] portals:updatePortalAlerts - Updating alerts for portal ${portalUuid}`);
        try {
            // Delete existing links
            await pool.query('DELETE FROM core.portal__portal_alerts WHERE rel_portal = $1', [portalUuid]);
            
            // Insert new links
            if (alertUuids && alertUuids.length > 0) {
                for (let i = 0; i < alertUuids.length; i++) {
                    await pool.query(
                        'INSERT INTO core.portal__portal_alerts (rel_portal, rel_portal_alert, display_order) VALUES ($1, $2, $3)',
                        [portalUuid, alertUuids[i], i + 1]
                    );
                }
                logger.info(`[SERVICE] portals:updatePortalAlerts - Linked ${alertUuids.length} alerts`);
            }
        } catch (error) {
            logger.error(`[SERVICE] portals:updatePortalAlerts - Error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update portal widgets junction table
     * @param {string} portalUuid - Portal UUID
     * @param {Array} widgetUuids - Array of widget UUIDs to link
     */
    async updatePortalWidgets(portalUuid, widgetUuids) {
        logger.info(`[SERVICE] portals:updatePortalWidgets - Updating widgets for portal ${portalUuid}`);
        try {
            // Delete existing links
            await pool.query('DELETE FROM core.portal__portal_widgets WHERE rel_portal = $1', [portalUuid]);
            
            // Insert new links
            if (widgetUuids && widgetUuids.length > 0) {
                for (let i = 0; i < widgetUuids.length; i++) {
                    await pool.query(
                        'INSERT INTO core.portal__portal_widgets (rel_portal, rel_portal_widget, display_order) VALUES ($1, $2, $3)',
                        [portalUuid, widgetUuids[i], i + 1]
                    );
                }
                logger.info(`[SERVICE] portals:updatePortalWidgets - Linked ${widgetUuids.length} widgets`);
            }
        } catch (error) {
            logger.error(`[SERVICE] portals:updatePortalWidgets - Error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Check if a portal code is unique
     * @param {string} code - Portal code to check
     * @param {string} excludeUuid - UUID to exclude from check (for updates)
     * @returns {Promise<Object>} { isUnique: boolean }
     */
    async checkCodeUniqueness(code, excludeUuid = null) {
        logger.info(`[SERVICE] portals:checkCodeUniqueness - Checking code: ${code}`);
        try {
            let query = `SELECT 1 FROM core.portals WHERE code = $1`;
            const params = [code];
            
            if (excludeUuid) {
                query += ` AND uuid != $2`;
                params.push(excludeUuid);
            }
            
            const result = await pool.query(query, params);
            const isUnique = result.rows.length === 0;
            
            logger.info(`[SERVICE] portals:checkCodeUniqueness - Code ${code} is ${isUnique ? 'unique' : 'not unique'}`);
            return { isUnique };
        } catch (error) {
            logger.error(`[SERVICE] portals:checkCodeUniqueness - Error: ${error.message}`);
            throw error;
        }
    }

    /**
     * List all portal models
     * @returns {Promise<Array>} List of portal models
     */
    async listModels() {
        logger.info('[SERVICE] portal_models:list - Starting query');
        try {
            const query = `
                SELECT 
                    uuid,
                    name,
                    description,
                    is_active,
                    created_at,
                    updated_at
                FROM core.portal_models
                WHERE is_active = true
                ORDER BY name ASC
            `;
            
            const result = await pool.query(query);
            logger.info(`[SERVICE] portal_models:list - Found ${result.rows.length} models`);
            return result.rows;
        } catch (error) {
            logger.error(`[SERVICE] portal_models:list - Error: ${error.message}`);
            throw error;
        }
    }

    /**
     * List all portal actions (not linked to a specific portal)
     * @returns {Promise<Array>} List of all portal actions
     */
    async listAllActions() {
        logger.info('[SERVICE] portal_actions:listAll - Starting query');
        try {
            const query = `
                SELECT 
                    uuid,
                    action_code,
                    http_method,
                    endpoint,
                    display_title,
                    description,
                    icon_type,
                    icon_value,
                    is_quick_action,
                    is_visible,
                    created_at,
                    updated_at
                FROM core.portal_actions
                ORDER BY action_code ASC
            `;
            
            const result = await pool.query(query);
            logger.info(`[SERVICE] portal_actions:listAll - Found ${result.rows.length} actions`);
            return result.rows;
        } catch (error) {
            logger.error(`[SERVICE] portal_actions:listAll - Error: ${error.message}`);
            throw error;
        }
    }

    /**
     * List all portal alerts (not linked to a specific portal)
     * @returns {Promise<Array>} List of all portal alerts
     */
    async listAllAlerts() {
        logger.info('[SERVICE] portal_alerts:listAll - Starting query');
        try {
            const query = `
                SELECT 
                    uuid,
                    message,
                    alert_type,
                    start_date,
                    end_date,
                    is_active,
                    created_at,
                    updated_at
                FROM core.portal_alerts
                ORDER BY created_at DESC
            `;
            
            const result = await pool.query(query);
            logger.info(`[SERVICE] portal_alerts:listAll - Found ${result.rows.length} alerts`);
            return result.rows;
        } catch (error) {
            logger.error(`[SERVICE] portal_alerts:listAll - Error: ${error.message}`);
            throw error;
        }
    }

    /**
     * List all portal widgets (not linked to a specific portal)
     * @returns {Promise<Array>} List of all portal widgets
     */
    async listAllWidgets() {
        logger.info('[SERVICE] portal_widgets:listAll - Starting query');
        try {
            const query = `
                SELECT 
                    uuid,
                    widget_code,
                    display_title,
                    widget_type,
                    api_endpoint,
                    api_method,
                    api_params,
                    refresh_interval,
                    is_visible,
                    created_at,
                    updated_at
                FROM core.portal_widgets
                ORDER BY widget_code ASC
            `;
            
            const result = await pool.query(query);
            logger.info(`[SERVICE] portal_widgets:listAll - Found ${result.rows.length} widgets`);
            return result.rows;
        } catch (error) {
            logger.error(`[SERVICE] portal_widgets:listAll - Error: ${error.message}`);
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
            
            // Get quick actions through junction table (ordered by junction table display_order)
            const actionsQuery = `
                SELECT 
                    pa.uuid,
                    pa.action_code,
                    pa.http_method,
                    pa.endpoint,
                    pa.payload_json,
                    pa.headers_json,
                    pa.display_title,
                    pa.description,
                    pa.icon_type,
                    pa.icon_value,
                    ppa.display_order
                FROM core.portal__portal_actions ppa
                INNER JOIN core.portal_actions pa ON ppa.rel_portal_action = pa.uuid
                WHERE ppa.rel_portal = $1 
                  AND pa.is_quick_action = true 
                  AND pa.is_visible = true
                ORDER BY ppa.display_order ASC
            `;
            
            const actionsResult = await pool.query(actionsQuery, [portal.uuid]);
            
            // Get active alerts through junction table (within date range, ordered by junction table display_order)
            const alertsQuery = `
                SELECT 
                    pa.uuid,
                    pa.message,
                    pa.alert_type,
                    pa.start_date,
                    pa.end_date,
                    ppa.display_order
                FROM core.portal__portal_alerts ppa
                INNER JOIN core.portal_alerts pa ON ppa.rel_portal_alert = pa.uuid
                WHERE ppa.rel_portal = $1 
                  AND pa.is_active = true
                  AND pa.start_date <= CURRENT_TIMESTAMP
                  AND (pa.end_date IS NULL OR pa.end_date >= CURRENT_TIMESTAMP)
                ORDER BY ppa.display_order ASC
            `;
            
            const alertsResult = await pool.query(alertsQuery, [portal.uuid]);
            
            // Get visible widgets through junction table (ordered by junction table display_order)
            const widgetsQuery = `
                SELECT 
                    pw.uuid,
                    pw.widget_code,
                    pw.display_title,
                    pw.widget_type,
                    pw.api_endpoint,
                    pw.api_method,
                    pw.api_params,
                    pw.refresh_interval,
                    ppw.display_order
                FROM core.portal__portal_widgets ppw
                INNER JOIN core.portal_widgets pw ON ppw.rel_portal_widget = pw.uuid
                WHERE ppw.rel_portal = $1 
                  AND pw.is_visible = true
                ORDER BY ppw.display_order ASC
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

}

module.exports = new PortalsService();
