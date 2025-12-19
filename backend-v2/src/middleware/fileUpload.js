/**
 * Middleware for file upload management
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const logger = require('../config/logger');

// Ensure upload directory exists
const createUploadDir = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  const baseDir = process.env.UPLOAD_DIR || './uploads';
  const yearDir = path.join(baseDir, String(year));
  const monthDir = path.join(yearDir, month);
  
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
    logger.info(`Upload directory created: ${baseDir}`);
  }
  
  if (!fs.existsSync(yearDir)) {
    fs.mkdirSync(yearDir, { recursive: true });
    logger.info(`Upload directory created: ${yearDir}`);
  }
  
  if (!fs.existsSync(monthDir)) {
    fs.mkdirSync(monthDir, { recursive: true });
    logger.info(`Upload directory created: ${monthDir}`);
  }
  
  return monthDir;
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = createUploadDir();
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate UUID for filename
    const uuid = crypto.randomUUID();
    const ext = path.extname(file.originalname);
    cb(null, uuid + ext);
  }
});

// File type filter (allowed and forbidden types)
const fileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || '').split(',').filter(type => type.trim() !== '');
  const forbiddenTypes = (process.env.FORBIDDEN_FILE_TYPES || '').split(',').filter(type => type.trim() !== '');
  
  // Check if type is explicitly forbidden
  if (forbiddenTypes.length > 0 && forbiddenTypes.includes(file.mimetype)) {
    cb(new Error(`Forbidden file type: ${file.mimetype}`), false);
    return;
  }
  
  // Check if type is allowed (if list is not empty)
  if (allowedTypes.length === 0 || allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || 10485760) // 10MB default
  },
  fileFilter: fileFilter
});

module.exports = upload;
