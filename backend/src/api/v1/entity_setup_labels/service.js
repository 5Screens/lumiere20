const { pool } = require('../../../config/database');
const db = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Crée un nouveau entity_setup_label
 * @param {Object} translationData - Données de la traduction à créer
 * @returns {Object} Traduction créée
 */
async function createEntitySetupLabel(translationData) {
    logger.info('[SERVICE] createEntitySetupLabel - Starting transaction');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        logger.info('[SERVICE] createEntitySetupLabel - Transaction started');

        const { parent_uuid, label, lang_code } = translationData;
        logger.info(`[SERVICE] createEntitySetupLabel - Creating label for parent_uuid: ${parent_uuid}, lang: ${lang_code}`);

        // Récupérer le code depuis configuration.entity_setup_codes avec l'UUID
        const getCodeQuery = `
            SELECT code FROM configuration.entity_setup_codes WHERE uuid = $1
        `;
        const codeResult = await client.query(getCodeQuery, [parent_uuid]);
        
        if (codeResult.rows.length === 0) {
            throw new Error(`Entity setup with UUID ${parent_uuid} not found`);
        }
        
        const rel_entity_setup_code = codeResult.rows[0].code;
        logger.info(`[SERVICE] createEntitySetupLabel - Found code: ${rel_entity_setup_code} for UUID: ${parent_uuid}`);

        // Insérer dans translations.entity_setup_labels
        const insertQuery = `
            INSERT INTO translations.entity_setup_labels (rel_entity_setup_code, lang, label)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const insertResult = await client.query(insertQuery, [rel_entity_setup_code, lang_code, label]);
        
        logger.info(`[SERVICE] createEntitySetupLabel - Successfully created entity setup label with UUID: ${insertResult.rows[0].uuid}`);

        await client.query('COMMIT');
        logger.info('[SERVICE] createEntitySetupLabel - Transaction committed successfully');

        return insertResult.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`[SERVICE] createEntitySetupLabel - Transaction rolled back due to error: ${error.message}`);
        throw error;
    } finally {
        client.release();
        logger.info('[SERVICE] createEntitySetupLabel - Database client released');
    }
}

/**
 * Met à jour un entity_setup_label
 * @param {string} uuid - UUID du label à mettre à jour
 * @param {Object} updateData - Données à mettre à jour
 * @returns {Object} Label mis à jour
 */
async function patchEntitySetupLabel(uuid, updateData) {
    logger.info(`[SERVICE] patchEntitySetupLabel - Starting update for UUID: ${uuid}`);
    try {
        const updateQuery = `
            UPDATE translations.entity_setup_labels 
            SET label = $1, updated_at = CURRENT_TIMESTAMP
            WHERE uuid = $2
            RETURNING *
        `;
        
        const result = await db.query(updateQuery, [updateData.label, uuid]);
        
        if (result.rows.length === 0) {
            logger.info(`[SERVICE] patchEntitySetupLabel - No entity setup label found with UUID: ${uuid}`);
            return null;
        }
        
        logger.info(`[SERVICE] patchEntitySetupLabel - Successfully updated entity setup label with UUID: ${uuid}`);
        return result.rows[0];
    } catch (error) {
        logger.error(`[SERVICE] patchEntitySetupLabel - Database error: ${error.message}`);
        throw error;
    }
}

module.exports = {
    createEntitySetupLabel,
    patchEntitySetupLabel
};
