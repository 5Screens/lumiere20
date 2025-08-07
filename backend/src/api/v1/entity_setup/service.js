const { pool } = require('../../../config/database');
const db = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Récupère les données de configuration des entités
 * @param {string} lang - Code de langue (optionnel)
 * @param {string} metadata - Type de métadonnées à filtrer (optionnel)
 * @returns {Promise<Array>} - Liste des configurations d'entité
 */
const getEntitySetup = async (lang, metadata) => {
    // Convertir metadata en majuscules si fourni
    const upperMetadata = metadata ? metadata.toUpperCase() : metadata;
    
    logger.info(`[SERVICE] Getting entity setup data. Language: ${lang || 'all'}, Metadata: ${upperMetadata || 'all'}`);
    
    try {
        let query;
        let params = [];
        let paramIndex = 1;
        
        // Construction de la requête en fonction des paramètres
        if (lang && upperMetadata) {
            // Filtrer par langue et metadata
            query = `
                SELECT 
                    esc.uuid, 
                    esc.metadata,
                    esc.code, 
                    esl.lang,
                    esl.label
                FROM configuration.entity_setup_codes esc
                JOIN translations.entity_setup_labels esl 
                    ON esc.code = esl.rel_entity_setup_code
                WHERE esl.lang = $${paramIndex++}
                AND esc.metadata = $${paramIndex++}
                ORDER BY esc.metadata, esc.code, esl.lang
            `;
            params.push(lang, upperMetadata);
        } else if (lang) {
            // Filtrer par langue uniquement
            query = `
                SELECT 
                    esc.uuid, 
                    esc.metadata,
                    esc.code, 
                    esl.lang,
                    esl.label
                FROM configuration.entity_setup_codes esc
                JOIN translations.entity_setup_labels esl 
                    ON esc.code = esl.rel_entity_setup_code
                WHERE esl.lang = $${paramIndex++}
                ORDER BY esc.metadata, esc.code, esl.lang
            `;
            params.push(lang);
        } else if (upperMetadata) {
            // Filtrer par metadata uniquement
            query = `
                SELECT 
                    esc.uuid, 
                    esc.metadata,
                    esc.code, 
                    esl.lang,
                    esl.label
                FROM configuration.entity_setup_codes esc
                JOIN translations.entity_setup_labels esl 
                    ON esc.code = esl.rel_entity_setup_code
                WHERE esc.metadata = $${paramIndex++}
                ORDER BY esc.metadata, esc.code, esl.lang
            `;
            params.push(upperMetadata);
        } else {
            // Aucun filtre - récupérer tout
            query = `
                SELECT 
                    esc.uuid, 
                    esc.metadata,
                    esc.code, 
                    esl.lang,
                    esl.label
                FROM configuration.entity_setup_codes esc
                LEFT JOIN translations.entity_setup_labels esl 
                    ON esc.code = esl.rel_entity_setup_code
                ORDER BY esc.metadata, esc.code, esl.lang
            `;
        }
        
        const result = await db.query(query, params);
        logger.info(`[SERVICE] Entity setup query executed successfully, found ${result.rows.length} records`);
        
        return result.rows;
    } catch (error) {
        logger.error(`[SERVICE] Error in getEntitySetup: ${error.message}`);
        throw error;
    }
};

/**
 * Récupère tous les entity_setup_codes avec leurs traductions dans la langue spécifiée
 * @param {string} lang - Code de langue pour les traductions
 * @returns {Array} Liste des entity setups avec traductions
 */
async function getAllEntitySetup(lang = 'en') {
    logger.info(`[SERVICE] getAllEntitySetup - Starting database query for language: ${lang}`);
    try {
        const query = `
            SELECT 
                esc.uuid,
                esc.metadata,
                esc.code,
                esc.created_at,
                esc.updated_at,
                COALESCE(esl.label, esc.code) as label,
                COALESCE(esl.lang, $1) as lang
            FROM configuration.entity_setup_codes esc
            LEFT JOIN translations.entity_setup_labels esl ON esc.code = esl.rel_entity_setup_code AND esl.lang = $1
            ORDER BY esc.metadata, esc.code
        `;
        
        const result = await db.query(query, [lang]);
        logger.info(`[SERVICE] getAllEntitySetup - Query executed successfully, found ${result.rows.length} entity setups`);
        return result.rows;
    } catch (error) {
        logger.error(`[SERVICE] getAllEntitySetup - Database error: ${error.message}`);
        throw error;
    }
}

