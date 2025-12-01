const { z } = require('zod');

/**
 * Validation middleware factory
 * Supports schemas with body, query, params keys or simple schemas
 * @param {z.ZodSchema} schema - Zod schema to validate against
 */
const validate = (schema) => {
  return (req, res, next) => {
    try {
      // Check if schema has body/query/params structure
      const schemaShape = schema._def?.shape?.();
      
      if (schemaShape?.body || schemaShape?.query || schemaShape?.params) {
        // Validate each part separately
        const result = schema.parse({
          body: req.body,
          query: req.query,
          params: req.params
        });
        
        // Update request with validated data
        if (result.body) req.body = result.body;
        if (result.query) req.query = result.query;
        if (result.params) req.params = result.params;
      } else {
        // Simple schema - validate body by default
        const result = schema.safeParse(req.body);
        if (!result.success) {
          console.log('[VALIDATE] Body received:', JSON.stringify(req.body, null, 2));
          console.log('[VALIDATE] Errors:', result.error.errors);
          return res.status(400).json({
            error: 'Validation error',
            details: result.error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          });
        }
        req.body = result.data;
      }
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
};

// Common validation schemas
const uuidSchema = z.string().uuid();

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

const sortSchema = z.object({
  sortField: z.string().optional().default('created_at'),
  sortOrder: z.coerce.number().int().min(-1).max(1).optional().default(1),
});

// PrimeVue filter schema
const primeVueFilterSchema = z.object({
  filters: z.record(z.any()).optional().default({}),
  sortField: z.string().optional().default('created_at'),
  sortOrder: z.coerce.number().int().optional().default(1),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
});

module.exports = {
  validate,
  uuidSchema,
  paginationSchema,
  sortSchema,
  primeVueFilterSchema,
};
