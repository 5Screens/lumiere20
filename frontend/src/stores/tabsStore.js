import { defineStore } from 'pinia'

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
  }),

  actions: {
    /**
     * Ouvre un nouvel onglet et l'active
     * @param {Object} tab - Données de l'onglet à ouvrir
     */
    openTab(tab) {
      const newTab = {
        ...tab,
        id_tab: Date.now(),
        timestamp: new Date().toISOString(),
      }
      
      // Si c'est un onglet enfant
      if (tab.parentId) {
        // Vérifie si l'onglet parent existe
        const parentExists = this.tabs.some(t => t.id_tab === tab.parentId)
        if (!parentExists) return

        this.activeChildTabId = newTab.id_tab
        this.activeTabId = tab.parentId
      } else {
        // Pour un onglet parent
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

      this.tabs.splice(tabIndex, 1)
    },

    /**
     * Ferme tous les onglets enfants d'un parent donné
     * @param {number} parentId - ID de l'onglet parent
     */
    closeChildTabs(parentId) {
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
     */
    switchTab(id_tab) {
      const tab = this.tabs.find(t => t.id_tab === id_tab && !t.parentId)
      if (tab) {
        this.activeTabId = id_tab
        this.activeChildTabId = null
      }
    },

    /**
     * Active un onglet enfant existant
     * @param {number} id_tab - ID de l'onglet enfant à activer
     */
    switchChildTab(id_tab) {
      const childTab = this.tabs.find(t => t.id_tab === id_tab && t.parentId)
      if (childTab) {
        this.activeChildTabId = id_tab
        this.activeTabId = childTab.parentId
      }
    }
  },

  getters: {
    /**
     * Retourne les onglets parents
     */
    parentTabs: (state) => state.tabs.filter(tab => !tab.parentId),

    /**
     * Retourne les onglets enfants de l'onglet parent actif
     */
    activeChildTabs: (state) => state.tabs.filter(tab => tab.parentId === state.activeTabId),

    /**
     * Retourne l'onglet parent actif
     */
    activeTab: (state) => state.tabs.find(tab => tab.id_tab === state.activeTabId),

    /**
     * Retourne l'onglet enfant actif
     */
    activeChildTab: (state) => state.tabs.find(tab => tab.id_tab === state.activeChildTabId)
  },

  persist: {
    key: 'tabs-store',
    storage: localStorage,
    paths: ['tabs', 'activeTabId', 'activeChildTabId']
  }
})
