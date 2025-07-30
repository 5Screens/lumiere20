const { pool } = require('../../../config/database');
const logger = require('../../../config/logger');

class SymptomsService {
    async getAllSymptoms(lang) {
        logger.info(`[SERVICE] getAllSymptoms - Starting database query for language: ${lang}`);
        try {
            const query = `
                SELECT 
                    s.uuid,
                    s.code,
                    st.libelle,
                    st.langue,
                    s.created_at,
                    s.updated_at
                FROM translations.symptoms_translation st
                JOIN configuration.symptoms s ON s.code = st.symptom_code
                WHERE st.langue = $1
                ORDER BY st.libelle ASC
            `;
            
            const result = await pool.query(query, [lang]);
            logger.info(`[SERVICE] getAllSymptoms - Query executed successfully, found ${result.rows.length} symptoms`);
            return result.rows;
        } catch (error) {
            logger.error(`[SERVICE] getAllSymptoms - Database error: ${error.message}`);
            throw error;
        }
    }

    async getAllSymptomsAllLanguages() {
        logger.info('[SERVICE] getAllSymptomsAllLanguages - Starting database query');
        try {
            const query = `
                SELECT 
                    st.uuid,
                    st.symptom_code,
                    st.libelle,
                    st.langue,
                    st.created_at,
                    st.updated_at
                FROM translations.symptoms_translation st
                ORDER BY st.langue, st.libelle ASC
            `;
            
            const result = await pool.query(query);
            logger.info(`[SERVICE] getAllSymptomsAllLanguages - Query executed successfully, found ${result.rows.length} symptoms`);
            return result.rows;
        } catch (error) {
            logger.error(`[SERVICE] getAllSymptomsAllLanguages - Database error: ${error.message}`);
            throw error;
        }
    }

    async getSymptomByCode(scode) {
        logger.info(`[SERVICE] getSymptomByCode - Starting database query for symptom code: ${scode}`);
        try {
            const query = `
                SELECT 
                    s.code,
                    s.uuid as symptom_uuid,
                    st.uuid,
                    st.langue,
                    st.libelle
                FROM configuration.symptoms s
                JOIN translations.symptoms_translation st ON s.code = st.symptom_code
                WHERE s.code = $1
                ORDER BY st.langue ASC
            `;
            
            const result = await pool.query(query, [scode]);
            
            if (result.rows.length === 0) {
                logger.info(`[SERVICE] getSymptomByCode - No symptom found with code: ${scode}`);
                return null;
            }
            
            // Formatage de la réponse selon le format demandé
            const symptom = {
                code: result.rows[0].code,
                uuid: result.rows[0].symptom_uuid,
                translations: result.rows.map(row => ({
                    uuid: row.uuid,
                    langue: row.langue,
                    libelle: row.libelle
                }))
            };
            
            logger.info(`[SERVICE] getSymptomByCode - Query executed successfully, found symptom with ${symptom.translations.length} translations`);
            return symptom;
        } catch (error) {
            logger.error(`[SERVICE] getSymptomByCode - Database error: ${error.message}`);
            throw error;
        }
    }

    async getSymptomByUuid(uuid, lang = null) {
        logger.info(`[SERVICE] getSymptomByUuid - Starting database query for symptom UUID: ${uuid}, language: ${lang}`);
        try {
            let query, params;
            
            if (lang) {
                // Si une langue est spécifiée, retourner seulement cette traduction
                query = `
                    SELECT 
                        s.uuid,
                        s.code as symptom_code,
                        st.libelle,
                        st.langue,
                        st.created_at,
                        st.updated_at
                    FROM configuration.symptoms s
                    JOIN translations.symptoms_translation st ON s.code = st.symptom_code
                    WHERE s.uuid = $1 AND st.langue = $2
                `;
                params = [uuid, lang];
            } else {
                // Si aucune langue spécifiée, retourner toutes les traductions
                query = `
                    SELECT 
                        s.uuid as uuid,
                        s.code as code,
                        s.created_at,
                        s.updated_at,
                        json_agg(
                            json_build_object(
                                'label_uuid', st.uuid,
                                'label_lang_code', st.langue,
                                'label', st.libelle
                            ) ORDER BY st.langue ASC
                        ) as labels
                    FROM configuration.symptoms s
                    JOIN translations.symptoms_translation st ON s.code = st.symptom_code
                    WHERE s.uuid = $1
                    GROUP BY s.uuid, s.code
                `;
                params = [uuid];
            }
            
            const result = await pool.query(query, params);
            
            if (result.rows.length === 0) {
                logger.info(`[SERVICE] getSymptomByUuid - No symptom found with UUID: ${uuid}`);
                return null;
            }
            
            if (lang) {
                // Retourner un seul objet pour une langue spécifique
                const symptom = result.rows[0];
                logger.info(`[SERVICE] getSymptomByUuid - Query executed successfully, found symptom for language: ${lang}`);
                return symptom;
            } else {
                // Retourner l'objet avec toutes les traductions
                const symptom = result.rows[0];
                logger.info(`[SERVICE] getSymptomByUuid - Query executed successfully, found symptom with ${symptom.labels.length} translations`);
                return symptom;
            }
        } catch (error) {
            logger.error(`[SERVICE] getSymptomByUuid - Database error: ${error.message}`);
            throw error;
        }
    }

