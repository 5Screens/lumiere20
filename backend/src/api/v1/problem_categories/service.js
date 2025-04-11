const db = require('../../../config/database');
const logger = require('../../../config/logger');

const getProblemCategories = async (lang, toSelect) => {
    logger.info('[SERVICE] Getting problem categories');
    
    try {
        const query = `
            SELECT 
                pc.uuid,
                pc.code,
                COALESCE(pcl.label, pc.code) as label
            FROM configuration.problem_categories pc
            LEFT JOIN translations.problem_categories_labels pcl 
                ON pc.code = pcl.rel_problem_category_code 
                AND pcl.lang = $1
            INNER JOIN translations.languages l 
                ON l.code = $1 
                AND l.is_active = true
            ORDER BY pc.code ASC;
        `;

        const result = await db.query(query, [lang]);
        
        logger.info(`[SERVICE] Found ${result.rows.length} problem categories`);
        
        // If toSelect=yes, transform the data to value/label pairs for select components
        if (toSelect === 'yes') {
            logger.info('[SERVICE] Transforming problem categories to select format (label/value pairs)');
            return result.rows.map(category => ({
                label: category.label,
                value: category.code
            }));
        }
        
        return result.rows;
    } catch (error) {
        logger.error(`[SERVICE] Error getting problem categories: ${error.message}`);
        throw error;
    }
};

module.exports = {
    getProblemCategories
};
