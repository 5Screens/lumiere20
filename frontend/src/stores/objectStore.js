import { defineStore } from 'pinia'
import apiService from '@/services/apiService'
import i18n from '@/i18n'
import { useUserProfileStore } from '@/stores/userProfileStore'

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
    message: null,
    // Objet en cours d'édition dans le formulaire
    currentObject: null,
    // Type d'objet en cours d'édition (ex: 'TICKET', 'INCIDENT')
    currentObjectType: null,
    // Endpoint API pour l'objet en cours d'édition
    currentEndpoint: null,
    // Erreurs de validation pour l'objet en cours d'édition
    validationErrors: {}
  }),

  actions: {
    /**
     * Réinitialise le message
     */
    resetMessage() {
      this.message = null
    },

    /**
     * Initialise un nouvel objet pour édition
     * @param {string} type - Type d'objet (ex: 'TICKET', 'INCIDENT')
     * @param {Object} instance - Instance de l'objet
     * @param {string} endpoint - Endpoint API pour l'objet
     */
    initObjectForm(type, instance, endpoint) {
      console.info(`[ObjectStore] Initializing form for object type: ${type}`)
      this.currentObjectType = type
      this.currentObject = instance
      this.currentEndpoint = endpoint
      this.validationErrors = {}
      this.message = null
    },

    /**
     * Met à jour un champ de l'objet en cours d'édition
     * @param {string} fieldName - Nom du champ à mettre à jour
     * @param {any} value - Nouvelle valeur du champ
     */
    updateObjectField(fieldName, value) {
      console.info(`[ObjectStore] Updating field '${fieldName}' in current object`)
      if (this.currentObject) {
        this.currentObject[fieldName] = value
      }
    },

    /**
     * Réinitialise le formulaire
     */
    resetObjectForm() {
      console.info('[ObjectStore] Resetting form state')
      this.currentObject = null
      this.currentObjectType = null
      this.currentEndpoint = null
      this.validationErrors = {}
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
        
        // Utilise la méthode toAPI de l'objet si disponible, en spécifiant la méthode HTTP
        const apiData = data.toAPI ? data.toAPI('POST') : data
        console.info('[ObjectStore] Data prepared for API (after toAPI if available):', apiData)
        
        console.info(`[ObjectStore] Calling apiService.post with endpoint: ${type}`)
        // Appel API
        const response = await apiService.post(type, apiData)
        console.info('[ObjectStore] Received API response:', response)
        
        console.info('[ObjectStore] Setting success message')
        this.message = 'Création réussie'
        
        console.info('[ObjectStore] createObject completed successfully')
        // Retourner la réponse complète pour pouvoir accéder à l'UUID
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
     * Upload les fichiers en attente pour un objet nouvellement créé
     * @param {string} objectUuid - UUID de l'objet créé
     * @param {Array} files - Liste des fichiers à uploader
     * @param {string} objectType - Type d'objet (ex: 'KNOWLEDGE')
     * @returns {Promise<Array>} - Liste des fichiers uploadés
     */
    async uploadPendingAttachments(objectUuid, files, objectType) {
      try {
        console.info(`[ObjectStore] BISOUS Uploading ${files.length} pending attachments for object ${objectUuid}`)
        console.info('[ObjectStore] FormData content: objectType:', objectType)
        console.info('[ObjectStore] FormData content: objectUuid:', objectUuid)
        
        if (!files.length || !objectUuid) {
          console.warn('[ObjectStore] No files to upload or missing objectUuid')
          return []
        }
        
        // Préparer le FormData pour l'upload multiple
        const formData = new FormData()
        files.forEach(file => {
          formData.append('files', file)
        })
        formData.append('objectType', objectType)
        formData.append('objectUuid', objectUuid)
        formData.append('uploadedBy', this.currentObject.writer_uuid) // Ajouter l'ID de l'utilisateur connecté
        
        // Logs pour vérifier le contenu du FormData
        console.info('[ObjectStore] FormData content: objectType:', objectType)
        console.info('[ObjectStore] FormData content: objectUuid:', objectUuid)
        console.info('[ObjectStore] FormData content: uploadedBy:', this.currentObject.writer_uuid)
        
        // Appeler le service API pour l'upload
        const response = await apiService.uploadFormData('attachments/upload-multiple', formData)
        console.info('[ObjectStore] Attachments uploaded successfully:', response)
        
        return response.attachments || []
      } catch (error) {
        console.error('[ObjectStore] Error uploading attachments:', error)
        this.message = `Erreur lors de l'upload des pièces jointes: ${error.message}`
        return []
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
        
        // Utilise la méthode toAPI de l'objet si disponible, en spécifiant la méthode HTTP
        const apiData = data.toAPI ? data.toAPI('PUT') : data
        
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
        
        // Prépare les données pour le PATCH, en utilisant toAPI si disponible
        const patchValue = data.toAPI ? data.toAPI('PATCH') : data[fieldName]
        const patchData = { [fieldName]: patchValue }
        
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
        this.deleting = true
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
        this.deleting = false
      }
    },

    /**
     * Vérifie si tous les champs requis sont remplis pour l'objet en cours d'édition
     * @returns {boolean} - true si tous les champs requis sont remplis, false sinon
     */
    checkRequiredFields() {
      console.info('[ObjectStore] Checking required fields for current object')
      
      if (!this.currentObject || !this.currentObjectType) {
        console.warn('[ObjectStore] No current object or object type to check required fields')
        this.message = 'Erreur: Aucun objet à valider'
        return false
      }
      
      // Récupère les champs requis de l'objet
      console.info('[ObjectStore] Current object type:', this.currentObjectType)
      console.info('[ObjectStore] Current object:', this.currentObject)
      
      let requiredFields = this.currentObject.requiredFields
      console.info('[ObjectStore] Found required fields:', requiredFields)
      
      // Si requiredFields n'est pas défini ou n'est pas un tableau, on utilise un tableau vide
      if (!requiredFields || !Array.isArray(requiredFields) || requiredFields.length === 0) {
        console.warn('[ObjectStore] No required fields defined for this object type, using default validation')
        // Créer une liste de champs requis basée sur les propriétés du modèle
        requiredFields = [
          { name: 'title', label: i18n.global.t(`${this.currentObjectType.toLowerCase()}.title`) },
          { name: 'ticket_status_code', label: i18n.global.t(`${this.currentObjectType.toLowerCase()}.status`) }
        ]
        console.info('[ObjectStore] Using default required fields:', requiredFields)
      }
      
      let missingFields = []
      
      try {
        // Vérifier si chaque champ requis est rempli
        requiredFields.forEach(field => {
          console.info(`[ObjectStore] Checking field '${field.name}' with value:`, this.currentObject[field.name])
          const value = this.currentObject[field.name]
          
          // Vérifier si la valeur est vide (null, undefined, chaîne vide, ou tableau vide)
          if (value === null || value === undefined || value === '' || 
              (Array.isArray(value) && value.length === 0)) {
            console.warn(`[ObjectStore] Required field '${field.name}' is empty`)
            missingFields.push(field)
            
            // Ajouter une erreur de validation pour ce champ
            this.validationErrors[field.name] = `Le champ "${field.label}" est requis`
          }
        })
        
        if (missingFields.length > 0) {
          console.warn(`[ObjectStore] ${missingFields.length} required fields are missing:`, missingFields)
          
          // Construire un message d'erreur avec la liste des champs manquants
          const fieldLabels = missingFields.map(f => f.label).join(', ')
          this.message = `${i18n.global.t('errors.identificationLabel')} - ${i18n.global.t('errors.requiredFields')} ${fieldLabels}`
          
          return false
        }
        
        console.info('[ObjectStore] All required fields are filled')
        return true
        
      } catch (error) {
        console.error('[ObjectStore] Error checking required fields:', error)
        this.message = `Erreur lors de la validation: ${error.message}`
        return false
      }
    }
  },

  getters: {
    /**
     * Indique si une opération est en cours
     */
    isProcessing: (state) => state.creating || state.loading || state.updating || state.deleting,
    
    /**
     * Retourne le message courant
     */
    currentMessage: (state) => state.message,

    /**
     * Vérifie si un champ a une erreur de validation
     */
    hasFieldError: (state) => (fieldName) => {
      return state.validationErrors[fieldName] !== undefined
    },

    /**
     * Retourne l'erreur de validation pour un champ
     */
    getFieldError: (state) => (fieldName) => {
      return state.validationErrors[fieldName]
    }
  }
})
