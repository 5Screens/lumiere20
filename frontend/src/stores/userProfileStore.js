import { defineStore } from 'pinia'

/**
 * Store pour la gestion du profil utilisateur et ses préférences
 */
export const useUserProfileStore = defineStore('userProfile', {
  state: () => ({
    // Identifiant unique de l'utilisateur
    id: null,
    // Nom complet de l'utilisateur
    name: '',
    // Liste des rôles de l'utilisateur (admin, editor, viewer, etc.)
    roles: [],
    // Thème de l'interface (light/dark)
    theme: 'light',
    // Langue de l'interface (fr/en/es/pt)
    language: 'en'
  }),

  actions: {
    /**
     * Initialise les informations de l'utilisateur
     * @param {Object} data - Données de l'utilisateur
     * @param {string|number} data.id - Identifiant de l'utilisateur
     * @param {string} data.name - Nom de l'utilisateur
     * @param {Array} data.roles - Rôles de l'utilisateur
     */
    setUser(data) {
      this.id = data.id
      this.name = data.name
      this.roles = data.roles || []
    },

    /**
     * Change le thème de l'interface
     * @param {'light'|'dark'} theme - Nouveau thème
     */
    setTheme(theme) {
      if (['light', 'dark'].includes(theme)) {
        this.theme = theme
        // Applique le thème au niveau du document
        document.documentElement.setAttribute('data-theme', theme)
      }
    },

    /**
     * Change la langue de l'interface
     * @param {'fr'|'en'|'es'|'pt'} language - Nouvelle langue
     */
    setLanguage(language) {
      if (['fr', 'en', 'es', 'pt'].includes(language)) {
        this.language = language
      }
    },

    /**
     * Met à jour les rôles de l'utilisateur
     * @param {Array} roles - Nouveaux rôles
     */
    setRoles(roles) {
      this.roles = Array.isArray(roles) ? roles : []
    },

    /**
     * Réinitialise toutes les données utilisateur aux valeurs par défaut
     */
    resetUser() {
      this.id = null
      this.name = ''
      this.roles = []
      this.theme = 'light'
      this.language = 'en'
    }
  },

  persist: true
})
