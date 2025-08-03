const { pool } = require('../../../config/database');
const db = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Récupère tous les project setup avec leurs traductions
 * @param {string} lang - Code de langue (optionnel)
 * @returns {Promise<Array>} - Liste des project setup
 */
async function getAllProjectSetup(lang = null) {
    logger.info(`[SERVICE] getAllProjectSetup - Starting database query for all project setup, language: ${lang || 'all'}`);
    try {
        let query, params;
        
        if (lang) {
            // Si une langue est spécifiée, retourner seulement cette traduction
            query = `
                SELECT 
                    psc.uuid,
                    psc.metadata,
                    psc.code,
                    psl.label,
                    psl.lang,
                    psc.created_at,
                    psc.updated_at
                FROM configuration.project_setup_codes psc
                LEFT JOIN translations.project_setup_label psl ON psc.code = psl.rel_project_setup_code
                WHERE psl.lang = $1 OR psl.lang IS NULL
                ORDER BY psc.metadata, psc.code, psl.label
            `;
            params = [lang];
        } else {
            // Si aucune langue spécifiée, retourner toutes les traductions groupées
            query = `
                SELECT 
                    psc.uuid,
                    psc.metadata,
                    psc.code,
                    psc.created_at,
                    psc.updated_at,
                    COALESCE(
                        json_agg(
                            CASE WHEN psl.uuid IS NOT NULL THEN
                                json_build_object(
                                    'label_uuid', psl.uuid,
                                    'label_lang_code', psl.lang,
                                    'label', psl.label
                                )
                            END
                        ) FILTER (WHERE psl.uuid IS NOT NULL), 
                        '[]'::json
                    ) as labels
                FROM configuration.project_setup_codes psc
                LEFT JOIN translations.project_setup_label psl ON psc.code = psl.rel_project_setup_code
                GROUP BY psc.uuid, psc.metadata, psc.code, psc.created_at, psc.updated_at
                ORDER BY psc.metadata, psc.code
            `;
            params = [];
        }
        
        const result = await db.query(query, params);
        
        logger.info(`[SERVICE] getAllProjectSetup - Query executed successfully, found ${result.rows.length} project setup records`);
        return result.rows;
    } catch (error) {
        logger.error(`[SERVICE] getAllProjectSetup - Database error: ${error.message}`);
        throw error;
    }
}

/**
 * Récupère un project setup par son UUID
 * @param {string} uuid - UUID du project setup
 * @param {string} lang - Code de langue (optionnel)
 * @returns {Promise<Object|null>} - Project setup trouvé ou null
 */
async function getProjectSetupByUuid(uuid, lang = null) {
    logger.info(`[SERVICE] getProjectSetupByUuid - Starting database query for project setup UUID: ${uuid}, language: ${lang}`);
    try {
        let query, params;
        
        if (lang) {
            // Si une langue est spécifiée, retourner seulement cette traduction
            query = `
                SELECT 
                    psc.uuid,
                    psc.metadata,
                    psc.code,
                    psl.label,
                    psl.lang,
                    psc.created_at,
                    psc.updated_at
                FROM configuration.project_setup_codes psc
                LEFT JOIN translations.project_setup_label psl ON psc.code = psl.rel_project_setup_code
                WHERE psc.uuid = $1 AND (psl.lang = $2 OR psl.lang IS NULL)
            `;
            params = [uuid, lang];
        } else {
            // Si aucune langue spécifiée, retourner toutes les traductions
            query = `
                SELECT 
                    psc.uuid,
                    psc.metadata,
                    psc.code,
                    psc.created_at,
                    psc.updated_at,
                    COALESCE(
                        json_agg(
                            CASE WHEN psl.uuid IS NOT NULL THEN
                                json_build_object(
                                    'label_uuid', psl.uuid,
                                    'label_lang_code', psl.lang,
                                    'label', psl.label
                                )
                            END
                        ) FILTER (WHERE psl.uuid IS NOT NULL), 
                        '[]'::json
                    ) as labels
                FROM configuration.project_setup_codes psc
                LEFT JOIN translations.project_setup_label psl ON psc.code = psl.rel_project_setup_code
                WHERE psc.uuid = $1
                GROUP BY psc.uuid, psc.metadata, psc.code, psc.created_at, psc.updated_at
            `;
            params = [uuid];
        }
        
        const result = await db.query(query, params);
        
        if (result.rows.length === 0) {
            logger.info(`[SERVICE] getProjectSetupByUuid - No project setup found with UUID: ${uuid}`);
            return null;
        }
        
        if (lang) {
            // Retourner un seul objet pour une langue spécifique
            const projectSetup = result.rows[0];
            logger.info(`[SERVICE] getProjectSetupByUuid - Query executed successfully, found project setup for language: ${lang}`);
            return projectSetup;
        } else {
            // Retourner l'objet avec toutes les traductions
            const projectSetup = result.rows[0];
            logger.info(`[SERVICE] getProjectSetupByUuid - Query executed successfully, found project setup with ${projectSetup.labels.length} translations`);
            return projectSetup;
        }
    } catch (error) {
        logger.error(`[SERVICE] getProjectSetupByUuid - Database error: ${error.message}`);
        throw error;
    }
}

