const { pool } = require('../../../config/database');
const db = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Récupère tous les change_options_codes avec leurs traductions
 * @param {string} lang - Code de langue pour filtrer les traductions
 * @returns {Array} Liste des change_options avec traductions
 */
async function getAllChangeOptions(lang = null) {
    logger.info(`[SERVICE] getAllChangeOptions - Starting database query for language: ${lang}`);
    try {
        let query;
        let params = [];
        
        if (lang) {
            // Si une langue est spécifiée, retourner seulement cette traduction
            query = `
                SELECT 
                    coc.uuid,
                    coc.metadata,
                    coc.question_id,
                    coc.code,
                    coc.weight,
                    col.label,
                    col.lang,
                    coc.created_at,
                    coc.updated_at
                FROM configuration.change_options_codes coc
                LEFT JOIN translations.change_options_labels col ON coc.code = col.rel_change_option_code
                WHERE col.lang = $1 OR col.lang IS NULL
                ORDER BY coc.question_id, coc.weight ASC
            `;
            params = [lang];
        } else {
            // Si aucune langue spécifiée, retourner toutes les traductions
            query = `
                SELECT 
                    coc.uuid,
                    coc.metadata,
                    coc.question_id,
                    coc.code,
                    coc.weight,
                    col.label,
                    col.lang,
                    coc.created_at,
                    coc.updated_at
                FROM configuration.change_options_codes coc
                LEFT JOIN translations.change_options_labels col ON coc.code = col.rel_change_option_code
                ORDER BY coc.question_id, coc.weight ASC
            `;
        }
        
        const result = await db.query(query, params);
        logger.info(`[SERVICE] getAllChangeOptions - Query executed successfully, found ${result.rows.length} change options`);
        return result.rows;
    } catch (error) {
        logger.error(`[SERVICE] getAllChangeOptions - Database error: ${error.message}`);
        throw error;
    }
}

/**
 * Récupère un change_options_code par UUID avec toutes ses traductions
 * @param {string} uuid - UUID du change_options_code
 * @param {string} lang - Code de langue (optionnel)
 * @returns {Object} Change option avec ses traductions
 */
async function getChangeOptionByUuid(uuid, lang = null) {
    logger.info(`[SERVICE] getChangeOptionByUuid - Starting database query for change option UUID: ${uuid}, language: ${lang}`);
    try {
        let query, params;
        
        if (lang) {
            // Si une langue est spécifiée, retourner seulement cette traduction
            query = `
                SELECT 
                    coc.uuid,
                    coc.metadata,
                    coc.question_id,
                    coc.code,
                    coc.weight,
                    col.label,
                    col.lang,
                    coc.created_at,
                    coc.updated_at
                FROM configuration.change_options_codes coc
                LEFT JOIN translations.change_options_labels col ON coc.code = col.rel_change_option_code
                WHERE coc.uuid = $1 AND (col.lang = $2 OR col.lang IS NULL)
            `;
            params = [uuid, lang];
        } else {
            // Si aucune langue spécifiée, retourner toutes les traductions
            query = `
                SELECT 
                    coc.uuid,
                    coc.metadata,
                    coc.question_id,
                    coc.code,
                    coc.weight,
                    coc.created_at,
                    coc.updated_at,
                    COALESCE(
                        json_agg(
                            CASE WHEN col.uuid IS NOT NULL THEN
                                json_build_object(
                                    'label_uuid', col.uuid,
                                    'label_lang_code', col.lang,
                                    'label', col.label
                                )
                            END
                        ) FILTER (WHERE col.uuid IS NOT NULL), 
                        '[]'::json
                    ) as labels
                FROM configuration.change_options_codes coc
                LEFT JOIN translations.change_options_labels col ON coc.code = col.rel_change_option_code
                WHERE coc.uuid = $1
                GROUP BY coc.uuid, coc.metadata, coc.question_id, coc.code, coc.weight, coc.created_at, coc.updated_at
            `;
            params = [uuid];
        }
        
        const result = await db.query(query, params);
        
        if (result.rows.length === 0) {
            logger.info(`[SERVICE] getChangeOptionByUuid - No change option found with UUID: ${uuid}`);
            return null;
        }
        
        if (lang) {
            // Retourner un seul objet pour une langue spécifique
            const changeOption = result.rows[0];
            logger.info(`[SERVICE] getChangeOptionByUuid - Query executed successfully, found change option for language: ${lang}`);
            return changeOption;
        } else {
            // Retourner l'objet avec toutes les traductions
            const changeOption = result.rows[0];
            logger.info(`[SERVICE] getChangeOptionByUuid - Query executed successfully, found change option with ${changeOption.labels.length} translations`);
            return changeOption;
        }
    } catch (error) {
        logger.error(`[SERVICE] getChangeOptionByUuid - Database error: ${error.message}`);
        throw error;
    }
}

