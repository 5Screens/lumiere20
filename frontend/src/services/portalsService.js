// services/portalsService.js
import apiService from './apiService';

/**
 * Service API pour la gestion des portails
 */
export const portalsService = {
  /**
   * Récupère la liste des portails
   * @param {Object} params - Paramètres de requête (is_active, q)
   * @returns {Promise<Array>} - Liste des portails
   */
  async listPortals(params = {}) {
    try {
      console.info('[PORTALS SERVICE] Fetching portals list', params);
      const data = await apiService.get('portals', params);
      console.info('[PORTALS SERVICE] Portals fetched successfully', data);
      return data;
    } catch (error) {
      console.error('[PORTALS SERVICE] Error fetching portals:', error);
      throw error;
    }
  },

  /**
   * Active ou désactive un portail
   * @param {string} uuid - UUID du portail
   * @param {boolean} is_active - Nouvel état d'activation
   * @returns {Promise<Object>} - Portail mis à jour
   */
  async activatePortal(uuid, is_active) {
    try {
      console.info(`[PORTALS SERVICE] Activating portal ${uuid}:`, is_active);
      const data = await apiService.patch(`portals/${uuid}/activate`, { is_active });
      console.info('[PORTALS SERVICE] Portal activation updated successfully', data);
      return data;
    } catch (error) {
      console.error('[PORTALS SERVICE] Error activating portal:', error);
      throw error;
    }
  },

  /**
   * Récupère les actions disponibles pour un portail
   * @param {string} uuid - UUID du portail
   * @returns {Promise<Array>} - Liste des actions
   */
  async listPortalActions(uuid) {
    try {
      console.info(`[PORTALS SERVICE] Fetching actions for portal ${uuid}`);
      const data = await apiService.get(`portals/${uuid}/actions`);
      console.info('[PORTALS SERVICE] Portal actions fetched successfully', data);
      return data;
    } catch (error) {
      console.error('[PORTALS SERVICE] Error fetching portal actions:', error);
      throw error;
    }
  }
};

export default portalsService;
