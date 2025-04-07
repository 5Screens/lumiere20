const Joi = require('joi');
const logger = require('../../../config/logger');
const db = require('../../../config/database');

const validateGetIncidentPriority = async (req, res, next) => {
    logger.info('[VALIDATION] Validating get incident priority request');
    
    const schema = Joi.object({
        incident_urgencies: Joi.string()
            .required()
            .messages({
                'string.empty': 'Incident urgency code cannot be empty',
                'any.required': 'Incident urgency code is required'
            }),
        incident_impacts: Joi.string()
            .required()
            .messages({
                'string.empty': 'Incident impact code cannot be empty',
                'any.required': 'Incident impact code is required'
            })
    }).unknown(false); // Reject any other query parameters

    const { error } = schema.validate(req.query);
    
    if (error) {
        logger.error(`[VALIDATION] Validation error: ${error.details[0].message}`);
        return res.status(400).json({ error: error.details[0].message });
    }

    try {
        // Check if urgency exists
        const urgencyQuery = `
            SELECT code 
            FROM configuration.incident_urgencies 
            WHERE code = $1
        `;
        const urgencyResult = await db.query(urgencyQuery, [req.query.incident_urgencies]);

        if (urgencyResult.rows.length === 0) {
            logger.error(`[VALIDATION] Incident urgency ${req.query.incident_urgencies} not found`);
            return res.status(400).json({ error: 'Invalid incident urgency code' });
        }

        // Check if impact exists
        const impactQuery = `
            SELECT code 
            FROM configuration.incident_impacts 
            WHERE code = $1
        `;
        const impactResult = await db.query(impactQuery, [req.query.incident_impacts]);

        if (impactResult.rows.length === 0) {
            logger.error(`[VALIDATION] Incident impact ${req.query.incident_impacts} not found`);
            return res.status(400).json({ error: 'Invalid incident impact code' });
        }

        logger.info('[VALIDATION] Get incident priority request validation successful');
        next();
    } catch (error) {
        logger.error(`[VALIDATION] Database error during validation: ${error.message}`);
        return res.status(500).json({ error: 'Internal server error during validation' });
    }
};

module.exports = {
    validateGetIncidentPriority
};
