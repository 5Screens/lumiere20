const logger = require('../config/logger');

const validate = (schema) => (req, res, next) => {
    const validationOptions = {
        abortEarly: false, // retourne toutes les erreurs
        allowUnknown: true, // permet des propriétés inconnues
        stripUnknown: true // supprime les propriétés inconnues
    };

    const { error, value } = schema.query.validate(req.query, validationOptions);
    
    if (error) {
        const errors = error.details.map((detail) => detail.message);
        logger.error(`Erreur de validation: ${errors.join(', ')}`);
        
        return res.status(400).json({
            success: false,
            message: 'Erreur de validation des paramètres',
            errors: errors
        });
    }

    // Remplace les valeurs validées
    req.query = value;
    return next();
};

module.exports = validate;
