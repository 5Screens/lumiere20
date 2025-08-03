const { pool } = require('../../../config/database');
const db = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Récupère toutes les problem_categories avec leurs traductions
 * @param {string} lang - Code de langue
 * @param {string} toSelect - Format de retour ('yes' pour select)
 * @returns {Array} Liste des problem categories
 */
const getAllProblemCategories = async (lang, toSelect) => {
    logger.info('[SERVICE] getAllProblemCategories - Getting all problem categories');
    
    try {
        const query = `
            SELECT 
                pc.uuid,
                pc.code,
                COALESCE(pcl.label, pc.code) as label,
                pcl.lang,
                pc.created_at,
                pc.updated_at
            FROM configuration.problem_categories pc
            LEFT JOIN translations.problem_categories_labels pcl 
                ON pc.code = pcl.rel_problem_category_code 
                AND pcl.lang = $1
            INNER JOIN translations.languages l 
                ON l.code = $1 
                AND l.is_active = true
            ORDER BY pc.code ASC;
        `;

        const result = await db.query(query, [lang]);
        
        logger.info(`[SERVICE] getAllProblemCategories - Found ${result.rows.length} problem categories`);
        
        // If toSelect=yes, transform the data to value/label pairs for select components
        if (toSelect === 'yes') {
            logger.info('[SERVICE] getAllProblemCategories - Transforming problem categories to select format (label/value pairs)');
            return result.rows.map(category => ({
                label: category.label,
                value: category.code
            }));
        }
        
        return result.rows;
    } catch (error) {
        logger.error(`[SERVICE] getAllProblemCategories - Error getting problem categories: ${error.message}`);
        throw error;
    }
};

/**
 * Fonction legacy pour compatibilité
 */
const getProblemCategories = getAllProblemCategories;

/**
 * Récupère une problem_category par UUID avec toutes ses traductions
 * @param {string} uuid - UUID de la problem_category
 * @param {string} lang - Code de langue (optionnel)
 * @returns {Object} Problem category avec ses traductions
 */
async function getProblemCategoryByUuid(uuid, lang = null) {
    logger.info(`[SERVICE] getProblemCategoryByUuid - Starting database query for problem category UUID: ${uuid}, language: ${lang}`);
    try {
        let query, params;
        
        if (lang) {
            // Si une langue est spécifiée, retourner seulement cette traduction
            query = `
                SELECT 
                    pc.uuid,
                    pc.code,
                    pc.created_at,
                    pc.updated_at,
                    pcl.label,
                    pcl.lang
                FROM configuration.problem_categories pc
                LEFT JOIN translations.problem_categories_labels pcl ON pc.code = pcl.rel_problem_category_code
                WHERE pc.uuid = $1 AND (pcl.lang = $2 OR pcl.lang IS NULL)
            `;
            params = [uuid, lang];
        } else {
            // Si aucune langue spécifiée, retourner toutes les traductions
            query = `
                SELECT 
                    pc.uuid,
                    pc.code,
                    pc.created_at,
                    pc.updated_at,
                    COALESCE(
                        json_agg(
                            CASE WHEN pcl.uuid IS NOT NULL THEN
                                json_build_object(
                                    'label_uuid', pcl.uuid,
                                    'label_lang_code', pcl.lang,
                                    'label', pcl.label
                                )
                            END
                        ) FILTER (WHERE pcl.uuid IS NOT NULL), 
                        '[]'::json
                    ) as labels
                FROM configuration.problem_categories pc
                LEFT JOIN translations.problem_categories_labels pcl ON pc.code = pcl.rel_problem_category_code
                WHERE pc.uuid = $1
                GROUP BY pc.uuid, pc.code, pc.created_at, pc.updated_at
            `;
            params = [uuid];
        }
        
        const result = await db.query(query, params);
        
        if (result.rows.length === 0) {
            logger.info(`[SERVICE] getProblemCategoryByUuid - No problem category found with UUID: ${uuid}`);
            return null;
        }
        
        if (lang) {
            // Retourner un seul objet pour une langue spécifique
            const problemCategory = result.rows[0];
            logger.info(`[SERVICE] getProblemCategoryByUuid - Query executed successfully, found problem category for language: ${lang}`);
            return problemCategory;
        } else {
            // Retourner l'objet avec toutes les traductions
            const problemCategory = result.rows[0];
            logger.info(`[SERVICE] getProblemCategoryByUuid - Query executed successfully, found problem category with ${problemCategory.labels.length} translations`);
            return problemCategory;
        }
    } catch (error) {
        logger.error(`[SERVICE] getProblemCategoryByUuid - Database error: ${error.message}`);
        throw error;
    }
}

/**
 * Met à jour une problem_category
 * @param {string} uuid - UUID de la problem_category
 * @param {Object} problemCategoryData - Données à mettre à jour
 * @returns {Object} Problem category mise à jour
 */
