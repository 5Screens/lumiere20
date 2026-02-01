/**
 * Middleware for portal image upload (logo and thumbnail)
 * Handles image upload with resizing
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const logger = require('../config/logger');

// Portal images directory
const PORTAL_IMAGES_DIR = process.env.PORTAL_IMAGES_DIR || './uploads/portals';

// Image dimensions
const IMAGE_DIMENSIONS = {
  logo: { height: 40 },
  thumbnail: { height: 176 }
};

// Allowed image types
const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml'
];

// Max file size: 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// Ensure portal images directory exists
const ensurePortalImagesDir = () => {
  if (!fs.existsSync(PORTAL_IMAGES_DIR)) {
    fs.mkdirSync(PORTAL_IMAGES_DIR, { recursive: true });
    logger.info(`[PORTAL_IMAGES] Directory created: ${PORTAL_IMAGES_DIR}`);
  }
  return PORTAL_IMAGES_DIR;
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = ensurePortalImagesDir();
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate UUID for filename
    const uuid = crypto.randomUUID();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uuid + ext);
  }
});

// File type filter for images only
const imageFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid image type. Allowed types: PNG, JPG, WEBP, SVG`), false);
  }
};

// Multer configuration for portal images
const portalImageUpload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: imageFilter
});

/**
 * Resize image using sharp (if available)
 * Falls back to original if sharp is not installed
 */
const resizeImage = async (filePath, imageType) => {
  try {
    // Try to load sharp dynamically
    const sharp = require('sharp');
    
    const dimensions = IMAGE_DIMENSIONS[imageType];
    if (!dimensions) {
      logger.warn(`[PORTAL_IMAGES] Unknown image type: ${imageType}, skipping resize`);
      return filePath;
    }

    const ext = path.extname(filePath).toLowerCase();
    
    // Skip SVG files - they don't need resizing
    if (ext === '.svg') {
      logger.info(`[PORTAL_IMAGES] SVG file, skipping resize`);
      return filePath;
    }

    const outputPath = filePath.replace(ext, `_resized${ext}`);
    
    await sharp(filePath)
      .resize({ height: dimensions.height, withoutEnlargement: true })
      .toFile(outputPath);
    
    // Replace original with resized
    fs.unlinkSync(filePath);
    fs.renameSync(outputPath, filePath);
    
    logger.info(`[PORTAL_IMAGES] Image resized to height ${dimensions.height}px: ${filePath}`);
    return filePath;
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      logger.warn(`[PORTAL_IMAGES] Sharp not installed, skipping resize. Run: npm install sharp`);
    } else {
      logger.error(`[PORTAL_IMAGES] Error resizing image: ${error.message}`);
    }
    return filePath;
  }
};

/**
 * Delete old portal image if exists
 */
const deleteOldImage = (imageUrl) => {
  if (!imageUrl) return;
  
  try {
    // Extract filename from URL
    const filename = path.basename(imageUrl);
    const filePath = path.join(PORTAL_IMAGES_DIR, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`[PORTAL_IMAGES] Deleted old image: ${filePath}`);
    }
  } catch (error) {
    logger.error(`[PORTAL_IMAGES] Error deleting old image: ${error.message}`);
  }
};

/**
 * Get public URL for portal image
 */
const getImageUrl = (filename) => {
  return `/uploads/portals/${filename}`;
};

module.exports = {
  portalImageUpload,
  resizeImage,
  deleteOldImage,
  getImageUrl,
  PORTAL_IMAGES_DIR,
  IMAGE_DIMENSIONS
};
