const { pool } = require('../../../config/database');
const db = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Récupère tous les incident_setup_codes avec leurs traductions dans la langue spécifiée
 * @param {string} lang - Code de langue pour les traductions
 * @param {string} metadata - Filtre optionnel par metadata
 * @returns {Array} Liste des incident_setup avec traductions
 */
async function getAllIncidentSetup(lang = 'fr', metadata = null) {
    logger.info(`[SERVICE] getAllIncidentSetup - Starting database query for language: ${lang}, metadata: ${metadata}`);
    try {
        let query = `
            SELECT 
                isc.uuid,
                isc.metadata,
                isc.code,
                isc.value,
                isl.label,
                isl.lang,
                isc.created_at,
                isc.updated_at
            FROM configuration.incident_setup_codes isc
            LEFT JOIN translations.incident_setup_labels isl ON isc.code = isl.rel_incident_setup_code
            WHERE (isl.lang = $1 OR isl.lang IS NULL)
        `;
        
        const params = [lang];
        
        if (metadata) {
            query += ` AND isc.metadata = $2`;
            params.push(metadata);
        }
        
        query += ` ORDER BY isc.metadata, isc.code`;
        
        const result = await db.query(query, params);
        logger.info(`[SERVICE] getAllIncidentSetup - Query executed successfully, found ${result.rows.length} incident_setup records`);
        return result.rows;
    } catch (error) {
        logger.error(`[SERVICE] getAllIncidentSetup - Database error: ${error.message}`);
        throw error;
    }
}

/**
 * Récupère un incident_setup_code par UUID avec toutes ses traductions
 * @param {string} uuid - UUID du incident_setup_code
 * @param {string} lang - Code de langue (optionnel)
 * @returns {Object} Incident setup avec ses traductions
 */
async function getIncidentSetupByUuid(uuid, lang = null) {
    logger.info(`[SERVICE] getIncidentSetupByUuid - Starting database query for incident setup UUID: ${uuid}, language: ${lang}`);
    try {
        let query, params;
        
        if (lang) {
            // Si une langue est spécifiée, retourner seulement cette traduction
            query = `
                SELECT 
                    isc.uuid,
                    isc.metadata,
                    isc.code,
                    isc.value,
                    isl.label,
                    isl.lang,
                    isc.created_at,
                    isc.updated_at
                FROM configuration.incident_setup_codes isc
                LEFT JOIN translations.incident_setup_labels isl ON isc.code = isl.rel_incident_setup_code
                WHERE isc.uuid = $1 AND (isl.lang = $2 OR isl.lang IS NULL)
            `;
            params = [uuid, lang];
        } else {
            // Si aucune langue spécifiée, retourner toutes les traductions
            query = `
                SELECT 
                    isc.uuid,
                    isc.metadata,
                    isc.code,
                    isc.value,
                    isc.created_at,
                    isc.updated_at,
                    COALESCE(
                        json_agg(
                            CASE WHEN isl.uuid IS NOT NULL THEN
                                json_build_object(
                                    'label_uuid', isl.uuid,
                                    'label_lang_code', isl.lang,
                                    'label', isl.label
                                )
                            END
                        ) FILTER (WHERE isl.uuid IS NOT NULL), 
                        '[]'::json
                    ) as labels
                FROM configuration.incident_setup_codes isc
                LEFT JOIN translations.incident_setup_labels isl ON isc.code = isl.rel_incident_setup_code
                WHERE isc.uuid = $1
                GROUP BY isc.uuid, isc.metadata, isc.code, isc.value, isc.created_at, isc.updated_at
            `;
            params = [uuid];
        }
        
        const result = await db.query(query, params);
        
        if (result.rows.length === 0) {
            logger.info(`[SERVICE] getIncidentSetupByUuid - No incident setup found with UUID: ${uuid}`);
            return null;
        }
        
        if (lang) {
            // Retourner un seul objet pour une langue spécifique
            const incidentSetup = result.rows[0];
            logger.info(`[SERVICE] getIncidentSetupByUuid - Query executed successfully, found incident setup for language: ${lang}`);
            return incidentSetup;
        } else {
            // Retourner l'objet avec toutes les traductions
            const incidentSetup = result.rows[0];
            logger.info(`[SERVICE] getIncidentSetupByUuid - Query executed successfully, found incident setup with ${incidentSetup.labels.length} translations`);
            return incidentSetup;
        }
    } catch (error) {
        logger.error(`[SERVICE] getIncidentSetupByUuid - Database error: ${error.message}`);
        throw error;
    }
}

/**
 * Met à jour un incident_setup_code
 * @param {string} uuid - UUID du incident_setup_code
 * @param {Object} incidentSetupData - Données à mettre à jour
 * @returns {Object} Incident setup mis à jour
 */
