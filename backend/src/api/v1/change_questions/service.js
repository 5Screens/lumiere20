const { pool } = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Récupère tous les change_questions_codes avec leurs traductions
 */
const getAllChangeQuestions = async (lang) => {
    logger.info(`[SERVICE] getAllChangeQuestions - Getting all change questions with lang: ${lang || 'all'}`);
    
    try {
        let query;
        let params = [];
        
        if (lang) {
            query = `
                SELECT 
                    cqc.uuid,
                    cqc.code,
                    cqc.metadata,
                    cqc.question_id,
                    cql.label
                FROM configuration.change_questions_codes cqc
                LEFT JOIN translations.change_questions_labels cql 
                    ON cqc.code = cql.rel_change_question_code 
                    AND cql.lang = $1
                ORDER BY cqc.metadata, cqc.question_id`;
            params = [lang];
        } else {
            query = `
                SELECT 
                    cqc.uuid,
                    cqc.code,
                    cqc.metadata,
                    cqc.question_id,
                    cql.lang,
                    cql.label
                FROM configuration.change_questions_codes cqc
                LEFT JOIN translations.change_questions_labels cql 
                    ON cqc.code = cql.rel_change_question_code
                ORDER BY cqc.metadata, cqc.question_id, cql.lang`;
        }
        
        const result = await pool.query(query, params);
        
        if (lang) {
            logger.info(`[SERVICE] getAllChangeQuestions - Found ${result.rows.length} change questions for language ${lang}`);
            return result.rows;
        } else {
            // Grouper par code avec toutes les traductions
            const groupedResults = {};
            
            result.rows.forEach(row => {
                if (!groupedResults[row.code]) {
                    groupedResults[row.code] = {
                        uuid: row.uuid,
                        code: row.code,
                        metadata: row.metadata,
                        question_id: row.question_id,
                        labels: {}
                    };
                }
                
                if (row.lang && row.label) {
                    groupedResults[row.code].labels[row.lang] = row.label;
                }
            });
            
            const finalResult = Object.values(groupedResults);
            logger.info(`[SERVICE] getAllChangeQuestions - Found ${finalResult.length} change questions with all translations`);
            return finalResult;
        }
    } catch (error) {
        logger.error(`[SERVICE] getAllChangeQuestions - Error: ${error.message}`);
        throw error;
    }
};

/**
 * Récupère un change_questions_code par UUID avec toutes ses traductions
 */
const getChangeQuestionByUuid = async (uuid) => {
    logger.info(`[SERVICE] getChangeQuestionByUuid - Getting change question with UUID: ${uuid}`);
    
    try {
        const query = `
            SELECT 
                cqc.uuid,
                cqc.code,
                cqc.metadata,
                cqc.question_id,
                cqc.created_at,
                cqc.updated_at,
                COALESCE(
                    json_object_agg(
                        cql.lang, 
                        json_build_object(
                            'uuid', cql.uuid,
                            'label', cql.label,
                            'lang', cql.lang
                        )
                    ) FILTER (WHERE cql.lang IS NOT NULL), 
                    '{}'
                ) as labels
            FROM configuration.change_questions_codes cqc
            LEFT JOIN translations.change_questions_labels cql 
                ON cqc.code = cql.rel_change_question_code
            WHERE cqc.uuid = $1
            GROUP BY cqc.uuid, cqc.code, cqc.metadata, cqc.question_id, cqc.created_at, cqc.updated_at`;
        
        const result = await pool.query(query, [uuid]);
        
        if (result.rows.length === 0) {
            logger.info(`[SERVICE] getChangeQuestionByUuid - Change question not found with UUID: ${uuid}`);
            return null;
        }
        
        logger.info(`[SERVICE] getChangeQuestionByUuid - Successfully retrieved change question with UUID: ${uuid}`);
        return result.rows[0];
    } catch (error) {
        logger.error(`[SERVICE] getChangeQuestionByUuid - Error: ${error.message}`);
        throw error;
    }
};

/**
 * Met à jour un change_questions_code
 */