/**
 * Récupère un entity_setup_code par UUID avec toutes ses traductions
 * @param {string} uuid - UUID du entity_setup_code
 * @returns {Object} Entity setup avec ses traductions
 */
async function getEntitySetupByUuid(uuid) {
    logger.info(`[SERVICE] getEntitySetupByUuid - Starting database query for entity setup UUID: ${uuid}`);
    try {
        const query = `
            SELECT 
                esc.uuid,
                esc.metadata,
                esc.code,
                esc.created_at,
                esc.updated_at,
                COALESCE(
                    json_agg(
                        CASE WHEN esl.uuid IS NOT NULL THEN
                            json_build_object(
                                'label_uuid', esl.uuid,
                                'label_lang_code', esl.lang,
                                'label', esl.label
                            )
                        END
                    ) FILTER (WHERE esl.uuid IS NOT NULL), 
                    '[]'::json
                ) as labels
            FROM configuration.entity_setup_codes esc
            LEFT JOIN translations.entity_setup_labels esl ON esc.code = esl.rel_entity_setup_code
            WHERE esc.uuid = $1
            GROUP BY esc.uuid, esc.metadata, esc.code, esc.created_at, esc.updated_at
        `;
        
        const result = await db.query(query, [uuid]);
        
        if (result.rows.length === 0) {
            logger.info(`[SERVICE] getEntitySetupByUuid - No entity setup found with UUID: ${uuid}`);
            return null;
        }
        
        const entitySetup = result.rows[0];
        logger.info(`[SERVICE] getEntitySetupByUuid - Query executed successfully, found entity setup with ${entitySetup.labels.length} translations`);
        return entitySetup;
    } catch (error) {
        logger.error(`[SERVICE] getEntitySetupByUuid - Database error: ${error.message}`);
        throw error;
    }
}

/**
 * Met à jour un entity_setup_code
 * @param {string} uuid - UUID du entity_setup_code
 * @param {Object} entitySetupData - Données à mettre à jour
 * @returns {Object} Entity setup mis à jour
 */
