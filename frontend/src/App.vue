<template>
  <div id="app">
    <header class="header">
      <div class="left-section">
        <router-link to="/" class="home-icon">
          <i class="fas fa-home"></i>
          <span>{{ $t('nav.myWork') }}</span>
        </router-link>
        <button class="create-button">{{ $t('nav.create') }}</button>
      </div>
      <div class="right-section">
        <div class="search-bar">
          <input type="text" :placeholder="$t('nav.search')" class="search-input" />
        </div>
        <button class="info-button" @click="toggleProfilePane">
          <i class="fas fa-info-circle"></i>
        </button>
        <button class="logout-button">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </header>

    <div class="main-content">
        <!--
          This is the side menu that appears on the left side of the window. It
          contains links to various features of the application. The links
          themselves are determined by the "nav" section of the i18n messages.
        -->
      <nav class="side-menu">
        <ul>
          <li><a href="#" @click.prevent="toggleServiceHub" data-service-hub-toggle>{{ $t('nav.serviceHub') }}</a></li>
          <li><a href="#" @click.prevent="toggleSprintCenter" data-sprint-center-toggle>{{ $t('nav.sprintCenter') }}</a></li>
          <li><router-link to="/mail">{{ $t('nav.mail') }}</router-link></li>
          <li><router-link to="/portals-builder">{{ $t('nav.portalsBuilder') }}</router-link></li>
          <li><a href="#" @click.prevent="toggleDataPane" data-data-pane-toggle>{{ $t('nav.data') }}</a></li>
          <li><router-link to="/tableaux">{{ $t('nav.tableaux') }}</router-link></li>
          <li><a href="#" @click.prevent="toggleConfiguration" data-configuration-toggle>{{ $t('nav.configuration') }}</a></li>
          <li><a href="#" @click.prevent="toggleAdmin" data-admin-toggle>{{ $t('nav.administration') }}</a></li>
        </ul>
      </nav>

        <!--
          The main content area of the application. It contains a tabbed interface
          with each tab representing a separate component. The component to be
          rendered is determined by the "activeTab" property.

          The tabs are rendered as a horizontal list of buttons, with the active
          tab highlighted. Clicking on a tab will switch the active tab to the
          one clicked.

          The content of the tab is rendered below the tabs, and is determined
          by the "activeTab" property.
        -->
      <main class="content-area">
 <!-- Utilisation du nouveau composant d'onglets hiérarchiques -->
 <hierarchical-tabs
          v-if="tabs.length > 0"
          :tabs="tabs"
          :active-tab-id="activeTab"
          @update:active-tab-id="activeTab = $event"
          @open-tab="handleOpenTab"
          @open-child-tab="handleOpenChildTab"
          @close-tab="handleCloseTab"
          @close-child-tab="handleCloseChildTab"
        />
        <router-view v-else></router-view>
      </main>
    </div>

    <ProfilePane 
      :is-visible="isProfilePaneVisible"
      @theme-changed="handleThemeChange"
      @language-changed="handleLanguageChange"
      @close="closeProfilePane"
    />

    <ServiceHubPane
      :is-visible="isServiceHubVisible"
      @close="closeServiceHub"
      @mouse-enter="handleServiceHubMouseEnter"
      @mouse-leave="handleServiceHubMouseLeave"
    />

    <SprintCenterPane
      :is-visible="isSprintCenterVisible"
      @close="closeSprintCenter"
      @mouse-enter="handleSprintCenterMouseEnter"
      @mouse-leave="handleSprintCenterMouseLeave"
    />

    <DataPane
      :is-visible="isDataPaneVisible"
      @close="closeDataPane"
      @mouse-enter="handleDataMouseEnter"
      @mouse-leave="handleDataMouseLeave"
      @open-tab="handleOpenTab"
    />

    <ConfigurationPane
      :is-visible="isConfigurationVisible"
      @close="closeConfiguration"
      @mouse-enter="handleConfigurationMouseEnter"
      @mouse-leave="handleConfigurationMouseLeave"
      @open-tab="handleOpenTab"
    />

    <AdminPane
      :is-visible="isAdminVisible"
      @close="closeAdmin"
      @mouse-enter="handleAdminMouseEnter"
      @mouse-leave="handleAdminMouseLeave"
      @open-tab="handleOpenTab"
    />

    <footer class="status-bar">
      <div class="status-info">
        <!-- Status information will be displayed here -->
      </div>
    </footer>
  </div>
</template>

