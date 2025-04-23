/**
 * Contrôleur pour la gestion des attachments
 */
const fs = require('fs');
const path = require('path');
const logger = require('../../../config/logger');
const attachmentService = require('./service');

/**
 * Contrôleur pour l'upload d'un fichier
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier n\'a été téléchargé' });
    }

    // Récupérer les informations sur l'objet parent
    const objectType = req.body.objectType;
    const objectUuid = req.body.objectUuid;
    
    if (!objectType || !objectUuid) {
      // Supprimer le fichier si les paramètres sont invalides
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'objectType et objectUuid sont requis' });
    }
    
    // Récupérer l'ID de l'utilisateur depuis l'authentification ou le corps de la requête
    const uploadedBy = req.body.uploadedBy || '00000000-0000-0000-0000-000000000000';
    
    // Créer l'enregistrement dans la base de données
    const attachmentUuid = await attachmentService.createAttachment(req.file, objectType, objectUuid, uploadedBy);
    
    // Renvoyer les informations sur le fichier uploadé
    return res.status(201).json({
      message: 'Fichier téléchargé avec succès',
      attachment: {
        uuid: attachmentUuid,
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    logger.error(`Erreur lors de l'upload du fichier: ${error.message}`);
    
    // Supprimer le fichier en cas d'erreur
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        logger.error(`Erreur lors de la suppression du fichier: ${err.message}`);
      }
    }
    
    return res.status(500).json({ error: 'Erreur lors de l\'upload du fichier' });
  }
};

/**
 * Contrôleur pour l'upload de plusieurs fichiers
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier n\'a été téléchargé' });
    }

    // Récupérer les informations sur l'objet parent
    const objectType = req.body.objectType;
    const objectUuid = req.body.objectUuid;
    
    if (!objectType || !objectUuid) {
      // Supprimer les fichiers si les paramètres sont invalides
      if (req.files) {
        for (const file of req.files) {
          fs.unlinkSync(file.path);
        }
      }
      return res.status(400).json({ error: 'objectType et objectUuid sont requis' });
    }
    
    // Récupérer l'ID de l'utilisateur depuis l'authentification ou le corps de la requête
    const uploadedBy = req.body.uploadedBy || '00000000-0000-0000-0000-000000000000';
    
    // Créer des enregistrements dans la base de données
    const attachments = [];
    for (const file of req.files) {
      const attachmentUuid = await attachmentService.createAttachment(file, objectType, objectUuid, uploadedBy);
      attachments.push({
        uuid: attachmentUuid,
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });
    }
    
    // Renvoyer les informations sur les fichiers uploadés
    return res.status(201).json({
      message: `${req.files.length} fichiers téléchargés avec succès`,
      attachments: attachments
    });
  } catch (error) {
    logger.error(`Erreur lors de l'upload des fichiers: ${error.message}`);
    
    // Supprimer les fichiers en cas d'erreur
    if (req.files) {
      for (const file of req.files) {
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          logger.error(`Erreur lors de la suppression du fichier: ${err.message}`);
        }
      }
    }
    
    return res.status(500).json({ error: 'Erreur lors de l\'upload des fichiers' });
  }
};

/**
 * Contrôleur pour récupérer un fichier
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.getFile = async (req, res) => {
  try {
    const attachmentUuid = req.params.uuid;
    
    // Récupérer l'attachment depuis la base de données
    const attachment = await attachmentService.getAttachmentByUuid(attachmentUuid);
    
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment non trouvé' });
    }
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(attachment.storage_uri)) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }
    
    // Définir les en-têtes de réponse
    res.setHeader('Content-Type', attachment.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${attachment.file_name}"`);
    
    // Envoyer le fichier
    return res.sendFile(path.resolve(attachment.storage_uri));
  } catch (error) {
    logger.error(`Erreur lors de la récupération du fichier: ${error.message}`);
    return res.status(500).json({ error: 'Erreur lors de la récupération du fichier' });
  }
};

/**
 * Contrôleur pour supprimer un fichier
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.deleteFile = async (req, res) => {
  try {
    const attachmentUuid = req.params.uuid;
    
    // Supprimer l'attachment
    await attachmentService.deleteAttachment(attachmentUuid);
    
    return res.status(200).json({ message: 'Attachment supprimé avec succès' });
  } catch (error) {
    logger.error(`Erreur lors de la suppression de l'attachment: ${error.message}`);
    return res.status(500).json({ error: 'Erreur lors de la suppression de l\'attachment' });
  }
};

/**
 * Contrôleur pour récupérer les attachments d'un objet
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.getAttachmentsByObject = async (req, res) => {
  try {
    const { objectType, objectUuid } = req.params;
    
    if (!objectType || !objectUuid) {
      return res.status(400).json({ error: 'objectType et objectUuid sont requis' });
    }
    
    const attachments = await attachmentService.getAttachmentsByObject(objectType, objectUuid);
    
    return res.status(200).json({
      attachments: attachments
    });
  } catch (error) {
    logger.error(`Erreur lors de la récupération des attachments: ${error.message}`);
    return res.status(500).json({ error: 'Erreur lors de la récupération des attachments' });
  }
};