async function updateEntitySetup(uuid, entitySetupData) {
    logger.info(`[SERVICE] updateEntitySetup - Starting transaction for UUID: ${uuid}`);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        logger.info('[SERVICE] updateEntitySetup - Transaction started');
        
        // Différer la contrainte de clé étrangère pour permettre la mise à jour du code
        await client.query('SET CONSTRAINTS entity_setup_labels_rel_entity_setup_code_fkey DEFERRED');
        logger.info('[SERVICE] updateEntitySetup - Foreign key constraint deferred');

        // Récupérer le code actuel du entity setup
        const getCurrentCodeQuery = `
            SELECT code FROM configuration.entity_setup_codes WHERE uuid = $1
        `;
        const currentCodeResult = await client.query(getCurrentCodeQuery, [uuid]);
        
        if (currentCodeResult.rows.length === 0) {
            throw new Error(`Entity setup with UUID ${uuid} not found`);
        }
        
        const currentCode = currentCodeResult.rows[0].code;
        logger.info(`[SERVICE] updateEntitySetup - Current entity setup code: ${currentCode}`);

        // Mettre à jour les champs dans la table entity_setup_codes si nécessaire
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;
        
        if (entitySetupData.code && entitySetupData.code !== currentCode) {
            updateFields.push(`code = $${paramIndex}`);
            updateValues.push(entitySetupData.code);
            paramIndex++;
        }
        
        if (entitySetupData.metadata) {
            updateFields.push(`metadata = $${paramIndex}`);
            updateValues.push(entitySetupData.metadata);
            paramIndex++;
        }
        
        if (updateFields.length > 0) {
            updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
            updateValues.push(uuid);
            
            const updateEntitySetupQuery = `
                UPDATE configuration.entity_setup_codes 
                SET ${updateFields.join(', ')}
                WHERE uuid = $${paramIndex}
                RETURNING code
            `;
            const entitySetupResult = await client.query(updateEntitySetupQuery, updateValues);
            logger.info(`[SERVICE] updateEntitySetup - Updated entity setup fields`);
            
            // Si le code a changé, mettre à jour les codes dans la table de traductions
            if (entitySetupData.code && entitySetupData.code !== currentCode) {
                const updateTranslationCodesQuery = `
                    UPDATE translations.entity_setup_labels 
                    SET rel_entity_setup_code = $1, updated_at = CURRENT_TIMESTAMP 
                    WHERE rel_entity_setup_code = $2
                `;
                const translationResult = await client.query(updateTranslationCodesQuery, [entitySetupData.code, currentCode]);
                logger.info(`[SERVICE] updateEntitySetup - Updated ${translationResult.rowCount} translation codes from ${currentCode} to ${entitySetupData.code}`);
            }
        } else {
            logger.info('[SERVICE] updateEntitySetup - No fields to update in entity_setup_codes table');
        }

        await client.query('COMMIT');
        logger.info('[SERVICE] updateEntitySetup - Transaction committed successfully');

        // Récupérer et retourner le entity setup mis à jour
        const updatedEntitySetup = await getEntitySetupByUuid(uuid);
        return updatedEntitySetup;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`[SERVICE] updateEntitySetup - Transaction rolled back due to error: ${error.message}`);
        throw error;
    } finally {
        client.release();
        logger.info('[SERVICE] updateEntitySetup - Database client released');
    }
}

/**
 * Crée un nouveau entity_setup_code avec ses traductions
 * @param {Object} entitySetupData - Données du entity setup à créer
 * @returns {Object} Entity setup créé
 */
async function createEntitySetup(entitySetupData) {
    logger.info('[SERVICE] createEntitySetup - Starting transaction');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        logger.info('[SERVICE] createEntitySetup - Transaction started');

        // Insérer dans la table entity_setup_codes
        const entitySetupQuery = `
            INSERT INTO configuration.entity_setup_codes (metadata, code)
            VALUES ($1, $2)
            RETURNING uuid, code
        `;
        const entitySetupResult = await client.query(entitySetupQuery, [
            entitySetupData.metadata || '', 
            entitySetupData.code
        ]);
        logger.info(`[SERVICE] createEntitySetup - Inserted into configuration.entity_setup_codes with code: ${entitySetupData.code}`);

        // Insérer les traductions (labels)
        if (entitySetupData.labels && entitySetupData.labels.length > 0) {
            const translationQuery = `
                INSERT INTO translations.entity_setup_labels (rel_entity_setup_code, lang, label)
                VALUES ($1, $2, $3)
                RETURNING *
            `;

            const translationPromises = entitySetupData.labels.map(label =>
                client.query(translationQuery, [
                    entitySetupData.code,
                    label.label_lang_code,
                    label.label
                ])
            );

            const translationResults = await Promise.all(translationPromises);
            logger.info(`[SERVICE] createEntitySetup - Inserted ${translationResults.length} translations`);
        }

        await client.query('COMMIT');
        logger.info('[SERVICE] createEntitySetup - Transaction committed successfully');

        // Récupérer et retourner le entity setup créé avec toutes ses traductions
        const createdEntitySetup = await getEntitySetupByUuid(entitySetupResult.rows[0].uuid);
        return createdEntitySetup;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`[SERVICE] createEntitySetup - Transaction rolled back due to error: ${error.message}`);
        throw error;
    } finally {
        client.release();
        logger.info('[SERVICE] createEntitySetup - Database client released');
    }
}

module.exports = {
    getEntitySetup,
    getAllEntitySetup,
    getEntitySetupByUuid,
    updateEntitySetup,
    createEntitySetup
};
