const { pool } = require('../../../config/database');
const db = require('../../../config/database');
const logger = require('../../../config/logger');

async function getContactTypes(lang, toSelect) {
    logger.info('[SERVICE] Getting contact types');
    try {
        const query = `
            SELECT 
                ct.created_at,
                ct.updated_at,
                ct.uuid,
                ct.code,
                COALESCE(ctl.label, ct.code) as label,
                l.native_name as lang
            FROM configuration.contact_types ct
            LEFT JOIN translations.contact_types_labels ctl 
                ON ct.code = ctl.rel_contact_type_code 
                AND ctl.language = $1
            INNER JOIN translations.languages l 
                ON ctl.language = l.code
            ORDER BY ct.code ASC
        `;

        const result = await db.query(query, [lang]);
        logger.info(`[SERVICE] Found ${result.rows.length} contact types`);
        
        // If toSelect=yes, transform the data to value/label pairs
        if (toSelect === 'yes') {
            logger.info('[SERVICE] Transforming contact types to select format');
            return result.rows.map(contactType => ({
                value: contactType.code,
                label: contactType.label
            }));
        }
        
        return result.rows;
    } catch (error) {
        logger.error(`[SERVICE] Error getting contact types: ${error.message}`);
        throw error;
    }
}

async function getContactTypeByUuid(uuid, lang = null) {
    logger.info(`[SERVICE] getContactTypeByUuid - Starting database query for contact type UUID: ${uuid}, language: ${lang}`);
    try {
        let query, params;
        
        if (lang) {
            // Si une langue est spécifiée, retourner seulement cette traduction
            query = `
                SELECT 
                    ct.uuid,
                    ct.code as contact_type_code,
                    ctl.label,
                    ctl.language,
                    ctl.created_at,
                    ctl.updated_at
                FROM configuration.contact_types ct
                JOIN translations.contact_types_labels ctl ON ct.code = ctl.rel_contact_type_code
                WHERE ct.uuid = $1 AND ctl.language = $2
            `;
            params = [uuid, lang];
        } else {
            // Si aucune langue spécifiée, retourner toutes les traductions
            query = `
                SELECT 
                    ct.uuid as uuid,
                    ct.code as code,
                    ct.created_at,
                    ct.updated_at,
                    json_agg(
                        json_build_object(
                            'label_uuid', ctl.uuid,
                            'label_lang_code', ctl.language,
                            'label', ctl.label
                        ) ORDER BY ctl.language ASC
                    ) as labels
                FROM configuration.contact_types ct
                JOIN translations.contact_types_labels ctl ON ct.code = ctl.rel_contact_type_code
                WHERE ct.uuid = $1
                GROUP BY ct.uuid, ct.code
            `;
            params = [uuid];
        }
        
        const result = await db.query(query, params);
        
        if (result.rows.length === 0) {
            logger.info(`[SERVICE] getContactTypeByUuid - No contact type found with UUID: ${uuid}`);
            return null;
        }
        
        if (lang) {
            // Retourner un seul objet pour une langue spécifique
            const contactType = result.rows[0];
            logger.info(`[SERVICE] getContactTypeByUuid - Query executed successfully, found contact type for language: ${lang}`);
            return contactType;
        } else {
            // Retourner l'objet avec toutes les traductions
            const contactType = result.rows[0];
            logger.info(`[SERVICE] getContactTypeByUuid - Query executed successfully, found contact type with ${contactType.labels.length} translations`);
            return contactType;
        }
    } catch (error) {
        logger.error(`[SERVICE] getContactTypeByUuid - Database error: ${error.message}`);
        throw error;
    }
}

