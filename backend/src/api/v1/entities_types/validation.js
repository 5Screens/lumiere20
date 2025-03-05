const Joi = require('joi');
const logger = require('../../../config/logger');

/**
 * Validation du paramètre de langue pour les requêtes d'entités types
 * @param {Object} req - Requête Express
 * @returns {Object} Résultat de validation
 */
const validateLanguageParam = (req) => {
    const schema = Joi.object({
        langue: Joi.string().min(2).max(5).required()
    });

    const result = schema.validate(req.query);
    
    if (result.error) {
        logger.warn(`[VALIDATION] validateLanguageParam - Validation failed: ${result.error.message}`);
    } else {
        logger.info(`[VALIDATION] validateLanguageParam - Validation successful for langue: ${req.query.langue}`);
    }
    
    return result;
};

module.exports = {
    validateLanguageParam
};
