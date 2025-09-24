const logger = require('../config/logger');

const validate = (schema) => (req, res, next) => {
    const validationOptions = {
        abortEarly: false, // retourne toutes les erreurs
        allowUnknown: true, // permet des propriétés inconnues
        stripUnknown: true // supprime les propriétés inconnues
    };

    // Validation du corps de la requête si un schéma est fourni
    if (schema.body) {
        const { error: bodyError } = schema.body.validate(req.body, validationOptions);
        if (bodyError) {
            const errors = bodyError.details.map((detail) => detail.message);
            logger.error(`Erreur de validation du corps: ${errors.join(', ')}`);
            return res.status(400).json({
                success: false,
                message: 'Erreur de validation du corps de la requête',
                errors: errors
            });
        }
    }

    // Validation des paramètres de requête si un schéma est fourni
    if (schema.query) {
        const { error: queryError } = schema.query.validate(req.query, validationOptions);
        if (queryError) {
            const errors = queryError.details.map((detail) => detail.message);
            logger.error(`Erreur de validation des paramètres: ${errors.join(', ')}`);
            return res.status(400).json({
                success: false,
                message: 'Erreur de validation des paramètres de requête',
                errors: errors
            });
        }
    }

    // Validation des paramètres d'URL si un schéma est fourni
    if (schema.params) {
        const { error: paramsError } = schema.params.validate(req.params, validationOptions);
        if (paramsError) {
            const errors = paramsError.details.map((detail) => detail.message);
            logger.error(`Erreur de validation des paramètres d'URL: ${errors.join(', ')}`);
            return res.status(400).json({
                success: false,
                message: 'Erreur de validation des paramètres d\'URL',
                errors: errors
            });
        }
    }

    next();
};

module.exports = validate;