/**
 * Met à jour un change_options_code
 * @param {string} uuid - UUID du change_options_code
 * @param {Object} changeOptionData - Données à mettre à jour
 * @returns {Object} Change option mis à jour
 */
async function updateChangeOption(uuid, changeOptionData) {
    logger.info(`[SERVICE] updateChangeOption - Starting transaction for UUID: ${uuid}`);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        logger.info('[SERVICE] updateChangeOption - Transaction started');
        
        // Différer la contrainte de clé étrangère pour permettre la mise à jour du code
        await client.query('SET CONSTRAINTS change_options_labels_rel_change_option_code_fkey DEFERRED');
        logger.info('[SERVICE] updateChangeOption - Foreign key constraint deferred');

        // Récupérer le code actuel du change option
        const getCurrentCodeQuery = `
            SELECT code FROM configuration.change_options_codes WHERE uuid = $1
        `;
        const currentCodeResult = await client.query(getCurrentCodeQuery, [uuid]);
        
        if (currentCodeResult.rows.length === 0) {
            throw new Error(`Change option with UUID ${uuid} not found`);
        }
        
        const currentCode = currentCodeResult.rows[0].code;
        logger.info(`[SERVICE] updateChangeOption - Current change option code: ${currentCode}`);

        // Mettre à jour les champs dans la table change_options_codes si nécessaire
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;
        
        if (changeOptionData.code && changeOptionData.code !== currentCode) {
            updateFields.push(`code = $${paramIndex}`);
            updateValues.push(changeOptionData.code);
            paramIndex++;
        }
        
        if (changeOptionData.metadata) {
            updateFields.push(`metadata = $${paramIndex}`);
            updateValues.push(changeOptionData.metadata);
            paramIndex++;
        }
        
        if (changeOptionData.question_id) {
            updateFields.push(`question_id = $${paramIndex}`);
            updateValues.push(changeOptionData.question_id);
            paramIndex++;
        }
        
        if (changeOptionData.weight !== undefined) {
            updateFields.push(`weight = $${paramIndex}`);
            updateValues.push(changeOptionData.weight);
            paramIndex++;
        }
        
        if (updateFields.length > 0) {
            updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
            updateValues.push(uuid);
            
            const updateChangeOptionQuery = `
                UPDATE configuration.change_options_codes 
                SET ${updateFields.join(', ')}
                WHERE uuid = $${paramIndex}
                RETURNING code
            `;
            const changeOptionResult = await client.query(updateChangeOptionQuery, updateValues);
            logger.info(`[SERVICE] updateChangeOption - Updated change option fields`);
            
            // Si le code a changé, mettre à jour les codes dans la table de traductions
            if (changeOptionData.code && changeOptionData.code !== currentCode) {
                const updateTranslationCodesQuery = `
                    UPDATE translations.change_options_labels 
                    SET rel_change_option_code = $1, updated_at = CURRENT_TIMESTAMP 
                    WHERE rel_change_option_code = $2
                `;
                const translationResult = await client.query(updateTranslationCodesQuery, [changeOptionData.code, currentCode]);
                logger.info(`[SERVICE] updateChangeOption - Updated ${translationResult.rowCount} translation codes from ${currentCode} to ${changeOptionData.code}`);
            }
        } else {
            logger.info('[SERVICE] updateChangeOption - No fields to update in change_options_codes table');
        }

        await client.query('COMMIT');
        logger.info('[SERVICE] updateChangeOption - Transaction committed successfully');

        // Récupérer et retourner le change option mis à jour
        const updatedChangeOption = await getChangeOptionByUuid(uuid);
        return updatedChangeOption;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`[SERVICE] updateChangeOption - Transaction rolled back due to error: ${error.message}`);
        throw error;
    } finally {
        client.release();
        logger.info('[SERVICE] updateChangeOption - Database client released');
    }
}

