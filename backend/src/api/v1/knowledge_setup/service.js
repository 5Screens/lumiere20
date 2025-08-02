const db = require('../../../config/database');
const { pool } = require('../../../config/database');
const logger = require('../../../config/logger');

async function getAllKnowledgeSetup(lang = null) {
    logger.info(`[SERVICE] getAllKnowledgeSetup - Starting database query for all knowledge setup, language: ${lang || 'all'}`);
    try {
        let query, params;
        
        if (lang) {
            // Si une langue est spécifiée, retourner seulement cette traduction
            query = `
                SELECT 
                    ksc.uuid,
                    ksc.metadata,
                    ksc.code,
                    ksl.label,
                    ksl.lang,
                    ksc.created_at,
                    ksc.updated_at
                FROM configuration.knowledge_setup_codes ksc
                LEFT JOIN translations.knowledge_setup_label ksl ON ksc.code = ksl.rel_change_setup_code
                WHERE ksl.lang = $1 OR ksl.lang IS NULL
                ORDER BY ksc.metadata, ksc.code, ksl.label
            `;
            params = [lang];
        } else {
            // Si aucune langue spécifiée, retourner toutes les traductions groupées
            query = `
                SELECT 
                    ksc.uuid,
                    ksc.metadata,
                    ksc.code,
                    ksc.created_at,
                    ksc.updated_at,
                    COALESCE(
                        json_agg(
                            CASE WHEN ksl.uuid IS NOT NULL THEN
                                json_build_object(
                                    'label_uuid', ksl.uuid,
                                    'label_lang_code', ksl.lang,
                                    'label', ksl.label
                                )
                            END
                        ) FILTER (WHERE ksl.uuid IS NOT NULL), 
                        '[]'::json
                    ) as labels
                FROM configuration.knowledge_setup_codes ksc
                LEFT JOIN translations.knowledge_setup_label ksl ON ksc.code = ksl.rel_change_setup_code
                GROUP BY ksc.uuid, ksc.metadata, ksc.code, ksc.created_at, ksc.updated_at
                ORDER BY ksc.metadata, ksc.code
            `;
            params = [];
        }
        
        const result = await pool.query(query, params);
        logger.info(`[SERVICE] getAllKnowledgeSetup - Query executed successfully, returned ${result.rows.length} rows`);
        return result.rows;
    } catch (error) {
        logger.error(`[SERVICE] getAllKnowledgeSetup - Database error: ${error.message}`);
        throw error;
    }
}

async function getKnowledgeSetupByUuid(uuid, lang = null) {
    logger.info(`[SERVICE] getKnowledgeSetupByUuid - Starting query for UUID: ${uuid}, language: ${lang || 'all'}`);
    try {
        let query, params;
        
        if (lang) {
            // Si une langue est spécifiée, retourner seulement cette traduction
            query = `
                SELECT 
                    ksc.uuid,
                    ksc.metadata,
                    ksc.code,
                    ksl.label,
                    ksl.lang,
                    ksc.created_at,
                    ksc.updated_at
                FROM configuration.knowledge_setup_codes ksc
                LEFT JOIN translations.knowledge_setup_label ksl ON ksc.code = ksl.rel_change_setup_code
                WHERE ksc.uuid = $1 AND (ksl.lang = $2 OR ksl.lang IS NULL)
                ORDER BY ksl.label
            `;
            params = [uuid, lang];
        } else {
            // Si aucune langue spécifiée, retourner toutes les traductions groupées
            query = `
                SELECT 
                    ksc.uuid,
                    ksc.metadata,
                    ksc.code,
                    ksc.created_at,
                    ksc.updated_at,
                    COALESCE(
                        json_agg(
                            CASE WHEN ksl.uuid IS NOT NULL THEN
                                json_build_object(
                                    'label_uuid', ksl.uuid,
                                    'label_lang_code', ksl.lang,
                                    'label', ksl.label
                                )
                            END
                        ) FILTER (WHERE ksl.uuid IS NOT NULL), 
                        '[]'::json
                    ) as labels
                FROM configuration.knowledge_setup_codes ksc
                LEFT JOIN translations.knowledge_setup_label ksl ON ksc.code = ksl.rel_change_setup_code
                WHERE ksc.uuid = $1
                GROUP BY ksc.uuid, ksc.metadata, ksc.code, ksc.created_at, ksc.updated_at
            `;
            params = [uuid];
        }
        
        const result = await pool.query(query, params);
        
        if (result.rows.length === 0) {
            logger.warn(`[SERVICE] getKnowledgeSetupByUuid - No knowledge setup found for UUID: ${uuid}`);
            return null;
        }
        
        logger.info(`[SERVICE] getKnowledgeSetupByUuid - Knowledge setup found for UUID: ${uuid}`);
        return result.rows[0];
    } catch (error) {
        logger.error(`[SERVICE] getKnowledgeSetupByUuid - Database error: ${error.message}`);
        throw error;
    }
}

