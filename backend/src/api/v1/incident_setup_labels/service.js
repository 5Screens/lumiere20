const { pool } = require('../../../config/database');
const db = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Crée un nouveau label pour incident_setup
 * @param {Object} labelData - Données du label à créer
 * @returns {Object} Label créé
 */
async function createIncidentSetupLabel(labelData) {
    logger.info('[SERVICE] createIncidentSetupLabel - Starting transaction');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        logger.info('[SERVICE] createIncidentSetupLabel - Transaction started');

        const { parent_uuid, label, lang_code } = labelData;
        logger.info(`[SERVICE] createIncidentSetupLabel - Creating label for parent_uuid: ${parent_uuid}, lang_code: ${lang_code}`);

        // Récupérer le code depuis configuration.incident_setup_codes avec l'UUID
        const getCodeQuery = `
            SELECT code FROM configuration.incident_setup_codes WHERE uuid = $1
        `;
        const codeResult = await client.query(getCodeQuery, [parent_uuid]);
        
        if (codeResult.rows.length === 0) {
            throw new Error(`Incident setup with UUID ${parent_uuid} not found`);
        }
        
        const rel_incident_setup_code = codeResult.rows[0].code;
        logger.info(`[SERVICE] createIncidentSetupLabel - Found code: ${rel_incident_setup_code} for UUID: ${parent_uuid}`);

        // Insérer le label dans translations.incident_setup_labels
        const insertLabelQuery = `
            INSERT INTO translations.incident_setup_labels (rel_incident_setup_code, lang, label)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const labelResult = await client.query(insertLabelQuery, [
            rel_incident_setup_code,
            lang_code,
            label
        ]);

        await client.query('COMMIT');
        logger.info('[SERVICE] createIncidentSetupLabel - Transaction committed successfully');

        const createdLabel = labelResult.rows[0];
        logger.info(`[SERVICE] createIncidentSetupLabel - Successfully created label with UUID: ${createdLabel.uuid}`);
        return createdLabel;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`[SERVICE] createIncidentSetupLabel - Transaction rolled back due to error: ${error.message}`);
        throw error;
    } finally {
        client.release();
        logger.info('[SERVICE] createIncidentSetupLabel - Database client released');
    }
}

/**
 * Met à jour un label d'incident_setup
 * @param {string} uuid - UUID du label à mettre à jour
 * @param {Object} labelData - Données à mettre à jour
 * @returns {Object} Label mis à jour
 */
async function patchIncidentSetupLabel(uuid, labelData) {
    logger.info(`[SERVICE] patchIncidentSetupLabel - Starting update for UUID: ${uuid}`);
    try {
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (labelData.label) {
            updateFields.push(`label = $${paramIndex}`);
            updateValues.push(labelData.label);
            paramIndex++;
        }

        if (labelData.lang) {
            updateFields.push(`lang = $${paramIndex}`);
            updateValues.push(labelData.lang);
            paramIndex++;
        }

        if (updateFields.length === 0) {
            logger.info('[SERVICE] patchIncidentSetupLabel - No fields to update');
            throw new Error('No fields to update');
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(uuid);

        const updateQuery = `
            UPDATE translations.incident_setup_labels 
            SET ${updateFields.join(', ')}
            WHERE uuid = $${paramIndex}
            RETURNING *
        `;

        const result = await db.query(updateQuery, updateValues);

        if (result.rows.length === 0) {
            logger.info(`[SERVICE] patchIncidentSetupLabel - No label found with UUID: ${uuid}`);
            return null;
        }

        const updatedLabel = result.rows[0];
        logger.info(`[SERVICE] patchIncidentSetupLabel - Successfully updated label with UUID: ${uuid}`);
        return updatedLabel;
    } catch (error) {
        logger.error(`[SERVICE] patchIncidentSetupLabel - Database error: ${error.message}`);
        throw error;
    }
}

module.exports = {
    createIncidentSetupLabel,
    patchIncidentSetupLabel
};