async function updateIncidentSetup(uuid, incidentSetupData) {
    logger.info(`[SERVICE] updateIncidentSetup - Starting transaction for UUID: ${uuid}`);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        logger.info('[SERVICE] updateIncidentSetup - Transaction started');
        
        // Différer la contrainte de clé étrangère pour permettre la mise à jour du code
        await client.query('SET CONSTRAINTS incident_setup_labels_rel_incident_setup_code_fkey DEFERRED');
        logger.info('[SERVICE] updateIncidentSetup - Foreign key constraint deferred');

        // Récupérer le code actuel du incident setup
        const getCurrentCodeQuery = `
            SELECT code FROM configuration.incident_setup_codes WHERE uuid = $1
        `;
        const currentCodeResult = await client.query(getCurrentCodeQuery, [uuid]);
        
        if (currentCodeResult.rows.length === 0) {
            throw new Error(`Incident setup with UUID ${uuid} not found`);
        }
        
        const currentCode = currentCodeResult.rows[0].code;
        logger.info(`[SERVICE] updateIncidentSetup - Current incident setup code: ${currentCode}`);

        // Mettre à jour les champs dans la table incident_setup_codes si nécessaire
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;
        
        if (incidentSetupData.code && incidentSetupData.code !== currentCode) {
            updateFields.push(`code = $${paramIndex}`);
            updateValues.push(incidentSetupData.code);
            paramIndex++;
        }
        
        if (incidentSetupData.metadata) {
            updateFields.push(`metadata = $${paramIndex}`);
            updateValues.push(incidentSetupData.metadata);
            paramIndex++;
        }
        
        if (incidentSetupData.value !== undefined) {
            updateFields.push(`value = $${paramIndex}`);
            updateValues.push(incidentSetupData.value);
            paramIndex++;
        }
        
        if (updateFields.length > 0) {
            updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
            updateValues.push(uuid);
            
            const updateIncidentSetupQuery = `
                UPDATE configuration.incident_setup_codes 
                SET ${updateFields.join(', ')}
                WHERE uuid = $${paramIndex}
                RETURNING code
            `;
            const incidentSetupResult = await client.query(updateIncidentSetupQuery, updateValues);
            logger.info(`[SERVICE] updateIncidentSetup - Updated incident setup fields`);
            
            // Si le code a changé, mettre à jour les codes dans la table de traductions
            if (incidentSetupData.code && incidentSetupData.code !== currentCode) {
                const updateTranslationCodesQuery = `
                    UPDATE translations.incident_setup_labels 
                    SET rel_incident_setup_code = $1, updated_at = CURRENT_TIMESTAMP 
                    WHERE rel_incident_setup_code = $2
                `;
                const translationResult = await client.query(updateTranslationCodesQuery, [incidentSetupData.code, currentCode]);
                logger.info(`[SERVICE] updateIncidentSetup - Updated ${translationResult.rowCount} translation codes from ${currentCode} to ${incidentSetupData.code}`);
            }
        } else {
            logger.info('[SERVICE] updateIncidentSetup - No fields to update in incident_setup_codes table');
        }

        await client.query('COMMIT');
        logger.info('[SERVICE] updateIncidentSetup - Transaction committed successfully');

        // Récupérer et retourner le incident setup mis à jour
        const updatedIncidentSetup = await getIncidentSetupByUuid(uuid);
        return updatedIncidentSetup;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`[SERVICE] updateIncidentSetup - Transaction rolled back due to error: ${error.message}`);
        throw error;
    } finally {
        client.release();
        logger.info('[SERVICE] updateIncidentSetup - Database client released');
    }
}

/**
 * Crée un nouveau incident_setup_code avec ses traductions
 * @param {Object} incidentSetupData - Données du incident setup à créer
 * @returns {Object} Incident setup créé
 */
async function createIncidentSetup(incidentSetupData) {
    logger.info('[SERVICE] createIncidentSetup - Starting transaction');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        logger.info('[SERVICE] createIncidentSetup - Transaction started');

        // Insérer dans la table incident_setup_codes
        const incidentSetupQuery = `
            INSERT INTO configuration.incident_setup_codes (metadata, code, value)
            VALUES ($1, $2, $3)
            RETURNING uuid, code
        `;
        const incidentSetupResult = await client.query(incidentSetupQuery, [
            incidentSetupData.metadata || '', 
            incidentSetupData.code,
            incidentSetupData.value || null
        ]);
        logger.info(`[SERVICE] createIncidentSetup - Inserted into configuration.incident_setup_codes with code: ${incidentSetupData.code}`);

        // Insérer les traductions (labels)
        if (incidentSetupData.labels && incidentSetupData.labels.length > 0) {
            const translationQuery = `
                INSERT INTO translations.incident_setup_labels (rel_incident_setup_code, lang, label)
                VALUES ($1, $2, $3)
                RETURNING *
            `;

            const translationPromises = incidentSetupData.labels.map(label =>
                client.query(translationQuery, [
                    incidentSetupData.code,
                    label.label_lang_code,
                    label.label
                ])
            );

            const translationResults = await Promise.all(translationPromises);
            logger.info(`[SERVICE] createIncidentSetup - Inserted ${translationResults.length} translations`);
        }

        await client.query('COMMIT');
        logger.info('[SERVICE] createIncidentSetup - Transaction committed successfully');

        // Récupérer et retourner le incident setup créé avec toutes ses traductions
        const createdIncidentSetup = await getIncidentSetupByUuid(incidentSetupResult.rows[0].uuid);
        return createdIncidentSetup;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`[SERVICE] createIncidentSetup - Transaction rolled back due to error: ${error.message}`);
        throw error;
    } finally {
        client.release();
        logger.info('[SERVICE] createIncidentSetup - Database client released');
    }
}

/**
 * Fonction legacy pour compatibilité avec l'ancien système
 * @param {string} lang - Code de langue
 * @param {string} metadata - Filtre optionnel par metadata
 * @returns {Array} Liste des incident_setup
 */
async function getIncidentSetup(lang = 'fr', metadata = null) {
    logger.info(`[SERVICE] getIncidentSetup (legacy) - Redirecting to getAllIncidentSetup with lang: ${lang}, metadata: ${metadata}`);
    return await getAllIncidentSetup(lang, metadata);
}

module.exports = {
    getAllIncidentSetup,
    getIncidentSetupByUuid,
    updateIncidentSetup,
    createIncidentSetup,
    getIncidentSetup // Fonction legacy
};
