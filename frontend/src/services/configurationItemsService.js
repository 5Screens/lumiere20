import apiService from './apiService';

/**
 * Service for Configuration Items CRUD operations
 */
const configurationItemsService = {
  /**
   * Get all configuration items with pagination and filters
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Paginated configuration items
   */
  async getAll(options = {}) {
    const params = {
      search: options.search || '',
      ci_type: options.ci_type || null,
      page: options.page || 1,
      limit: options.limit || 50,
      sortBy: options.sortBy || 'name',
      sortDirection: options.sortDirection || 'asc'
    };
    
    return await apiService.get('configuration_items', params);
  },

  /**
   * Get configuration item by UUID
   * @param {string} uuid - Configuration item UUID
   * @returns {Promise<Object>} - Configuration item details
   */
  async getById(uuid) {
    return await apiService.get(`configuration_items/${uuid}`);
  },

  /**
   * Create new configuration item
   * @param {Object} data - Configuration item data
   * @returns {Promise<Object>} - Created configuration item
   */
  async create(data) {
    return await apiService.post('configuration_items', data);
  },

  /**
   * Update configuration item
   * @param {string} uuid - Configuration item UUID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} - Updated configuration item
   */
  async update(uuid, data) {
    return await apiService.patch(`configuration_items/${uuid}`, data);
  },

  /**
   * Delete configuration item
   * @param {string} uuid - Configuration item UUID
   * @returns {Promise<void>}
   */
  async delete(uuid) {
    return await apiService.delete(`configuration_items/${uuid}`);
  },

  /**
   * Get CI type schemas
   * @returns {Promise<Object>} - CI type schemas
   */
  async getSchemas() {
    return await apiService.get('configuration_items/schemas');
  }
};

export default configurationItemsService;
