const { pool } = require('../../../config/database');
const logger = require('../../../config/logger');

class SymptomsService {
    async getAllSymptoms(lang) {
        logger.info(`[SERVICE] getAllSymptoms - Starting database query for language: ${lang}`);
        try {
            const query = `
                SELECT 
                    st.uuid,
                    s.code,
                    st.libelle,
                    st.langue
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
}

module.exports = new SymptomsService();
