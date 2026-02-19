const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../../config/prisma');
const authConfig = require('../../../config/auth');
const logger = require('../../../config/logger');

/**
 * Register a new user
 * @param {Object} data - User data
 * @returns {Promise<Object>} - Created user (without password)
 */
const register = async (data) => {
  const { email, password, first_name, last_name } = data;

  // Check if user already exists
  const existingUser = await prisma.persons.findFirst({
    where: { email: email.toLowerCase() }
  });

  if (existingUser) {
    const error = new Error('User with this email already exists');
    error.statusCode = 409;
    throw error;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, authConfig.saltRounds);

  // Create user
  const user = await prisma.persons.create({
    data: {
      email: email.toLowerCase(),
      password_hash: hashedPassword,
      first_name,
      last_name,
      is_active: true
    },
    select: {
      uuid: true,
      email: true,
      first_name: true,
      last_name: true,
      is_active: true,
      created_at: true
    }
  });

  logger.info(`User registered: ${user.email}`);
  return user;
};

/**
 * Login user
 * @param {Object} data - Login credentials
 * @returns {Promise<Object>} - User and token
 */
const login = async (data) => {
  const { email, password } = data;

  // Find user by email (include role relation to get role code)
  const user = await prisma.persons.findFirst({
    where: { email: email.toLowerCase() },
    include: { role_ref: true }
  });

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Check if user is active
  if (!user.is_active) {
    const error = new Error('Account is disabled');
    error.statusCode = 403;
    throw error;
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash || '');
  if (!isValidPassword) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Generate JWT token (use role code, not UUID)
  const roleCode = user.role_ref?.code || 'user';
  const token = jwt.sign(
    {
      uuid: user.uuid,
      email: user.email,
      role: roleCode
    },
    authConfig.jwtSecret,
    { expiresIn: authConfig.jwtExpiresIn }
  );

  // Update last login
  await prisma.persons.update({
    where: { uuid: user.uuid },
    data: { last_login: new Date() }
  });

  logger.info(`User logged in: ${user.email}`);

  return {
    user: {
      uuid: user.uuid,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: roleCode
    },
    token
  };
};

/**
 * Get current user profile
 * @param {string} uuid - User UUID
 * @returns {Promise<Object>} - User profile
 */
const getProfile = async (uuid) => {
  const user = await prisma.persons.findUnique({
    where: { uuid },
    select: {
      uuid: true,
      email: true,
      first_name: true,
      last_name: true,
      phone: true,
      is_active: true,
      role: true,
      role_ref: { select: { code: true, label: true } },
      created_at: true,
      last_login: true
    }
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return {
    ...user,
    role_code: user.role_ref?.code || null,
    role_label: user.role_ref?.label || null,
  };
};

/**
 * Update user profile
 * @param {string} uuid - User UUID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} - Updated user
 */
const updateProfile = async (uuid, data) => {
  const { first_name, last_name, phone } = data;

  const user = await prisma.persons.update({
    where: { uuid },
    data: {
      first_name,
      last_name,
      phone
    },
    select: {
      uuid: true,
      email: true,
      first_name: true,
      last_name: true,
      phone: true,
      is_active: true,
      role: true,
      role_ref: { select: { code: true, label: true } }
    }
  });

  logger.info(`User profile updated: ${user.email}`);
  return user;
};

/**
 * Change user password
 * @param {string} uuid - User UUID
 * @param {Object} data - Password data
 * @returns {Promise<void>}
 */
const changePassword = async (uuid, data) => {
  const { currentPassword, newPassword } = data;

  // Get user with password
  const user = await prisma.persons.findUnique({
    where: { uuid }
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash || '');
  if (!isValidPassword) {
    const error = new Error('Current password is incorrect');
    error.statusCode = 401;
    throw error;
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, authConfig.saltRounds);

  // Update password
  await prisma.persons.update({
    where: { uuid },
    data: { password_hash: hashedPassword }
  });

  logger.info(`Password changed for user: ${user.email}`);
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
};