/**
 * This script defines the main application component for a Vue.js app, including 
 * several child components such as ProfilePane, ServiceHubPane, SprintCenterPane, 
 * DataPane, ConfigurationPane, AdminPane, and SymptomsGrid. It manages the visibility 
 * of these panes and handles various user interactions like toggling panes, switching 
 * tabs, and handling theme and language changes. The script also manages a tabbed 
 * interface allowing dynamic content to be rendered based on user interaction.
 */
<script>
import ProfilePane from './components/ProfilePane.vue'
import ServiceHubPane from './components/ServiceHubPane.vue'
import SprintCenterPane from './components/SprintCenterPane.vue'
import DataPane from './components/DataPane.vue'
import ConfigurationPane from './components/ConfigurationPane.vue'
import AdminPane from './components/AdminPane.vue'
import SymptomsTab from './components/SymptomsTab.vue'
import EntitiesTab from '@/components/entitiesTab.vue'
import SymptomsForm from '@/components/coreForms/symptomsForm.vue'
import EntityForm from '@/components/coreForms/entityForm.vue'
import HierarchicalTabs from '@/components/common/hierarchicalTabs.vue'

export default {
  name: 'App',
  components: {
    ProfilePane,
    ServiceHubPane,
    SprintCenterPane,
    DataPane,
    ConfigurationPane,
    AdminPane,
    SymptomsTab,
    HierarchicalTabs,
    EntitiesTab,
    SymptomsForm,
    EntityForm
  },
  data() {
    return {
      isProfilePaneVisible: false,
      isServiceHubVisible: false,
      isSprintCenterVisible: false,
      isDataPaneVisible: false,
      isConfigurationVisible: false,
      isAdminVisible: false,
      tabs: [],
      activeTab: null,
      configurationCloseTimeout: null,
      adminCloseTimeout: null,
      dataCloseTimeout: null,
      serviceHubCloseTimeout: null,
      sprintCenterCloseTimeout: null
    }
  },
  methods: {
    /**
     * Toggles the visibility of the profile pane
     */
    toggleProfilePane() {
      // Fermer tous les autres panneaux
      this.isServiceHubVisible = false
      this.isSprintCenterVisible = false
      this.isDataPaneVisible = false
      this.isConfigurationVisible = false
      this.isAdminVisible = false
      // Basculer l'état du panneau demandé
      this.isProfilePaneVisible = !this.isProfilePaneVisible
    },
    closeProfilePane() {
      this.isProfilePaneVisible = false
    },
    toggleServiceHub() {
      // Fermer tous les autres panneaux
      this.isProfilePaneVisible = false
      this.isSprintCenterVisible = false
      this.isDataPaneVisible = false
      this.isConfigurationVisible = false
      this.isAdminVisible = false
      // Basculer l'état du panneau demandé
      this.isServiceHubVisible = !this.isServiceHubVisible
    },
    closeServiceHub() {
      this.isServiceHubVisible = false
    },
    toggleSprintCenter() {
      // Fermer tous les autres panneaux
      this.isProfilePaneVisible = false
      this.isServiceHubVisible = false
      this.isDataPaneVisible = false
      this.isConfigurationVisible = false
      this.isAdminVisible = false
      // Basculer l'état du panneau demandé
      this.isSprintCenterVisible = !this.isSprintCenterVisible
    },
    closeSprintCenter() {
      this.isSprintCenterVisible = false
    },
    toggleDataPane() {
      // Fermer tous les autres panneaux
      this.isProfilePaneVisible = false
      this.isServiceHubVisible = false
      this.isSprintCenterVisible = false
      this.isConfigurationVisible = false
      this.isAdminVisible = false
      // Basculer l'état du panneau demandé
      this.isDataPaneVisible = !this.isDataPaneVisible
    },
    closeDataPane() {
      this.isDataPaneVisible = false
    },
    toggleConfiguration() {
      // Fermer tous les autres panneaux
      this.isProfilePaneVisible = false
      this.isServiceHubVisible = false
      this.isSprintCenterVisible = false
      this.isDataPaneVisible = false
      this.isAdminVisible = false
      // Basculer l'état du panneau demandé
      this.isConfigurationVisible = !this.isConfigurationVisible
    },
    closeConfiguration() {
      this.isConfigurationVisible = false
    },
    toggleAdmin() {
      // Fermer tous les autres panneaux
      this.isProfilePaneVisible = false
      this.isServiceHubVisible = false
      this.isSprintCenterVisible = false
      this.isDataPaneVisible = false
      this.isConfigurationVisible = false
      // Basculer l'état du panneau demandé
      this.isAdminVisible = !this.isAdminVisible
    },
    closeAdmin() {
      this.isAdminVisible = false
    },
    handleThemeChange(theme) {
      // Implémenter la logique de changement de thème
      console.log('Theme changed to:', theme)
    },
    handleLanguageChange(language) {
      this.$i18n.locale = language;
      this.updateTabTitles();
    },
    /**
     * Handles the opening of a new tab in the application.
     * If the tab already exists, its data is updated.
     * If the tab does not exist, it is created and added to the list of tabs.
     * The currently active tab is then set to the newly opened tab.
     * @param {object} payload - The payload of the tab to open, containing its id, title, data, and type.
     */
    handleOpenTab({ id, title, data, type }) {
      const existingTabIndex = this.tabs.findIndex(tab => tab.id === id)
      
      if (existingTabIndex !== -1) {
        // Update existing tab
        this.tabs[existingTabIndex].data = data
        this.activeTab = id
      } else {
        // Create new tab with a unique instance identifier for component types that need unique instances
        const instanceId = Date.now().toString()
        const tabData = { ...data, _instanceId: instanceId }
        
        // Create new tab
        this.tabs.push({ id, title, data: tabData, type })
        this.activeTab = id
      }
    },
    
    /**
     * Switches the active tab to the tab with the specified id.
     * @param {string} tabId - The id of the tab to switch to.
     */
    switchTab(tabId) {
      this.activeTab = tabId
    },
    
    /**
     * Closes the specified tab and removes it from the list of tabs.
     * If the closed tab is the currently active tab, the active tab is set to the
     * previous tab in the list of tabs, or null if there are no tabs left.
     * @param {string} tabId - The id of the tab to close.
     */
    closeTab(tabId) {
      const index = this.tabs.findIndex(tab => tab.id === tabId)
      if (index !== -1) {
        this.tabs.splice(index, 1)
        if (this.activeTab === tabId) {
          this.activeTab = this.tabs.length > 0 ? this.tabs[this.tabs.length - 1].id : null
        }
      }
    },
    
    /**
     * Gère l'ouverture d'un onglet enfant
     * @param {object} payload - Les données de l'onglet enfant
     */
    handleOpenChildTab({ id, title, type, data, parentId }) {
      // Vérifier si l'onglet enfant existe déjà
      const existingTabIndex = this.tabs.findIndex(tab => tab.id === id)
      
      if (existingTabIndex !== -1) {
        // Mettre à jour les données de l'onglet existant
        this.tabs[existingTabIndex].data = {
          ...this.tabs[existingTabIndex].data,
          ...data,
          _instanceId: Date.now() // Pour forcer la réinitialisation du composant
        }
      } else {
        // Créer un nouvel onglet enfant
        this.tabs.push({
          id,
          title,
          type,
          data: {
            ...data,
            _instanceId: Date.now()
          },
          parentId: parentId || this.activeTab // Utiliser parentId s'il est fourni, sinon l'onglet actif
        })
      }
    },
    
    /**
     * Gère la fermeture d'un onglet et de tous ses onglets enfants
     * @param {object} payload - Contient l'ID de l'onglet à fermer et les IDs de ses enfants
     */
    handleCloseTab({ tabId, childTabIds }) {
      // Supprimer tous les onglets enfants
      if (childTabIds && childTabIds.length > 0) {
        this.tabs = this.tabs.filter(tab => !childTabIds.includes(tab.id))
      }
      
      // Supprimer l'onglet parent
      const tabIndex = this.tabs.findIndex(tab => tab.id === tabId)
      if (tabIndex !== -1) {
        this.tabs.splice(tabIndex, 1)
      }
      
      // Si l'onglet fermé était l'onglet actif, passer à un autre onglet
      if (this.activeTab === tabId) {
        // Trouver le prochain onglet de premier niveau
        const nextTab = this.tabs.find(tab => !tab.parentId)
        this.activeTab = nextTab ? nextTab.id : null
      }
    },
    
    /**
     * Gère la fermeture d'un onglet enfant
     * @param {string} tabId - L'ID de l'onglet enfant à fermer
     */
    handleCloseChildTab(tabId) {
      const tabIndex = this.tabs.findIndex(tab => tab.id === tabId)
      if (tabIndex !== -1) {
        this.tabs.splice(tabIndex, 1)
      }
    },
    
    /**
     * Returns the component name associated with the specified tab id.
     * Searches for a tab with the given id and returns the component
     * name based on the tab's type. If no tab is found, or if the tab type
     * is not recognized, it returns null.
     * 
     * @param {string} tabId - The id of the tab whose component is to be retrieved.
     * @returns {string|null} The name of the component corresponding to the tab type,
     * or null if not found or type is unrecognized.
     */
    getTabComponent(tabId) {
      const tab = this.tabs.find(t => t.id === tabId)
      if (!tab) return null
      
      switch (tab.type) {
        case 'symptoms':
          return 'SymptomsTab'
        case 'entities':
          return 'EntitiesTab'
        case 'symptomForm':
          return 'SymptomsForm'
        case 'entityForm':
          return 'EntityForm'
        default:
          return null
      }
    },
    
    /**
     * Retrieves the data associated with the specified tab id.
     * Searches for a tab with the given id and returns its data.
     * If no tab is found, it returns null.
     * 
     * @param {string} tabId - The id of the tab whose data is to be retrieved.
     * @returns {object|null} The data of the tab if found, otherwise null.
     */
    getTabData(tabId) {
      const tab = this.tabs.find(t => t.id === tabId)
      return tab ? tab.data : null
    },
    /**
     * Cancels the configuration pane close timeout when the mouse enters the
     * configuration pane. This prevents the pane from closing when the user
     * moves the mouse back into the pane while the timeout is still active.
     */
    handleConfigurationMouseEnter() {
      if (this.configurationCloseTimeout) {
        clearTimeout(this.configurationCloseTimeout);
        this.configurationCloseTimeout = null;
      }
    },

    /**
     * Sets a timeout to close the configuration pane after a 300ms delay when
     * the mouse leaves the pane. This allows the user to quickly move the mouse
     * out and back into the pane without it closing.
     */
    handleConfigurationMouseLeave() {
      this.configurationCloseTimeout = setTimeout(() => {
        this.closeConfiguration();
      }, 300); // Délai de 300ms avant la fermeture
    },
    /**
     * Cancels the administration pane close timeout when the mouse enters the
     * administration pane. This prevents the pane from closing when the user
     * moves the mouse back into the pane while the timeout is still active.
     */
    handleAdminMouseEnter() {
      if (this.adminCloseTimeout) {
        clearTimeout(this.adminCloseTimeout);
        this.adminCloseTimeout = null;
      }
    },

    handleAdminMouseLeave() {
      this.adminCloseTimeout = setTimeout(() => {
        this.closeAdmin();
      }, 300);
    },
    handleDataMouseEnter() {
      if (this.dataCloseTimeout) {
        clearTimeout(this.dataCloseTimeout);
        this.dataCloseTimeout = null;
      }
    },

    handleDataMouseLeave() {
      this.dataCloseTimeout = setTimeout(() => {
        this.closeDataPane();
      }, 300);
    },
    handleServiceHubMouseEnter() {
      if (this.serviceHubCloseTimeout) {
        clearTimeout(this.serviceHubCloseTimeout);
        this.serviceHubCloseTimeout = null;
      }
    },

    handleServiceHubMouseLeave() {
      this.serviceHubCloseTimeout = setTimeout(() => {
        this.closeServiceHub();
      }, 300);
    },
    handleSprintCenterMouseEnter() {
      if (this.sprintCenterCloseTimeout) {
        clearTimeout(this.sprintCenterCloseTimeout);
        this.sprintCenterCloseTimeout = null;
      }
    },

    handleSprintCenterMouseLeave() {
      this.sprintCenterCloseTimeout = setTimeout(() => {
        this.closeSprintCenter();
      }, 300);
    },

    /**
     * Met à jour les titres des onglets ouverts en fonction de la langue actuelle.
     * Pour chaque onglet, récupère la traduction correspondante à son type.
     */
    updateTabTitles() {
      this.tabs = this.tabs.map(tab => {
        let newTitle;
        switch (tab.type) {
          case 'companies':
            newTitle = this.$t('configuration.companies');
            break;
          case 'locations':
            newTitle = this.$t('configuration.locations');
            break;
          case 'sites':
            newTitle = this.$t('configuration.sites');
            break;
          case 'entities':
            newTitle = this.$t('configuration.entities');
            break;
          case 'departments':
            newTitle = this.$t('configuration.departments');
            break;
          case 'persons':
            newTitle = this.$t('configuration.persons');
            break;
          case 'support-groups':
            newTitle = this.$t('configuration.supportGroups');
            break;
          case 'roles':
            newTitle = this.$t('configuration.roles');
            break;
          case 'ticket-status':
            newTitle = this.$t('configuration.ticketStatus');
            break;
          case 'symptoms':
            newTitle = this.$t('configuration.symptoms');
            break;
          case 'ticket-types':
            newTitle = this.$t('configuration.ticketTypes');
            break;
          case 'workflows':
            newTitle = this.$t('configuration.workflows');
            break;
          default:
            newTitle = tab.title;
        }
        return { ...tab, title: newTitle };
      });
    }
  }
}


</script>

<style>
@import './assets/styles/app.css';
</style>
