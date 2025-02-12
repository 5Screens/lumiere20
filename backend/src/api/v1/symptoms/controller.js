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
            return res.status(200).json({
                success: true,
                data: symptoms
            });
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
            const symptoms = await symptomsService.getAllSymptomsAllLanguages();
            
            logger.info(`[CONTROLLER] getAllSymptoms - Successfully retrieved ${symptoms.length} symptoms`);
            return res.status(200).json({
                success: true,
                data: symptoms
            });
        } catch (error) {
            logger.error(`[CONTROLLER] getAllSymptoms - Error: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: 'Une erreur est survenue lors de la récupération de tous les symptômes'
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
            return res.status(201).json({
                success: true,
                data: newSymptom,
                message: 'Symptôme créé avec succès'
            });
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
