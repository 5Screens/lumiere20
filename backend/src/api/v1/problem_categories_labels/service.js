const { pool } = require('../../../config/database');
const db = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Crée un nouveau problem_categories_label
 * @param {Object} translationData - Données de la traduction à créer
 * @returns {Object} Traduction créée
 */
async function createProblemCategoryLabel(translationData) {
    logger.info('[SERVICE] createProblemCategoryLabel - Starting transaction');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        logger.info('[SERVICE] createProblemCategoryLabel - Transaction started');

        const { parent_uuid, label, lang_code } = translationData;
        logger.info(`[SERVICE] createProblemCategoryLabel - Creating label for parent_uuid: ${parent_uuid}, lang: ${lang_code}`);

        // Récupérer le code depuis configuration.problem_categories avec l'UUID
        const getCodeQuery = `
            SELECT code FROM configuration.problem_categories WHERE uuid = $1
        `;
        const codeResult = await client.query(getCodeQuery, [parent_uuid]);
        
        if (codeResult.rows.length === 0) {
            throw new Error(`Problem category with UUID ${parent_uuid} not found`);
        }
        
        const rel_problem_category_code = codeResult.rows[0].code;
        logger.info(`[SERVICE] createProblemCategoryLabel - Found code: ${rel_problem_category_code} for UUID: ${parent_uuid}`);

        // Insérer dans translations.problem_categories_labels
        const insertQuery = `
            INSERT INTO translations.problem_categories_labels (rel_problem_category_code, lang, label)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const insertResult = await client.query(insertQuery, [rel_problem_category_code, lang_code, label]);
        
        logger.info(`[SERVICE] createProblemCategoryLabel - Successfully created problem category label with UUID: ${insertResult.rows[0].uuid}`);

        await client.query('COMMIT');
        logger.info('[SERVICE] createProblemCategoryLabel - Transaction committed successfully');

        return insertResult.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`[SERVICE] createProblemCategoryLabel - Transaction rolled back due to error: ${error.message}`);
        throw error;
    } finally {
        client.release();
        logger.info('[SERVICE] createProblemCategoryLabel - Database client released');
    }
}

/**
 * Met à jour un problem_categories_label
 * @param {string} uuid - UUID du label à mettre à jour
 * @param {Object} updateData - Données à mettre à jour
 * @returns {Object} Label mis à jour
 */
async function patchProblemCategoryLabel(uuid, updateData) {
    logger.info(`[SERVICE] patchProblemCategoryLabel - Starting update for UUID: ${uuid}`);
    try {
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (updateData.label) {
            updateFields.push(`label = $${paramIndex}`);
            updateValues.push(updateData.label);
            paramIndex++;
        }

        if (updateFields.length === 0) {
            logger.info('[SERVICE] patchProblemCategoryLabel - No fields to update');
            return null;
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(uuid);

        const updateQuery = `
            UPDATE translations.problem_categories_labels 
            SET ${updateFields.join(', ')}
            WHERE uuid = $${paramIndex}
            RETURNING *
        `;

        const result = await db.query(updateQuery, updateValues);
        
        if (result.rows.length === 0) {
            logger.info(`[SERVICE] patchProblemCategoryLabel - No problem category label found with UUID: ${uuid}`);
            return null;
        }

        logger.info(`[SERVICE] patchProblemCategoryLabel - Successfully updated problem category label with UUID: ${uuid}`);
        return result.rows[0];
    } catch (error) {
        logger.error(`[SERVICE] patchProblemCategoryLabel - Error updating problem category label: ${error.message}`);
        throw error;
    }
}

module.exports = {
    createProblemCategoryLabel,
    patchProblemCategoryLabel
};
