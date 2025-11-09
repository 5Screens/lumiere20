const Joi = require('joi');
const logger = require('../../../config/logger');

// Schema for creating a portal
const createSchema = {
    body: Joi.object({
        code: Joi.string()
            .pattern(/^[a-z0-9-]{2,50}$/)
            .required()
            .messages({
                'string.pattern.base': 'Code must contain only lowercase letters, numbers and hyphens (2-50 characters)',
                'any.required': 'Code is required',
                'string.empty': 'Code cannot be empty'
            }),
        name: Joi.string()
            .min(2)
            .max(150)
            .required()
            .messages({
                'string.min': 'Name must be at least 2 characters',
                'string.max': 'Name cannot exceed 150 characters',
                'any.required': 'Name is required',
                'string.empty': 'Name cannot be empty'
            }),
        base_url: Joi.string()
            .uri()
            .required()
            .messages({
                'string.uri': 'Base URL must be a valid URI',
                'any.required': 'Base URL is required',
                'string.empty': 'Base URL cannot be empty'
            }),
        thumbnail_url: Joi.string()
            .uri()
            .optional()
            .allow(null, '')
            .messages({
                'string.uri': 'Thumbnail URL must be a valid URI'
            })
    }).options({ 
        abortEarly: false,
        stripUnknown: true 
    })
};

// Schema for activating/deactivating a portal
const activateSchema = {
    params: Joi.object({
        uuid: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.guid': 'UUID must be a valid UUID',
                'any.required': 'UUID is required'
            })
    }),
    body: Joi.object({
        is_active: Joi.boolean()
            .required()
            .messages({
                'any.required': 'is_active is required',
                'boolean.base': 'is_active must be a boolean'
            })
    }).options({ 
        abortEarly: false,
        stripUnknown: true 
    })
};

// Schema for listing portals with query filters
const listQuerySchema = {
    query: Joi.object({
        is_active: Joi.boolean()
            .optional()
            .messages({
                'boolean.base': 'is_active must be a boolean'
            }),
        q: Joi.string()
            .optional()
            .allow('')
            .messages({
                'string.base': 'q must be a string'
            })
    }).options({ 
        abortEarly: false,
        stripUnknown: true 
    })
};

// Schema for getting actions of a portal
const getActionsSchema = {
    params: Joi.object({
        uuid: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.guid': 'UUID must be a valid UUID',
                'any.required': 'UUID is required'
            })
    })
};

module.exports = {
    createSchema,
    activateSchema,
    listQuerySchema,
    getActionsSchema
};
