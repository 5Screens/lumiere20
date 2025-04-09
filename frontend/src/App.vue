<template>
  <div id="app">
    <header class="header">
      <div class="left-section">
        <router-link to="/" class="home-icon">
          <i class="fas fa-home"></i>
          <span>{{ $t('nav.myWork') }}</span>
        </router-link>
        <button class="create-button" @click="showCreateModal">{{ $t('nav.create') }}</button>
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

      <main class="content-area">
        <hierarchical-tabs v-if="tabsStore.tabs.length > 0" />
        <router-view v-else></router-view>
      </main>
    </div>

    <ProfilePane 
      :is-visible="isProfilePaneVisible"
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
    />

    <AdminPane
      :is-visible="isAdminVisible"
      @close="closeAdmin"
      @mouse-enter="handleAdminMouseEnter"
      @mouse-leave="handleAdminMouseLeave"
    />

    <object-edit-view
      v-if="isCreateModalVisible"
      @close="closeCreateModal"
    />

    <!-- Fenêtre modale pour afficher les messages du store objectStore -->
    <div v-if="objectStore.message" class="notification-modal">
      <div class="notification-content">
        <div class="notification-header">
          <h3>{{ $t('notifications.title') }}</h3>
          <button class="close-button" @click="closeNotification">&times;</button>
        </div>
        <div class="notification-body">
          <p>{{ $t(getMessageTranslationKey()) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useTabsStore } from '@/stores/tabsStore'
import { useObjectStore } from '@/stores/objectStore'
import HierarchicalTabs from '@/components/common/hierarchicalTabs.vue'
import ProfilePane from '@/components/panes/ProfilePane.vue'
import ServiceHubPane from '@/components/panes/ServiceHubPane.vue'
import SprintCenterPane from '@/components/panes/SprintCenterPane.vue'
import DataPane from '@/components/panes/DataPane.vue'
import ConfigurationPane from '@/components/panes/ConfigurationPane.vue'
import AdminPane from '@/components/panes/AdminPane.vue'
import ObjectEditView from '@/components/coreForms/objectEditView.vue'

export default {
  name: 'App',
  components: {
    HierarchicalTabs,
    ProfilePane,
    ServiceHubPane,
    SprintCenterPane,
    DataPane,
    ConfigurationPane,
    AdminPane,
    ObjectEditView
  },
  setup() {
    const tabsStore = useTabsStore()
    const objectStore = useObjectStore()
    return { tabsStore, objectStore }
  },
  data() {
    return {
      isProfilePaneVisible: false,
      isServiceHubVisible: false,
      isSprintCenterVisible: false,
      isDataPaneVisible: false,
      isConfigurationVisible: false,
      isAdminVisible: false,
      isCreateModalVisible: false,
      serviceHubCloseTimeout: null,
      sprintCenterCloseTimeout: null,
      dataCloseTimeout: null,
      configurationCloseTimeout: null,
      adminCloseTimeout: null
    }
  },
  methods: {
    toggleProfilePane() {
      this.isProfilePaneVisible = !this.isProfilePaneVisible
    },
    closeProfilePane() {
      this.isProfilePaneVisible = false
    },
    toggleServiceHub() {
      this.isServiceHubVisible = !this.isServiceHubVisible
      if (!this.isServiceHubVisible) {
        clearTimeout(this.serviceHubCloseTimeout)
      }
    },
    closeServiceHub() {
      this.isServiceHubVisible = false
    },
    toggleSprintCenter() {
      this.isSprintCenterVisible = !this.isSprintCenterVisible
      if (!this.isSprintCenterVisible) {
        clearTimeout(this.sprintCenterCloseTimeout)
      }
    },
    closeSprintCenter() {
      this.isSprintCenterVisible = false
    },
    toggleDataPane() {
      this.isDataPaneVisible = !this.isDataPaneVisible
      if (!this.isDataPaneVisible) {
        clearTimeout(this.dataCloseTimeout)
      }
    },
    closeDataPane() {
      this.isDataPaneVisible = false
    },
    toggleConfiguration() {
      this.isConfigurationVisible = !this.isConfigurationVisible
      if (!this.isConfigurationVisible) {
        clearTimeout(this.configurationCloseTimeout)
      }
    },
    closeConfiguration() {
      this.isConfigurationVisible = false
    },
    toggleAdmin() {
      this.isAdminVisible = !this.isAdminVisible
      if (!this.isAdminVisible) {
        clearTimeout(this.adminCloseTimeout)
      }
    },
    closeAdmin() {
      this.isAdminVisible = false
    },
    handleOpenTab(tabData) {
      this.tabsStore.openTab({
        ...tabData,
        label: this.$t(`tabs.${tabData.type}`)
      })
    },
    handleServiceHubMouseEnter() {
      clearTimeout(this.serviceHubCloseTimeout)
    },
    handleServiceHubMouseLeave() {
      this.serviceHubCloseTimeout = setTimeout(() => {
        this.closeServiceHub()
      }, 300)
    },
    handleSprintCenterMouseEnter() {
      clearTimeout(this.sprintCenterCloseTimeout)
    },
    handleSprintCenterMouseLeave() {
      this.sprintCenterCloseTimeout = setTimeout(() => {
        this.closeSprintCenter()
      }, 300)
    },
    handleDataMouseEnter() {
      clearTimeout(this.dataCloseTimeout)
    },
    handleDataMouseLeave() {
      this.dataCloseTimeout = setTimeout(() => {
        this.closeDataPane()
      }, 300)
    },
    handleConfigurationMouseEnter() {
      clearTimeout(this.configurationCloseTimeout)
    },
    handleConfigurationMouseLeave() {
      this.configurationCloseTimeout = setTimeout(() => {
        this.closeConfiguration()
      }, 300)
    },
    handleAdminMouseEnter() {
      clearTimeout(this.adminCloseTimeout)
    },
    handleAdminMouseLeave() {
      this.adminCloseTimeout = setTimeout(() => {
        this.closeAdmin()
      }, 300)
    },
    updateTabTitles() {
      // Mise à jour des titres des onglets en fonction de la langue
      this.tabsStore.tabs = this.tabsStore.tabs.map(tab => ({
        ...tab,
        label: this.$t(`tabs.${tab.type}`)
      }))
    },
    showCreateModal() {
      this.isCreateModalVisible = true
    },
    closeCreateModal() {
      this.isCreateModalVisible = false
    },
    closeNotification() {
      this.objectStore.resetMessage()
    },
    getMessageTranslationKey() {
      // Détermine la clé de traduction en fonction du message
      const message = this.objectStore.message
      
      if (!message) return 'notifications.message'
      
      // Retourner directement les messages d'erreur
      if (message.includes(this.$t('errors.identificationLabel'))) return message
      
      // Vérifier les messages spécifiques
      if (message.includes('Création réussie')) return 'notifications.creationSuccess'
      if (message.includes('Mise à jour réussie')) return 'notifications.updateSuccess'
      if (message.includes('Suppression réussie')) return 'notifications.deleteSuccess'
      
      // Message par défaut
      return 'notifications.message'
    }
  }
}
</script>

<style>
@import '@/assets/styles/app.css';

#app {
  font-family: 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--text-color);
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Styles pour la fenêtre modale de notification */
.notification-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  animation: fadeIn 0.3s ease-in-out;
}

.notification-content {
  background-color: var(--bg-color);
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color);
  animation: slideIn 0.3s ease-in-out;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

.notification-header h3 {
  margin: 0;
  font-size: 18px;
}

.notification-body {
  padding: 16px;
  font-size: 16px;
  line-height: 1.5;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
