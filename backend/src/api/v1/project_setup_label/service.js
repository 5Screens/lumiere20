const { pool } = require('../../../config/database');
const db = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Crée un nouveau project setup label
 * @param {Object} translationData - Données de traduction à créer
 * @returns {Promise<Object>} - Label créé
 */
async function createProjectSetupLabel(translationData) {
    logger.info('[SERVICE] createProjectSetupLabel - Starting transaction');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        logger.info('[SERVICE] createProjectSetupLabel - Transaction started');

        // Récupérer le code depuis configuration.project_setup_codes avec l'UUID
        const getCodeQuery = `
            SELECT code FROM configuration.project_setup_codes WHERE uuid = $1
        `;
        const codeResult = await client.query(getCodeQuery, [translationData.parent_uuid]);
        
        if (codeResult.rows.length === 0) {
            throw new Error(`Project setup with UUID ${translationData.parent_uuid} not found`);
        }
        
        const projectSetupCode = codeResult.rows[0].code;
        logger.info(`[SERVICE] createProjectSetupLabel - Found project setup code: ${projectSetupCode}`);

        // Insérer dans translations.project_setup_label
        const insertQuery = `
            INSERT INTO translations.project_setup_label (rel_project_setup_code, lang, label)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const insertResult = await client.query(insertQuery, [
            projectSetupCode,
            translationData.lang_code,
            translationData.label
        ]);

        await client.query('COMMIT');
        logger.info('[SERVICE] createProjectSetupLabel - Transaction committed successfully');

        const createdLabel = insertResult.rows[0];
        logger.info(`[SERVICE] createProjectSetupLabel - Successfully created project setup label with UUID: ${createdLabel.uuid}`);
        
        return createdLabel;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`[SERVICE] createProjectSetupLabel - Transaction rolled back due to error: ${error.message}`);
        throw error;
    } finally {
        client.release();
        logger.info('[SERVICE] createProjectSetupLabel - Database client released');
    }
}

/**
 * Met à jour un project setup label
 * @param {string} uuid - UUID du label à mettre à jour
 * @param {Object} updateData - Données à mettre à jour
 * @returns {Promise<Object>} - Label mis à jour
 */
async function patchProjectSetupLabel(uuid, updateData) {
    logger.info(`[SERVICE] patchProjectSetupLabel - Starting update for UUID: ${uuid}`);
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
            throw new Error('No fields to update');
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(uuid);

        const updateQuery = `
            UPDATE translations.project_setup_label 
            SET ${updateFields.join(', ')}
            WHERE uuid = $${paramIndex}
            RETURNING *
        `;

        const result = await db.query(updateQuery, updateValues);

        if (result.rows.length === 0) {
            logger.info(`[SERVICE] patchProjectSetupLabel - No project setup label found with UUID: ${uuid}`);
            return null;
        }

        const updatedLabel = result.rows[0];
        logger.info(`[SERVICE] patchProjectSetupLabel - Successfully updated project setup label`);
        
        return updatedLabel;
    } catch (error) {
        logger.error(`[SERVICE] patchProjectSetupLabel - Database error: ${error.message}`);
        throw error;
    }
}

module.exports = {
    createProjectSetupLabel,
    patchProjectSetupLabel
};
