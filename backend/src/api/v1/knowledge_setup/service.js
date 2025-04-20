const { pool } = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Récupère les données de configuration des articles de connaissance
 * @param {string} lang - Code de langue (optionnel)
 * @param {string} metadata - Type de métadonnées à filtrer (optionnel)
 * @param {string} toSelect - Si 'yes', renvoie les données au format value/label pour les composants de sélection
 * @returns {Promise<Array|Object>} - Liste des configurations des articles de connaissance
 */
const getKnowledgeSetup = async (lang, metadata, toSelect) => {
    // Convertir metadata en majuscules si fourni pour correspondre au format de la base de données
    const upperMetadata = metadata ? metadata.toUpperCase() : metadata;
    
    logger.info(`[SERVICE] Getting knowledge setup data. Language: ${lang || 'all'}, Metadata: ${upperMetadata || 'all'}`);
    
    try {
        let query;
        let params = [];
        let paramIndex = 1;
        
        // Construction de la requête en fonction des paramètres
        if (lang && upperMetadata) {
            // Filtrer par langue et metadata
            query = `
                SELECT 
                    ksc.uuid, 
                    ksc.metadata,
                    ksc.code, 
                    ksl.lang,
                    ksl.label
                FROM configuration.knowledge_setup_codes ksc
                JOIN translations.knowledge_setup_label ksl 
                    ON ksc.code = ksl.rel_change_setup_code
                WHERE ksl.lang = $${paramIndex++}
                AND ksc.metadata = $${paramIndex++}
                ORDER BY ksc.metadata, ksc.code, ksl.lang
            `;
            params.push(lang, upperMetadata);
        } else if (lang) {
            // Filtrer par langue uniquement
            query = `
                SELECT 
                    ksc.uuid, 
                    ksc.metadata,
                    ksc.code, 
                    ksl.lang,
                    ksl.label
                FROM configuration.knowledge_setup_codes ksc
                JOIN translations.knowledge_setup_label ksl 
                    ON ksc.code = ksl.rel_change_setup_code
                WHERE ksl.lang = $${paramIndex++}
                ORDER BY ksc.metadata, ksc.code, ksl.lang
            `;
            params.push(lang);
        } else if (upperMetadata) {
            // Filtrer par metadata uniquement
            query = `
                SELECT 
                    ksc.uuid, 
                    ksc.metadata,
                    ksc.code, 
                    ksl.lang,
                    ksl.label
                FROM configuration.knowledge_setup_codes ksc
                JOIN translations.knowledge_setup_label ksl 
                    ON ksc.code = ksl.rel_change_setup_code
                WHERE ksc.metadata = $${paramIndex++}
                ORDER BY ksc.metadata, ksc.code, ksl.lang
            `;
            params.push(upperMetadata);
        } else {
            // Aucun filtre, récupérer toutes les données
            query = `
                SELECT 
                    ksc.uuid, 
                    ksc.metadata,
                    ksc.code, 
                    ksl.lang,
                    ksl.label
                FROM configuration.knowledge_setup_codes ksc
                JOIN translations.knowledge_setup_label ksl 
                    ON ksc.code = ksl.rel_change_setup_code
                ORDER BY ksc.metadata, ksc.code, ksl.lang
            `;
        }
        
        const result = await pool.query(query, params);
        
        logger.info(`[SERVICE] Found ${result.rows.length} knowledge setup entries`);
        
        // Si toSelect=yes, transformer les données au format value/label pour les composants de sélection
        if (toSelect === 'yes') {
            logger.info('[SERVICE] Transforming data to value/label format for select component');
            
            // Si une langue spécifique est demandée et un metadata spécifique, on renvoie directement un tableau de value/label
            if (lang && lowerMetadata) {
                const selectArray = [];
                
                result.rows.forEach(row => {
                    selectArray.push({
                        value: row.code,
                        label: row.label
                    });
                });
                
                return selectArray;
            }
            // Si une langue spécifique est demandée mais pas de metadata spécifique
            else if (lang) {
                const selectData = {};
                
                result.rows.forEach(row => {
                    if (!selectData[row.metadata]) {
                        selectData[row.metadata] = [];
                    }
                    
                    selectData[row.metadata].push({
                        value: row.code,
                        label: row.label
                    });
                });
                
                return selectData;
            } 
            // Si pas de langue spécifique, on renvoie un objet avec les traductions par langue
            else {
                const selectData = {};
                
                result.rows.forEach(row => {
                    if (!selectData[row.metadata]) {
                        selectData[row.metadata] = {};
                    }
                    
                    if (!selectData[row.metadata][row.lang]) {
                        selectData[row.metadata][row.lang] = [];
                    }
                    
                    selectData[row.metadata][row.lang].push({
                        value: row.code,
                        label: row.label
                    });
                });
                
                return selectData;
            }
        }
        
        // Format standard: retourner les données sans regroupement par code
        const formattedData = [];
        
        result.rows.forEach(row => {
            formattedData.push({
                uuid: row.uuid,
                metadata: row.metadata,
                code: row.code,
                lang: row.lang,
                label: row.label
            });
        });
        
        // Si la requête inclut des métadonnées mais qu'aucun résultat n'est trouvé, renvoyer un tableau vide
        if (upperMetadata && formattedData.length === 0) {
            logger.info(`[SERVICE] No data found for metadata: ${upperMetadata}`);
            return [];
        }
        
        return formattedData;
    } catch (error) {
        logger.error(`[SERVICE] Error getting knowledge setup data: ${error.message}`);
        throw error;
    }
};

module.exports = {
    getKnowledgeSetup
};
