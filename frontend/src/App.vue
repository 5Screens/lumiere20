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
          <li><a href="#" @click.prevent="showUnderConstruction('mail')">{{ $t('nav.mail') }}</a></li>
          <li><a href="#" @click.prevent="showUnderConstruction('portalsBuilder')">{{ $t('nav.portalsBuilder') }}</a></li>
          <li><a href="#" @click.prevent="toggleDataPane" data-data-pane-toggle>{{ $t('nav.data') }}</a></li>
          <li><a href="#" @click.prevent="showUnderConstruction('tableaux')">{{ $t('nav.tableaux') }}</a></li>
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

    <!-- Panneaux dynamiques pour remplacer tous les panneaux individuels -->
    <!-- Service Hub Pane -->
    <DynamicPane 
      type="serviceHub"
      :is-visible="paneStore.isPaneVisible('serviceHub')"
      :items="paneStore.getPaneConfig('serviceHub').items"
      :sections="paneStore.getPaneConfig('serviceHub').sections"
      :has-sections="paneStore.getPaneConfig('serviceHub').hasSections"
      @close="paneStore.closePane"
      @mouse-enter="paneStore.handleMouseEnter"
      @mouse-leave="paneStore.handleMouseLeave"
      @open-tab="handleOpenTab"
    />
    
    <!-- Sprint Center Pane -->
    <DynamicPane 
      type="sprintCenter"
      :is-visible="paneStore.isPaneVisible('sprintCenter')"
      :items="paneStore.getPaneConfig('sprintCenter').items"
      :sections="paneStore.getPaneConfig('sprintCenter').sections"
      :has-sections="paneStore.getPaneConfig('sprintCenter').hasSections"
      @close="paneStore.closePane"
      @mouse-enter="paneStore.handleMouseEnter"
      @mouse-leave="paneStore.handleMouseLeave"
      @open-tab="handleOpenTab"
    />
    
    <!-- Data Pane -->
    <DynamicPane 
      type="dataPane"
      :is-visible="paneStore.isPaneVisible('dataPane')"
      :items="paneStore.getPaneConfig('dataPane').items"
      :sections="paneStore.getPaneConfig('dataPane').sections"
      :has-sections="paneStore.getPaneConfig('dataPane').hasSections"
      @close="paneStore.closePane"
      @mouse-enter="paneStore.handleMouseEnter"
      @mouse-leave="paneStore.handleMouseLeave"
      @open-tab="handleOpenTab"
    />
    
    <!-- Configuration Pane -->
    <DynamicPane 
      type="configuration"
      :is-visible="paneStore.isPaneVisible('configuration')"
      :items="paneStore.getPaneConfig('configuration').items"
      :sections="paneStore.getPaneConfig('configuration').sections"
      :has-sections="paneStore.getPaneConfig('configuration').hasSections"
      @close="paneStore.closePane"
      @mouse-enter="paneStore.handleMouseEnter"
      @mouse-leave="paneStore.handleMouseLeave"
      @open-tab="handleOpenTab"
    />
    
    <!-- Admin Pane -->
    <DynamicPane 
      type="admin"
      :is-visible="paneStore.isPaneVisible('admin')"
      :items="paneStore.getPaneConfig('admin').items"
      :sections="paneStore.getPaneConfig('admin').sections"
      :has-sections="paneStore.getPaneConfig('admin').hasSections"
      @close="paneStore.closePane"
      @mouse-enter="paneStore.handleMouseEnter"
      @mouse-leave="paneStore.handleMouseLeave"
      @open-tab="handleOpenTab"
    />
    
    <!-- Pane En cours de construction -->
    <DynamicPane 
      type="underConstruction"
      :is-visible="isUnderConstructionVisible"
      :items="[]"
      :sections="[]"
      :has-sections="false"
      @close="closeUnderConstruction"
      @mouse-enter="paneStore.handleMouseEnter"
      @mouse-leave="paneStore.handleMouseLeave"
    />

    <object-edit-view
      v-if="isCreateModalVisible"
      @close="closeCreateModal"
    />

    <!-- Fenêtre modale pour afficher les messages des stores -->
    <div v-if="objectStore.message || tabsStore.message" class="notification-modal">
      <div class="notification-content">
        <div class="notification-header">
          <h3>{{ $t('notifications.title') }}</h3>
          <button class="close-button" @click="closeNotification">&times;</button>
        </div>
        <div class="notification-body">
          <p>{{ objectStore.message || tabsStore.message }}</p>
        </div>
      </div>
    </div>
    
    <!-- Modale de confirmation globale -->
    <yes-no-modal
      v-model="tabsStore.showConfirmation"
      :confirmation-to-display="tabsStore.confirmationMessage"
      @confirm="tabsStore.handleConfirm"
      @cancel="tabsStore.handleCancel"
    />
    
    <!-- Popover global pour contenu tronqué -->
    <div v-if="popoverStore.isVisible" 
         class="global-popover" 
         :style="popoverPositionStyle"
         @click.stop>
      <div class="global-popover-content">
        <div v-if="popoverStore.format === 'html'" v-html="popoverStore.content"></div>
        <div v-else>{{ popoverStore.content }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { useTabsStore } from '@/stores/tabsStore'
import { useObjectStore } from '@/stores/objectStore'
import { usePaneStore } from '@/stores/paneStore'
import { usePopoverStore } from '@/stores/popoverStore'
import HierarchicalTabs from '@/components/common/hierarchicalTabs.vue'
import ProfilePane from '@/components/panes/ProfilePane.vue'
import DynamicPane from '@/components/panes/DynamicPane.vue'
import ObjectEditView from '@/components/coreForms/objectEditView.vue'
import YesNoModal from '@/components/common/yesNoModal.vue'

export default {
  name: 'App',
  components: {
    HierarchicalTabs,
    ProfilePane,
    DynamicPane,
    ObjectEditView,
    YesNoModal
  },
  setup() {
    const tabsStore = useTabsStore()
    const objectStore = useObjectStore()
    const paneStore = usePaneStore()
    const popoverStore = usePopoverStore()
    
    // Types de panneaux disponibles
    const paneTypes = ['admin', 'configuration', 'data', 'serviceHub', 'sprintCenter']
    
    return { 
      tabsStore, 
      objectStore,
      paneStore,
      popoverStore,
      paneTypes
    }
  },
  data() {
    return {
      isProfilePaneVisible: false,
      isCreateModalVisible: false,
      isUnderConstructionVisible: false,
      underConstructionType: ''
    }
  },
  computed: {
    popoverPositionStyle() {
      if (!this.popoverStore.isVisible) return {}
      
      const { x, y } = this.popoverStore.position
      const maxWidth = 600
      const maxHeight = window.innerHeight * 0.5
      
      // Ajuster la position si le popover dépasse de l'écran
      let adjustedX = x
      let adjustedY = y
      
      // Vérifier le débordement horizontal
      if (x + maxWidth > window.innerWidth) {
        adjustedX = window.innerWidth - maxWidth - 20
      }
      
      // Vérifier le débordement vertical
      if (y + maxHeight > window.innerHeight) {
        adjustedY = window.innerHeight - maxHeight - 20
      }
      
      return {
        left: `${Math.max(10, adjustedX)}px`,
        top: `${Math.max(10, adjustedY)}px`,
        maxWidth: `${maxWidth}px`,
        maxHeight: `${maxHeight}px`
      }
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
      console.log('toggleServiceHub appelé dans App.vue');
      this.paneStore.togglePane('serviceHub')
    },
    toggleSprintCenter() {
      this.paneStore.togglePane('sprintCenter')
    },
    toggleDataPane() {
      this.paneStore.togglePane('dataPane')
    },
    toggleConfiguration() {
      this.paneStore.togglePane('configuration')
    },
    toggleAdmin() {
      this.paneStore.togglePane('admin')
    },
    showUnderConstruction(type) {
      this.underConstructionType = type;
      this.isUnderConstructionVisible = true;
    },
    closeUnderConstruction() {
      this.isUnderConstructionVisible = false;
    },
    handleOpenTab(tabData) {
      // Si la classe est null, afficher un message "En cours de construction"
      if (tabData.className === null) {
        this.tabsStore.setMessage({
          type: 'info',
          message: this.$t('common.underConstruction')
        })
        return
      }
      
      // Ouvrir l'onglet avec les données enrichies
      this.tabsStore.openTab({
        ...tabData
      })
    },
    updateTabTitles() {
      // Mise à jour des titres des onglets en fonction de la langue
      this.tabsStore.tabs = this.tabsStore.tabs.map(tab => ({
        ...tab,
        label: this.$t(`tabs.${tab.id}`)
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
      this.tabsStore.resetMessage()
    },
    handleGlobalClick(event) {
      // Fermer le popover si clic en dehors
      if (this.popoverStore.isVisible) {
        const popover = document.querySelector('.global-popover')
        if (popover && !popover.contains(event.target)) {
          this.popoverStore.hidePopover()
        }
      }
    }
  },
  mounted() {
    // Écouter les clics globaux pour fermer le popover
    document.addEventListener('click', this.handleGlobalClick)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleGlobalClick)
  }
}
</script>

<style>
@import '@/assets/styles/app.css';

#app {
  font-family: var(--font-family);
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

/* Styles pour le popover global */
.global-popover {
  position: fixed;
  z-index: 3000;
  pointer-events: none;
  animation: popoverFadeIn 0.2s ease-out;
}

.global-popover-content {
  background: var(--bg-color);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  overflow: auto;
  pointer-events: auto;
  user-select: text;
  transform-origin: top left;
  animation: popoverSlideIn 0.2s ease-out;
}

@keyframes popoverFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes popoverSlideIn {
  from { 
    transform: scale(0.9) translateY(-8px);
    opacity: 0;
  }
  to { 
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}
</style>
