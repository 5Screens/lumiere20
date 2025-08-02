const db = require('../../../config/database');
const { pool } = require('../../../config/database');
const logger = require('../../../config/logger');

async function getAllDefectSetup(lang = null) {
    logger.info(`[SERVICE] getAllDefectSetup - Starting database query for all defect setup, language: ${lang || 'all'}`);
    try {
        let query, params;
        
        if (lang) {
            // Si une langue est spécifiée, retourner seulement cette traduction
            query = `
                SELECT 
                    dsc.uuid,
                    dsc.metadata,
                    dsc.code,
                    dsl.label,
                    dsl.lang,
                    dsc.created_at,
                    dsc.updated_at
                FROM configuration.defect_setup_codes dsc
                LEFT JOIN translations.defect_setup_labels dsl ON dsc.code = dsl.rel_defect_setup_code
                WHERE dsl.lang = $1 OR dsl.lang IS NULL
                ORDER BY dsc.metadata, dsc.code, dsl.label
            `;
            params = [lang];
        } else {
            // Si aucune langue spécifiée, retourner toutes les traductions groupées
            query = `
                SELECT 
                    dsc.uuid,
                    dsc.metadata,
                    dsc.code,
                    dsc.created_at,
                    dsc.updated_at,
                    COALESCE(
                        json_agg(
                            CASE WHEN dsl.uuid IS NOT NULL THEN
                                json_build_object(
                                    'label_uuid', dsl.uuid,
                                    'label_lang_code', dsl.lang,
                                    'label', dsl.label
                                )
                            END
                        ) FILTER (WHERE dsl.uuid IS NOT NULL), 
                        '[]'::json
                    ) as labels
                FROM configuration.defect_setup_codes dsc
                LEFT JOIN translations.defect_setup_labels dsl ON dsc.code = dsl.rel_defect_setup_code
                GROUP BY dsc.uuid, dsc.metadata, dsc.code, dsc.created_at, dsc.updated_at
                ORDER BY dsc.metadata, dsc.code
            `;
            params = [];
        }
        
        const result = await db.query(query, params);
        
        logger.info(`[SERVICE] getAllDefectSetup - Query executed successfully, found ${result.rows.length} defect setup records`);
        return result.rows;
    } catch (error) {
        logger.error(`[SERVICE] getAllDefectSetup - Database error: ${error.message}`);
        throw error;
    }
}

async function getDefectSetupByUuid(uuid, lang = null) {
    logger.info(`[SERVICE] getDefectSetupByUuid - Starting database query for defect setup UUID: ${uuid}, language: ${lang}`);
    try {
        let query, params;
        
        if (lang) {
            // Si une langue est spécifiée, retourner seulement cette traduction
            query = `
                SELECT 
                    dsc.uuid,
                    dsc.metadata,
                    dsc.code,
                    dsl.label,
                    dsl.lang,
                    dsc.created_at,
                    dsc.updated_at
                FROM configuration.defect_setup_codes dsc
                LEFT JOIN translations.defect_setup_labels dsl ON dsc.code = dsl.rel_defect_setup_code
                WHERE dsc.uuid = $1 AND (dsl.lang = $2 OR dsl.lang IS NULL)
            `;
            params = [uuid, lang];
        } else {
            // Si aucune langue spécifiée, retourner toutes les traductions
            query = `
                SELECT 
                    dsc.uuid,
                    dsc.metadata,
                    dsc.code,
                    dsc.created_at,
                    dsc.updated_at,
                    COALESCE(
                        json_agg(
                            CASE WHEN dsl.uuid IS NOT NULL THEN
                                json_build_object(
                                    'label_uuid', dsl.uuid,
                                    'label_lang_code', dsl.lang,
                                    'label', dsl.label
                                )
                            END
                        ) FILTER (WHERE dsl.uuid IS NOT NULL), 
                        '[]'::json
                    ) as labels
                FROM configuration.defect_setup_codes dsc
                LEFT JOIN translations.defect_setup_labels dsl ON dsc.code = dsl.rel_defect_setup_code
                WHERE dsc.uuid = $1
                GROUP BY dsc.uuid, dsc.metadata, dsc.code, dsc.created_at, dsc.updated_at
            `;
            params = [uuid];
        }
        
        const result = await db.query(query, params);
        
        if (result.rows.length === 0) {
            logger.info(`[SERVICE] getDefectSetupByUuid - No defect setup found with UUID: ${uuid}`);
            return null;
        }
        
        if (lang) {
            // Retourner un seul objet pour une langue spécifique
            const defectSetup = result.rows[0];
            logger.info(`[SERVICE] getDefectSetupByUuid - Query executed successfully, found defect setup for language: ${lang}`);
            return defectSetup;
        } else {
            // Retourner l'objet avec toutes les traductions
            const defectSetup = result.rows[0];
            logger.info(`[SERVICE] getDefectSetupByUuid - Query executed successfully, found defect setup with ${defectSetup.labels.length} translations`);
            return defectSetup;
        }
    } catch (error) {
        logger.error(`[SERVICE] getDefectSetupByUuid - Database error: ${error.message}`);
        throw error;
    }
}