    async createSymptom(symptomData) {
        logger.info('[SERVICE] createSymptom - Starting transaction');
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            logger.info('[SERVICE] createSymptom - Transaction started');

            // Insérer dans la table symptoms
            const symptomQuery = `
                INSERT INTO configuration.symptoms (code)
                VALUES ($1)
                RETURNING code
            `;
            const symptomResult = await client.query(symptomQuery, [symptomData.code]);
            logger.info(`[SERVICE] createSymptom - Inserted into configuration.symptoms with code: ${symptomData.code}`);

            // Insérer les traductions
            const translationQuery = `
                INSERT INTO translations.symptoms_translation (symptom_code, langue, libelle)
                VALUES ($1, $2, $3)
                RETURNING *
            `;

            const translationPromises = symptomData.translations.map(translation =>
                client.query(translationQuery, [
                    symptomData.code,
                    translation.langue,
                    translation.libelle
                ])
            );

            const translationResults = await Promise.all(translationPromises);
            logger.info(`[SERVICE] createSymptom - Inserted ${translationResults.length} translations`);

            await client.query('COMMIT');
            logger.info('[SERVICE] createSymptom - Transaction committed successfully');

            return {
                code: symptomResult.rows[0].code,
                translations: translationResults.map(result => result.rows[0])
            };
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error(`[SERVICE] createSymptom - Transaction rolled back due to error: ${error.message}`);
            throw error;
        } finally {
            client.release();
            logger.info('[SERVICE] createSymptom - Database client released');
        }
    }

    async updateSymptom(uuid, symptomData) {
        logger.info(`[SERVICE] updateSymptom - Starting transaction for UUID: ${uuid}`);
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            logger.info('[SERVICE] updateSymptom - Transaction started');

            // Récupérer le code actuel du symptôme
            const getCurrentCodeQuery = `
                SELECT code FROM configuration.symptoms WHERE uuid = $1
            `;
            const currentCodeResult = await client.query(getCurrentCodeQuery, [uuid]);
            
            if (currentCodeResult.rows.length === 0) {
                throw new Error(`Symptom with UUID ${uuid} not found`);
            }
            
            const currentCode = currentCodeResult.rows[0].code;
            logger.info(`[SERVICE] updateSymptom - Current symptom code: ${currentCode}`);

            // Mettre à jour le code dans la table symptoms
            if (symptomData.code && symptomData.code !== currentCode) {
                const updateSymptomQuery = `
                    UPDATE configuration.symptoms 
                    SET code = $1, updated_at = CURRENT_TIMESTAMP 
                    WHERE uuid = $2
                    RETURNING code
                `;
                const symptomResult = await client.query(updateSymptomQuery, [symptomData.code, uuid]);
                logger.info(`[SERVICE] updateSymptom - Updated symptom code from ${currentCode} to ${symptomData.code}`);
                
                // Mettre à jour les codes dans la table de traductions
                const updateTranslationCodesQuery = `
                    UPDATE translations.symptoms_translation 
                    SET symptom_code = $1, updated_at = CURRENT_TIMESTAMP 
                    WHERE symptom_code = $2
                `;
                const translationResult = await client.query(updateTranslationCodesQuery, [symptomData.code, currentCode]);
                logger.info(`[SERVICE] updateSymptom - Updated ${translationResult.rowCount} translation codes from ${currentCode} to ${symptomData.code}`);
            } else {
                logger.info('[SERVICE] updateSymptom - No code change requested or code is identical');
            }

            await client.query('COMMIT');
            logger.info('[SERVICE] updateSymptom - Transaction committed successfully');

            // Récupérer et retourner le symptôme mis à jour
            const updatedSymptom = await this.getSymptomByUuid(uuid);
            return updatedSymptom;
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error(`[SERVICE] updateSymptom - Transaction rolled back due to error: ${error.message}`);
            throw error;
        } finally {
            client.release();
            logger.info('[SERVICE] updateSymptom - Database client released');
        }
    }
}

module.exports = new SymptomsService();
