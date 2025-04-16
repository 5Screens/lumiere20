const { pool } = require('../../../config/database');
const logger = require('../../../config/logger');

const getChangeOptions = async (questionId, lang) => {
    logger.info(`[SERVICE] Getting change options for question_id: ${questionId || 'all'}, language: ${lang || 'all'}`);
    
    try {
        let query;
        let params = [];
        let whereClause = '';
        let paramIndex = 1;
        
        // Ajouter la condition de question_id si elle est fournie
        if (questionId) {
            whereClause = `WHERE UPPER(co.question_id) = UPPER($${paramIndex})`;
            params.push(questionId);
            paramIndex++;
        }
        
        if (lang) {
            // Si une langue spécifique est demandée
            query = `
                SELECT 
                    co.code as value, 
                    co.question_id,
                    COALESCE(col.label, co.code) as label
                FROM configuration.change_options_codes co
                LEFT JOIN translations.change_options_labels col 
                    ON co.code = col.rel_change_option_code 
                    AND col.lang = $${paramIndex}
                INNER JOIN translations.languages l 
                    ON l.code = $${paramIndex} 
                    AND l.is_active = true
                ${whereClause}
                ORDER BY co.question_id, co.weight ASC`;
            
            params.push(lang);
        } else {
            // Si aucune langue n'est spécifiée, renvoyer toutes les traductions
            query = `
                SELECT 
                    co.code as value,
                    co.question_id,
                    col.lang,
                    COALESCE(col.label, co.code) as label
                FROM configuration.change_options_codes co
                LEFT JOIN translations.change_options_labels col 
                    ON co.code = col.rel_change_option_code
                INNER JOIN translations.languages l 
                    ON l.code = col.lang 
                    AND l.is_active = true
                ${whereClause}
                ORDER BY co.question_id, co.weight ASC, col.lang ASC`;
        }
        
        const result = await pool.query(query, params);
        
        logger.info(`[SERVICE] Found ${result.rows.length} change options`);
        
        return result.rows;
    } catch (error) {
        logger.error(`[SERVICE] Error getting change options: ${error.message}`);
        throw error;
    }
};

module.exports = {
    getChangeOptions
};
