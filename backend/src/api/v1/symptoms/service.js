const { pool } = require('../../../config/database');
const logger = require('../../../config/logger');

class SymptomsService {
    async getAllSymptoms(langue) {
        logger.info(`[SERVICE] getAllSymptoms - Starting database query for language: ${langue}`);
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
            
            const result = await pool.query(query, [langue]);
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
                    st.date_creation,
                    st.date_modification
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
