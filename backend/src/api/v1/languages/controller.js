const languageService = require('./service');
const logger = require('../../../config/logger');

class LanguageController {
    async getActiveLanguages(req, res) {
        logger.info('[CONTROLLER] getActiveLanguages - Starting to process request');
        try {
            const languages = await languageService.getActiveLanguages();
            logger.info(`[CONTROLLER] getActiveLanguages - Successfully retrieved ${languages.length} language codes`);
            res.json(languages);
        } catch (error) {
            logger.error(`[CONTROLLER] getActiveLanguages - Error: ${error.message}`);
            res.status(500).json({ 
                error: 'Une erreur est survenue lors de la récupération des codes de langue' 
            });
        }
    }
}

module.exports = new LanguageController();
