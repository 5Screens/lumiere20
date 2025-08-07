const Joi = require('joi');
const logger = require('../../../config/logger');

/**
 * Schéma de validation pour la récupération de tous les incident setups
 */
const getAllIncidentSetupSchema = Joi.object({
    lang: Joi.string().max(10).optional().default('fr'),
    metadata: Joi.string().max(50).optional()
});

/**
 * Schéma de validation pour la récupération d'un incident setup par UUID
 */
const getIncidentSetupByUuidSchema = Joi.object({
    uuid: Joi.string().uuid().required(),
    lang: Joi.string().max(10).optional()
});

/**
 * Schéma de validation pour la création d'un incident setup
 */
const createIncidentSetupSchema = Joi.object({
    code: Joi.string().max(50).required(),
    metadata: Joi.string().max(50).required(),
    value: Joi.number().integer().optional().allow(null),
    labels: Joi.array().items(
        Joi.object({
            label_lang_code: Joi.string().max(10).required(),
            label: Joi.string().max(255).required()
        })
    ).optional()
});

/**
 * Schéma de validation pour la mise à jour d'un incident setup
 */
const updateIncidentSetupSchema = Joi.object({
    uuid: Joi.string().uuid().required(),
    code: Joi.string().max(50).optional(),
    metadata: Joi.string().max(50).optional(),
    value: Joi.number().integer().optional().allow(null)
});

/**
 * Middleware de validation pour getAllIncidentSetup
 */
function validateGetAllIncidentSetup(req, res, next) {
    logger.info('[VALIDATION] validateGetAllIncidentSetup - Starting validation');
    
    const { error, value } = getAllIncidentSetupSchema.validate(req.query);
    
    if (error) {
        logger.error(`[VALIDATION] validateGetAllIncidentSetup - Validation error: ${error.details[0].message}`);
        return res.status(400).json({
            success: false,
            message: `Erreur de validation: ${error.details[0].message}`
        });
    }
    
    req.query = value;
    logger.info('[VALIDATION] validateGetAllIncidentSetup - Validation successful');
    next();
}

/**
 * Middleware de validation pour getIncidentSetupByUuid
 */
function validateGetIncidentSetupByUuid(req, res, next) {
    logger.info('[VALIDATION] validateGetIncidentSetupByUuid - Starting validation');
    
    const validationData = {
        uuid: req.params.uuid,
        ...req.query
    };
    
    const { error, value } = getIncidentSetupByUuidSchema.validate(validationData);
    
    if (error) {
        logger.error(`[VALIDATION] validateGetIncidentSetupByUuid - Validation error: ${error.details[0].message}`);
        return res.status(400).json({
            success: false,
            message: `Erreur de validation: ${error.details[0].message}`
        });
    }
    
    req.params.uuid = value.uuid;
    req.query = { lang: value.lang };
    logger.info('[VALIDATION] validateGetIncidentSetupByUuid - Validation successful');
    next();
}

/**
 * Middleware de validation pour createIncidentSetup
 */
function validateCreateIncidentSetup(req, res, next) {
    logger.info('[VALIDATION] validateCreateIncidentSetup - Starting validation');
    
    const { error, value } = createIncidentSetupSchema.validate(req.body);
    
    if (error) {
        logger.error(`[VALIDATION] validateCreateIncidentSetup - Validation error: ${error.details[0].message}`);
        return res.status(400).json({
            success: false,
            message: `Erreur de validation: ${error.details[0].message}`
        });
    }
    
    req.body = value;
    logger.info('[VALIDATION] validateCreateIncidentSetup - Validation successful');
    next();
}

/**
 * Middleware de validation pour updateIncidentSetup
 */
function validateUpdateIncidentSetup(req, res, next) {
    logger.info('[VALIDATION] validateUpdateIncidentSetup - Starting validation');
    
    const validationData = {
        uuid: req.params.uuid,
        ...req.body
    };
    
    const { error, value } = updateIncidentSetupSchema.validate(validationData);
    
    if (error) {
        logger.error(`[VALIDATION] validateUpdateIncidentSetup - Validation error: ${error.details[0].message}`);
        return res.status(400).json({
            success: false,
            message: `Erreur de validation: ${error.details[0].message}`
        });
    }
    
    req.params.uuid = value.uuid;
    delete value.uuid;
    req.body = value;
    logger.info('[VALIDATION] validateUpdateIncidentSetup - Validation successful');
    next();
}

module.exports = {
    validateGetAllIncidentSetup,
    validateGetIncidentSetupByUuid,
    validateCreateIncidentSetup,
    validateUpdateIncidentSetup
};
