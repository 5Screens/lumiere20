/**
 * Validation des requêtes pour les attachments
 */
const Joi = require('joi');

// Schéma de validation pour l'upload d'un fichier
const uploadFileSchema = Joi.object({
  objectType: Joi.string().required().messages({
    'string.empty': 'Le type d\'objet ne peut pas être vide',
    'any.required': 'Le type d\'objet est requis'
  }),
  objectUuid: Joi.string().guid().required().messages({
    'string.empty': 'L\'UUID de l\'objet ne peut pas être vide',
    'string.guid': 'L\'UUID de l\'objet doit être un UUID valide',
    'any.required': 'L\'UUID de l\'objet est requis'
  }),
  uploadedBy: Joi.string().guid().messages({
    'string.guid': 'L\'UUID de l\'utilisateur doit être un UUID valide'
  })
});

// Schéma de validation pour la récupération des attachments d'un objet
const getAttachmentsByObjectSchema = Joi.object({
  objectType: Joi.string().required().messages({
    'string.empty': 'Le type d\'objet ne peut pas être vide',
    'any.required': 'Le type d\'objet est requis'
  }),
  objectUuid: Joi.string().guid().required().messages({
    'string.empty': 'L\'UUID de l\'objet ne peut pas être vide',
    'string.guid': 'L\'UUID de l\'objet doit être un UUID valide',
    'any.required': 'L\'UUID de l\'objet est requis'
  })
});

// Schéma de validation pour la récupération ou suppression d'un attachment
const attachmentUuidSchema = Joi.object({
  uuid: Joi.string().guid().required().messages({
    'string.empty': 'L\'UUID de l\'attachment ne peut pas être vide',
    'string.guid': 'L\'UUID de l\'attachment doit être un UUID valide',
    'any.required': 'L\'UUID de l\'attachment est requis'
  })
});

// Middleware de validation pour l'upload d'un fichier
const validateUploadFile = (req, res, next) => {
  const { error } = uploadFileSchema.validate(req.body);
  if (error) {
    // Supprimer le fichier si la validation échoue
    if (req.file && req.file.path) {
      require('fs').unlinkSync(req.file.path);
    }
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

// Middleware de validation pour l'upload de plusieurs fichiers
const validateUploadMultipleFiles = (req, res, next) => {
  const { error } = uploadFileSchema.validate(req.body);
  if (error) {
    // Supprimer les fichiers si la validation échoue
    if (req.files) {
      for (const file of req.files) {
        require('fs').unlinkSync(file.path);
      }
    }
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

// Middleware de validation pour la récupération des attachments d'un objet
const validateGetAttachmentsByObject = (req, res, next) => {
  const { error } = getAttachmentsByObjectSchema.validate(req.params);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

// Middleware de validation pour la récupération ou suppression d'un attachment
const validateAttachmentUuid = (req, res, next) => {
  const { error } = attachmentUuidSchema.validate(req.params);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

module.exports = {
  validateUploadFile,
  validateUploadMultipleFiles,
  validateGetAttachmentsByObject,
  validateAttachmentUuid
};