const updateChangeQuestion = async (uuid, updateData) => {
    logger.info(`[SERVICE] updateChangeQuestion - Updating change question with UUID: ${uuid}`);
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Différer la contrainte de clé étrangère pour permettre la mise à jour du code
        await client.query('SET CONSTRAINTS change_questions_labels_rel_change_question_code_fkey DEFERRED');
        logger.info('[SERVICE] updateChangeQuestion - Foreign key constraint deferred');
        
        // Mettre à jour la table principale
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;
        
        if (updateData.code !== undefined) {
            updateFields.push(`code = $${paramIndex}`);
            updateValues.push(updateData.code);
            paramIndex++;
        }
        
        if (updateData.metadata !== undefined) {
            updateFields.push(`metadata = $${paramIndex}`);
            updateValues.push(updateData.metadata);
            paramIndex++;
        }
        
        if (updateData.question_id !== undefined) {
            updateFields.push(`question_id = $${paramIndex}`);
            updateValues.push(updateData.question_id);
            paramIndex++;
        }
        
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(uuid);
        
        const updateQuery = `
            UPDATE configuration.change_questions_codes 
            SET ${updateFields.join(', ')}
            WHERE uuid = $${paramIndex}
            RETURNING *`;
        
        const updateResult = await client.query(updateQuery, updateValues);
        
        if (updateResult.rows.length === 0) {
            await client.query('ROLLBACK');
            logger.info(`[SERVICE] updateChangeQuestion - Change question not found with UUID: ${uuid}`);
            return null;
        }
        
        // Si le code a été modifié, mettre à jour les références dans les traductions
        if (updateData.code !== undefined) {
            const oldCodeQuery = 'SELECT code FROM configuration.change_questions_codes WHERE uuid = $1';
            const oldCodeResult = await client.query(oldCodeQuery, [uuid]);
            
            if (oldCodeResult.rows.length > 0) {
                const oldCode = oldCodeResult.rows[0].code;
                
                if (oldCode !== updateData.code) {
                    const updateTranslationsQuery = `
                        UPDATE translations.change_questions_labels 
                        SET rel_change_question_code = $1, updated_at = CURRENT_TIMESTAMP
                        WHERE rel_change_question_code = $2`;
                    
                    const translationUpdateResult = await client.query(updateTranslationsQuery, [updateData.code, oldCode]);
                    logger.info(`[SERVICE] updateChangeQuestion - Updated ${translationUpdateResult.rowCount} translation references`);
                }
            }
        }
        
        await client.query('COMMIT');
        
        logger.info(`[SERVICE] updateChangeQuestion - Successfully updated change question with UUID: ${uuid}`);
        return updateResult.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`[SERVICE] updateChangeQuestion - Error: ${error.message}`);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Crée un nouveau change_questions_code
 */
const createChangeQuestion = async (questionData) => {
    logger.info('[SERVICE] createChangeQuestion - Creating new change question');
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Insérer le code principal
        const insertQuery = `
            INSERT INTO configuration.change_questions_codes (code, metadata, question_id)
            VALUES ($1, $2, $3)
            RETURNING *`;
        
        const result = await client.query(insertQuery, [
            questionData.code,
            questionData.metadata,
            questionData.question_id
        ]);
        
        const newQuestion = result.rows[0];
        
        // Insérer les traductions si fournies
        if (questionData.labels && Array.isArray(questionData.labels)) {
            for (const label of questionData.labels) {
                const insertLabelQuery = `
                    INSERT INTO translations.change_questions_labels (rel_change_question_code, lang, label)
                    VALUES ($1, $2, $3)`;
                
                await client.query(insertLabelQuery, [
                    newQuestion.code,
                    label.label_lang_code,
                    label.label
                ]);
            }
            
            logger.info(`[SERVICE] createChangeQuestion - Inserted ${questionData.labels.length} labels`);
        }
        
        await client.query('COMMIT');
        
        logger.info(`[SERVICE] createChangeQuestion - Successfully created change question with UUID: ${newQuestion.uuid}`);
        return newQuestion;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`[SERVICE] createChangeQuestion - Error: ${error.message}`);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Get change questions based on optional filters (fonction legacy)
 * @param {string} lang - Optional language code filter
 * @param {string} question_id - Optional question ID filter
 * @returns {Array} - Array of change questions
 */
const getChangeQuestions = async (lang, question_id) => {
    logger.info(`[SERVICE] getChangeQuestions - Getting change questions with filters - lang: ${lang || 'all'}, question_id: ${question_id || 'all'}`);
    
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
        
        logger.info(`[SERVICE] getChangeQuestions - Found ${result.rows.length} change questions`);
        
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
        logger.error(`[SERVICE] getChangeQuestions - Error getting change questions: ${error.message}`);
        throw error;
    }
};

module.exports = {
    getAllChangeQuestions,
    getChangeQuestionByUuid,
    updateChangeQuestion,
    createChangeQuestion,
    getChangeQuestions
};
