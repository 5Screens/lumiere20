const db = require('../../../config/database');
const logger = require('../../../config/logger');

async function getContactTypes(lang) {
    logger.info('[SERVICE] Getting contact types');
    try {
        const query = `
            SELECT 
                ct.uuid,
                ct.code,
                ctl.label
            FROM configuration.contact_types ct
            LEFT JOIN translations.contact_types_labels ctl 
                ON ct.code = ctl.rel_contact_type_code 
                AND ctl.language = $1
            ORDER BY ct.code ASC
        `;

        const result = await db.query(query, [lang]);
        logger.info(`[SERVICE] Found ${result.rows.length} contact types`);
        return result.rows;
    } catch (error) {
        logger.error(`[SERVICE] Error getting contact types: ${error.message}`);
        throw error;
    }
}

module.exports = {
    getContactTypes
};
