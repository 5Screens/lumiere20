const db = require('../../../config/database');
const logger = require('../../../config/logger');

async function createKnowledgeSetupLabel(labelData) {
    logger.info('[SERVICE] createKnowledgeSetupLabel - Starting database operation');
    try {
        const { label, parent_uuid, lang_code } = labelData;
        
        logger.info(`[SERVICE] createKnowledgeSetupLabel - Creating label for parent_uuid: ${parent_uuid}, lang: ${lang_code}`);
        
        // Aller chercher le code avec l'aide du parent_uuid
        const query = `
            SELECT code
            FROM configuration.knowledge_setup_codes
            WHERE uuid = $1
        `;
        const result = await db.query(query, [parent_uuid]);
        
        if (result.rows.length === 0) {
            throw new Error(`Knowledge setup not found for UUID: ${parent_uuid}`);
        }
        
        const rel_change_setup_code = result.rows[0].code;
        
        // Insérer le label avec le rel_change_setup_code
        const query2 = `
            INSERT INTO translations.knowledge_setup_label (rel_change_setup_code, lang, label)
            VALUES ($1, $2, $3)
            RETURNING uuid, rel_change_setup_code, lang, label, created_at, updated_at
        `;
        
        const result2 = await db.query(query2, [rel_change_setup_code, lang_code, label]);
        
        if (result2.rows.length === 0) {
            throw new Error('Failed to create knowledge setup label');
        }
        
        const createdLabel = result2.rows[0];
        logger.info(`[SERVICE] createKnowledgeSetupLabel - Label created successfully with UUID: ${createdLabel.uuid}`);
        
        return createdLabel;
    } catch (error) {
        logger.error(`[SERVICE] createKnowledgeSetupLabel - Database error: ${error.message}`);
        throw error;
    }
}

async function patchKnowledgeSetupLabel(uuid, newLabel) {
    logger.info(`[SERVICE] patchKnowledgeSetupLabel - Starting database operation for UUID: ${uuid}`);
    try {
        logger.info(`[SERVICE] patchKnowledgeSetupLabel - Updating label to: ${newLabel}`);
        
        const query = `
            UPDATE translations.knowledge_setup_label 
            SET label = $1, updated_at = CURRENT_TIMESTAMP
            WHERE uuid = $2
            RETURNING uuid, rel_change_setup_code, lang, label, created_at, updated_at
        `;
        
        const result = await db.query(query, [newLabel, uuid]);
        
        if (result.rows.length === 0) {
            logger.info(`[SERVICE] patchKnowledgeSetupLabel - No label found with UUID: ${uuid}`);
            return null;
        }
        
        const updatedLabel = result.rows[0];
        logger.info(`[SERVICE] patchKnowledgeSetupLabel - Label updated successfully for UUID: ${uuid}`);
        
        return updatedLabel;
    } catch (error) {
        logger.error(`[SERVICE] patchKnowledgeSetupLabel - Database error: ${error.message}`);
        throw error;
    }
}

module.exports = {
    createKnowledgeSetupLabel,
    patchKnowledgeSetupLabel
};
