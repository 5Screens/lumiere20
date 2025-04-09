const Joi = require('joi');
const logger = require('../../../config/logger');
const db = require('../../../config/database');

const validateGetIncidentPriority = async (req, res, next) => {
    logger.info('[VALIDATION] Validating get incident priority request');
    
    const schema = Joi.object({
        incident_urgencies: Joi.alternatives().try(
            Joi.string().trim(),
            Joi.number().integer().positive()
        )
            .required()
            .messages({
                'any.required': 'Incident urgency is required',
                'alternatives.types': 'Incident urgency must be a string code or a positive integer value'
            }),
        incident_impacts: Joi.alternatives().try(
            Joi.string().trim(),
            Joi.number().integer().positive()
        )
            .required()
            .messages({
                'any.required': 'Incident impact is required',
                'alternatives.types': 'Incident impact must be a string code or a positive integer value'
            })
    }).unknown(false); // Reject any other query parameters

    const { error } = schema.validate(req.query);
    
    if (error) {
        logger.error(`[VALIDATION] Validation error: ${error.details[0].message}`);
        return res.status(400).json({ error: error.details[0].message });
    }

    try {
        let urgencyCode;
        let impactCode;

        // Check if urgency exists - handle both code (string) and value (integer)
        if (typeof req.query.incident_urgencies === 'string' && !isNaN(parseInt(req.query.incident_urgencies))) {
            // If it's a string that can be parsed as a number, treat it as a value
            const urgencyValue = parseInt(req.query.incident_urgencies);
            const urgencyValueQuery = `
                SELECT code 
                FROM configuration.incident_urgencies 
                WHERE value = $1
            `;
            const urgencyValueResult = await db.query(urgencyValueQuery, [urgencyValue]);

            if (urgencyValueResult.rows.length === 0) {
                logger.error(`[VALIDATION] Incident urgency with value ${urgencyValue} not found`);
                return res.status(400).json({ error: 'Invalid incident urgency value' });
            }
            urgencyCode = urgencyValueResult.rows[0].code;
        } else {
            // Otherwise treat it as a code
            const urgencyCodeQuery = `
                SELECT code 
                FROM configuration.incident_urgencies 
                WHERE code = $1
            `;
            const urgencyCodeResult = await db.query(urgencyCodeQuery, [req.query.incident_urgencies]);

            if (urgencyCodeResult.rows.length === 0) {
                logger.error(`[VALIDATION] Incident urgency ${req.query.incident_urgencies} not found`);
                return res.status(400).json({ error: 'Invalid incident urgency code' });
            }
            urgencyCode = req.query.incident_urgencies;
        }

        // Check if impact exists - handle both code (string) and value (integer)
        if (typeof req.query.incident_impacts === 'string' && !isNaN(parseInt(req.query.incident_impacts))) {
            // If it's a string that can be parsed as a number, treat it as a value
            const impactValue = parseInt(req.query.incident_impacts);
            const impactValueQuery = `
                SELECT code 
                FROM configuration.incident_impacts 
                WHERE value = $1
            `;
            const impactValueResult = await db.query(impactValueQuery, [impactValue]);

            if (impactValueResult.rows.length === 0) {
                logger.error(`[VALIDATION] Incident impact with value ${impactValue} not found`);
                return res.status(400).json({ error: 'Invalid incident impact value' });
            }
            impactCode = impactValueResult.rows[0].code;
        } else {
            // Otherwise treat it as a code
            const impactCodeQuery = `
                SELECT code 
                FROM configuration.incident_impacts 
                WHERE code = $1
            `;
            const impactCodeResult = await db.query(impactCodeQuery, [req.query.incident_impacts]);

            if (impactCodeResult.rows.length === 0) {
                logger.error(`[VALIDATION] Incident impact ${req.query.incident_impacts} not found`);
                return res.status(400).json({ error: 'Invalid incident impact code' });
            }
            impactCode = req.query.incident_impacts;
        }

        // Store the resolved codes in the request for the controller to use
        req.resolvedQuery = {
            incident_urgencies: urgencyCode,
            incident_impacts: impactCode
        };

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
