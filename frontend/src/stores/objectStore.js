import { defineStore } from 'pinia'
import apiService from '@/services/apiService'

/**
 * Store pour la gestion des opérations CRUD sur les objets métier
 * Centralise la logique d'appel API et la gestion d'état
 */
export const useObjectStore = defineStore('object', {
  state: () => ({
    // Indique si une création est en cours
    creating: false,
    // Indique si un chargement est en cours
    loading: false,
    // Indique si une mise à jour est en cours
    updating: false,
    // Indique si une suppression est en cours
    deleting: false,
    // Message d'information ou d'erreur
    message: null
  }),

  actions: {
    /**
     * Réinitialise le message
     */
    resetMessage() {
      this.message = null
    },

    /**
     * Crée un nouvel objet via l'API
     * @param {string} type - Type d'objet (ex: 'tickets', 'defects')
     * @param {Object} data - Données de l'objet à créer
     * @returns {Promise<Object>} - Objet créé
     */
    async createObject(type, data) {
      try {
        console.info(`[ObjectStore] Starting createObject for type: ${type}`)
        console.info('[ObjectStore] Setting creating flag to true')
        this.creating = true
        this.message = null
        
        console.info('[ObjectStore] Original data object:', data)
        
        // Utilise la méthode toAPI de l'objet si disponible
        const apiData = data.toAPI ? data.toAPI() : data
        console.info('[ObjectStore] Data prepared for API (after toAPI if available):', apiData)
        
        console.info(`[ObjectStore] Calling apiService.post with endpoint: ${type}`)
        // Appel API
        const response = await apiService.post(type, apiData)
        console.info('[ObjectStore] Received API response:', response)
        
        console.info('[ObjectStore] Setting success message')
        this.message = 'Création réussie'
        
        console.info('[ObjectStore] createObject completed successfully')
        return response
      } catch (error) {
        console.error('[ObjectStore] Error in createObject:', error)
        this.message = `Erreur lors de la création: ${error.message}`
        throw error
      } finally {
        console.info('[ObjectStore] Setting creating flag to false')
        this.creating = false
      }
    },

    /**
     * Récupère un objet via l'API
     * @param {string} type - Type d'objet (ex: 'tickets', 'defects')
     * @param {Object} params - Paramètres de recherche
     * @returns {Promise<Object>} - Objet récupéré
     */
    async fetchObject(type, params) {
      try {
        this.loading = true
        this.message = null
        
        // Appel API
        const response = await apiService.get(type, params)
        
        // Utilise la méthode fromAPI de la classe de l'objet si disponible
        if (params && params.fromAPI && typeof params.fromAPI === 'function') {
          return params.fromAPI(response)
        }
        
        return response
      } catch (error) {
        this.message = `Erreur lors du chargement: ${error.message}`
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Met à jour un objet via l'API
     * @param {string} type - Type d'objet (ex: 'tickets', 'defects')
     * @param {Object} data - Données de l'objet à mettre à jour
     * @returns {Promise<Object>} - Objet mis à jour
     */
    async updateObject(type, data) {
      try {
        this.updating = true
        this.message = null
        
        // Utilise la méthode toAPI de l'objet si disponible
        const apiData = data.toAPI ? data.toAPI() : data
        
        // Construit l'endpoint avec l'UUID si disponible
        const endpoint = data.uuid ? `${type}/${data.uuid}` : type
        
        // Appel API
        const response = await apiService.put(endpoint, apiData)
        
        this.message = 'Mise à jour réussie'
        return response
      } catch (error) {
        this.message = `Erreur lors de la mise à jour: ${error.message}`
        throw error
      } finally {
        this.updating = false
      }
    },

    /**
     * Met à jour partiellement un objet via l'API (PATCH)
     * @param {string} type - Type d'objet (ex: 'tickets', 'defects')
     * @param {string} fieldName - Nom du champ à mettre à jour
     * @param {Object} data - Données à mettre à jour (doit contenir uuid)
     * @returns {Promise<Object>} - Objet mis à jour
     */
    async patchObject(type, fieldName, data) {
      try {
        this.updating = true
        this.message = null
        
        if (!data.uuid) {
          throw new Error('UUID requis pour l\'opération PATCH')
        }
        
        // Construit l'endpoint
        const endpoint = `${type}/${data.uuid}`
        
        // Prépare les données pour le PATCH
        const patchData = { [fieldName]: data[fieldName] }
        
        // Appel API
        const response = await apiService.patch(endpoint, patchData)
        
        this.message = 'Mise à jour partielle réussie'
        return response
      } catch (error) {
        this.message = `Erreur lors de la mise à jour partielle: ${error.message}`
        throw error
      } finally {
        this.updating = false
      }
    },

    /**
     * Supprime un objet via l'API
     * @param {string} type - Type d'objet (ex: 'tickets', 'defects')
     * @param {Object} data - Données de l'objet à supprimer (doit contenir uuid)
     * @returns {Promise<Object>} - Réponse de l'API
     */
    async deleteObject(type, data) {
      try {
        this.updating = true
        this.message = null
        
        if (!data.uuid) {
          throw new Error('UUID requis pour la suppression')
        }
        
        // Construit l'endpoint
        const endpoint = `${type}/${data.uuid}`
        
        // Appel API
        const response = await apiService.delete(endpoint)
        
        this.message = 'Suppression réussie'
        return response
      } catch (error) {
        this.message = `Erreur lors de la suppression: ${error.message}`
        throw error
      } finally {
        this.updating = false
      }
    }
  },

  getters: {
    /**
     * Indique si une opération est en cours
     */
    isProcessing: (state) => state.creating || state.loading || state.updating,
    
    /**
     * Retourne le message actuel
     */
    currentMessage: (state) => state.message
  }
})
