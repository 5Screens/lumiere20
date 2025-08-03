const { pool } = require('../../../config/database');
const db = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Crée un nouveau change_setup_label
 * @param {Object} translationData - Données de la traduction à créer
 * @returns {Object} Traduction créée
 */
async function createChangeSetupLabel(translationData) {
    logger.info('[SERVICE] createChangeSetupLabel - Starting transaction');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        logger.info('[SERVICE] createChangeSetupLabel - Transaction started');

        const { parent_uuid, label, lang_code } = translationData;
        logger.info(`[SERVICE] createChangeSetupLabel - Creating label for parent_uuid: ${parent_uuid}, lang: ${lang_code}`);

        // Récupérer le code depuis configuration.change_setup_codes avec l'UUID
        const getCodeQuery = `
            SELECT code FROM configuration.change_setup_codes WHERE uuid = $1
        `;
        const codeResult = await client.query(getCodeQuery, [parent_uuid]);
        
        if (codeResult.rows.length === 0) {
            throw new Error(`Change setup with UUID ${parent_uuid} not found`);
        }
        
        const rel_change_setup_code = codeResult.rows[0].code;
        logger.info(`[SERVICE] createChangeSetupLabel - Found code: ${rel_change_setup_code} for UUID: ${parent_uuid}`);

        // Insérer dans translations.change_setup_label
        const insertQuery = `
            INSERT INTO translations.change_setup_label (rel_change_setup_code, lang, label)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const insertResult = await client.query(insertQuery, [rel_change_setup_code, lang_code, label]);
        
        logger.info(`[SERVICE] createChangeSetupLabel - Successfully created change setup label with UUID: ${insertResult.rows[0].uuid}`);

        await client.query('COMMIT');
        logger.info('[SERVICE] createChangeSetupLabel - Transaction committed successfully');

        return insertResult.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`[SERVICE] createChangeSetupLabel - Transaction rolled back due to error: ${error.message}`);
        throw error;
    } finally {
        client.release();
        logger.info('[SERVICE] createChangeSetupLabel - Database client released');
    }
}

/**
 * Met à jour un change_setup_label
 * @param {string} uuid - UUID du label à mettre à jour
 * @param {Object} updateData - Données à mettre à jour
 * @returns {Object} Label mis à jour
 */
async function patchChangeSetupLabel(uuid, updateData) {
    logger.info(`[SERVICE] patchChangeSetupLabel - Starting update for UUID: ${uuid}`);
    try {
        const { label } = updateData;
        
        const updateQuery = `
            UPDATE translations.change_setup_label 
            SET label = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE uuid = $2
            RETURNING *
        `;
        const result = await db.query(updateQuery, [label, uuid]);
        
        if (result.rows.length === 0) {
            throw new Error(`Change setup label with UUID ${uuid} not found`);
        }
        
        logger.info(`[SERVICE] patchChangeSetupLabel - Successfully updated change setup label with UUID: ${uuid}`);
        return result.rows[0];
    } catch (error) {
        logger.error(`[SERVICE] patchChangeSetupLabel - Error updating change setup label: ${error.message}`);
        throw error;
    }
}

module.exports = {
    createChangeSetupLabel,
    patchChangeSetupLabel
};
