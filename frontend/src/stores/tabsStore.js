import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'

/**
 * Store pour la gestion des onglets hiérarchiques
 * Utilise pinia-plugin-persistedstate pour la persistance dans localStorage
 */
export const useTabsStore = defineStore('tabs', {
  state: () => ({
    // Liste des onglets ouverts
    tabs: [],
    // ID de l'onglet parent actif
    activeTabId: null,
    // ID de l'onglet enfant actif
    activeChildTabId: null,
    // Objets en cours de création/modification
    objectsInEditing: {},
    // Message d'information ou d'erreur
    message: null,
    // Nous n'utilisons plus le suivi des entités chargées
  }),
  
  actions: {
    /**
     * Définit un message de notification
     * @param {string} message - Message à afficher
     */
    setMessage(message) {
      console.log('[TabsStore] Définition du message:', message)
      this.message = message
    },

    /**
     * Réinitialise le message
     */
    resetMessage() {
      console.log('[TabsStore] Réinitialisation du message')
      this.message = null
    },

    /**
     * Définit un objet en cours de création/modification
     * @param {string} tabId - ID de l'onglet
     * @param {Object} objectData - Données de l'objet
     */
    setObjectInEditing(tabId, objectData) {
      console.log('[TabsStore] Exécution de setObjectInEditing()', tabId, objectData)
      this.objectsInEditing[tabId] = objectData
    },

    /**
     * Met à jour un objet en cours de création/modification
     * @param {string} tabId - ID de l'onglet
     * @param {Object} objectData - Données de l'objet
     */
    updateObjectInEditing(tabId, objectData) {
      console.log('[TabsStore] Exécution de updateObjectInEditing()', tabId, objectData)
      if (this.objectsInEditing[tabId]) {
        this.objectsInEditing[tabId] = {
          ...this.objectsInEditing[tabId],
          data: objectData.data
        }
      } else {
        this.setObjectInEditing(tabId, objectData)
      }
    },

    /**
     * Supprime un objet en cours de création/modification
     * @param {string} tabId - ID de l'onglet
     */
    removeObjectInEditing(tabId) {
      console.log('[TabsStore] Exécution de removeObjectInEditing()', tabId)
      if (this.objectsInEditing[tabId]) {
        delete this.objectsInEditing[tabId]
      }
    },

    /**
     * Récupère un objet en cours de création/modification
     * @param {string} tabId - ID de l'onglet
     * @returns {Object|null} - Données de l'objet ou null si non trouvé
     */
    getObjectInEditing(tabId) {
      return this.objectsInEditing[tabId] || null
    },
    
    /**
     * Ouvre un nouvel onglet et l'active
     * @param {Object} tab - Données de l'onglet à ouvrir
     */
    openTab(tab) {
      console.log('[TabsStore] Exécution de openTab()', tab)
      const newTab = {
        ...tab,
        id_tab: uuidv4(),
        timestamp: new Date().toISOString(),
        loaded: false, // Nouveau champ pour indiquer si l'onglet est chargé
        isActive: false // Indique si l'onglet est actif
      }
      
      // Si c'est un onglet enfant
      if (tab.parentId) {
        // Vérifie si l'onglet parent existe
        const parentExists = this.tabs.some(t => t.id_tab === tab.parentId)
        if (!parentExists) return

        // Désactiver tous les onglets
        this.tabs.forEach(t => t.isActive = false)
        
        // Activer le nouvel onglet mais PAS son parent
        newTab.isActive = true
        this.activeChildTabId = newTab.id_tab
        this.activeTabId = tab.parentId
        
        // L'onglet parent ne doit pas être marqué comme actif
        // car c'est l'onglet enfant qui est affiché
        const parentTab = this.tabs.find(t => t.id_tab === tab.parentId)
        if (parentTab) parentTab.isActive = false
      } else {
        // Pour un onglet parent
        // Désactiver tous les onglets
        this.tabs.forEach(t => t.isActive = false)
        
        // Activer le nouvel onglet
        newTab.isActive = true
        this.activeTabId = newTab.id_tab
        this.activeChildTabId = null
      }

      this.tabs.push(newTab)
    },

    /**
     * Ferme un onglet et ses enfants éventuels
     * @param {number} id_tab - ID de l'onglet à fermer
     */
    closeTab(id_tab) {
      console.log('[TabsStore] Exécution de closeTab()', id_tab)
      // Ferme d'abord les onglets enfants
      this.closeChildTabs(id_tab)

      const tabIndex = this.tabs.findIndex(t => t.id_tab === id_tab)
      if (tabIndex === -1) return

      // Si on ferme l'onglet actif, active l'onglet précédent
      if (this.activeTabId === id_tab) {
        const remainingTabs = this.tabs.filter(t => !t.parentId)
        const prevTab = remainingTabs[remainingTabs.length - 2]
        this.activeTabId = prevTab ? prevTab.id_tab : null
        this.activeChildTabId = null
      }

      // Supprimer les données de l'objet en cours d'édition
      this.removeObjectInEditing(id_tab)

      this.tabs.splice(tabIndex, 1)
    },

    /**
     * Ferme tous les onglets enfants d'un parent donné
     * @param {number} parentId - ID de l'onglet parent
     */
    closeChildTabs(parentId) {
      console.log('[TabsStore] Exécution de closeChildTabs()', parentId)
      this.tabs = this.tabs.filter(tab => tab.parentId !== parentId)
      if (this.activeChildTabId) {
        const childStillExists = this.tabs.some(t => t.id_tab === this.activeChildTabId)
        if (!childStillExists) {
          this.activeChildTabId = null
        }
      }
    },

    /**
     * Active un onglet parent existant
     * @param {number} id_tab - ID de l'onglet à activer
     * @returns {boolean} - true si l'onglet était déjà actif, false sinon
     */
    switchTab(id_tab) {
      console.log('[TabsStore] Exécution de switchTab()', id_tab)
      const tab = this.tabs.find(t => t.id_tab === id_tab && !t.parentId)
      if (tab) {
        // Vérifie si l'onglet est déjà actif ET qu'aucun onglet enfant n'est actif
        if (this.activeTabId === id_tab && !this.activeChildTabId && tab.isActive) {
          console.info(`[TabsStore] Onglet parent déjà actif : ${id_tab}, pas de réinitialisation.`)
          return true // L'onglet était déjà actif et aucun enfant n'est actif
        }
        
        // Mettre à jour l'état actif pour tous les onglets
        this.tabs.forEach(t => {
          // Si on active un onglet parent, désactiver tous les autres onglets
          // L'onglet parent est actif uniquement s'il n'a pas d'enfant actif
          t.isActive = (t.id_tab === id_tab && !t.parentId && !this.activeChildTabId)
        })
        
        this.activeTabId = id_tab
        this.activeChildTabId = null
        return false // L'onglet n'était pas actif avant
      }
      return false
    },

    /**
     * Active un onglet enfant existant
     * @param {number} id_tab - ID de l'onglet enfant à activer
     * @returns {boolean} - true si l'onglet était déjà actif, false sinon
     */
    switchChildTab(id_tab) {
      console.log('[TabsStore] Exécution de switchChildTab()', id_tab)
      const childTab = this.tabs.find(t => t.id_tab === id_tab && t.parentId)
      if (childTab) {
        // Vérifie si l'onglet est déjà actif
        if (this.activeChildTabId === id_tab && childTab.isActive) {
          console.info(`[TabsStore] Onglet enfant déjà actif : ${id_tab}, pas de réinitialisation.`)
          return true // L'onglet était déjà actif
        }
        
        // Mettre à jour l'état actif pour tous les onglets
        this.tabs.forEach(t => {
          // Seul l'onglet enfant est actif, l'onglet parent ne doit PAS être actif
          t.isActive = (t.id_tab === id_tab && t.parentId)
          // L'onglet parent est désactivé car c'est l'enfant qui est affiché
        })
        
        this.activeChildTabId = id_tab
        this.activeTabId = childTab.parentId
        return false // L'onglet n'était pas actif avant
      }
      return false
    },

    /**
     * Marque un onglet comme chargé
     * @param {string} id_tab - ID de l'onglet à marquer comme chargé
     */
    markTabAsLoaded(id_tab) {
      console.log('[TabsStore] Exécution de markTabAsLoaded()', id_tab)
      const tab = this.tabs.find(t => t.id_tab === id_tab);
      if (tab) tab.loaded = true;
    },
    
    /**
     * Désactive tous les onglets enfants d'un parent donné
     * @param {string} parentId - ID de l'onglet parent
     */
    deactivateChildren(parentId) {
      console.log('[TabsStore] Exécution de deactivateChildren()', parentId)
      this.tabs.forEach(tab => {
        if (tab.parentId === parentId) {
          tab.isActive = false;
        }
      });
    },
    
    /**
     * Définit l'onglet actif et met à jour l'état isActive de tous les onglets
     * @param {string} tabId - ID de l'onglet à activer
     */
    setActiveTab(tabId) {
      console.log('[TabsStore] Exécution de setActiveTab()', tabId)
      const tab = this.tabs.find(t => t.id_tab === tabId);
      
      if (!tab) return;
      
      // Mettre à jour l'état isActive pour tous les onglets
      this.tabs.forEach(t => {
        if (tab.parentId) {
          // Si c'est un onglet enfant qu'on active, SEUL l'onglet enfant est actif
          // L'onglet parent ne doit PAS être actif car c'est l'enfant qui est affiché
          t.isActive = (t.id_tab === tabId);
        } else {
          // Si c'est un onglet parent qu'on active
          t.isActive = (t.id_tab === tabId);
        }
      });
      
      // Mettre à jour les IDs actifs
      if (tab.parentId) {
        this.activeChildTabId = tabId;
        this.activeTabId = tab.parentId;
      } else {
        this.activeTabId = tabId;
        this.activeChildTabId = null;
      }
    },

    /**
     * Vérifie si un onglet est chargé
     * @param {string} id_tab - ID de l'onglet à vérifier
     * @returns {boolean} - true si l'onglet est chargé, false sinon
     */
    isTabLoaded(id_tab) {
      console.log('[TabsStore] Exécution de isTabLoaded()', id_tab)
      const tab = this.tabs.find(t => t.id_tab === id_tab);
      return tab ? tab.loaded : false;
    }
  },

  getters: {
    /**
     * Retourne le message courant
     */
    currentMessage(state) {
      return state.message
    },
    /**
     * Retourne les onglets parents
     */
    parentTabs: (state) => state.tabs.filter(tab => !tab.parentId),

    /**
     * Retourne les onglets enfants de l'onglet parent actif
     */
    activeChildTabs: (state) => state.tabs.filter(tab => tab.parentId === state.activeTabId),
    
    /**
     * Indique si un onglet parent est réellement actif (affiché)
     * Un onglet parent n'est réellement actif que s'il n'a pas d'onglet enfant actif
     */
    isParentTabActive: (state) => (tabId) => {
      return state.activeTabId === tabId && !state.activeChildTabId;
    },

    /**
     * Retourne l'onglet parent actif
     */
    activeTab: (state) => state.tabs.find(tab => tab.id_tab === state.activeTabId),

    /**
     * Retourne l'onglet enfant actif
     */
    activeChildTab: (state) => state.tabs.find(tab => tab.id_tab === state.activeChildTabId),
    
    /**
     * Retourne l'onglet actif (parent ou enfant)
     */
    getActiveTab: (state) => {
      console.log('[TabsStore] Exécution de getActiveTab getter')
      if (state.activeChildTabId) {
        return state.tabs.find(tab => tab.id_tab === state.activeChildTabId)
      }
      return state.tabs.find(tab => tab.id_tab === state.activeTabId)
    }
  },

  persist: {
    key: 'tabs-store',
    storage: localStorage,
    paths: ['tabs', 'activeTabId', 'activeChildTabId', 'objectsInEditing']
  }
})
