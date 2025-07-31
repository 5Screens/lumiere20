const { getContactTypes, getContactTypeByUuid, updateContactType, createContactType } = require('./service');
const logger = require('../../../config/logger');

async function handleGetContactTypes(req, res) {
    logger.info('[CONTROLLER] Handling get contact types request');
    try {
        const { lang, toSelect } = req.query;
        const contactTypes = await getContactTypes(lang, toSelect);
        logger.info('[CONTROLLER] Successfully retrieved contact types');
        res.json(contactTypes);
    } catch (error) {
        logger.error(`[CONTROLLER] Error in get contact types: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function handleGetContactTypeByUuid(req, res) {
    logger.info('[CONTROLLER] handleGetContactTypeByUuid - Starting to process request');
    try {
        const { uuid } = req.params;
        const { lang } = req.query;
        logger.info(`[CONTROLLER] handleGetContactTypeByUuid - Fetching contact type with UUID: ${uuid}, language: ${lang}`);
        
        const contactType = await getContactTypeByUuid(uuid, lang);
        
        if (!contactType) {
            logger.info(`[CONTROLLER] handleGetContactTypeByUuid - No contact type found with UUID: ${uuid}`);
            return res.status(404).json({
                success: false,
                message: `Aucun type de contact trouvé avec l'UUID: ${uuid}`
            });
        }
        
        logger.info(`[CONTROLLER] handleGetContactTypeByUuid - Successfully retrieved contact type with UUID: ${uuid}`);
        return res.status(200).json(contactType);
    } catch (error) {
        logger.error(`[CONTROLLER] handleGetContactTypeByUuid - Error: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Une erreur est survenue lors de la récupération du type de contact'
        });
    }
}

async function handleUpdateContactType(req, res) {
    logger.info('[CONTROLLER] handleUpdateContactType - Starting to process request');
    try {
        const { uuid } = req.params;
        const contactTypeData = req.body;
        
        logger.info(`[CONTROLLER] handleUpdateContactType - Updating contact type with UUID: ${uuid}`);
        const updatedContactType = await updateContactType(uuid, contactTypeData);
        
        logger.info('[CONTROLLER] handleUpdateContactType - Contact type updated successfully');
        return res.status(200).json(updatedContactType);
    } catch (error) {
        logger.error(`[CONTROLLER] handleUpdateContactType - Error: ${error.message}`);
        
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: 'Type de contact non trouvé'
            });
        }
        
        if (error.code === '23505') { // Code d'erreur PostgreSQL pour violation de contrainte unique
            return res.status(409).json({
                success: false,
                message: 'Un type de contact avec ce code existe déjà'
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Une erreur est survenue lors de la mise à jour du type de contact'
        });
    }
}

async function handleCreateContactType(req, res) {
    logger.info('[CONTROLLER] handleCreateContactType - Starting to process request');
    try {
        const contactTypeData = req.body;
        logger.info('[CONTROLLER] handleCreateContactType - Creating new contact type');
        const newContactType = await createContactType(contactTypeData);
        
        logger.info('[CONTROLLER] handleCreateContactType - Contact type created successfully');
        return res.status(201).json(newContactType);
    } catch (error) {
        logger.error(`[CONTROLLER] handleCreateContactType - Error: ${error.message}`);
        
        if (error.code === '23505') { // Code d'erreur PostgreSQL pour violation de contrainte unique
            return res.status(409).json({
                success: false,
                message: 'Un type de contact avec ce code existe déjà'
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Une erreur est survenue lors de la création du type de contact'
        });
    }
}

module.exports = {
    handleGetContactTypes,
    handleGetContactTypeByUuid,
    handleUpdateContactType,
    handleCreateContactType
};
