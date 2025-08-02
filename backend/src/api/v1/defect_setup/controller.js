const defectSetupService = require('./service');
const logger = require('../../../config/logger');

class DefectSetupController {

    async getAllDefectSetup(req, res) {
        logger.info('[CONTROLLER] getAllDefectSetup - Starting to process request');
        try {
            const { lang } = req.query;
            logger.info(`[CONTROLLER] getAllDefectSetup - Retrieving all defect setup with language: ${lang || 'all'}`);
            
            const defectSetups = await defectSetupService.getAllDefectSetup(lang);
            
            logger.info(`[CONTROLLER] getAllDefectSetup - Successfully retrieved ${defectSetups.length} defect setup records`);
            return res.status(200).json(defectSetups);
        } catch (error) {
            logger.error(`[CONTROLLER] getAllDefectSetup - Error: ${error.message}`);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getDefectSetupByUuid(req, res) {
        logger.info('[CONTROLLER] getDefectSetupByUuid - Starting to process request');
        try {
            const { uuid } = req.params;
            const { lang } = req.query;
            
            logger.info(`[CONTROLLER] getDefectSetupByUuid - Retrieving defect setup with UUID: ${uuid}, language: ${lang || 'all'}`);
            
            const defectSetup = await defectSetupService.getDefectSetupByUuid(uuid, lang);
            
            if (!defectSetup) {
                logger.info(`[CONTROLLER] getDefectSetupByUuid - No defect setup found with UUID: ${uuid}`);
                return res.status(404).json({
                    success: false,
                    message: `No defect setup found with UUID: ${uuid}`
                });
            }
            
            logger.info('[CONTROLLER] getDefectSetupByUuid - Successfully retrieved defect setup');
            return res.status(200).json({
                success: true,
                data: defectSetup
            });
        } catch (error) {
            logger.error(`[CONTROLLER] getDefectSetupByUuid - Error: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: 'An error occurred while retrieving defect setup'
            });
        }
    }

    async updateDefectSetup(req, res) {
        logger.info('[CONTROLLER] updateDefectSetup - Starting to process request');
        try {
            const { uuid } = req.params;
            const defectSetupData = req.body;
            
            logger.info(`[CONTROLLER] updateDefectSetup - Updating defect setup with UUID: ${uuid}`);
            
            const updatedDefectSetup = await defectSetupService.updateDefectSetup(uuid, defectSetupData);
            
            if (!updatedDefectSetup) {
                logger.info(`[CONTROLLER] updateDefectSetup - No defect setup found with UUID: ${uuid}`);
                return res.status(404).json({
                    success: false,
                    message: `No defect setup found with UUID: ${uuid}`
                });
            }
            
            logger.info('[CONTROLLER] updateDefectSetup - Successfully updated defect setup');
            return res.status(200).json({
                success: true,
                message: 'Defect setup updated successfully',
                data: updatedDefectSetup
            });
        } catch (error) {
            logger.error(`[CONTROLLER] updateDefectSetup - Error: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: 'An error occurred while updating defect setup'
            });
        }
    }

    async createDefectSetup(req, res) {
        logger.info('[CONTROLLER] createDefectSetup - Starting to process request');
        try {
            const defectSetupData = req.body;
            
            logger.info(`[CONTROLLER] createDefectSetup - Creating defect setup with code: ${defectSetupData.code}`);
            
            const createdDefectSetup = await defectSetupService.createDefectSetup(defectSetupData);
            
            logger.info(`[CONTROLLER] createDefectSetup - Successfully created defect setup with UUID: ${createdDefectSetup.uuid}`);
            return res.status(201).json({
                success: true,
                message: 'Defect setup created successfully',
                data: createdDefectSetup
            });
        } catch (error) {
            logger.error(`[CONTROLLER] createDefectSetup - Error: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: 'An error occurred while creating defect setup'
            });
        }
    }

    // Legacy method for backward compatibility
    async getDefectSetup(req, res) {
        logger.info(`[CONTROLLER] getDefectSetup - Processing legacy request for defect setup with metadata: ${req.query.metadata}`);
        try {
            const { lang, metadata } = req.query;
            const defectSetup = await defectSetupService.getDefectSetup(lang, metadata);
            logger.info('[CONTROLLER] getDefectSetup - Successfully retrieved defect setup data');
            res.json(defectSetup);
        } catch (error) {
            logger.error(`[CONTROLLER] getDefectSetup - Error: ${error.message}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = new DefectSetupController();
