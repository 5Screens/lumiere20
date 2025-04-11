const Joi = require('joi');
const logger = require('../../../config/logger');
const db = require('../../../config/database');

// Validation schema for GET request query parameters
const getTicketStatusSchema = Joi.object({
    lang: Joi.string()
        .required()
        .min(2)
        .max(5)
        .pattern(/^[a-zA-Z-]+$/)
        .messages({
            'string.base': 'Language must be a string',
            'string.empty': 'Language is required',
            'string.min': 'Language code must be at least 2 characters',
            'string.max': 'Language code must not exceed 5 characters',
            'string.pattern.base': 'Language code must contain only letters and hyphens',
            'any.required': 'Language is required'
        }),
    toSelect: Joi.string()
        .valid('yes')
        .optional()
        .messages({
            'any.only': 'toSelect parameter must be "yes" if provided'
        }),
    ticket_type: Joi.string()
        .optional()
        .messages({
            'string.base': 'Ticket type must be a string',
            'string.empty': 'Ticket type cannot be empty if provided'
        })
});

const validateGetTicketStatus = async (req, res, next) => {
    logger.info('[VALIDATION] Validating get ticket status request');
    
    const { error } = getTicketStatusSchema.validate(req.query);
    
    if (error) {
        logger.error(`[VALIDATION] Validation error: ${error.details[0].message}`);
        return res.status(400).json({ error: error.details[0].message });
    }

    try {
        // Check if language exists and is active
        const langQuery = `
            SELECT code 
            FROM translations.languages 
            WHERE code = $1 
            AND is_active = true
        `;
        const langResult = await db.query(langQuery, [req.query.lang]);

        if (langResult.rows.length === 0) {
            logger.error(`[VALIDATION] Language ${req.query.lang} not found or not active`);
            return res.status(400).json({ error: 'Invalid or inactive language code' });
        }
        
        // Check if ticket_type exists if provided
        if (req.query.ticket_type) {
            logger.info(`[VALIDATION] Checking if ticket type ${req.query.ticket_type} exists`);
            const typeQuery = `
                SELECT code 
                FROM configuration.ticket_types 
                WHERE code = $1
            `;
            const typeResult = await db.query(typeQuery, [req.query.ticket_type]);
            
            if (typeResult.rows.length === 0) {
                logger.error(`[VALIDATION] Ticket type ${req.query.ticket_type} not found`);
                return res.status(400).json({ error: 'Invalid ticket type code' });
            }
        }

        logger.info('[VALIDATION] Get ticket status request validation successful');
        next();
    } catch (error) {
        logger.error(`[VALIDATION] Database error during validation: ${error.message}`);
        return res.status(500).json({ error: 'Internal server error during validation' });
    }
};

logger.info('[VALIDATION] Ticket status validation schemas loaded');

module.exports = {
    getTicketStatusSchema,
    validateGetTicketStatus
};