async function updateProblemCategory(uuid, problemCategoryData) {
    logger.info(`[SERVICE] updateProblemCategory - Starting transaction for UUID: ${uuid}`);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        logger.info('[SERVICE] updateProblemCategory - Transaction started');
        
        // Différer la contrainte de clé étrangère pour permettre la mise à jour du code
        await client.query('SET CONSTRAINTS problem_categories_labels_rel_problem_category_code_fkey DEFERRED');
        logger.info('[SERVICE] updateProblemCategory - Foreign key constraint deferred');

        // Récupérer le code actuel de la problem category
        const getCurrentCodeQuery = `
            SELECT code FROM configuration.problem_categories WHERE uuid = $1
        `;
        const currentCodeResult = await client.query(getCurrentCodeQuery, [uuid]);
        
        if (currentCodeResult.rows.length === 0) {
            throw new Error(`Problem category with UUID ${uuid} not found`);
        }
        
        const currentCode = currentCodeResult.rows[0].code;
        logger.info(`[SERVICE] updateProblemCategory - Current problem category code: ${currentCode}`);

        // Mettre à jour les champs dans la table problem_categories si nécessaire
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;
        
        if (problemCategoryData.code && problemCategoryData.code !== currentCode) {
            updateFields.push(`code = $${paramIndex}`);
            updateValues.push(problemCategoryData.code);
            paramIndex++;
        }
        
        if (updateFields.length > 0) {
            updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
            updateValues.push(uuid);
            
            const updateProblemCategoryQuery = `
                UPDATE configuration.problem_categories 
                SET ${updateFields.join(', ')}
                WHERE uuid = $${paramIndex}
                RETURNING code
            `;
            const problemCategoryResult = await client.query(updateProblemCategoryQuery, updateValues);
            logger.info(`[SERVICE] updateProblemCategory - Updated problem category fields`);
            
            // Si le code a changé, mettre à jour les codes dans la table de traductions
            if (problemCategoryData.code && problemCategoryData.code !== currentCode) {
                const updateTranslationCodesQuery = `
                    UPDATE translations.problem_categories_labels 
                    SET rel_problem_category_code = $1, updated_at = CURRENT_TIMESTAMP 
                    WHERE rel_problem_category_code = $2
                `;
                const translationResult = await client.query(updateTranslationCodesQuery, [problemCategoryData.code, currentCode]);
                logger.info(`[SERVICE] updateProblemCategory - Updated ${translationResult.rowCount} translation codes from ${currentCode} to ${problemCategoryData.code}`);
            }
        } else {
            logger.info('[SERVICE] updateProblemCategory - No fields to update in problem_categories table');
        }

        await client.query('COMMIT');
        logger.info('[SERVICE] updateProblemCategory - Transaction committed successfully');

        // Récupérer et retourner la problem category mise à jour
        const updatedProblemCategory = await getProblemCategoryByUuid(uuid);
        return updatedProblemCategory;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`[SERVICE] updateProblemCategory - Transaction rolled back due to error: ${error.message}`);
        throw error;
    } finally {
        client.release();
        logger.info('[SERVICE] updateProblemCategory - Database client released');
    }
}

/**
 * Crée une nouvelle problem_category avec ses traductions
 * @param {Object} problemCategoryData - Données de la problem category à créer
 * @returns {Object} Problem category créée
 */
async function createProblemCategory(problemCategoryData) {
    logger.info('[SERVICE] createProblemCategory - Starting transaction');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        logger.info('[SERVICE] createProblemCategory - Transaction started');

        // Insérer dans la table problem_categories
        const problemCategoryQuery = `
            INSERT INTO configuration.problem_categories (code)
            VALUES ($1)
            RETURNING uuid, code
        `;
        const problemCategoryResult = await client.query(problemCategoryQuery, [
            problemCategoryData.code
        ]);
        logger.info(`[SERVICE] createProblemCategory - Inserted into configuration.problem_categories with code: ${problemCategoryData.code}`);

        // Insérer les traductions (labels)
        if (problemCategoryData.labels && problemCategoryData.labels.length > 0) {
            const translationQuery = `
                INSERT INTO translations.problem_categories_labels (rel_problem_category_code, lang, label)
                VALUES ($1, $2, $3)
                RETURNING *
            `;

            const translationPromises = problemCategoryData.labels.map(label =>
                client.query(translationQuery, [
                    problemCategoryData.code,
                    label.label_lang_code,
                    label.label
                ])
            );

            const translationResults = await Promise.all(translationPromises);
            logger.info(`[SERVICE] createProblemCategory - Inserted ${translationResults.length} translations`);
        }

        await client.query('COMMIT');
        logger.info('[SERVICE] createProblemCategory - Transaction committed successfully');

        // Récupérer et retourner la problem category créée avec toutes ses traductions
        const createdProblemCategory = await getProblemCategoryByUuid(problemCategoryResult.rows[0].uuid);
        return createdProblemCategory;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`[SERVICE] createProblemCategory - Transaction rolled back due to error: ${error.message}`);
        throw error;
    } finally {
        client.release();
        logger.info('[SERVICE] createProblemCategory - Database client released');
    }
}

module.exports = {
    getAllProblemCategories,
    getProblemCategories, // Legacy function
    getProblemCategoryByUuid,
    updateProblemCategory,
    createProblemCategory
};
