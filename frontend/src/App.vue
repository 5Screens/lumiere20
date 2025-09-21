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
        <button class="theme-toggle-button" @click="toggleTheme" :title="themeButtonTitle">
          <i :class="themeButtonIcon"></i>
        </button>
        <button class="logout-button">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </header>

    <div class="main-content">
      <nav class="side-menu">
        <ul>
          <li>
            <a href="#" 
               @click.prevent 
               @mouseenter="showTooltipMenu('serviceHub', $event)"
               @mouseleave="hideTooltipMenu"
               data-service-hub-toggle>
              {{ $t('serviceHub.title') }}
            </a>
          </li>
          <li>
            <a href="#" 
               @click.prevent 
               @mouseenter="showTooltipMenu('sprintCenter', $event)"
               @mouseleave="hideTooltipMenu"
               data-sprint-center-toggle>
              {{ $t('sprintCenter.title') }}
            </a>
          </li>
          <li>
            <a href="#" 
               @click.prevent
               @mouseenter="showTooltipMenu('mail', $event)"
               @mouseleave="hideTooltipMenu"
               data-mail-toggle>
              {{ $t('mail.title') }}
            </a>
          </li>
          <li>
            <a href="#" 
               @click.prevent
               @mouseenter="showTooltipMenu('portalsBuilder', $event)"
               @mouseleave="hideTooltipMenu"
               data-portals-builder-toggle>
              {{ $t('portalsBuilder.title') }}
            </a>
          </li>
          <li>
            <a href="#" 
               @click.prevent 
               @mouseenter="showTooltipMenu('dataPane', $event)"
               @mouseleave="hideTooltipMenu"
               data-data-pane-toggle>
              {{ $t('dataPane.title') }}
            </a>
          </li>
          <li>
            <a href="#" 
               @click.prevent
               @mouseenter="showTooltipMenu('tableaux', $event)"
               @mouseleave="hideTooltipMenu"
               data-tableaux-toggle>
              {{ $t('tableaux.title') }}
            </a>
          </li>
          <li>
            <a href="#" 
               @click.prevent 
               @mouseenter="showTooltipMenu('configuration', $event)"
               @mouseleave="hideTooltipMenu"
               data-configuration-toggle>
              {{ $t('configuration.title') }}
            </a>
          </li>
          <li>
            <a href="#" 
               @click.prevent 
               @mouseenter="showTooltipMenu('admin', $event)"
               @mouseleave="hideTooltipMenu"
               data-admin-toggle>
              {{ $t('admin.title') }}
            </a>
          </li>
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
         ref="globalPopover"
         :key="`popover-${popoverStore.position.x}-${popoverStore.position.y}-${Date.now()}`"
         class="global-popover" 
         :style="popoverPositionStyle"
         @click.stop>
      <div class="global-popover-content">
        <div v-if="popoverStore.format === 'html'" v-html="popoverStore.content"></div>
        <div v-else>{{ popoverStore.content }}</div>
      </div>
    </div>
    
    <!-- Dynamic Tooltip Menu -->
    <dynamic-tool-tip-menu
      v-if="tooltipMenu.isVisible"
      :is-visible="tooltipMenu.isVisible"
      :pane-type="tooltipMenu.paneType"
      :items="tooltipMenu.items"
      :sections="tooltipMenu.sections"
      :has-sections="tooltipMenu.hasSections"
      :position="tooltipMenu.position"
      :title-icon="tooltipMenu.titleIcon"
      @item-click="handleTooltipItemClick"
      @mouse-enter="handleTooltipMouseEnter"
      @mouse-leave="handleTooltipMouseLeave"
    />
  </div>
</template>

<script>
import { useTabsStore } from '@/stores/tabsStore'
import { useObjectStore } from '@/stores/objectStore'
import { usePaneStore } from '@/stores/paneStore'
import { usePopoverStore } from '@/stores/popoverStore'
import { useUserProfileStore } from '@/stores/userProfileStore'
import HierarchicalTabs from '@/components/common/hierarchicalTabs.vue'
import ProfilePane from '@/components/panes/ProfilePane.vue'
import DynamicToolTipMenu from '@/components/panes/dynamicToolTipMenu.vue'
import ObjectEditView from '@/components/coreForms/objectEditView.vue'
import YesNoModal from '@/components/common/yesNoModal.vue'

