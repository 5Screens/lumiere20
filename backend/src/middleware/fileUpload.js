/**
 * Middleware pour la gestion des uploads de fichiers
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const logger = require('../config/logger');

// Assurez-vous que le répertoire d'upload existe
const createUploadDir = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  const baseDir = process.env.UPLOAD_DIR || './uploads';
  const yearDir = path.join(baseDir, String(year));
  const monthDir = path.join(yearDir, month);
  
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
    logger.info(`Répertoire d'upload créé: ${baseDir}`);
  }
  
  if (!fs.existsSync(yearDir)) {
    fs.mkdirSync(yearDir, { recursive: true });
    logger.info(`Répertoire d'upload créé: ${yearDir}`);
  }
  
  if (!fs.existsSync(monthDir)) {
    fs.mkdirSync(monthDir, { recursive: true });
    logger.info(`Répertoire d'upload créé: ${monthDir}`);
  }
  
  return monthDir;
};

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = createUploadDir();
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Générer un UUID pour le nom de fichier
    const uuid = crypto.randomUUID();
    const ext = path.extname(file.originalname);
    cb(null, uuid + ext);
  }
});

// Filtre pour les types de fichiers autorisés
const fileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || '').split(',');
  
  if (allowedTypes.length === 0 || allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Type de fichier non autorisé. Types autorisés: ${allowedTypes.join(', ')}`), false);
  }
};

// Configuration de Multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || 10485760) // 10MB par défaut
  },
  fileFilter: fileFilter
});

module.exports = upload;
