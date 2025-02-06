const symptomsService = require('./service');
const logger = require('../../../config/logger');

class SymptomsController {
    async getSymptoms(req, res) {
        try {
            const { langue } = req.query;
            const symptoms = await symptomsService.getAllSymptoms(langue);
            
            return res.status(200).json({
                success: true,
                data: symptoms
            });
        } catch (error) {
            logger.error(`Erreur dans getSymptoms: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: 'Une erreur est survenue lors de la récupération des symptômes'
            });
        }
    }

    async createSymptom(req, res) {
        try {
            const symptomData = req.body;
            const newSymptom = await symptomsService.createSymptom(symptomData);
            
            return res.status(201).json({
                success: true,
                data: newSymptom,
                message: 'Symptôme créé avec succès'
            });
        } catch (error) {
            logger.error(`Erreur dans createSymptom: ${error.message}`);
            
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
