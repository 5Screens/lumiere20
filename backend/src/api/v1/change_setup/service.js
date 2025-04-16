const { pool } = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Récupère les données de configuration des changements
 * @param {string} lang - Code de langue (optionnel)
 * @param {string} metadata - Type de métadonnées à filtrer (optionnel)
 * @returns {Promise<Array>} - Liste des configurations de changement
 */
const getChangeSetup = async (lang, metadata) => {
    logger.info(`[SERVICE] Getting change setup data. Language: ${lang || 'all'}, Metadata: ${metadata || 'all'}`);
    
    try {
        let query;
        let params = [];
        let paramIndex = 1;
        
        // Construction de la requête en fonction des paramètres
        if (lang && metadata) {
            // Filtrer par langue et metadata
            query = `
                SELECT 
                    csc.uuid, 
                    csc.metadata,
                    csc.code, 
                    csl.lang,
                    csl.label
                FROM configuration.change_setup_codes csc
                JOIN translations.change_setup_label csl 
                    ON csc.code = csl.rel_change_setup_code
                WHERE csl.lang = $${paramIndex++}
                AND csc.metadata = $${paramIndex++}
                ORDER BY csc.metadata, csc.code, csl.lang
            `;
            params.push(lang, metadata);
        } else if (lang) {
            // Filtrer par langue uniquement
            query = `
                SELECT 
                    csc.uuid, 
                    csc.metadata,
                    csc.code, 
                    csl.lang,
                    csl.label
                FROM configuration.change_setup_codes csc
                JOIN translations.change_setup_label csl 
                    ON csc.code = csl.rel_change_setup_code
                WHERE csl.lang = $${paramIndex++}
                ORDER BY csc.metadata, csc.code, csl.lang
            `;
            params.push(lang);
        } else if (metadata) {
            // Filtrer par metadata uniquement
            query = `
                SELECT 
                    csc.uuid, 
                    csc.metadata,
                    csc.code, 
                    csl.lang,
                    csl.label
                FROM configuration.change_setup_codes csc
                JOIN translations.change_setup_label csl 
                    ON csc.code = csl.rel_change_setup_code
                WHERE csc.metadata = $${paramIndex++}
                ORDER BY csc.metadata, csc.code, csl.lang
            `;
            params.push(metadata);
        } else {
            // Aucun filtre, récupérer toutes les données
            query = `
                SELECT 
                    csc.uuid, 
                    csc.metadata,
                    csc.code, 
                    csl.lang,
                    csl.label
                FROM configuration.change_setup_codes csc
                JOIN translations.change_setup_label csl 
                    ON csc.code = csl.rel_change_setup_code
                ORDER BY csc.metadata, csc.code, csl.lang
            `;
        }
        
        const result = await pool.query(query, params);
        
        logger.info(`[SERVICE] Found ${result.rows.length} change setup entries`);
        
        // Restructurer les données pour regrouper les traductions par code
        const groupedData = {};
        
        result.rows.forEach(row => {
            if (!groupedData[row.metadata]) {
                groupedData[row.metadata] = {};
            }
            
            if (!groupedData[row.metadata][row.code]) {
                groupedData[row.metadata][row.code] = {
                    uuid: row.uuid,
                    code: row.code,
                    translations: {}
                };
            }
            
            groupedData[row.metadata][row.code].translations[row.lang] = row.label;
        });
        
        return groupedData;
    } catch (error) {
        logger.error(`[SERVICE] Error getting change setup data: ${error.message}`);
        throw error;
    }
};

module.exports = {
    getChangeSetup
};
