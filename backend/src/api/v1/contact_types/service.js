const db = require('../../../config/database');
const logger = require('../../../config/logger');

async function getContactTypes(lang) {
    logger.info('[SERVICE] Getting contact types');
    try {
        const query = `
            SELECT 
                ct.uuid,
                ct.code,
                COALESCE(ctl.label, ct.code) as label
            FROM configuration.contact_types ct
            LEFT JOIN translations.contact_types_labels ctl 
                ON ct.code = ctl.rel_contact_type_code 
                AND ctl.language = $1
            INNER JOIN translations.languages l 
                ON l.code = $1 
                AND l.is_active = true
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