/**
 * Met à jour un project setup
 * @param {string} uuid - UUID du project setup
 * @param {Object} projectSetupData - Données à mettre à jour
 * @returns {Promise<Object>} - Project setup mis à jour
 */
async function updateProjectSetup(uuid, projectSetupData) {
    logger.info(`[SERVICE] updateProjectSetup - Starting transaction for UUID: ${uuid}`);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        logger.info('[SERVICE] updateProjectSetup - Transaction started');
        
        // Différer la contrainte de clé étrangère pour permettre la mise à jour du code
        await client.query('SET CONSTRAINTS project_setup_label_rel_project_setup_code_fkey DEFERRED');
        logger.info('[SERVICE] updateProjectSetup - Foreign key constraint deferred');

        // Récupérer le code actuel du project setup
        const getCurrentCodeQuery = `
            SELECT code FROM configuration.project_setup_codes WHERE uuid = $1
        `;
        const currentCodeResult = await client.query(getCurrentCodeQuery, [uuid]);
        
        if (currentCodeResult.rows.length === 0) {
            throw new Error(`Project setup with UUID ${uuid} not found`);
        }
        
        const currentCode = currentCodeResult.rows[0].code;
        logger.info(`[SERVICE] updateProjectSetup - Current project setup code: ${currentCode}`);

        // Mettre à jour les champs dans la table project_setup_codes si nécessaire
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;
        
        if (projectSetupData.code && projectSetupData.code !== currentCode) {
            updateFields.push(`code = $${paramIndex}`);
            updateValues.push(projectSetupData.code);
            paramIndex++;
        }
        
        if (projectSetupData.metadata) {
            updateFields.push(`metadata = $${paramIndex}`);
            updateValues.push(projectSetupData.metadata);
            paramIndex++;
        }
        
        if (updateFields.length > 0) {
            updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
            updateValues.push(uuid);
            
            const updateProjectSetupQuery = `
                UPDATE configuration.project_setup_codes 
                SET ${updateFields.join(', ')}
                WHERE uuid = $${paramIndex}
                RETURNING code
            `;
            const projectSetupResult = await client.query(updateProjectSetupQuery, updateValues);
            logger.info(`[SERVICE] updateProjectSetup - Updated project setup fields`);
            
            // Si le code a changé, mettre à jour les codes dans la table de traductions
            if (projectSetupData.code && projectSetupData.code !== currentCode) {
                const updateTranslationCodesQuery = `
                    UPDATE translations.project_setup_label 
                    SET rel_project_setup_code = $1, updated_at = CURRENT_TIMESTAMP 
                    WHERE rel_project_setup_code = $2
                `;
                const translationResult = await client.query(updateTranslationCodesQuery, [projectSetupData.code, currentCode]);
                logger.info(`[SERVICE] updateProjectSetup - Updated ${translationResult.rowCount} translation codes from ${currentCode} to ${projectSetupData.code}`);
            }
        } else {
            logger.info('[SERVICE] updateProjectSetup - No fields to update in project_setup_codes table');
        }

        await client.query('COMMIT');
        logger.info('[SERVICE] updateProjectSetup - Transaction committed successfully');

        // Récupérer et retourner le project setup mis à jour
        const updatedProjectSetup = await getProjectSetupByUuid(uuid);
        return updatedProjectSetup;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`[SERVICE] updateProjectSetup - Transaction rolled back due to error: ${error.message}`);
        throw error;
    } finally {
        client.release();
        logger.info('[SERVICE] updateProjectSetup - Database client released');
    }
}

/**
 * Crée un nouveau project setup
 * @param {Object} projectSetupData - Données du project setup à créer
 * @returns {Promise<Object>} - Project setup créé
 */