async function updateContactType(uuid, contactTypeData) {
    logger.info(`[SERVICE] updateContactType - Starting transaction for UUID: ${uuid}`);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        logger.info('[SERVICE] updateContactType - Transaction started');
        
        // Différer la contrainte de clé étrangère pour permettre la mise à jour du code
        await client.query('SET CONSTRAINTS contact_types_labels_rel_contact_type_code_fkey DEFERRED');
        logger.info('[SERVICE] updateContactType - Foreign key constraint deferred');

        // Récupérer le code actuel du type de contact
        const getCurrentCodeQuery = `
            SELECT code FROM configuration.contact_types WHERE uuid = $1
        `;
        const currentCodeResult = await client.query(getCurrentCodeQuery, [uuid]);
        
        if (currentCodeResult.rows.length === 0) {
            throw new Error(`Contact type with UUID ${uuid} not found`);
        }
        
        const currentCode = currentCodeResult.rows[0].code;
        logger.info(`[SERVICE] updateContactType - Current contact type code: ${currentCode}`);

        // Mettre à jour le code dans les tables si nécessaire
        if (contactTypeData.code && contactTypeData.code !== currentCode) {
            // Mettre à jour le code dans la table contact_types
            const updateContactTypeQuery = `
                UPDATE configuration.contact_types 
                SET code = $1, updated_at = CURRENT_TIMESTAMP 
                WHERE uuid = $2
                RETURNING code
            `;
            const contactTypeResult = await client.query(updateContactTypeQuery, [contactTypeData.code, uuid]);
            logger.info(`[SERVICE] updateContactType - Updated contact type code from ${currentCode} to ${contactTypeData.code}`);
            
            // Mettre à jour les codes dans la table de traductions
            const updateTranslationCodesQuery = `
                UPDATE translations.contact_types_labels 
                SET rel_contact_type_code = $1, updated_at = CURRENT_TIMESTAMP 
                WHERE rel_contact_type_code = $2
            `;
            const translationResult = await client.query(updateTranslationCodesQuery, [contactTypeData.code, currentCode]);
            logger.info(`[SERVICE] updateContactType - Updated ${translationResult.rowCount} translation codes from ${currentCode} to ${contactTypeData.code}`);
        } else {
            logger.info('[SERVICE] updateContactType - No code change requested or code is identical');
        }

        await client.query('COMMIT');
        logger.info('[SERVICE] updateContactType - Transaction committed successfully');

        // Récupérer et retourner le type de contact mis à jour
        const updatedContactType = await getContactTypeByUuid(uuid);
        return updatedContactType;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`[SERVICE] updateContactType - Transaction rolled back due to error: ${error.message}`);
        throw error;
    } finally {
        client.release();
        logger.info('[SERVICE] updateContactType - Database client released');
    }
}

async function createContactType(contactTypeData) {
    logger.info('[SERVICE] createContactType - Starting transaction');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        logger.info('[SERVICE] createContactType - Transaction started');

        // Insérer dans la table contact_types
        const contactTypeQuery = `
            INSERT INTO configuration.contact_types (code)
            VALUES ($1)
            RETURNING code
        `;
        const contactTypeResult = await client.query(contactTypeQuery, [contactTypeData.code]);
        logger.info(`[SERVICE] createContactType - Inserted into configuration.contact_types with code: ${contactTypeData.code}`);

        // Insérer les traductions (labels)
        const translationQuery = `
            INSERT INTO translations.contact_types_labels (rel_contact_type_code, language, label)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const translationPromises = contactTypeData.labels.map(label =>
            client.query(translationQuery, [
                contactTypeData.code,
                label.label_lang_code,
                label.label
            ])
        );

        const translationResults = await Promise.all(translationPromises);
        logger.info(`[SERVICE] createContactType - Inserted ${translationResults.length} translations`);

        await client.query('COMMIT');
        logger.info('[SERVICE] createContactType - Transaction committed successfully');

        return {
            code: contactTypeResult.rows[0].code,
            labels: translationResults.map(result => ({
                label_uuid: result.rows[0].uuid,
                label_lang_code: result.rows[0].language,
                label: result.rows[0].label
            }))
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`[SERVICE] createContactType - Transaction rolled back due to error: ${error.message}`);
        throw error;
    } finally {
        client.release();
        logger.info('[SERVICE] createContactType - Database client released');
    }
}

module.exports = {
    getContactTypes,
    getContactTypeByUuid,
    updateContactType,
    createContactType
};
