/**
 * Service pour la gestion des attachments
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Calcule le hash SHA-256 d'un fichier
 * @param {string} filePath - Chemin du fichier
 * @returns {Promise<string>} - Hash SHA-256 du fichier
 */
const calculateFileSha256 = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('error', err => reject(err));
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
};

/**
 * Crée un enregistrement d'attachment dans la base de données
 * @param {Object} file - Objet fichier de Multer
 * @param {string} objectType - Type d'objet parent
 * @param {string} objectUuid - UUID de l'objet parent
 * @param {string} uploadedBy - UUID de l'utilisateur qui a uploadé le fichier
 * @returns {Promise<string>} - UUID de l'attachment créé
 */
const createAttachment = async (file, objectType, objectUuid, uploadedBy) => {
  try {
    // Calculer le hash SHA-256 du fichier
    const sha256 = await calculateFileSha256(file.path);
    
    // Insérer dans la base de données
    const query = `
      INSERT INTO core.attachments (
        uuid,
        object_type, 
        object_uuid,
        file_name, 
        mime_type, 
        size_bytes, 
        sha256, 
        storage_uri, 
        uploaded_by
      ) 
      VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING uuid
    `;
    
    const values = [
      objectType,
      objectUuid,
      file.originalname,
      file.mimetype,
      file.size,
      sha256,
      file.path,
      uploadedBy
    ];
    
    const result = await db.query(query, values);
    return result.rows[0].uuid;
  } catch (error) {
    logger.error(`Erreur lors de la création de l'attachment: ${error.message}`);
    throw error;
  }
};

/**
 * Récupère un attachment par son UUID
 * @param {string} uuid - UUID de l'attachment
 * @returns {Promise<Object|null>} - Données de l'attachment ou null si non trouvé
 */
const getAttachmentByUuid = async (uuid) => {
  try {
    const query = `
      SELECT * FROM core.attachments
      WHERE uuid = $1
    `;
    
    const result = await db.query(query, [uuid]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    logger.error(`Erreur lors de la récupération de l'attachment: ${error.message}`);
    throw error;
  }
};

/**
 * Supprime un attachment
 * @param {string} uuid - UUID de l'attachment
 * @returns {Promise<boolean>} - true si supprimé avec succès
 */
const deleteAttachment = async (uuid) => {
  try {
    // Récupérer l'attachment
    const attachment = await getAttachmentByUuid(uuid);
    
    if (!attachment) {
      throw new Error(`Attachment avec l'UUID ${uuid} non trouvé`);
    }
    
    // Supprimer le fichier physique
    if (fs.existsSync(attachment.storage_uri)) {
      fs.unlinkSync(attachment.storage_uri);
    }
    
    // Supprimer l'enregistrement de la base de données
    await db.query(
      `DELETE FROM core.attachments WHERE uuid = $1`,
      [uuid]
    );
    
    return true;
  } catch (error) {
    logger.error(`Erreur lors de la suppression de l'attachment: ${error.message}`);
    throw error;
  }
};

/**
 * Récupère les attachments d'un objet
 * @param {string} objectType - Type d'objet parent
 * @param {string} objectUuid - UUID de l'objet parent
 * @returns {Promise<Array>} - Liste des attachments
 */
const getAttachmentsByObject = async (objectType, objectUuid) => {
  try {
    const query = `
      SELECT * FROM core.attachments
      WHERE object_type = $1 AND object_uuid = $2
    `;
    
    const result = await db.query(query, [objectType, objectUuid]);
    return result.rows;
  } catch (error) {
    logger.error(`Erreur lors de la récupération des attachments: ${error.message}`);
    throw error;
  }
};

/**
 * Récupère les attachments par UUID de l'objet parent, sans préciser le type
 * @param {string} objectUuid - UUID de l'objet parent
 * @returns {Promise<Array>} - Liste des attachments adaptée pour le composant sFileUploader
 */
const getAttachmentsByObjectUuid = async (objectUuid) => {
  try {
    const query = `
      SELECT * FROM core.attachments
      WHERE object_uuid = $1
    `;
    
    const result = await db.query(query, [objectUuid]);
    
    // Adapter les noms des propriétés pour le composant sFileUploader
    const adaptedAttachments = result.rows.map(attachment => ({
      ...attachment,
      originalname: attachment.file_name,
      name: attachment.file_name,
      mimetype: attachment.mime_type,
      size: parseInt(attachment.size_bytes) || 0
    }));
    
    return adaptedAttachments;
  } catch (error) {
    logger.error(`Erreur lors de la récupération des attachments par UUID: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createAttachment,
  getAttachmentByUuid,
  deleteAttachment,
  getAttachmentsByObject,
  getAttachmentsByObjectUuid,
  calculateFileSha256
};