async function createProjectSetup(projectSetupData) {
    logger.info('[SERVICE] createProjectSetup - Starting transaction');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        logger.info('[SERVICE] createProjectSetup - Transaction started');

        // Insérer dans la table project_setup_codes
        const projectSetupQuery = `
            INSERT INTO configuration.project_setup_codes (metadata, code)
            VALUES ($1, $2)
            RETURNING uuid, code
        `;
        const projectSetupResult = await client.query(projectSetupQuery, [projectSetupData.metadata || '', projectSetupData.code]);
        logger.info(`[SERVICE] createProjectSetup - Inserted into configuration.project_setup_codes with code: ${projectSetupData.code}`);

        // Insérer les traductions (labels)
        if (projectSetupData.labels && projectSetupData.labels.length > 0) {
            const translationQuery = `
                INSERT INTO translations.project_setup_label (rel_project_setup_code, lang, label)
                VALUES ($1, $2, $3)
                RETURNING *
            `;

            const translationPromises = projectSetupData.labels.map(label =>
                client.query(translationQuery, [
                    projectSetupData.code,
                    label.label_lang_code,
                    label.label
                ])
            );

            const translationResults = await Promise.all(translationPromises);
            logger.info(`[SERVICE] createProjectSetup - Inserted ${translationResults.length} translations`);
        }

        await client.query('COMMIT');
        logger.info('[SERVICE] createProjectSetup - Transaction committed successfully');

        // Récupérer et retourner le project setup créé avec toutes ses traductions
        const createdProjectSetup = await getProjectSetupByUuid(projectSetupResult.rows[0].uuid);
        return createdProjectSetup;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`[SERVICE] createProjectSetup - Transaction rolled back due to error: ${error.message}`);
        throw error;
    } finally {
        client.release();
        logger.info('[SERVICE] createProjectSetup - Database client released');
    }
}

/**
 * Récupère les données de configuration des projets (fonction legacy)
 * @param {string} lang - Code de langue (optionnel)
 * @param {string} metadata - Type de métadonnées à filtrer (optionnel)
 * @param {string} toSelect - Si 'yes', renvoie les données au format value/label pour les composants de sélection
 * @returns {Promise<Array|Object>} - Liste des configurations de projet
 */
const getProjectSetup = async (lang, metadata, toSelect) => {
    // Convertir metadata en majuscules si fourni
    const upperMetadata = metadata ? metadata.toUpperCase() : metadata;
    
    logger.info(`[SERVICE] Getting project setup data. Language: ${lang || 'all'}, Metadata: ${upperMetadata || 'all'}`);
    
    try {
        let query;
        let params = [];
        let paramIndex = 1;
        
        // Construction de la requête en fonction des paramètres
        if (lang && upperMetadata) {
            // Filtrer par langue et metadata
            query = `
                SELECT 
                    psc.uuid, 
                    psc.metadata,
                    psc.code, 
                    psl.lang,
                    psl.label
                FROM configuration.project_setup_codes psc
                JOIN translations.project_setup_label psl 
                    ON psc.code = psl.rel_project_setup_code
                WHERE psl.lang = $${paramIndex++}
                AND psc.metadata = $${paramIndex++}
                ORDER BY psc.metadata, psc.code, psl.lang
            `;
            params.push(lang, upperMetadata);
        } else if (lang) {
            // Filtrer par langue uniquement
            query = `
                SELECT 
                    psc.uuid, 
                    psc.metadata,
                    psc.code, 
                    psl.lang,
                    psl.label
                FROM configuration.project_setup_codes psc
                JOIN translations.project_setup_label psl 
                    ON psc.code = psl.rel_project_setup_code
                WHERE psl.lang = $${paramIndex++}
                ORDER BY psc.metadata, psc.code, psl.lang
            `;
            params.push(lang);
        } else if (upperMetadata) {
            // Filtrer par metadata uniquement
            query = `
                SELECT 
                    psc.uuid, 
                    psc.metadata,
                    psc.code, 
                    psl.lang,
                    psl.label
                FROM configuration.project_setup_codes psc
                JOIN translations.project_setup_label psl 
                    ON psc.code = psl.rel_project_setup_code
                WHERE psc.metadata = $${paramIndex++}
                ORDER BY psc.metadata, psc.code, psl.lang
            `;
            params.push(upperMetadata);
        } else {
            // Aucun filtre, récupérer toutes les données
            query = `
                SELECT 
                    psc.uuid, 
                    psc.metadata,
                    psc.code, 
                    psl.lang,
                    psl.label
                FROM configuration.project_setup_codes psc
                JOIN translations.project_setup_label psl 
                    ON psc.code = psl.rel_project_setup_code
                ORDER BY psc.metadata, psc.code, psl.lang
            `;
        }
        
        const result = await pool.query(query, params);
        
        logger.info(`[SERVICE] Found ${result.rows.length} project setup entries`);
        
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
        logger.error(`[SERVICE] Error getting project setup data: ${error.message}`);
        throw error;
    }
};

module.exports = {
    getAllProjectSetup,
    getProjectSetupByUuid,
    updateProjectSetup,
    createProjectSetup,
    getProjectSetup
};
