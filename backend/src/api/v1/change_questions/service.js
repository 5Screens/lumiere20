const { pool } = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Get change questions based on optional filters
 * @param {string} lang - Optional language code filter
 * @param {string} question_id - Optional question ID filter
 * @returns {Array} - Array of change questions
 */
const getChangeQuestions = async (lang, question_id) => {
    logger.info(`[SERVICE] Getting change questions with filters - lang: ${lang || 'all'}, question_id: ${question_id || 'all'}`);
    
    try {
        let query;
        let params = [];
        let paramIndex = 1;
        
        // Base query without filters
        if (!lang && !question_id) {
            query = `
                SELECT 
                    cqc.uuid, 
                    cqc.code as value,
                    cqc.metadata,
                    cqc.question_id,
                    cql.lang,
                    cql.label
                FROM configuration.change_questions_codes cqc
                JOIN translations.change_questions_labels cql 
                    ON cqc.code = cql.rel_change_question_code
                JOIN translations.languages l 
                    ON cql.lang = l.code 
                    AND l.is_active = true
                ORDER BY cqc.metadata, cqc.question_id, cql.lang`;
        } 
        // Query with filters
        else {
            query = `
                SELECT 
                    cqc.uuid, 
                    cqc.code as value,
                    cqc.metadata,
                    cqc.question_id,
                    cql.lang,
                    cql.label
                FROM configuration.change_questions_codes cqc
                JOIN translations.change_questions_labels cql 
                    ON cqc.code = cql.rel_change_question_code
                JOIN translations.languages l 
                    ON cql.lang = l.code 
                    AND l.is_active = true
                WHERE 1=1`;
                
            if (lang) {
                query += ` AND cql.lang = $${paramIndex}`;
                params.push(lang);
                paramIndex++;
            }
            
            if (question_id) {
                query += ` AND cqc.question_id = UPPER($${paramIndex})`;
                params.push(question_id);
                paramIndex++;
            }
            
            query += ` ORDER BY cqc.metadata, cqc.question_id, cql.lang`;
        }
        
        const result = await pool.query(query, params);
        
        logger.info(`[SERVICE] Found ${result.rows.length} change questions`);
        
        // If both lang and question_id are provided, return array format
        if (lang && question_id) {
            return result.rows;
        }
        
        // Group by question code if no specific question_id is requested
        if (!question_id) {
            const groupedResults = {};
            
            result.rows.forEach(row => {
                if (!groupedResults[row.value]) {
                    groupedResults[row.value] = {
                        uuid: row.uuid,
                        value: row.value,
                        metadata: row.metadata,
                        question_id: row.question_id,
                        translations: {}
                    };
                }
                
                groupedResults[row.value].translations[row.lang] = row.label;
            });
            
            return Object.values(groupedResults);
        }
        
        return result.rows;
    } catch (error) {
        logger.error(`[SERVICE] Error getting change questions: ${error.message}`);
        throw error;
    }
};

module.exports = {
    getChangeQuestions
};
