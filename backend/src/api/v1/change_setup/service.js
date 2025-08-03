const { pool } = require('../../../config/database');
const db = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Récupère les données de configuration des changements
 * @param {string} lang - Code de langue (optionnel)
 * @param {string} metadata - Type de métadonnées à filtrer (optionnel)
 * @param {string} toSelect - Si 'yes', renvoie les données au format value/label pour les composants de sélection
 * @returns {Promise<Array|Object>} - Liste des configurations de changement
 */
const getChangeSetup = async (lang, metadata, toSelect) => {
    // Convertir metadata en majuscules si fourni
    const upperMetadata = metadata ? metadata.toUpperCase() : metadata;
    
    logger.info(`[SERVICE] Getting change setup data. Language: ${lang || 'all'}, Metadata: ${upperMetadata || 'all'}`);
    
    try {
        let query;
        let params = [];
        let paramIndex = 1;
        
        // Construction de la requête en fonction des paramètres
        if (lang && upperMetadata) {
            // Filtrer par langue et metadata
            query = `
                SELECT 
                    csc.uuid, 
                    csc.metadata,
                    csc.code, 
                    csl.lang,
                    csl.label
                FROM configuration.change_setup_codes csc
                JOIN translations.change_setup_label csl 
                    ON csc.code = csl.rel_change_setup_code
                WHERE csl.lang = $${paramIndex++}
                AND csc.metadata = $${paramIndex++}
                ORDER BY csc.metadata, csc.code, csl.lang
            `;
            params.push(lang, upperMetadata);
        } else if (lang) {
            // Filtrer par langue uniquement
            query = `
                SELECT 
                    csc.uuid, 
                    csc.metadata,
                    csc.code, 
                    csl.lang,
                    csl.label
                FROM configuration.change_setup_codes csc
                JOIN translations.change_setup_label csl 
                    ON csc.code = csl.rel_change_setup_code
                WHERE csl.lang = $${paramIndex++}
                ORDER BY csc.metadata, csc.code, csl.lang
            `;
            params.push(lang);
        } else if (upperMetadata) {
            // Filtrer par metadata uniquement
            query = `
                SELECT 
                    csc.uuid, 
                    csc.metadata,
                    csc.code, 
                    csl.lang,
                    csl.label
                FROM configuration.change_setup_codes csc
                JOIN translations.change_setup_label csl 
                    ON csc.code = csl.rel_change_setup_code
                WHERE csc.metadata = $${paramIndex++}
                ORDER BY csc.metadata, csc.code, csl.lang
            `;
            params.push(upperMetadata);
        } else {
            // Aucun filtre, récupérer toutes les données
            query = `
                SELECT 
                    csc.uuid, 
                    csc.metadata,
                    csc.code, 
                    csl.lang,
                    csl.label
                FROM configuration.change_setup_codes csc
                JOIN translations.change_setup_label csl 
                    ON csc.code = csl.rel_change_setup_code
                ORDER BY csc.metadata, csc.code, csl.lang
            `;
        }
        
        const result = await pool.query(query, params);
        
        logger.info(`[SERVICE] Found ${result.rows.length} change setup entries`);
        
        // Si toSelect=yes, transformer les données au format value/label pour les composants de sélection
        if (toSelect === 'yes') {
            logger.info('[SERVICE] Transforming data to value/label format for select component');
            
            // Si une langue spécifique est demandée et un metadata spécifique, on renvoie directement un tableau de value/label
            if (lang && upperMetadata) {
                const selectArray = [];
                
                result.rows.forEach(row => {
                    selectArray.push({
                        value: row.code,
                        label: row.label
                    });
                });
                
                return selectArray;
            }
            // Si une langue spécifique est demandée mais pas de metadata spécifique
            else if (lang) {
                const selectData = {};
                
                result.rows.forEach(row => {
                    if (!selectData[row.metadata]) {
                        selectData[row.metadata] = [];
                    }
                    
                    selectData[row.metadata].push({
                        value: row.code,
                        label: row.label
                    });
                });
                
                return selectData;
            } 
            // Si pas de langue spécifique, on renvoie un objet avec les traductions par langue
            else {
                const selectData = {};
                
                result.rows.forEach(row => {
                    if (!selectData[row.metadata]) {
                        selectData[row.metadata] = {};
                    }
                    
                    if (!selectData[row.metadata][row.lang]) {
                        selectData[row.metadata][row.lang] = [];
                    }
                    
                    selectData[row.metadata][row.lang].push({
                        value: row.code,
                        label: row.label
                    });
                });
                
                return selectData;
            }
        }
        
        // Format standard: retourner les données sans regroupement par code
        const formattedData = [];
        
        result.rows.forEach(row => {
            formattedData.push({
                uuid: row.uuid,
                metadata: row.metadata,
                code: row.code,
                lang: row.lang,
                label: row.label
            });
        });
        
        return formattedData;
    } catch (error) {
        logger.error(`[SERVICE] Error getting change setup data: ${error.message}`);
        throw error;
    }
};

