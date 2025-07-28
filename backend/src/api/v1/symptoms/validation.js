const Joi = require('joi');
const logger = require('../../../config/logger');
const db = require('../../../config/database');

const getSymptoms = {
    query: Joi.object({
        langue: Joi.string().length(2).required()
    }).options({ 
        abortEarly: false,
        stripUnknown: true 
    })
};

const getSymptomByCode = {
    query: Joi.object({
        scode: Joi.string().required()
    }).options({ 
        abortEarly: false,
        stripUnknown: true 
    })
};

const getSymptomByUuid = {
    params: Joi.object({
        uuid: Joi.string().uuid().required()
            .messages({
                'string.guid': 'L\'UUID doit être un UUID valide',
                'any.required': 'L\'UUID est requis'
            })
    }),
    query: Joi.object({
        lang: Joi.string().length(2).optional()
            .messages({
                'string.length': 'Le code de langue doit contenir exactement 2 caractères',
                'string.empty': 'Le code de langue ne peut pas être vide'
            })
    }).options({ 
        abortEarly: false,
        stripUnknown: true 
    })
};

const createSymptom = {
    body: Joi.object({
        code: Joi.string().max(50).required(),
        translations: Joi.array().items(
            Joi.object({
                langue: Joi.string().length(2).required(),
                libelle: Joi.string().max(255).required()
            })
        ).min(1).required()
    }).options({ 
        abortEarly: false,
        stripUnknown: true 
    })
};

// Nouveau schéma pour la validation du paramètre lang
const getSymptomsWithLang = {
    query: Joi.object({
        lang: Joi.string().length(2).optional()
            .messages({
                'string.length': 'Le code de langue doit contenir exactement 2 caractères',
                'string.empty': 'Le code de langue ne peut pas être vide'
            })
    }).options({ 
        abortEarly: false,
        stripUnknown: true 
    })
};

const validateSymptom = (schema, data) => {
    logger.info('[VALIDATION] Starting symptom validation');
    const { error, value } = schema.validate(data);
    if (error) {
        logger.error(`[VALIDATION] Symptom validation failed: ${error.details.map(d => d.message).join(', ')}`);
        return { error };
    }
    logger.info('[VALIDATION] Symptom validation successful');
    return { value };
};

// Fonction de validation pour le paramètre lang
const validateGetSymptomsWithLang = async (req, res, next) => {
    logger.info('[VALIDATION] Validating get symptoms with lang request');
    
    try {
        const validationResult = getSymptomsWithLang.query.validate(req.query);
        const { error } = validationResult;
        
        if (error) {
            logger.error(`[VALIDATION] Validation error: ${error.details[0].message}`);
            return res.status(400).json({ error: error.details[0].message });
        }
    } catch (validationError) {
        logger.error(`[VALIDATION] Validation exception: ${validationError.message}`);
        return res.status(400).json({ error: 'Erreur de validation des paramètres' });
    }

    // Si lang est fourni, vérifier s'il existe et est actif
    if (req.query.lang) {
        try {
            const query = `
                SELECT code 
                FROM translations.languages 
                WHERE code = $1 
                AND is_active = true
            `;
            const result = await db.pool.query(query, [req.query.lang]);

            if (result.rows.length === 0) {
                logger.error(`[VALIDATION] Language ${req.query.lang} not found or not active`);
                return res.status(400).json({ error: 'Code de langue invalide ou inactif' });
            }
        } catch (error) {
            logger.error(`[VALIDATION] Database error during language validation: ${error.message}`);
            return res.status(500).json({ error: 'Erreur interne lors de la validation' });
        }
    }

    logger.info('[VALIDATION] Get symptoms with lang request validation successful');
    next();
};

module.exports = {
    getSymptoms,
    getSymptomByCode,
    getSymptomByUuid,
    createSymptom,
    validateSymptom,
    validateGetSymptomsWithLang
};
