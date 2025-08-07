const Joi = require('joi');
const logger = require('../../../config/logger');

/**
 * Schéma de validation pour la récupération de tous les entity setups
 */
const getAllEntitySetupSchema = Joi.object({
    lang: Joi.string().max(10).optional(),
    metadata: Joi.string().max(50).optional()
});

/**
 * Schéma de validation pour la récupération d'un entity setup par UUID
 */
const getEntitySetupByUuidSchema = Joi.object({
    uuid: Joi.string().uuid().required()
});

/**
 * Schéma de validation pour la mise à jour d'un entity setup
 */
const updateEntitySetupSchema = Joi.object({
    code: Joi.string().max(50).optional(),
    metadata: Joi.string().max(50).optional()
}).min(1); // Au moins un champ doit être fourni

/**
 * Schéma de validation pour la création d'un entity setup
 */
const createEntitySetupSchema = Joi.object({
    code: Joi.string().max(50).required(),
    metadata: Joi.string().max(50).optional(),
    labels: Joi.array().items(
        Joi.object({
            label_lang_code: Joi.string().max(10).required(),
            label: Joi.string().max(255).required()
        })
    ).optional()
});

/**
 * Middleware de validation pour getAllEntitySetup
 */
function validateGetAllEntitySetup(req, res, next) {
    logger.info('[VALIDATION] validateGetAllEntitySetup - Validating query parameters');
    
    const { error, value } = getAllEntitySetupSchema.validate(req.query);
    
    if (error) {
        logger.error(`[VALIDATION] validateGetAllEntitySetup - Validation error: ${error.details[0].message}`);
        return res.status(400).json({
            success: false,
            message: `Erreur de validation: ${error.details[0].message}`
        });
    }
    
    req.query = value;
    logger.info('[VALIDATION] validateGetAllEntitySetup - Validation successful');
    next();
}

/**
 * Middleware de validation pour getEntitySetupByUuid
 */
function validateGetEntitySetupByUuid(req, res, next) {
    logger.info(`[VALIDATION] validateGetEntitySetupByUuid - Validating UUID: ${req.params.uuid}`);
    
    const { error, value } = getEntitySetupByUuidSchema.validate(req.params);
    
    if (error) {
        logger.error(`[VALIDATION] validateGetEntitySetupByUuid - Validation error: ${error.details[0].message}`);
        return res.status(400).json({
            success: false,
            message: `Erreur de validation: ${error.details[0].message}`
        });
    }
    
    req.params = value;
    logger.info('[VALIDATION] validateGetEntitySetupByUuid - Validation successful');
    next();
}

/**
 * Middleware de validation pour updateEntitySetup
 */
function validateUpdateEntitySetup(req, res, next) {
    logger.info(`[VALIDATION] validateUpdateEntitySetup - Validating update data for UUID: ${req.params.uuid}`);
    
    // Valider l'UUID dans les paramètres
    const { error: uuidError } = getEntitySetupByUuidSchema.validate(req.params);
    if (uuidError) {
        logger.error(`[VALIDATION] validateUpdateEntitySetup - UUID validation error: ${uuidError.details[0].message}`);
        return res.status(400).json({
            success: false,
            message: `Erreur de validation UUID: ${uuidError.details[0].message}`
        });
    }
    
    // Valider les données du body
    const { error: bodyError, value } = updateEntitySetupSchema.validate(req.body);
    if (bodyError) {
        logger.error(`[VALIDATION] validateUpdateEntitySetup - Body validation error: ${bodyError.details[0].message}`);
        return res.status(400).json({
            success: false,
            message: `Erreur de validation: ${bodyError.details[0].message}`
        });
    }
    
    req.body = value;
    logger.info('[VALIDATION] validateUpdateEntitySetup - Validation successful');
    next();
}

/**
 * Middleware de validation pour createEntitySetup
 */
function validateCreateEntitySetup(req, res, next) {
    logger.info(`[VALIDATION] validateCreateEntitySetup - Validating creation data for code: ${req.body.code}`);
    
    const { error, value } = createEntitySetupSchema.validate(req.body);
    
    if (error) {
        logger.error(`[VALIDATION] validateCreateEntitySetup - Validation error: ${error.details[0].message}`);
        return res.status(400).json({
            success: false,
            message: `Erreur de validation: ${error.details[0].message}`
        });
    }
    
    req.body = value;
    logger.info('[VALIDATION] validateCreateEntitySetup - Validation successful');
    next();
}

module.exports = {
    validateGetAllEntitySetup,
    validateGetEntitySetupByUuid,
    validateUpdateEntitySetup,
    validateCreateEntitySetup
};
