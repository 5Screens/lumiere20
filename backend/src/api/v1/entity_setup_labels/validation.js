const Joi = require('joi');
const logger = require('../../../config/logger');

/**
 * Schéma de validation pour la création d'un entity_setup_label
 */
const createEntitySetupLabelSchema = Joi.object({
    parent_uuid: Joi.string().uuid().required(),
    label: Joi.string().max(255).required(),
    lang_code: Joi.string().max(10).required()
});

/**
 * Schéma de validation pour la mise à jour d'un entity_setup_label
 */
const patchEntitySetupLabelSchema = Joi.object({
    label: Joi.string().max(255).required()
});

/**
 * Schéma de validation pour l'UUID dans les paramètres
 */
const uuidParamSchema = Joi.object({
    uuid: Joi.string().uuid().required()
});

/**
 * Middleware de validation pour createEntitySetupLabel
 */
function validateCreateEntitySetupLabel(req, res, next) {
    logger.info(`[VALIDATION] validateCreateEntitySetupLabel - Validating creation data for parent_uuid: ${req.body.parent_uuid}`);
    
    const { error, value } = createEntitySetupLabelSchema.validate(req.body);
    
    if (error) {
        logger.error(`[VALIDATION] validateCreateEntitySetupLabel - Validation error: ${error.details[0].message}`);
        return res.status(400).json({
            success: false,
            message: `Erreur de validation: ${error.details[0].message}`
        });
    }
    
    req.body = value;
    logger.info('[VALIDATION] validateCreateEntitySetupLabel - Validation successful');
    next();
}

/**
 * Middleware de validation pour patchEntitySetupLabel
 */
function validatePatchEntitySetupLabel(req, res, next) {
    logger.info(`[VALIDATION] validatePatchEntitySetupLabel - Validating update data for UUID: ${req.params.uuid}`);
    
    // Valider l'UUID dans les paramètres
    const { error: uuidError } = uuidParamSchema.validate(req.params);
    if (uuidError) {
        logger.error(`[VALIDATION] validatePatchEntitySetupLabel - UUID validation error: ${uuidError.details[0].message}`);
        return res.status(400).json({
            success: false,
            message: `Erreur de validation UUID: ${uuidError.details[0].message}`
        });
    }
    
    // Valider les données du body
    const { error: bodyError, value } = patchEntitySetupLabelSchema.validate(req.body);
    if (bodyError) {
        logger.error(`[VALIDATION] validatePatchEntitySetupLabel - Body validation error: ${bodyError.details[0].message}`);
        return res.status(400).json({
            success: false,
            message: `Erreur de validation: ${bodyError.details[0].message}`
        });
    }
    
    req.body = value;
    logger.info('[VALIDATION] validatePatchEntitySetupLabel - Validation successful');
    next();
}

module.exports = {
    validateCreateEntitySetupLabel,
    validatePatchEntitySetupLabel
};
