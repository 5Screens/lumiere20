const changeOptionsService = require('./service');
const logger = require('../../../config/logger');

/**
 * Récupère tous les change_options_codes avec leurs traductions
 */
const getAllChangeOptions = async (req, res) => {
    logger.info('[CONTROLLER] getAllChangeOptions - Starting to process request');
    
    const lang = req.query.lang;
    const questionId = req.query.question_id;
    
    // Si question_id est fourni, router vers la méthode legacy qui gère ce cas
    if (questionId) {
        logger.info('[CONTROLLER] getAllChangeOptions - question_id provided, routing to legacy method');
        return getChangeOptions(req, res);
    }
    
    try {
        const changeOptions = await changeOptionsService.getAllChangeOptions(lang);
        
        logger.info(`[CONTROLLER] getAllChangeOptions - Successfully retrieved ${changeOptions.length} change options`);
        res.json(changeOptions);
    } catch (error) {
        logger.error(`[CONTROLLER] getAllChangeOptions - Error retrieving change options: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des options de changement'
        });
    }
};

/**
 * Récupère un change_options_code par UUID
 */
const getChangeOptionByUuid = async (req, res) => {
    logger.info(`[CONTROLLER] getChangeOptionByUuid - Starting to process request for UUID: ${req.params.uuid}`);
    
    const { uuid } = req.params;
    const lang = req.query.lang;
    
    try {
        const changeOption = await changeOptionsService.getChangeOptionByUuid(uuid, lang);
        
        if (!changeOption) {
            logger.info(`[CONTROLLER] getChangeOptionByUuid - Change option not found with UUID: ${uuid}`);
            return res.status(404).json({
                success: false,
                message: 'Option de changement non trouvée'
            });
        }
        
        logger.info(`[CONTROLLER] getChangeOptionByUuid - Successfully retrieved change option`);
        res.json(changeOption);
    } catch (error) {
        logger.error(`[CONTROLLER] getChangeOptionByUuid - Error retrieving change option: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'option de changement'
        });
    }
};

/**
 * Met à jour un change_options_code
 */
const updateChangeOption = async (req, res) => {
    logger.info(`[CONTROLLER] updateChangeOption - Starting to process request for UUID: ${req.params.uuid}`);
    
    const { uuid } = req.params;
    const changeOptionData = req.body;
    
    try {
        const updatedChangeOption = await changeOptionsService.updateChangeOption(uuid, changeOptionData);
        
        logger.info(`[CONTROLLER] updateChangeOption - Successfully updated change option`);
        res.json(updatedChangeOption);
    } catch (error) {
        logger.error(`[CONTROLLER] updateChangeOption - Error updating change option: ${error.message}`);
        
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: 'Option de changement non trouvée'
            });
        }
        
        if (error.code === '23505') { // Code d'erreur PostgreSQL pour violation de contrainte unique
            return res.status(409).json({
                success: false,
                message: 'Une option de changement avec ce code existe déjà'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de l\'option de changement'
        });
    }
};

/**
 * Crée un nouveau change_options_code
 */
const createChangeOption = async (req, res) => {
    logger.info('[CONTROLLER] createChangeOption - Starting to process request');
    
    const changeOptionData = req.body;
    
    try {
        const createdChangeOption = await changeOptionsService.createChangeOption(changeOptionData);
        
        logger.info(`[CONTROLLER] createChangeOption - Successfully created change option`);
        res.status(201).json(createdChangeOption);
    } catch (error) {
        logger.error(`[CONTROLLER] createChangeOption - Error creating change option: ${error.message}`);
        
        if (error.code === '23505') { // Code d'erreur PostgreSQL pour violation de contrainte unique
            return res.status(409).json({
                success: false,
                message: 'Une option de changement avec ce code existe déjà'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de l\'option de changement'
        });
    }
};

// Fonction legacy pour compatibilité
const getChangeOptions = async (req, res) => {
    logger.info('[CONTROLLER] getChangeOptions (legacy) - Starting to process request');
    
    const questionId = req.query.question_id;
    const lang = req.query.lang;
    
    try {
        const changeOptions = await changeOptionsService.getChangeOptions(questionId, lang);
        
        logger.info(`[CONTROLLER] getChangeOptions (legacy) - Successfully retrieved ${changeOptions.length} change options`);
        
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
        logger.error(`[CONTROLLER] getChangeOptions (legacy) - Error retrieving change options: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des options de changement'
        });
    }
};

module.exports = {
    getAllChangeOptions,
    getChangeOptionByUuid,
    updateChangeOption,
    createChangeOption,
    getChangeOptions // fonction legacy
};
