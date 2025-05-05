const defectSetupService = require('./service');
const logger = require('../../../config/logger');

const getDefectSetup = async (req, res) => {
    logger.info(`[CONTROLLER] Processing request for defect setup with metadata: ${req.query.metadata}`);
    try {
        const { lang, metadata } = req.query;
        const defectSetup = await defectSetupService.getDefectSetup(lang, metadata);
        logger.info('[CONTROLLER] Successfully retrieved defect setup data');
        res.json(defectSetup);
    } catch (error) {
        logger.error(`[CONTROLLER] Error in getDefectSetup: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getDefectSetup
};