/**
 * Récupère tous les change_setup_codes avec leurs traductions dans la langue spécifiée
 * @param {string} lang - Code de langue pour les traductions
 * @returns {Array} Liste des change_setup avec traductions
 */
async function getAllChangeSetup(lang = 'fr') {
    logger.info(`[SERVICE] getAllChangeSetup - Starting database query for language: ${lang}`);
    try {
        const query = `
            SELECT 
                csc.uuid,
                csc.metadata,
                csc.code,
                csl.label,
                csl.lang,
                csc.created_at,
                csc.updated_at
            FROM configuration.change_setup_codes csc
            LEFT JOIN translations.change_setup_label csl ON csc.code = csl.rel_change_setup_code
            WHERE csl.lang = $1 OR csl.lang IS NULL
            ORDER BY csc.metadata, csc.code
        `;
        
        const result = await db.query(query, [lang]);
        logger.info(`[SERVICE] getAllChangeSetup - Query executed successfully, found ${result.rows.length} change_setup records`);
        return result.rows;
    } catch (error) {
        logger.error(`[SERVICE] getAllChangeSetup - Database error: ${error.message}`);
        throw error;
    }
}

/**
 * Récupère un change_setup_code par UUID avec toutes ses traductions
 * @param {string} uuid - UUID du change_setup_code
 * @param {string} lang - Code de langue (optionnel)
 * @returns {Object} Change setup avec ses traductions
 */
async function getChangeSetupByUuid(uuid, lang = null) {
    logger.info(`[SERVICE] getChangeSetupByUuid - Starting database query for change setup UUID: ${uuid}, language: ${lang}`);
    try {
        let query, params;
        
        if (lang) {
            // Si une langue est spécifiée, retourner seulement cette traduction
            query = `
                SELECT 
                    csc.uuid,
                    csc.metadata,
                    csc.code,
                    csl.label,
                    csl.lang,
                    csc.created_at,
                    csc.updated_at
                FROM configuration.change_setup_codes csc
                LEFT JOIN translations.change_setup_label csl ON csc.code = csl.rel_change_setup_code
                WHERE csc.uuid = $1 AND (csl.lang = $2 OR csl.lang IS NULL)
            `;
            params = [uuid, lang];
        } else {
            // Si aucune langue spécifiée, retourner toutes les traductions
            query = `
                SELECT 
                    csc.uuid,
                    csc.metadata,
                    csc.code,
                    csc.created_at,
                    csc.updated_at,
                    COALESCE(
                        json_agg(
                            CASE WHEN csl.uuid IS NOT NULL THEN
                                json_build_object(
                                    'label_uuid', csl.uuid,
                                    'label_lang_code', csl.lang,
                                    'label', csl.label
                                )
                            END
                        ) FILTER (WHERE csl.uuid IS NOT NULL), 
                        '[]'::json
                    ) as labels
                FROM configuration.change_setup_codes csc
                LEFT JOIN translations.change_setup_label csl ON csc.code = csl.rel_change_setup_code
                WHERE csc.uuid = $1
                GROUP BY csc.uuid, csc.metadata, csc.code, csc.created_at, csc.updated_at
            `;
            params = [uuid];
        }
        
        const result = await db.query(query, params);
        
        if (result.rows.length === 0) {
            logger.info(`[SERVICE] getChangeSetupByUuid - No change setup found with UUID: ${uuid}`);
            return null;
        }
        
        if (lang) {
            // Retourner un seul objet pour une langue spécifique
            const changeSetup = result.rows[0];
            logger.info(`[SERVICE] getChangeSetupByUuid - Query executed successfully, found change setup for language: ${lang}`);
            return changeSetup;
        } else {
            // Retourner l'objet avec toutes les traductions
            const changeSetup = result.rows[0];
            logger.info(`[SERVICE] getChangeSetupByUuid - Query executed successfully, found change setup with ${changeSetup.labels.length} translations`);
            return changeSetup;
        }
    } catch (error) {
        logger.error(`[SERVICE] getChangeSetupByUuid - Database error: ${error.message}`);
        throw error;
    }
}

/**
 * Met à jour un change_setup_code
 * @param {string} uuid - UUID du change_setup_code
 * @param {Object} changeSetupData - Données à mettre à jour
 * @returns {Object} Change setup mis à jour
 */
