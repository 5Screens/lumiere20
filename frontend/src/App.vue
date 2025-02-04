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
        <div class="tabs" v-if="tabs.length > 0">
          <div v-for="tab in tabs" :key="tab.id" class="tab" :class="{ active: activeTab === tab.id }">
            <span @click="switchTab(tab.id)">{{ tab.title }}</span>
            <button class="close-tab" @click="closeTab(tab.id)">×</button>
          </div>
        </div>
        <div class="tab-content">
          <div v-if="activeTab">
            <component :is="getTabComponent(activeTab)" :data="getTabData(activeTab)" />
          </div>
          <router-view v-else></router-view>
        </div>
      </main>
    </div>

    <!--
      A component that renders a pane on the right side of the screen, containing
      options to change the theme and language of the application. When the pane
      is closed, the "close" event is emitted.

      Props:
        isVisible: A boolean indicating whether the pane should be visible or not.

      Events:
        theme-changed: Emitted when the theme of the application is changed. The
          event payload is the new theme.
        language-changed: Emitted when the language of the application is changed.
          The event payload is the new language.
        close: Emitted when the pane is closed.
    -->
    <ProfilePane 
      :is-visible="isProfilePaneVisible"
      @theme-changed="handleThemeChange"
      @language-changed="handleLanguageChange"
      @close="closeProfilePane"
    />

    <ServiceHubPane
      :is-visible="isServiceHubVisible"
      @close="closeServiceHub"
    />

    <SprintCenterPane
      :is-visible="isSprintCenterVisible"
      @close="closeSprintCenter"
    />

    <DataPane
      :is-visible="isDataPaneVisible"
      @close="closeDataPane"
    />

    <ConfigurationPane
      :is-visible="isConfigurationVisible"
      @close="closeConfiguration"
      @open-tab="handleOpenTab"
    />

    <AdminPane
      :is-visible="isAdminVisible"
      @close="closeAdmin"
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
import SymptomsGrid from './components/SymptomsGrid.vue'

export default {
  name: 'App',
  components: {
    ProfilePane,
    ServiceHubPane,
    SprintCenterPane,
    DataPane,
    ConfigurationPane,
    AdminPane,
    SymptomsGrid
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
      activeTab: null
    }
  },
  methods: {
    /**
     * Toggles the visibility of the profile pane
     */
    toggleProfilePane() {
      this.isProfilePaneVisible = !this.isProfilePaneVisible
    },
    closeProfilePane() {
      this.isProfilePaneVisible = false
    },
    toggleServiceHub() {
      this.isServiceHubVisible = !this.isServiceHubVisible
    },
    closeServiceHub() {
      this.isServiceHubVisible = false
    },
    toggleSprintCenter() {
      this.isSprintCenterVisible = !this.isSprintCenterVisible
    },
    closeSprintCenter() {
      this.isSprintCenterVisible = false
    },
    toggleDataPane() {
      this.isDataPaneVisible = !this.isDataPaneVisible
    },
    closeDataPane() {
      this.isDataPaneVisible = false
    },
    toggleConfiguration() {
      this.isConfigurationVisible = !this.isConfigurationVisible
    },
    closeConfiguration() {
      this.isConfigurationVisible = false
    },
    toggleAdmin() {
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
      // Implémenter la logique de changement de langue
      console.log('Language changed to:', language)
    },
    handleOpenTab({ id, title, data, type }) {
      const existingTabIndex = this.tabs.findIndex(tab => tab.id === id)
      
      if (existingTabIndex !== -1) {
        // Update existing tab
        this.tabs[existingTabIndex].data = data
        this.activeTab = id
      } else {
        // Create new tab
        this.tabs.push({ id, title, data, type })
        this.activeTab = id
      }
    },
    
    switchTab(tabId) {
      this.activeTab = tabId
    },
    
    closeTab(tabId) {
      const index = this.tabs.findIndex(tab => tab.id === tabId)
      if (index !== -1) {
        this.tabs.splice(index, 1)
        if (this.activeTab === tabId) {
          this.activeTab = this.tabs.length > 0 ? this.tabs[this.tabs.length - 1].id : null
        }
      }
    },
    
    getTabComponent(tabId) {
      const tab = this.tabs.find(t => t.id === tabId)
      if (!tab) return null
      
      switch (tab.type) {
        case 'symptoms':
          return 'SymptomsGrid'
        default:
          return null
      }
    },
    
    getTabData(tabId) {
      const tab = this.tabs.find(t => t.id === tabId)
      return tab ? tab.data : null
    }
  }
}
</script>

<style>
@import './assets/styles/themes.css';

#app {
  background-color: var(--bg-color);
  color: var(--text-color);
  min-height: 100vh;
}

.header {
  background-color: var(--header-bg);
  border-bottom: 1px solid var(--border-color);
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px var(--shadow-color);
}

.left-section, .right-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.home-icon {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: var(--text-color);
}

.create-button {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.create-button:hover {
  background-color: var(--primary-hover);
}

.search-bar {
  position: relative;
  margin-right: 1rem;
}

.search-input {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--background-secondary);
  color: var(--text-primary);
  width: 200px;
  transition: width 0.3s ease-in-out;
}

.search-input:focus {
  width: 800px;
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.2);
}

.info-button, .logout-button {
  background: transparent;
  border: none;
  color: var(--text-color);
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
}

.info-button:hover, .logout-button:hover {
  background-color: var(--hover-color);
}

.main-content {
  display: flex;
  min-height: calc(100vh - 60px);
}

.side-menu {
  background-color: var(--sidebar-bg);
  width: 250px;
  padding: 1rem;
  border-right: 1px solid var(--border-color);
}

.side-menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.side-menu li {
  margin-bottom: 0.5rem;
}

.side-menu a {
  color: var(--text-color);
  text-decoration: none;
  display: block;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.side-menu a:hover {
  background-color: var(--hover-color);
}

.side-menu a.router-link-active {
  background-color: var(--primary-color);
  color: white;
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
}

.tab.active {
  background-color: var(--primary-color);
  color: white;
}

.close-tab {
  background: transparent;
  border: none;
  color: var(--text-color);
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
}

.close-tab:hover {
  background-color: var(--hover-color);
}

.content-area {
  flex: 1;
  padding: 20px;
  width: 100%;
  overflow-x: hidden;
}

.tab-content {
  width: 100%;
  height: 100%;
}

.status-bar {
  background-color: var(--footer-bg);
  padding: 0.5rem;
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.status-info {
  color: var(--text-color);
}
</style>
