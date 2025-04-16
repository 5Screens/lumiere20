const changeOptionsService = require('./service');
const logger = require('../../../config/logger');

const getChangeOptions = async (req, res) => {
    logger.info('[CONTROLLER] Starting to process getChangeOptions request');
    
    const questionId = req.query.question_id;
    const lang = req.query.lang;
    
    try {
        const changeOptions = await changeOptionsService.getChangeOptions(questionId, lang);
        
        logger.info(`[CONTROLLER] Successfully retrieved ${changeOptions.length} change options`);
        
        // Si aucun question_id n'est spécifié, on organise les données par question_id
        if (!questionId) {
            // Si aucune langue n'est spécifiée, on renvoie les données brutes
            if (!lang) {
                res.json(changeOptions);
                return;
            }
            
            // Si une langue est spécifiée, on organise les données par question_id
            const groupedOptions = {};
            changeOptions.forEach(option => {
                if (!groupedOptions[option.question_id]) {
                    groupedOptions[option.question_id] = [];
                }
                groupedOptions[option.question_id].push({
                    value: option.value,
                    label: option.label
                });
            });
            
            res.json(groupedOptions);
            return;
        }
        
        // Si un question_id est spécifié mais aucune langue n'est spécifiée, on renvoie les données brutes
        if (!lang) {
            res.json(changeOptions);
            return;
        }
        
        // Si un question_id et une langue sont spécifiés, on renvoie un tableau formaté pour les composants de sélection
        const formattedOptions = changeOptions.map(option => ({
            value: option.value,
            label: option.label
        }));
        
        res.json(formattedOptions);
    } catch (error) {
        logger.error(`[CONTROLLER] Error: ${error.message}`);
        res.status(500).json({ 
            error: 'An error occurred while retrieving change options' 
        });
    }
};

module.exports = {
    getChangeOptions
};
