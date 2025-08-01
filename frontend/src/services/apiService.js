// services/apiService.js
import { API_BASE_URL } from '@/config/config';
import { useTabsStore } from '@/stores/tabsStore';

/**
 * Service pour gérer les appels API
 * Centralise la logique de gestion des erreurs et des requêtes
 */
export default {
  /**
   * Effectue une requête GET
   * @param {string} endpoint - Point d'accès API (sans l'URL de base)
   * @param {Object} params - Paramètres de requête (optionnel)
   * @returns {Promise<any>} - Données de réponse
   */
  async get(endpoint, params = {}) {
    try {
      // Construire l'URL avec les paramètres de requête
      const url = new URL(`${API_BASE_URL}/${endpoint}`);
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          url.searchParams.append(key, params[key]);
        }
      });

      // Log request details
      console.info(`[API Request] GET ${url.toString()}`);
      if (Object.keys(params).length > 0) {
        console.info('[API Request] Query params:', params);
      }

      const response = await fetch(url.toString());
      
      // Log response status
      console.info(`[API Response] GET ${endpoint} - Status: ${response.status}`);
      
      // Vérifier si la réponse est OK (statut 2xx)
      if (!response.ok) {
        throw await this.handleErrorResponse(response);
      }
      
      const data = await response.json();
      console.info(`[API Response] GET ${endpoint} - Success`);
      return data;
    } catch (error) {
      console.error(`[API Error] GET ${endpoint}:`, error);
      const tabsStore = useTabsStore()
      tabsStore.setMessage('Error getting ' + endpoint + ' : ' + error.message)
      throw error;
    }
  },

  /**
   * Effectue une requête POST
   * @param {string} endpoint - Point d'accès API (sans l'URL de base)
   * @param {Object} data - Données à envoyer
   * @returns {Promise<any>} - Données de réponse
   */
  async post(endpoint, data = {}) {
    try {
      // Log request details
      console.info(`[API Request] POST ${API_BASE_URL}/${endpoint}`);
      console.info('[API Request] Request body:', JSON.stringify(data, null, 2));
      
      const startTime = performance.now();
      console.info(`[API Request] POST request started at: ${new Date().toISOString()}`);
      
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const endTime = performance.now();
      console.info(`[API Response] POST ${endpoint} - Request took ${(endTime - startTime).toFixed(2)}ms`);
      console.info(`[API Response] POST ${endpoint} - Status: ${response.status}`);
      
      // Vérifier si la réponse est OK (statut 2xx)
      if (!response.ok) {
        console.error(`[API Error] POST ${endpoint} - Failed with status: ${response.status}`);
        throw await this.handleErrorResponse(response);
      }
      
      const responseData = await response.json();
      console.info(`[API Response] POST ${endpoint} - Success`);
      console.info('[API Response] Response data:', responseData);
      
      return responseData;
    } catch (error) {
      console.error(`[API Error] POST ${endpoint}:`, error);
      const tabsStore = useTabsStore()
      tabsStore.setMessage('Error posting ' + endpoint + ' : ' + error.message)
      throw error;
    }
  },

  /**
   * Effectue une requête PUT
   * @param {string} endpoint - Point d'accès API (sans l'URL de base)
   * @param {Object} data - Données à envoyer
   * @returns {Promise<any>} - Données de réponse
   */
  async put(endpoint, data = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      // Vérifier si la réponse est OK (statut 2xx)
      if (!response.ok) {
        throw await this.handleErrorResponse(response);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Erreur lors de la requête PUT à ${endpoint}:`, error);
      const tabsStore = useTabsStore()
      tabsStore.setMessage('Error putting ' + endpoint + ' : ' + error.message)
      throw error;
    }
  },

  /**
   * Effectue une requête DELETE
   * @param {string} endpoint - Point d'accès API (sans l'URL de base)
   * @returns {Promise<any>} - Données de réponse
   */
  async delete(endpoint) {
    try {
      // Log request details
      console.info(`[API Request] DELETE ${API_BASE_URL}/${endpoint}`);

      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'DELETE'
      });
      
      // Log response status
      console.info(`[API Response] DELETE ${endpoint} - Status: ${response.status}`);
      
      // Vérifier si la réponse est OK (statut 2xx)
      if (!response.ok) {
        throw await this.handleErrorResponse(response);
      }
      
      const responseData = await response.json();
      console.info(`[API Response] DELETE ${endpoint} - Success`);
      return responseData;
    } catch (error) {
      console.error(`[API Error] DELETE ${endpoint}:`, error);
      const tabsStore = useTabsStore()
      tabsStore.setMessage('Error deleting ' + endpoint + ' : ' + error.message)
      throw error;
    }
  },

  /**
   * Performs a PATCH request with data in the request body
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {Object} data - Data to be sent in the request body
   * @returns {Promise<any>} - Response data
   */
  async patch(endpoint, data = {}) {
    try {
      // Log request details
      console.info(`[API Request] PATCH ${API_BASE_URL}/${endpoint}`);
      console.info('[API Request] Body:', data);

      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      // Log response status
      console.info(`[API Response] PATCH ${endpoint} - Status: ${response.status}`);
      
      // Check if response is OK (2xx status)
      if (!response.ok) {
        throw await this.handleErrorResponse(response);
      }
      
      const responseData = await response.json();
      console.info(`[API Response] PATCH ${endpoint} - Success`);
      return responseData;
    } catch (error) {
      console.error(`[API Error] PATCH ${endpoint}:`, error);
      const tabsStore = useTabsStore()
      tabsStore.setMessage('Error patching ' + endpoint + ' : ' + error.message)
      throw error;
    }
  },

  /**
   * Gère les réponses d'erreur de l'API
   * @param {Response} response - Réponse de l'API
   * @returns {Error} - Erreur avec message approprié
   */
  async handleErrorResponse(response) {
    let errorMessage;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || `Erreur ${response.status}`;
    } catch (e) {
      // Si on ne peut pas parser la réponse JSON, utiliser un message basé sur le code HTTP
      errorMessage = this.getHttpErrorMessage(response.status);
    }
    
    return new Error(errorMessage);
  },

  /**
   * Obtient un message d'erreur basé sur le code HTTP
   * @param {number} statusCode - Code de statut HTTP
   * @returns {string} - Message d'erreur
   */
  getHttpErrorMessage(statusCode) {
    switch (statusCode) {
      case 400:
        return 'Requête incorrecte';
      case 401:
        return 'Non autorisé';
      case 403:
        return 'Accès interdit';
      case 404:
        return 'Ressource non trouvée';
      case 409:
        return 'Conflit avec l\'état actuel de la ressource';
      case 422:
        return 'Entité non traitable';
      case 500:
        return 'Erreur interne du serveur';
      case 503:
        return 'Service indisponible';
      default:
        return `Erreur HTTP ${statusCode}`;
    }
  },
  
  /**
   * Upload des fichiers avec FormData
   * @param {string} endpoint - Point d'accès API (sans l'URL de base)
   * @param {FormData} formData - Données du formulaire contenant les fichiers
   * @returns {Promise<any>} - Données de réponse
   */
  async uploadFormData(endpoint, formData) {
    try {
      // Log request details
      console.info(`[API Request] POST FormData ${API_BASE_URL}/${endpoint}`);
      
      const startTime = performance.now();
      console.info(`[API Request] FormData upload started at: ${new Date().toISOString()}`);
      
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        // Ne pas définir Content-Type ici, le navigateur le fera avec la boundary correcte
        body: formData
      });
      
      const endTime = performance.now();
      console.info(`[API Response] POST FormData ${endpoint} - Request took ${(endTime - startTime).toFixed(2)}ms`);
      console.info(`[API Response] POST FormData ${endpoint} - Status: ${response.status}`);
      
      // Vérifier si la réponse est OK (statut 2xx)
      if (!response.ok) {
        console.error(`[API Error] POST FormData ${endpoint} - Failed with status: ${response.status}`);
        throw await this.handleErrorResponse(response);
      }
      
      const responseData = await response.json();
      console.info(`[API Response] POST FormData ${endpoint} - Success`);
      
      return responseData;
    } catch (error) {
      console.error(`[API Error] POST FormData ${endpoint}:`, error);
      const tabsStore = useTabsStore()
      tabsStore.setMessage('Error uploading to ' + endpoint + ' : ' + error.message)
      throw error;
    }
  }
};