const Joi = require('joi');
const logger = require('../../../config/logger');
const db = require('../../../config/database');

/**
 * Validation pour POST créer un problem_categories_label
 */
const validateCreateProblemCategoryLabel = async (req, res, next) => {
    logger.info('[VALIDATION] validateCreateProblemCategoryLabel - Validating create problem category label request');
    
    const schema = Joi.object({
        parent_uuid: Joi.string().uuid().required().messages({
            'string.uuid': 'Invalid parent UUID format',
            'string.empty': 'Parent UUID cannot be empty',
            'any.required': 'Parent UUID is required'
        }),
        label: Joi.string().max(255).required().messages({
            'string.empty': 'Label cannot be empty',
            'string.max': 'Label cannot exceed 255 characters',
            'any.required': 'Label is required'
        }),
        lang_code: Joi.string().max(10).required().messages({
            'string.empty': 'Language code cannot be empty',
            'string.max': 'Language code cannot exceed 10 characters',
            'any.required': 'Language code is required'
        })
    });

    const { error, value } = schema.validate(req.body);
    
    if (error) {
        logger.error(`[VALIDATION] validateCreateProblemCategoryLabel - Validation error: ${error.details[0].message}`);
        return res.status(400).json({ error: error.details[0].message });
    }

    req.body = value;

    try {
        // Vérifier que le parent_uuid existe dans configuration.problem_categories
        const parentQuery = `
            SELECT uuid FROM configuration.problem_categories WHERE uuid = $1
        `;
        const parentResult = await db.query(parentQuery, [req.body.parent_uuid]);

        if (parentResult.rows.length === 0) {
            logger.error(`[VALIDATION] validateCreateProblemCategoryLabel - Parent problem category not found: ${req.body.parent_uuid}`);
            return res.status(400).json({ error: 'Parent problem category not found' });
        }

        // Vérifier que le code de langue existe et est actif
        const langQuery = `
            SELECT code 
            FROM translations.languages 
            WHERE code = $1 
            AND is_active = true
        `;
        const langResult = await db.query(langQuery, [req.body.lang_code]);

        if (langResult.rows.length === 0) {
            logger.error(`[VALIDATION] validateCreateProblemCategoryLabel - Language ${req.body.lang_code} not found or not active`);
            return res.status(400).json({ error: 'Invalid or inactive language code' });
        }

        logger.info('[VALIDATION] validateCreateProblemCategoryLabel - Create problem category label request validation successful');
        next();
    } catch (error) {
        logger.error(`[VALIDATION] validateCreateProblemCategoryLabel - Database error during validation: ${error.message}`);
        return res.status(500).json({ error: 'Internal server error during validation' });
    }
};

/**
 * Validation pour PATCH mettre à jour un problem_categories_label
 */
const validatePatchProblemCategoryLabel = async (req, res, next) => {
    logger.info('[VALIDATION] validatePatchProblemCategoryLabel - Validating patch problem category label request');
    
    const paramsSchema = Joi.object({
        uuid: Joi.string().uuid().required().messages({
            'string.uuid': 'Invalid UUID format',
            'any.required': 'UUID is required'
        })
    });

    const bodySchema = Joi.object({
        label: Joi.string().max(255).required().messages({
            'string.empty': 'Label cannot be empty',
            'string.max': 'Label cannot exceed 255 characters',
            'any.required': 'Label is required'
        })
    });

    const { error: paramsError, value: paramsValue } = paramsSchema.validate(req.params);
    const { error: bodyError, value: bodyValue } = bodySchema.validate(req.body);
    
    if (paramsError) {
        logger.error(`[VALIDATION] validatePatchProblemCategoryLabel - Params validation error: ${paramsError.details[0].message}`);
        return res.status(400).json({ error: paramsError.details[0].message });
    }
    
    if (bodyError) {
        logger.error(`[VALIDATION] validatePatchProblemCategoryLabel - Body validation error: ${bodyError.details[0].message}`);
        return res.status(400).json({ error: bodyError.details[0].message });
    }

    req.params = paramsValue;
    req.body = bodyValue;

    try {
        // Vérifier que le label existe
        const labelQuery = `
            SELECT uuid FROM translations.problem_categories_labels WHERE uuid = $1
        `;
        const labelResult = await db.query(labelQuery, [req.params.uuid]);

        if (labelResult.rows.length === 0) {
            logger.error(`[VALIDATION] validatePatchProblemCategoryLabel - Problem category label not found: ${req.params.uuid}`);
            return res.status(404).json({ error: 'Problem category label not found' });
        }

        logger.info('[VALIDATION] validatePatchProblemCategoryLabel - Patch problem category label request validation successful');
        next();
    } catch (error) {
        logger.error(`[VALIDATION] validatePatchProblemCategoryLabel - Database error during validation: ${error.message}`);
        return res.status(500).json({ error: 'Internal server error during validation' });
    }
};

module.exports = {
    validateCreateProblemCategoryLabel,
    validatePatchProblemCategoryLabel
};
