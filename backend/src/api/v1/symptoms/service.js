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
}

module.exports = new SymptomsService();
