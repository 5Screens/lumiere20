const service = require('./service');
const logger = require('../../../config/logger');

/**
 * GET /api/v1/global-search
 * Search across all object types
 * Query params:
 *   - q: search query (required, min 2 chars)
 *   - limit: max results per type (optional, default 5)
 */
const search = async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;
    const locale = req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';

    if (!q || q.length < 2) {
      return res.status(400).json({
        error: 'Query parameter "q" is required and must be at least 2 characters',
      });
    }

    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 5, 1), 10);

    const result = await service.globalSearch(q, limitNum, locale);

    return res.json(result);
  } catch (error) {
    logger.error('[GLOBAL-SEARCH] Controller error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  search,
};
