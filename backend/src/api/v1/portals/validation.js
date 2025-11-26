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

// Schema for updating a portal
const updateSchema = {
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
        code: Joi.string()
            .pattern(/^[a-z0-9-]{2,50}$/)
            .optional()
            .messages({
                'string.pattern.base': 'Code must contain only lowercase letters, numbers and hyphens (2-50 characters)'
            }),
        name: Joi.string()
            .min(2)
            .max(150)
            .optional()
            .messages({
                'string.min': 'Name must be at least 2 characters',
                'string.max': 'Name cannot exceed 150 characters'
            }),
        base_url: Joi.string()
            .uri()
            .optional()
            .messages({
                'string.uri': 'Base URL must be a valid URI'
            }),
        thumbnail_url: Joi.string()
            .uri()
            .optional()
            .allow(null, '')
            .messages({
                'string.uri': 'Thumbnail URL must be a valid URI'
            }),
        view_component: Joi.string()
            .max(50)
            .optional()
            .messages({
                'string.max': 'View component cannot exceed 50 characters'
            }),
        title: Joi.string()
            .max(150)
            .optional()
            .allow(null, '')
            .messages({
                'string.max': 'Title cannot exceed 150 characters'
            }),
        subtitle: Joi.string()
            .max(255)
            .optional()
            .allow(null, '')
            .messages({
                'string.max': 'Subtitle cannot exceed 255 characters'
            }),
        welcome_template: Joi.string()
            .max(255)
            .optional()
            .allow(null, '')
            .messages({
                'string.max': 'Welcome template cannot exceed 255 characters'
            }),
        logo_url: Joi.string()
            .uri()
            .optional()
            .allow(null, '')
            .messages({
                'string.uri': 'Logo URL must be a valid URI'
            }),
        theme_primary_color: Joi.string()
            .pattern(/^#[0-9A-Fa-f]{6}$/)
            .optional()
            .allow(null, '')
            .messages({
                'string.pattern.base': 'Primary color must be a valid hex color (e.g., #FF6B00)'
            }),
        theme_secondary_color: Joi.string()
            .pattern(/^#[0-9A-Fa-f]{6}$/)
            .optional()
            .allow(null, '')
            .messages({
                'string.pattern.base': 'Secondary color must be a valid hex color (e.g., #111111)'
            }),
        show_chat: Joi.boolean()
            .optional()
            .messages({
                'boolean.base': 'show_chat must be a boolean'
            }),
        show_alerts: Joi.boolean()
            .optional()
            .messages({
                'boolean.base': 'show_alerts must be a boolean'
            }),
        chat_default_message: Joi.string()
            .optional()
            .allow(null, '')
            .messages({
                'string.base': 'Chat default message must be a string'
            })
    }).options({ 
        abortEarly: false,
        stripUnknown: true 
    })
};

// Schema for checking code uniqueness
const checkCodeSchema = {
    query: Joi.object({
        code: Joi.string()
            .pattern(/^[a-z0-9-]{2,50}$/)
            .required()
            .messages({
                'string.pattern.base': 'Code must contain only lowercase letters, numbers and hyphens (2-50 characters)',
                'any.required': 'Code is required'
            }),
        exclude_uuid: Joi.string()
            .uuid()
            .optional()
            .messages({
                'string.guid': 'exclude_uuid must be a valid UUID'
            })
    }).options({ 
        abortEarly: false,
        stripUnknown: true 
    })
};

// Schema for getting a portal by UUID
const getByUuidSchema = {
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
    getActionsSchema,
    updateSchema,
    checkCodeSchema,
    getByUuidSchema
};
