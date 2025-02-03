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
}

module.exports = new SymptomsController();
