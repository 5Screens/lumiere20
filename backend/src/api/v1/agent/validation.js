const Joi = require('joi');
const logger = require('../../../config/logger');

/**
 * Validation schema for chat message
 */
const chatMessageSchema = Joi.object({
  message: Joi.string()
    .min(1)
    .max(5000)
    .required()
    .messages({
      'string.empty': 'Message cannot be empty',
      'string.min': 'Message must be at least 1 character',
      'string.max': 'Message cannot exceed 5000 characters',
      'any.required': 'Message is required'
    }),
  
  conversationHistory: Joi.array()
    .items(
      Joi.object({
        role: Joi.string().valid('user', 'assistant', 'system').required(),
        content: Joi.string().required()
      })
    )
    .max(50) // Limit conversation history to 50 messages
    .optional()
    .messages({
      'array.max': 'Conversation history cannot exceed 50 messages'
    })
});

/**
 * Middleware to validate chat message
 */
const validateChatMessage = (req, res, next) => {
  logger.info('[AGENT VALIDATION] Validating chat message');

  const { error, value } = chatMessageSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    logger.warn('[AGENT VALIDATION] Validation failed:', errors);

    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  // Replace body with validated and sanitized value
  req.body = value;
  
  logger.info('[AGENT VALIDATION] Validation successful');
  next();
};

module.exports = {
  validateChatMessage
};
