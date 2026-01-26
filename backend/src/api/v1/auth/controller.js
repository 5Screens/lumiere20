const authService = require('./service');
const logger = require('../../../config/logger');

/**
 * Register a new user
 */
const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.uuid);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = await authService.updateProfile(req.user.uuid, req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 */
const changePassword = async (req, res, next) => {
  try {
    await authService.changePassword(req.user.uuid, req.body);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout (client-side token removal, but we can log it)
 */
const logout = async (req, res, next) => {
  try {
    logger.info(`User logged out: ${req.user?.email || 'unknown'}`);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout
};