async function updateChangeSetup(uuid, changeSetupData) {
    logger.info(`[SERVICE] updateChangeSetup - Starting transaction for UUID: ${uuid}`);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        logger.info('[SERVICE] updateChangeSetup - Transaction started');
        
        // Différer la contrainte de clé étrangère pour permettre la mise à jour du code
        await client.query('SET CONSTRAINTS change_setup_label_rel_change_setup_code_fkey DEFERRED');
        logger.info('[SERVICE] updateChangeSetup - Foreign key constraint deferred');

        // Récupérer le code actuel du change setup
        const getCurrentCodeQuery = `
            SELECT code FROM configuration.change_setup_codes WHERE uuid = $1
        `;
        const currentCodeResult = await client.query(getCurrentCodeQuery, [uuid]);
        
        if (currentCodeResult.rows.length === 0) {
            throw new Error(`Change setup with UUID ${uuid} not found`);
        }
        
        const currentCode = currentCodeResult.rows[0].code;
        logger.info(`[SERVICE] updateChangeSetup - Current change setup code: ${currentCode}`);

        // Mettre à jour les champs dans la table change_setup_codes si nécessaire
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;
        
        if (changeSetupData.code && changeSetupData.code !== currentCode) {
            updateFields.push(`code = $${paramIndex}`);
            updateValues.push(changeSetupData.code);
            paramIndex++;
        }
        
        if (changeSetupData.metadata) {
            updateFields.push(`metadata = $${paramIndex}`);
            updateValues.push(changeSetupData.metadata);
            paramIndex++;
        }
        
        if (updateFields.length > 0) {
            updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
            updateValues.push(uuid);
            
            const updateChangeSetupQuery = `
                UPDATE configuration.change_setup_codes 
                SET ${updateFields.join(', ')}
                WHERE uuid = $${paramIndex}
                RETURNING code
            `;
            const changeSetupResult = await client.query(updateChangeSetupQuery, updateValues);
            logger.info(`[SERVICE] updateChangeSetup - Updated change setup fields`);
            
            // Si le code a changé, mettre à jour les codes dans la table de traductions
            if (changeSetupData.code && changeSetupData.code !== currentCode) {
                const updateTranslationCodesQuery = `
                    UPDATE translations.change_setup_label 
                    SET rel_change_setup_code = $1, updated_at = CURRENT_TIMESTAMP 
                    WHERE rel_change_setup_code = $2
                `;
                const translationResult = await client.query(updateTranslationCodesQuery, [changeSetupData.code, currentCode]);
                logger.info(`[SERVICE] updateChangeSetup - Updated ${translationResult.rowCount} translation codes from ${currentCode} to ${changeSetupData.code}`);
            }
        } else {
            logger.info('[SERVICE] updateChangeSetup - No fields to update in change_setup_codes table');
        }

        await client.query('COMMIT');
        logger.info('[SERVICE] updateChangeSetup - Transaction committed successfully');

        // Récupérer et retourner le change setup mis à jour
        const updatedChangeSetup = await getChangeSetupByUuid(uuid);
        return updatedChangeSetup;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`[SERVICE] updateChangeSetup - Transaction rolled back due to error: ${error.message}`);
        throw error;
    } finally {
        client.release();
        logger.info('[SERVICE] updateChangeSetup - Database client released');
    }
}

/**
 * Crée un nouveau change_setup_code avec ses traductions
 * @param {Object} changeSetupData - Données du change setup à créer
 * @returns {Object} Change setup créé
 */
async function createChangeSetup(changeSetupData) {
    logger.info('[SERVICE] createChangeSetup - Starting transaction');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        logger.info('[SERVICE] createChangeSetup - Transaction started');

        // Insérer dans la table change_setup_codes
        const changeSetupQuery = `
            INSERT INTO configuration.change_setup_codes (metadata, code)
            VALUES ($1, $2)
            RETURNING uuid, code
        `;
        const changeSetupResult = await client.query(changeSetupQuery, [
            changeSetupData.metadata || '', 
            changeSetupData.code
        ]);
        logger.info(`[SERVICE] createChangeSetup - Inserted into configuration.change_setup_codes with code: ${changeSetupData.code}`);

        // Insérer les traductions (labels)
        if (changeSetupData.labels && changeSetupData.labels.length > 0) {
            const translationQuery = `
                INSERT INTO translations.change_setup_label (rel_change_setup_code, lang, label)
                VALUES ($1, $2, $3)
                RETURNING *
            `;

            const translationPromises = changeSetupData.labels.map(label =>
                client.query(translationQuery, [
                    changeSetupData.code,
                    label.label_lang_code,
                    label.label
                ])
            );

            const translationResults = await Promise.all(translationPromises);
            logger.info(`[SERVICE] createChangeSetup - Inserted ${translationResults.length} translations`);
        }

        await client.query('COMMIT');
        logger.info('[SERVICE] createChangeSetup - Transaction committed successfully');

        // Récupérer et retourner le change setup créé avec toutes ses traductions
        const createdChangeSetup = await getChangeSetupByUuid(changeSetupResult.rows[0].uuid);
        return createdChangeSetup;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`[SERVICE] createChangeSetup - Transaction rolled back due to error: ${error.message}`);
        throw error;
    } finally {
        client.release();
        logger.info('[SERVICE] createChangeSetup - Database client released');
    }
}

module.exports = {
    getChangeSetup,
    getAllChangeSetup,
    getChangeSetupByUuid,
    updateChangeSetup,
    createChangeSetup
};
