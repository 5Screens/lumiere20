const db = require('../../../config/database');
const logger = require('../../../config/logger');

async function createDefectSetupLabel(labelData) {
    logger.info('[SERVICE] createDefectSetupLabel - Starting database operation');
    try {
        const { label, parent_code, lang_code } = labelData;
        
        logger.info(`[SERVICE] createDefectSetupLabel - Creating label for parent_code: ${parent_code}, lang: ${lang_code}`);
        
        const query = `
            INSERT INTO translations.defect_setup_labels (rel_defect_setup_code, lang, label)
            VALUES ($1, $2, $3)
            RETURNING uuid, rel_defect_setup_code, lang, label, created_at, updated_at
        `;
        
        const result = await db.query(query, [parent_code, lang_code, label]);
        
        if (result.rows.length === 0) {
            throw new Error('Failed to create defect setup label');
        }
        
        const createdLabel = result.rows[0];
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