async function updateKnowledgeSetup(uuid, knowledgeSetupData) {
    logger.info(`[SERVICE] updateKnowledgeSetup - Starting update for UUID: ${uuid}`);
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Différer la contrainte de clé étrangère pour permettre la mise à jour du code
        await client.query('SET CONSTRAINTS knowledge_setup_label_rel_change_setup_code_fkey DEFERRED');
        logger.info('[SERVICE] updateKnowledgeSetup - Foreign key constraint deferred');
        
        // Mise à jour de la table principale
        const updateKnowledgeSetupQuery = `
            UPDATE configuration.knowledge_setup_codes 
            SET 
                code = $1,
                metadata = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE uuid = $3
            RETURNING *
        `;
        
        const knowledgeSetupResult = await client.query(updateKnowledgeSetupQuery, [
            knowledgeSetupData.code,
            knowledgeSetupData.metadata,
            uuid
        ]);
        
        if (knowledgeSetupResult.rows.length === 0) {
            throw new Error(`Knowledge setup with UUID ${uuid} not found`);
        }
        
        logger.info(`[SERVICE] updateKnowledgeSetup - Knowledge setup updated successfully for UUID: ${uuid}`);
        
        // Mise à jour des codes dans les traductions si le code a changé
        if (knowledgeSetupData.code) {
            const updateTranslationCodesQuery = `
                UPDATE translations.knowledge_setup_label 
                SET 
                    rel_change_setup_code = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE rel_change_setup_code = (
                    SELECT code FROM configuration.knowledge_setup_codes WHERE uuid = $2
                )
            `;
            
            const translationResult = await client.query(updateTranslationCodesQuery, [
                knowledgeSetupData.code,
                uuid
            ]);
            
            logger.info(`[SERVICE] updateKnowledgeSetup - Updated ${translationResult.rowCount} translation records`);
        }
        
        await client.query('COMMIT');
        logger.info(`[SERVICE] updateKnowledgeSetup - Transaction committed successfully for UUID: ${uuid}`);
        
        return knowledgeSetupResult.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`[SERVICE] updateKnowledgeSetup - Transaction rolled back due to error: ${error.message}`);
        throw error;
    } finally {
        client.release();
    }
}

async function createKnowledgeSetup(knowledgeSetupData) {
    logger.info('[SERVICE] createKnowledgeSetup - Starting creation of new knowledge setup');
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Insertion dans la table principale
        const insertKnowledgeSetupQuery = `
            INSERT INTO configuration.knowledge_setup_codes (code, metadata)
            VALUES ($1, $2)
            RETURNING *
        `;
        
        const knowledgeSetupResult = await client.query(insertKnowledgeSetupQuery, [
            knowledgeSetupData.code,
            knowledgeSetupData.metadata
        ]);
        
        const newKnowledgeSetup = knowledgeSetupResult.rows[0];
        logger.info(`[SERVICE] createKnowledgeSetup - Knowledge setup created with UUID: ${newKnowledgeSetup.uuid}`);
        
        // Insertion des traductions
        if (knowledgeSetupData.labels && knowledgeSetupData.labels.length > 0) {
            for (const label of knowledgeSetupData.labels) {
                const insertLabelQuery = `
                    INSERT INTO translations.knowledge_setup_label (rel_change_setup_code, lang, label)
                    VALUES ($1, $2, $3)
                `;
                
                await client.query(insertLabelQuery, [
                    newKnowledgeSetup.code,
                    label.label_lang_code,
                    label.label
                ]);
            }
            logger.info(`[SERVICE] createKnowledgeSetup - ${knowledgeSetupData.labels.length} labels inserted`);
        }
        
        await client.query('COMMIT');
        logger.info(`[SERVICE] createKnowledgeSetup - Transaction committed successfully`);
        
        return newKnowledgeSetup;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`[SERVICE] createKnowledgeSetup - Transaction rolled back due to error: ${error.message}`);
        throw error;
    } finally {
        client.release();
    }
}

// Legacy method for backward compatibility
const getKnowledgeSetup = async (lang, metadata, toSelect) => {
    logger.info(`[SERVICE] getKnowledgeSetup (legacy) - Language: ${lang || 'all'}, Metadata: ${metadata || 'all'}`);
    
    try {
        const results = await getAllKnowledgeSetup(lang);
        
        if (toSelect === 'yes') {
            return results.map(row => ({
                value: row.code,
                label: row.label
            }));
        }
        
        return results;
    } catch (error) {
        logger.error(`[SERVICE] getKnowledgeSetup (legacy) - Error: ${error.message}`);
        throw error;
    }
};

module.exports = {
    getAllKnowledgeSetup,
    getKnowledgeSetupByUuid,
    updateKnowledgeSetup,
    createKnowledgeSetup,
    getKnowledgeSetup
};
