const db = require('../../../config/database');
const logger = require('../../../config/logger');

async function createDefectSetupLabel(labelData) {
    logger.info('[SERVICE] createDefectSetupLabel - Starting database operation');
    try {
        const { label, parent_uuid, lang_code } = labelData;
        
        logger.info(`[SERVICE] createDefectSetupLabel - Creating label for parent_uuid: ${parent_uuid}, lang: ${lang_code}`);
        
        // Aller chercher le code avec l'aide du parent_uuid
        const query = `
            SELECT code
            FROM configuration.defect_setup_codes
            WHERE uuid = $1
        `;
        const result = await db.query(query, [parent_uuid]);
        
        if (result.rows.length === 0) {
            throw new Error(`Defect setup not found for UUID: ${parent_uuid}`);
        }
        
        const rel_defect_setup_code = result.rows[0].code;
        
        // Insérer le label avec le rel_defect_setup_code
        const query2 = `
            INSERT INTO translations.defect_setup_labels (rel_defect_setup_code, lang, label)
            VALUES ($1, $2, $3)
            RETURNING uuid, rel_defect_setup_code, lang, label, created_at, updated_at
        `;
        
        const result2 = await db.query(query2, [rel_defect_setup_code, lang_code, label]);
        
        if (result2.rows.length === 0) {
            throw new Error('Failed to create defect setup label');
        }
        
        const createdLabel = result2.rows[0];
        logger.info(`[SERVICE] createDefectSetupLabel - Label created successfully with UUID: ${createdLabel.uuid}`);
        
        return createdLabel;
    } catch (error) {
        logger.error(`[SERVICE] createDefectSetupLabel - Database error: ${error.message}`);
        throw error;
    }
}

async function patchDefectSetupLabel(uuid, newLabel) {
    logger.info(`[SERVICE] patchDefectSetupLabel - Starting database operation for UUID: ${uuid}`);
    try {
        logger.info(`[SERVICE] patchDefectSetupLabel - Updating label to: ${newLabel}`);
        
        const query = `
            UPDATE translations.defect_setup_labels 
            SET label = $1, updated_at = CURRENT_TIMESTAMP
            WHERE uuid = $2
            RETURNING uuid, rel_defect_setup_code, lang, label, created_at, updated_at
        `;
        
        const result = await db.query(query, [newLabel, uuid]);
        
        if (result.rows.length === 0) {
            logger.info(`[SERVICE] patchDefectSetupLabel - No label found with UUID: ${uuid}`);
            return null;
        }
        
        const patchedLabel = result.rows[0];
        logger.info(`[SERVICE] patchDefectSetupLabel - Label updated successfully`);
        
        return patchedLabel;
    } catch (error) {
        logger.error(`[SERVICE] patchDefectSetupLabel - Database error: ${error.message}`);
        throw error;
    }
}

module.exports = {
    createDefectSetupLabel,
    patchDefectSetupLabel
};
