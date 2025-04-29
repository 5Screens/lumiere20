const symptomsService = require('./service');
const logger = require('../../../config/logger');

class SymptomsController {
    async getSymptoms(req, res) {
        logger.info('[CONTROLLER] getSymptoms - Starting to process request');
        try {
            const { langue } = req.query;
            logger.info(`[CONTROLLER] getSymptoms - Fetching symptoms for language: ${langue}`);
            const symptoms = await symptomsService.getAllSymptoms(langue);
            
            logger.info(`[CONTROLLER] getSymptoms - Successfully retrieved ${symptoms.length} symptoms`);
            return res.status(200).json(symptoms);
        } catch (error) {
            logger.error(`[CONTROLLER] getSymptoms - Error: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: 'Une erreur est survenue lors de la récupération des symptômes'
            });
        }
    }

    async getAllSymptoms(req, res) {
        logger.info('[CONTROLLER] getAllSymptoms - Starting to process request');
        try {
            const { lang } = req.query;
            
            let symptoms;
            if (lang) {
                logger.info(`[CONTROLLER] getAllSymptoms - Fetching symptoms for language: ${lang}`);
                symptoms = await symptomsService.getAllSymptoms(lang);
            } else {
                logger.info('[CONTROLLER] getAllSymptoms - Fetching symptoms for all languages');
                symptoms = await symptomsService.getAllSymptomsAllLanguages();
            }
            
            logger.info(`[CONTROLLER] getAllSymptoms - Successfully retrieved ${symptoms.length} symptoms`);
            return res.status(200).json(symptoms);
        } catch (error) {
            logger.error(`[CONTROLLER] getAllSymptoms - Error: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: 'Une erreur est survenue lors de la récupération des symptômes'
            });
        }
    }

    async getSymptomByCode(req, res) {
        logger.info('[CONTROLLER] getSymptomByCode - Starting to process request');
        try {
            const { scode } = req.query;
            logger.info(`[CONTROLLER] getSymptomByCode - Fetching symptom with code: ${scode}`);
            
            const symptom = await symptomsService.getSymptomByCode(scode);
            
            if (!symptom) {
                logger.info(`[CONTROLLER] getSymptomByCode - No symptom found with code: ${scode}`);
                return res.status(404).json({
                    success: false,
                    message: `Aucun symptôme trouvé avec le code: ${scode}`
                });
            }
            
            logger.info(`[CONTROLLER] getSymptomByCode - Successfully retrieved symptom with code: ${scode}`);
            return res.status(200).json(symptom);
        } catch (error) {
            logger.error(`[CONTROLLER] getSymptomByCode - Error: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: 'Une erreur est survenue lors de la récupération du symptôme'
            });
        }
    }

    async createSymptom(req, res) {
        logger.info('[CONTROLLER] createSymptom - Starting to process request');
        try {
            const symptomData = req.body;
            logger.info('[CONTROLLER] createSymptom - Creating new symptom');
            const newSymptom = await symptomsService.createSymptom(symptomData);
            
            logger.info('[CONTROLLER] createSymptom - Symptom created successfully');
            return res.status(201).json(newSymptom);
        } catch (error) {
            logger.error(`[CONTROLLER] createSymptom - Error: ${error.message}`);
            
            if (error.code === '23505') { // Code d'erreur PostgreSQL pour violation de contrainte unique
                return res.status(409).json({
                    success: false,
                    message: 'Un symptôme avec ce code existe déjà'
                });
            }
            
            return res.status(500).json({
                success: false,
                message: 'Une erreur est survenue lors de la création du symptôme'
            });
        }
    }
}

module.exports = new SymptomsController();
