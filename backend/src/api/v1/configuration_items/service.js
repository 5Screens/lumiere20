const db = require('../../../config/database');
const logger = require('../../../config/logger');

const getAllConfigurationItems = async (lang) => {
    try {
        logger.info('[SERVICE] Fetching all configuration items from database');
        const query = `
            SELECT 
                ci.uuid,
                ci.nom,
                ci.description,
                ci.created_at,
                ci.updated_at
            FROM data.configuration_items ci
            ORDER BY ci.nom ASC
        `;
        
        const result = await db.query(query);
        logger.info(`[SERVICE] Retrieved ${result.rows.length} configuration items`);
        return result.rows;
    } catch (error) {
        logger.error('[SERVICE] Error in getAllConfigurationItems service:', error);
        throw error;
    }
};

module.exports = {
    getAllConfigurationItems
};
