const db = require('../../../config/database');
const logger = require('../../../config/logger');

const getDefectSetup = async (lang, metadata) => {
    logger.info(`[SERVICE] Getting defect setup data for metadata: ${metadata}, language: ${lang}`);
    try {
        const query = `
            SELECT 
                dsc.code,
                dsl.label
            FROM configuration.defect_setup_codes dsc
            LEFT JOIN translations.defect_setup_labels dsl 
                ON dsl.rel_defect_setup_code = dsc.code 
                AND dsl.lang = $1
            WHERE dsc.metadata = $2
            ORDER BY dsl.label;
        `;
        const result = await db.query(query, [lang, metadata]);
        logger.info(`[SERVICE] Successfully retrieved ${result.rows.length} defect setup entries`);
        return result.rows;
    } catch (error) {
        logger.error(`[SERVICE] Error getting defect setup data: ${error.message}`);
        throw error;
    }
};

module.exports = {
    getDefectSetup
};
