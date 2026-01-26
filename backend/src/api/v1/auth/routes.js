const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticate } = require('../../../middleware/auth');
const { validate } = require('../../../middleware/validate');
const { z } = require('zod');

// Validation schemas
const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required')
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
  })
});

const updateProfileSchema = z.object({
  body: z.object({
    first_name: z.string().min(1).optional(),
    last_name: z.string().min(1).optional(),
    phone: z.string().optional()
  })
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters')
  })
});

// Public routes
router.post('/register', validate(registerSchema), controller.register);
router.post('/login', validate(loginSchema), controller.login);

// Protected routes
router.get('/profile', authenticate, controller.getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), controller.updateProfile);
router.post('/change-password', authenticate, validate(changePasswordSchema), controller.changePassword);
router.post('/logout', authenticate, controller.logout);

module.exports = router;
