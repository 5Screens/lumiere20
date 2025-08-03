const { pool } = require('../../../config/database');
const db = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Crée un nouveau change_options_label
 * @param {Object} translationData - Données de la traduction à créer
 * @returns {Object} Traduction créée
 */
async function createChangeOptionLabel(translationData) {
    logger.info('[SERVICE] createChangeOptionLabel - Starting transaction');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        logger.info('[SERVICE] createChangeOptionLabel - Transaction started');

        const { parent_uuid, label, lang_code } = translationData;
        logger.info(`[SERVICE] createChangeOptionLabel - Creating label for parent_uuid: ${parent_uuid}, lang: ${lang_code}`);

        // Récupérer le code depuis configuration.change_options_codes avec l'UUID
        const getCodeQuery = `
            SELECT code FROM configuration.change_options_codes WHERE uuid = $1
        `;
        const codeResult = await client.query(getCodeQuery, [parent_uuid]);
        
        if (codeResult.rows.length === 0) {
            throw new Error(`Change option with UUID ${parent_uuid} not found`);
        }
        
        const rel_change_option_code = codeResult.rows[0].code;
        logger.info(`[SERVICE] createChangeOptionLabel - Found code: ${rel_change_option_code} for UUID: ${parent_uuid}`);

        // Insérer dans translations.change_options_labels
        const insertQuery = `
            INSERT INTO translations.change_options_labels (rel_change_option_code, lang, label)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const insertResult = await client.query(insertQuery, [rel_change_option_code, lang_code, label]);
        
        logger.info(`[SERVICE] createChangeOptionLabel - Successfully created change option label with UUID: ${insertResult.rows[0].uuid}`);

        await client.query('COMMIT');
        logger.info('[SERVICE] createChangeOptionLabel - Transaction committed successfully');

        return insertResult.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`[SERVICE] createChangeOptionLabel - Transaction rolled back due to error: ${error.message}`);
        throw error;
    } finally {
        client.release();
        logger.info('[SERVICE] createChangeOptionLabel - Database client released');
    }
}

/**
 * Met à jour un change_options_label
 * @param {string} uuid - UUID du label à mettre à jour
 * @param {Object} updateData - Données à mettre à jour
 * @returns {Object} Label mis à jour
 */
async function patchChangeOptionLabel(uuid, updateData) {
    logger.info(`[SERVICE] patchChangeOptionLabel - Starting update for UUID: ${uuid}`);
    try {
        const { label } = updateData;
        
        const updateQuery = `
            UPDATE translations.change_options_labels 
            SET label = $1, updated_at = CURRENT_TIMESTAMP
            WHERE uuid = $2
            RETURNING *
        `;
        
        const result = await db.query(updateQuery, [label, uuid]);
        
        if (result.rows.length === 0) {
            logger.info(`[SERVICE] patchChangeOptionLabel - No change option label found with UUID: ${uuid}`);
            return null;
        }
        
        logger.info(`[SERVICE] patchChangeOptionLabel - Successfully updated change option label`);
        return result.rows[0];
    } catch (error) {
        logger.error(`[SERVICE] patchChangeOptionLabel - Database error: ${error.message}`);
        throw error;
    }
}

module.exports = {
    createChangeOptionLabel,
    patchChangeOptionLabel
};