export default {
  name: 'App',
  components: {
    HierarchicalTabs,
    ProfilePane,
    DynamicToolTipMenu,
    ObjectEditView,
    YesNoModal
  },
  setup() {
    const tabsStore = useTabsStore()
    const objectStore = useObjectStore()
    const paneStore = usePaneStore()
    const popoverStore = usePopoverStore()
    const userProfileStore = useUserProfileStore()
    
    // Types de panneaux disponibles
    const paneTypes = ['admin', 'configuration', 'data', 'serviceHub', 'sprintCenter']
    
    return { 
      tabsStore, 
      objectStore,
      paneStore,
      popoverStore,
      userProfileStore,
      paneTypes
    }
  },
  data() {
    return {
      isProfilePaneVisible: false,
      isCreateModalVisible: false,
      tooltipMenu: {
        isVisible: false,
        paneType: '',
        items: [],
        sections: [],
        hasSections: false,
        position: { x: 0, y: 0 },
        titleIcon: '',
        mouseOverTooltip: false,
        mouseOverTrigger: false
      }
    }
  },
  computed: {
    themeButtonIcon() {
      // Si le thème actuel est clair, afficher l'icône de lune (pour basculer vers sombre)
      // Si le thème actuel est sombre, afficher l'icône de soleil (pour basculer vers clair)
      return this.userProfileStore.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun'
    },
    themeButtonTitle() {
      // Titre du bouton selon le thème actuel
      return this.userProfileStore.theme === 'light' ? this.$t('theme.dark') : this.$t('theme.light')
    },
    popoverPositionStyle() {
      if (!this.popoverStore.isVisible) return {}
      
      const { x, y } = this.popoverStore.position
      const margin = 10
      const maxWidth = window.innerWidth

      // Measure the rendered popover width if possible; fallback to a conservative value
      let popoverWidth = 0
      const popoverEl = this.$refs.globalPopover
      if (popoverEl) {
        const contentEl = popoverEl.querySelector('.global-popover-content')
        popoverWidth = (contentEl && contentEl.offsetWidth) ? contentEl.offsetWidth : popoverEl.offsetWidth
      }
      if (!popoverWidth) popoverWidth = 300

      // If the popover overflows on the right, shift it left by the exact overflow delta
      // Trigger: x + popoverWidth > maxWidth - margin
      // delta = (x + popoverWidth) - (maxWidth - margin)
      // adjustedX = x - delta
      let adjustedX = x
      const overflowRight = (x + popoverWidth) - (maxWidth - margin)
      if (overflowRight > 0) {
        adjustedX = x - overflowRight
      }
      
      return {
        left: `${adjustedX}px`,
        top: `${y}px`,
        maxWidth: '600px',
        maxHeight: '50vh'
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
    toggleTheme() {
      // Basculer entre les thèmes clair et sombre
      const newTheme = this.userProfileStore.theme === 'light' ? 'dark' : 'light'
      this.userProfileStore.setTheme(newTheme)
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
    },
    showTooltipMenu(paneType, event) {
      const config = this.paneStore.getPaneConfig(paneType)
      if (!config) return
      
      const rect = event.target.getBoundingClientRect()
      const sideMenuWidth = 200 // Largeur approximative du side-menu
      
      // Définir les icônes pour chaque type de panneau
      const paneIcons = {
        serviceHub: 'fas fa-concierge-bell',
        sprintCenter: 'fas fa-running',
        mail: 'fas fa-envelope',
        portalsBuilder: 'fas fa-globe',
        dataPane: 'fas fa-database',
        tableaux: 'fas fa-chart-bar',
        configuration: 'fas fa-cogs',
        admin: 'fas fa-user-shield'
      }
      
      this.tooltipMenu = {
        isVisible: true,
        paneType: paneType,
        items: config.items,
        sections: config.sections,
        hasSections: config.hasSections,
        position: {
          x: sideMenuWidth + 10, // À droite du menu latéral
          y: rect.top // Aligné avec l'élément survolé
        },
        titleIcon: paneIcons[paneType] || 'fas fa-cube',
        mouseOverTooltip: false,
        mouseOverTrigger: true
      }
    },
    hideTooltipMenu() {
      this.tooltipMenu.mouseOverTrigger = false
      // Délai avant de masquer pour permettre le survol du tooltip
      setTimeout(() => {
        if (!this.tooltipMenu.mouseOverTooltip && !this.tooltipMenu.mouseOverTrigger) {
          this.tooltipMenu.isVisible = false
        }
      }, 100)
    },
    handleTooltipItemClick(item) {
      // Même logique que handleOpenTab mais pour les items du tooltip
      if (item.className === null) {
        this.tabsStore.setMessage({
          type: 'info',
          message: this.$t('common.underConstruction')
        })
        return
      }
      
      // Ouvrir l'onglet
      this.tabsStore.openTab({
        id: item.tabToOpen,
        label: item.label,
        icon: item.icon,
        className: item.className
      })
      
      // Masquer le tooltip
      this.tooltipMenu.isVisible = false
    },
    handleTooltipMouseEnter() {
      this.tooltipMenu.mouseOverTooltip = true
    },
    handleTooltipMouseLeave() {
      this.tooltipMenu.mouseOverTooltip = false
      // Délai avant de masquer
      setTimeout(() => {
        if (!this.tooltipMenu.mouseOverTooltip && !this.tooltipMenu.mouseOverTrigger) {
          this.tooltipMenu.isVisible = false
        }
      }, 100)
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