async function updateDefectSetup(uuid, defectSetupData) {
    logger.info(`[SERVICE] updateDefectSetup - Starting transaction for UUID: ${uuid}`);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        logger.info('[SERVICE] updateDefectSetup - Transaction started');
        
        // Différer la contrainte de clé étrangère pour permettre la mise à jour du code
        await client.query('SET CONSTRAINTS defect_setup_labels_rel_defect_setup_code_fkey DEFERRED');
        logger.info('[SERVICE] updateDefectSetup - Foreign key constraint deferred');

        // Récupérer le code actuel du defect setup
        const getCurrentCodeQuery = `
            SELECT code FROM configuration.defect_setup_codes WHERE uuid = $1
        `;
        const currentCodeResult = await client.query(getCurrentCodeQuery, [uuid]);
        
        if (currentCodeResult.rows.length === 0) {
            throw new Error(`Defect setup with UUID ${uuid} not found`);
        }
        
        const currentCode = currentCodeResult.rows[0].code;
        logger.info(`[SERVICE] updateDefectSetup - Current defect setup code: ${currentCode}`);

        // Mettre à jour les champs dans la table defect_setup_codes si nécessaire
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;
        
        if (defectSetupData.code && defectSetupData.code !== currentCode) {
            updateFields.push(`code = $${paramIndex}`);
            updateValues.push(defectSetupData.code);
            paramIndex++;
        }
        
        if (defectSetupData.metadata) {
            updateFields.push(`metadata = $${paramIndex}`);
            updateValues.push(defectSetupData.metadata);
            paramIndex++;
        }
        
        if (updateFields.length > 0) {
            updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
            updateValues.push(uuid);
            
            const updateDefectSetupQuery = `
                UPDATE configuration.defect_setup_codes 
                SET ${updateFields.join(', ')}
                WHERE uuid = $${paramIndex}
                RETURNING code
            `;
            const defectSetupResult = await client.query(updateDefectSetupQuery, updateValues);
            logger.info(`[SERVICE] updateDefectSetup - Updated defect setup fields`);
            
            // Si le code a changé, mettre à jour les codes dans la table de traductions
            if (defectSetupData.code && defectSetupData.code !== currentCode) {
                const updateTranslationCodesQuery = `
                    UPDATE translations.defect_setup_labels 
                    SET rel_defect_setup_code = $1, updated_at = CURRENT_TIMESTAMP 
                    WHERE rel_defect_setup_code = $2
                `;
                const translationResult = await client.query(updateTranslationCodesQuery, [defectSetupData.code, currentCode]);
                logger.info(`[SERVICE] updateDefectSetup - Updated ${translationResult.rowCount} translation codes from ${currentCode} to ${defectSetupData.code}`);
            }
        } else {
            logger.info('[SERVICE] updateDefectSetup - No fields to update in defect_setup_codes table');
        }

        await client.query('COMMIT');
        logger.info('[SERVICE] updateDefectSetup - Transaction committed successfully');

        // Récupérer et retourner le defect setup mis à jour
        const updatedDefectSetup = await getDefectSetupByUuid(uuid);
        return updatedDefectSetup;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`[SERVICE] updateDefectSetup - Transaction rolled back due to error: ${error.message}`);
        throw error;
    } finally {
        client.release();
        logger.info('[SERVICE] updateDefectSetup - Database client released');
    }
}

async function createDefectSetup(defectSetupData) {
    logger.info('[SERVICE] createDefectSetup - Starting transaction');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        logger.info('[SERVICE] createDefectSetup - Transaction started');

        // Insérer dans la table defect_setup_codes
        const defectSetupQuery = `
            INSERT INTO configuration.defect_setup_codes (metadata, code)
            VALUES ($1, $2)
            RETURNING uuid, code
        `;
        const defectSetupResult = await client.query(defectSetupQuery, [defectSetupData.metadata || '', defectSetupData.code]);
        logger.info(`[SERVICE] createDefectSetup - Inserted into configuration.defect_setup_codes with code: ${defectSetupData.code}`);

        // Insérer les traductions (labels)
        if (defectSetupData.labels && defectSetupData.labels.length > 0) {
            const translationQuery = `
                INSERT INTO translations.defect_setup_labels (rel_defect_setup_code, lang, label)
                VALUES ($1, $2, $3)
                RETURNING *
            `;

            const translationPromises = defectSetupData.labels.map(label =>
                client.query(translationQuery, [
                    defectSetupData.code,
                    label.label_lang_code,
                    label.label
                ])
            );

            const translationResults = await Promise.all(translationPromises);
            logger.info(`[SERVICE] createDefectSetup - Inserted ${translationResults.length} translations`);
        }

        await client.query('COMMIT');
        logger.info('[SERVICE] createDefectSetup - Transaction committed successfully');

        // Récupérer et retourner le defect setup créé avec toutes ses traductions
        const createdDefectSetup = await getDefectSetupByUuid(defectSetupResult.rows[0].uuid);
        return createdDefectSetup;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`[SERVICE] createDefectSetup - Transaction rolled back due to error: ${error.message}`);
        throw error;
    } finally {
        client.release();
        logger.info('[SERVICE] createDefectSetup - Database client released');
    }
}

// Legacy method for backward compatibility
const getDefectSetup = async (lang, metadata) => {
    logger.info(`[SERVICE] getDefectSetup - Getting legacy defect setup data for metadata: ${metadata}, language: ${lang}`);
    try {
        const query = `
            SELECT 
                dsc.code,
                dsl.label
            FROM configuration.defect_setup_codes dsc
            LEFT JOIN translations.defect_setup_labels dsl 
                ON dsl.rel_defect_setup_code = dsc.code 
                AND dsl.lang = $1
            WHERE dsc.metadata = $2
            ORDER BY dsl.label;
        `;
        const result = await db.query(query, [lang, metadata]);
        logger.info(`[SERVICE] getDefectSetup - Successfully retrieved ${result.rows.length} legacy defect setup entries`);
        return result.rows;
    } catch (error) {
        logger.error(`[SERVICE] getDefectSetup - Error getting legacy defect setup data: ${error.message}`);
        throw error;
    }
};

module.exports = {
    getAllDefectSetup,
    getDefectSetupByUuid,
    updateDefectSetup,
    createDefectSetup,
    getDefectSetup // Legacy method
};
