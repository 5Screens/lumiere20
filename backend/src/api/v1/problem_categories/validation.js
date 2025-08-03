const Joi = require('joi');
const logger = require('../../../config/logger');
const db = require('../../../config/database');

/**
 * Validation pour GET toutes les problem_categories
 */
const validateGetProblemCategories = async (req, res, next) => {
    logger.info('[VALIDATION] validateGetProblemCategories - Validating get problem categories request');
    
    const schema = Joi.object({
        lang: Joi.string()
            .required()
            .messages({
                'string.empty': 'Language code cannot be empty',
                'any.required': 'Language code is required'
            }),
        toSelect: Joi.string()
            .valid('yes', 'no')
            .optional()
            .default('no')
    });

    const { error, value } = schema.validate(req.query);
    
    if (error) {
        logger.error(`[VALIDATION] validateGetProblemCategories - Validation error: ${error.details[0].message}`);
        return res.status(400).json({ error: error.details[0].message });
    }

    // Update the query with validated values
    req.query = value;

    try {
        // Check if language exists and is active
        const query = `
            SELECT code 
            FROM translations.languages 
            WHERE code = $1 
            AND is_active = true
        `;
        const result = await db.query(query, [req.query.lang]);

        if (result.rows.length === 0) {
            logger.error(`[VALIDATION] validateGetProblemCategories - Language ${req.query.lang} not found or not active`);
            return res.status(400).json({ error: 'Invalid or inactive language code' });
        }

        logger.info('[VALIDATION] validateGetProblemCategories - Get problem categories request validation successful');
        next();
    } catch (error) {
        logger.error(`[VALIDATION] validateGetProblemCategories - Database error during language validation: ${error.message}`);
        return res.status(500).json({ error: 'Internal server error during validation' });
    }
};

/**
 * Validation pour GET une problem_category par UUID
 */
const validateGetProblemCategoryById = async (req, res, next) => {
    logger.info('[VALIDATION] validateGetProblemCategoryById - Validating get problem category by UUID request');
    
    const paramsSchema = Joi.object({
        uuid: Joi.string().uuid().required().messages({
            'string.uuid': 'Invalid UUID format',
            'any.required': 'UUID is required'
        })
    });

    const querySchema = Joi.object({
        lang: Joi.string().optional()
    });

    const { error: paramsError, value: paramsValue } = paramsSchema.validate(req.params);
    const { error: queryError, value: queryValue } = querySchema.validate(req.query);
    
    if (paramsError) {
        logger.error(`[VALIDATION] validateGetProblemCategoryById - Params validation error: ${paramsError.details[0].message}`);
        return res.status(400).json({ error: paramsError.details[0].message });
    }
    
    if (queryError) {
        logger.error(`[VALIDATION] validateGetProblemCategoryById - Query validation error: ${queryError.details[0].message}`);
        return res.status(400).json({ error: queryError.details[0].message });
    }

    req.params = paramsValue;
    req.query = queryValue;

    // Si lang est fourni, vérifier qu'il existe et est actif
    if (req.query.lang) {
        try {
            const query = `
                SELECT code 
                FROM translations.languages 
                WHERE code = $1 
                AND is_active = true
            `;
            const result = await db.query(query, [req.query.lang]);

            if (result.rows.length === 0) {
                logger.error(`[VALIDATION] validateGetProblemCategoryById - Language ${req.query.lang} not found or not active`);
                return res.status(400).json({ error: 'Invalid or inactive language code' });
            }
        } catch (error) {
            logger.error(`[VALIDATION] validateGetProblemCategoryById - Database error during language validation: ${error.message}`);
            return res.status(500).json({ error: 'Internal server error during validation' });
        }
    }

    logger.info('[VALIDATION] validateGetProblemCategoryById - Get problem category by UUID request validation successful');
    next();
};

/**
 * Validation pour PATCH une problem_category
 */
const validateUpdateProblemCategory = async (req, res, next) => {
    logger.info('[VALIDATION] validateUpdateProblemCategory - Validating update problem category request');
    
    const paramsSchema = Joi.object({
        uuid: Joi.string().uuid().required().messages({
            'string.uuid': 'Invalid UUID format',
            'any.required': 'UUID is required'
        })
    });

    const bodySchema = Joi.object({
        code: Joi.string().max(50).optional()
    }).min(1);

    const { error: paramsError, value: paramsValue } = paramsSchema.validate(req.params);
    const { error: bodyError, value: bodyValue } = bodySchema.validate(req.body);
    
    if (paramsError) {
        logger.error(`[VALIDATION] validateUpdateProblemCategory - Params validation error: ${paramsError.details[0].message}`);
        return res.status(400).json({ error: paramsError.details[0].message });
    }
    
    if (bodyError) {
        logger.error(`[VALIDATION] validateUpdateProblemCategory - Body validation error: ${bodyError.details[0].message}`);
        return res.status(400).json({ error: bodyError.details[0].message });
    }

    req.params = paramsValue;
    req.body = bodyValue;

    logger.info('[VALIDATION] validateUpdateProblemCategory - Update problem category request validation successful');
    next();
};

/**
 * Validation pour POST créer une problem_category
 */
const validateCreateProblemCategory = async (req, res, next) => {
    logger.info('[VALIDATION] validateCreateProblemCategory - Validating create problem category request');
    
    const schema = Joi.object({
        code: Joi.string().max(50).required().messages({
            'string.empty': 'Code cannot be empty',
            'string.max': 'Code cannot exceed 50 characters',
            'any.required': 'Code is required'
        }),
        labels: Joi.array().items(
            Joi.object({
                label_lang_code: Joi.string().max(10).required().messages({
                    'string.empty': 'Language code cannot be empty',
                    'string.max': 'Language code cannot exceed 10 characters',
                    'any.required': 'Language code is required'
                }),
                label: Joi.string().max(255).required().messages({
                    'string.empty': 'Label cannot be empty',
                    'string.max': 'Label cannot exceed 255 characters',
                    'any.required': 'Label is required'
                })
            })
        ).optional()
    });

    const { error, value } = schema.validate(req.body);
    
    if (error) {
        logger.error(`[VALIDATION] validateCreateProblemCategory - Validation error: ${error.details[0].message}`);
        return res.status(400).json({ error: error.details[0].message });
    }

    req.body = value;

    // Vérifier que tous les codes de langue existent et sont actifs
    if (req.body.labels && req.body.labels.length > 0) {
        try {
            const langCodes = req.body.labels.map(label => label.label_lang_code);
            const query = `
                SELECT code 
                FROM translations.languages 
                WHERE code = ANY($1) 
                AND is_active = true
            `;
            const result = await db.query(query, [langCodes]);

            const validLangCodes = result.rows.map(row => row.code);
            const invalidLangCodes = langCodes.filter(code => !validLangCodes.includes(code));

            if (invalidLangCodes.length > 0) {
                logger.error(`[VALIDATION] validateCreateProblemCategory - Invalid language codes: ${invalidLangCodes.join(', ')}`);
                return res.status(400).json({ error: `Invalid or inactive language codes: ${invalidLangCodes.join(', ')}` });
            }
        } catch (error) {
            logger.error(`[VALIDATION] validateCreateProblemCategory - Database error during language validation: ${error.message}`);
            return res.status(500).json({ error: 'Internal server error during validation' });
        }
    }

    logger.info('[VALIDATION] validateCreateProblemCategory - Create problem category request validation successful');
    next();
};

module.exports = {
    validateGetProblemCategories,
    validateGetProblemCategoryById,
    validateUpdateProblemCategory,
    validateCreateProblemCategory
};
