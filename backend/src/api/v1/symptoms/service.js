const { pool } = require('../../../config/database');
const logger = require('../../../config/logger');

class SymptomsService {
    async getAllSymptoms(langue) {
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
            return result.rows;
        } catch (error) {
            logger.error(`Erreur lors de la récupération des symptômes: ${error.message}`);
            throw error;
        }
    }

    async getAllSymptomsAllLanguages() {
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
            return result.rows;
        } catch (error) {
            logger.error(`Erreur lors de la récupération de tous les symptômes: ${error.message}`);
            throw error;
        }
    }

    async createSymptom(symptomData) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Création du symptôme dans la table configuration.symptoms
            const symptomQuery = `
                INSERT INTO configuration.symptoms (code)
                VALUES ($1)
                RETURNING code`;
            logger.info(`Exécution de la requête symptôme: ${symptomQuery.replace(/\s+/g, ' ')}`);
            logger.info(`Paramètres de la requête symptôme: $1=${symptomData.code}`);
            
            const symptomResult = await client.query(symptomQuery, [symptomData.code]);
            const symptomCode = symptomResult.rows[0].code;

            // Création des traductions
            const translationQuery = `
                INSERT INTO translations.symptoms_translation
                (symptom_code, langue, libelle)
                VALUES ($1, $2, $3)`;
            
            for (const translation of symptomData.translations) {
                logger.info(`Exécution de la requête traduction: ${translationQuery.replace(/\s+/g, ' ')}`);
                logger.info(`Paramètres de la requête traduction: $1=${symptomCode}, $2=${translation.langue}, $3=${translation.libelle}`);
                
                await client.query(translationQuery, [
                    symptomCode,
                    translation.langue,
                    translation.libelle
                ]);
            }

            await client.query('COMMIT');
            logger.info(`Symptôme créé avec succès: ${symptomData.code}`);
            return { code: symptomCode, ...symptomData };
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error(`Erreur lors de la création du symptôme: ${error.message}`);
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = new SymptomsService();
