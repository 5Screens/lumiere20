const { pool } = require('../../../config/database');
const logger = require('../../../config/logger');

class EntitiesTypesService {
    /**
     * Récupère tous les types d'entités avec leurs libellés dans la langue spécifiée
     * @param {string} langue - Code de la langue (ex: 'fr', 'en', 'es', 'pt')
     * @returns {Promise<Array>} Liste des types d'entités avec leurs libellés
     */
    async getEntityTypesByLanguage(langue) {
        logger.info(`[SERVICE] getEntityTypesByLanguage - Starting database query for language: ${langue}`);
        try {
            const query = `
                SELECT 
                    etl.uuid,
                    etl.entity_type,
                    etl.langue,
                    etl.libelle
                FROM translations.entities_types_label etl
                WHERE etl.langue = $1
                ORDER BY etl.libelle ASC`;
            
            const result = await pool.query(query, [langue]);
            logger.info(`[SERVICE] getEntityTypesByLanguage - Query executed successfully, found ${result.rows.length} records for language: ${langue}`);
            return result.rows;
        } catch (error) {
            logger.error(`[SERVICE] getEntityTypesByLanguage - Database error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new EntitiesTypesService();
