const Joi = require('joi');
const logger = require('../../../config/logger');

/**
 * Schéma de validation pour la création d'un label incident_setup
 */
const createIncidentSetupLabelSchema = Joi.object({
    label: Joi.string().max(255).required(),
    parent_uuid: Joi.string().uuid().required(),
    lang_code: Joi.string().max(10).required()
});

/**
 * Schéma de validation pour la mise à jour d'un label incident_setup
 */
const patchIncidentSetupLabelSchema = Joi.object({
    uuid: Joi.string().uuid().required(),
    label: Joi.string().max(255).optional(),
    lang: Joi.string().max(10).optional()
});

/**
 * Middleware de validation pour createIncidentSetupLabel
 */
function validateCreateIncidentSetupLabel(req, res, next) {
    logger.info('[VALIDATION] validateCreateIncidentSetupLabel - Starting validation');
    
    const { error, value } = createIncidentSetupLabelSchema.validate(req.body);
    
    if (error) {
        logger.error(`[VALIDATION] validateCreateIncidentSetupLabel - Validation error: ${error.details[0].message}`);
        return res.status(400).json({
            success: false,
            message: `Erreur de validation: ${error.details[0].message}`
        });
    }
    
    req.body = value;
    logger.info('[VALIDATION] validateCreateIncidentSetupLabel - Validation successful');
    next();
}

/**
 * Middleware de validation pour patchIncidentSetupLabel
 */
function validatePatchIncidentSetupLabel(req, res, next) {
    logger.info('[VALIDATION] validatePatchIncidentSetupLabel - Starting validation');
    
    const validationData = {
        uuid: req.params.uuid,
        ...req.body
    };
    
    const { error, value } = patchIncidentSetupLabelSchema.validate(validationData);
    
    if (error) {
        logger.error(`[VALIDATION] validatePatchIncidentSetupLabel - Validation error: ${error.details[0].message}`);
        return res.status(400).json({
            success: false,
            message: `Erreur de validation: ${error.details[0].message}`
        });
    }
    
    req.params.uuid = value.uuid;
    delete value.uuid;
    req.body = value;
    logger.info('[VALIDATION] validatePatchIncidentSetupLabel - Validation successful');
    next();
}

module.exports = {
    validateCreateIncidentSetupLabel,
    validatePatchIncidentSetupLabel
};
