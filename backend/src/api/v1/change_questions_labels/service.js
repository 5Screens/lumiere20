const { pool } = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Crée un nouveau change_questions_label
 */
const createChangeQuestionLabel = async (translationData) => {
    logger.info('[SERVICE] createChangeQuestionLabel - Creating new change question label');
    
    const { parent_uuid, label, lang_code } = translationData;
    
    try {
        // Récupérer le code depuis configuration.change_questions_codes avec l'UUID
        const getCodeQuery = `
            SELECT code 
            FROM configuration.change_questions_codes 
            WHERE uuid = $1`;
        
        const codeResult = await pool.query(getCodeQuery, [parent_uuid]);
        
        if (codeResult.rows.length === 0) {
            logger.error(`[SERVICE] createChangeQuestionLabel - Change question not found with UUID: ${parent_uuid}`);
            throw new Error('Change question not found');
        }
        
        const rel_change_question_code = codeResult.rows[0].code;
        
        // Insérer le nouveau label
        const insertQuery = `
            INSERT INTO translations.change_questions_labels (rel_change_question_code, lang, label)
            VALUES ($1, $2, $3)
            RETURNING *`;
        
        const result = await pool.query(insertQuery, [rel_change_question_code, lang_code, label]);
        
        logger.info(`[SERVICE] createChangeQuestionLabel - Successfully created change question label with UUID: ${result.rows[0].uuid}`);
        return result.rows[0];
    } catch (error) {
        logger.error(`[SERVICE] createChangeQuestionLabel - Error: ${error.message}`);
        throw error;
    }
};

/**
 * Met à jour un change_questions_label
 */
const patchChangeQuestionLabel = async (uuid, updateData) => {
    logger.info(`[SERVICE] patchChangeQuestionLabel - Updating change question label with UUID: ${uuid}`);
    
    try {
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;
        
        if (updateData.label !== undefined) {
            updateFields.push(`label = $${paramIndex}`);
            updateValues.push(updateData.label);
            paramIndex++;
        }
        
        if (updateData.lang !== undefined) {
            updateFields.push(`lang = $${paramIndex}`);
            updateValues.push(updateData.lang);
            paramIndex++;
        }
        
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(uuid);
        
        const updateQuery = `
            UPDATE translations.change_questions_labels 
            SET ${updateFields.join(', ')}
            WHERE uuid = $${paramIndex}
            RETURNING *`;
        
        const result = await pool.query(updateQuery, updateValues);
        
        if (result.rows.length === 0) {
            logger.info(`[SERVICE] patchChangeQuestionLabel - Change question label not found with UUID: ${uuid}`);
            return null;
        }
        
        logger.info(`[SERVICE] patchChangeQuestionLabel - Successfully updated change question label with UUID: ${uuid}`);
        return result.rows[0];
    } catch (error) {
        logger.error(`[SERVICE] patchChangeQuestionLabel - Error: ${error.message}`);
        throw error;
    }
};

module.exports = {
    createChangeQuestionLabel,
    patchChangeQuestionLabel
};
