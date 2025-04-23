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
    
    // Assurer l'encodage correct du nom de fichier original pour les accents
    let decodedFilename;
    try {
      decodedFilename = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    } catch (error) {
      logger.warn(`Erreur lors du décodage du nom de fichier: ${error.message}`);
      decodedFilename = req.file.originalname;
    }
    
    const fileWithCorrectName = {
      ...req.file,
      originalname: decodedFilename
    };
    
    // Créer l'enregistrement dans la base de données
    const attachmentUuid = await attachmentService.createAttachment(fileWithCorrectName, objectType, objectUuid, uploadedBy);
    
    // Renvoyer les informations sur le fichier uploadé
    return res.status(201).json({
      message: 'Fichier téléchargé avec succès',
      attachment: {
        uuid: attachmentUuid,
        filename: req.file.filename,
        originalname: decodedFilename,
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
    // Vérification du nombre de fichiers reçus
    
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

      
      try {
        // Assurer l'encodage correct du nom de fichier original pour les accents
        let decodedFilename;
        try {
          decodedFilename = Buffer.from(file.originalname, 'latin1').toString('utf8');
        } catch (error) {
          logger.warn(`Erreur lors du décodage du nom de fichier: ${error.message}`);
          decodedFilename = file.originalname;
        }
        
        const fileWithCorrectName = {
          ...file,
          originalname: decodedFilename
        };
        
        const attachmentUuid = await attachmentService.createAttachment(fileWithCorrectName, objectType, objectUuid, uploadedBy);
        
        attachments.push({
          uuid: attachmentUuid,
          filename: file.filename,
          originalname: decodedFilename,
          mimetype: file.mimetype,
          size: file.size
        });
      } catch (err) {
        logger.error(`Erreur lors du traitement du fichier ${file.originalname}: ${err.message}`);
        logger.error(err.stack);
        throw err;
      }
    }
    
    // Renvoyer les informations sur les fichiers uploadés

    return res.status(201).json({
      message: `${req.files.length} fichiers téléchargés avec succès`,
      attachments: attachments
    });
  } catch (error) {
    logger.error(`Erreur lors de l'upload des fichiers: ${error.message}`);
    logger.error(error.stack);
    
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
 * Contrôleur pour récupérer les attachments par UUID de l'objet parent, sans préciser le type
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.getAttachmentsByObjectUuid = async (req, res) => {
  try {
    const { objectUuid } = req.params;
    
    if (!objectUuid) {
      return res.status(400).json({ error: 'objectUuid est requis' });
    }
    
    const attachments = await attachmentService.getAttachmentsByObjectUuid(objectUuid);
    
    return res.status(200).json(attachments);
  } catch (error) {
    logger.error(`Erreur lors de la récupération des attachments par UUID: ${error.message}`);
    return res.status(500).json({ error: 'Erreur lors de la récupération des attachments' });
  }
};