/**
 * Crée un nouveau change_options_code avec ses traductions
 * @param {Object} changeOptionData - Données du change option à créer
 * @returns {Object} Change option créé
 */
async function createChangeOption(changeOptionData) {
    logger.info('[SERVICE] createChangeOption - Starting transaction');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        logger.info('[SERVICE] createChangeOption - Transaction started');

        // Insérer dans la table change_options_codes
        const changeOptionQuery = `
            INSERT INTO configuration.change_options_codes (metadata, question_id, code, weight)
            VALUES ($1, $2, $3, $4)
            RETURNING uuid, code
        `;
        const changeOptionResult = await client.query(changeOptionQuery, [
            changeOptionData.metadata || '', 
            changeOptionData.question_id || '',
            changeOptionData.code,
            changeOptionData.weight || 0
        ]);
        logger.info(`[SERVICE] createChangeOption - Inserted into configuration.change_options_codes with code: ${changeOptionData.code}`);

        // Insérer les traductions (labels)
        if (changeOptionData.labels && changeOptionData.labels.length > 0) {
            const translationQuery = `
                INSERT INTO translations.change_options_labels (rel_change_option_code, lang, label)
                VALUES ($1, $2, $3)
                RETURNING *
            `;

            const translationPromises = changeOptionData.labels.map(label =>
                client.query(translationQuery, [
                    changeOptionData.code,
                    label.label_lang_code,
                    label.label
                ])
            );

            const translationResults = await Promise.all(translationPromises);
            logger.info(`[SERVICE] createChangeOption - Inserted ${translationResults.length} translations`);
        }

        await client.query('COMMIT');
        logger.info('[SERVICE] createChangeOption - Transaction committed successfully');

        // Récupérer et retourner le change option créé avec toutes ses traductions
        const createdChangeOption = await getChangeOptionByUuid(changeOptionResult.rows[0].uuid);
        return createdChangeOption;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`[SERVICE] createChangeOption - Transaction rolled back due to error: ${error.message}`);
        throw error;
    } finally {
        client.release();
        logger.info('[SERVICE] createChangeOption - Database client released');
    }
}

// Fonction legacy pour compatibilité
const getChangeOptions = async (questionId, lang) => {
    logger.info(`[SERVICE] getChangeOptions (legacy) - Getting change options for question_id: ${questionId || 'all'}, language: ${lang || 'all'}`);
    
    try {
        let query;
        let params = [];
        let whereClause = '';
        
        // Ajouter la condition de question_id si elle est fournie
        if (questionId) {
            whereClause = `WHERE UPPER(co.question_id) = UPPER($${params.length + 1})`;
            params.push(questionId);
        }
        
        if (lang) {
            // Si une langue spécifique est demandée
            query = `
                SELECT 
                    co.code as value, 
                    co.question_id,
                    COALESCE(col.label, co.code) as label
                FROM configuration.change_options_codes co
                LEFT JOIN translations.change_options_labels col 
                    ON co.code = col.rel_change_option_code 
                    AND col.lang = $${params.length + 1}
                INNER JOIN translations.languages l 
                    ON l.code = $${params.length + 1} 
                    AND l.is_active = true
                ${whereClause}
                ORDER BY co.question_id, co.weight ASC`;
            
            params.push(lang);
        } else {
            // Si aucune langue n'est spécifiée, renvoyer toutes les traductions
            query = `
                SELECT 
                    co.code as value,
                    co.question_id,
                    col.lang,
                    COALESCE(col.label, co.code) as label
                FROM configuration.change_options_codes co
                LEFT JOIN translations.change_options_labels col 
                    ON co.code = col.rel_change_option_code
                INNER JOIN translations.languages l 
                    ON l.code = col.lang 
                    AND l.is_active = true
                ${whereClause}
                ORDER BY co.question_id, co.weight ASC, col.lang ASC`;
        }
        
        const result = await pool.query(query, params);
        logger.info(`[SERVICE] getChangeOptions (legacy) - Successfully retrieved ${result.rows.length} change options`);
        
        return result.rows;
    } catch (error) {
        logger.error(`[SERVICE] getChangeOptions (legacy) - Error getting change options: ${error.message}`);
        throw error;
    }
};

module.exports = {
    getAllChangeOptions,
    getChangeOptionByUuid,
    updateChangeOption,
    createChangeOption,
    getChangeOptions // fonction legacy
};
