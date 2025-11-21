<template>
  <div class="hierarchical-tabs">
    <!-- Onglets principaux (niveau 1) -->
    <div class="tabs-container primary-tabs">
      <div 
        v-for="tab in store.parentTabs" 
        :key="tab.id_tab" 
        class="tab primary-tab" 
        :class="{ 
          active: store.isParentTabActive(tab.id_tab),
          'has-active-child': store.activeTabId === tab.id_tab && store.activeChildTabId !== null 
        }"
        @click="handleTabSwitch(tab)"
      >
        <i v-if="tab.icon" :class="tab.icon"></i>
        <span class="tab-title">{{ $t(tab.label) }}</span>
        <button class="close-tab" @click.stop="store.closeTab(tab.id_tab)">×</button>
      </div>
    </div>
    
    <!-- Onglets secondaires (niveau 2) si un onglet parent est actif -->
    <div v-if="store.activeChildTabs.length > 0" class="tabs-container secondary-tabs">
      <div>
        <!-- Onglet fixe de retour à la table de l'onglet parent actif si au moins un onglet secondaire actif est ouvert -->
        <div
          v-if="store.activeTab"
          class="tab secondary-tab"
          :class="{
            active: store.isParentTabActive(store.activeTab.id_tab)
          }"
          @click="handleTabSwitch(store.activeTab)"
        >
          <div class="secondary-tab-main">
            <div class="secondary-tab-head">
              <i v-if="store.activeTab.icon" class="fas fa-table"></i>
              <span class="tab-title">Filtres de la table</span>
            </div>
            <div class="secondary-tab-body">
              <span class="tab-info">Retour à la vue principale</span>
            </div>
          </div>
        </div>
      </div>
      <!-- Onglets secondaires (niveau 2) -->
      <div
        v-for="tab in store.activeChildTabs"
        :key="tab.id_tab"
        class="tab secondary-tab"
        :class="{ active: store.activeChildTabId === tab.id_tab }"
        @click="handleChildTabSwitch(tab)"
      >
        <div class="secondary-tab-main">
          <div class="secondary-tab-head">
            <i v-if="tab.icon" :class="tab.icon"></i>
            <span class="tab-title" :title="tab.label">
              {{ tab.label && tab.label.length > 15 ? tab.label.substring(0, 15) + '...' : (tab.label || 'Sans titre') }}
            </span>
            <button class="close-tab" @click.stop="store.closeTab(tab.id_tab)">×</button>
          </div>
          <div class="secondary-tab-body">
            <span class="tab-info" v-if="tab.objectId" :title="tab.objectId">
              ID: {{ formatShortId(tab.objectId) }}
            </span>
            <span class="tab-info" v-if="tab.status" :class="'status-badge status-' + getStatusClass(tab.status)">
              {{ tab.status }}
            </span>
            <span class="tab-info" v-if="tab.mode">
              {{ tab.mode === 'creation' ? 'Création' : 'Modification' }}
            </span>
            <span class="tab-info" v-if="tab.updatedAt">
              Modifié: {{ formatDate(tab.updatedAt) }}
            </span>
            <span class="tab-info" v-else-if="tab.createdAt">
              Créé: {{ formatDate(tab.createdAt) }}
            </span>
            <!-- Debug temporaire -->
            <span class="tab-info" style="color: red; font-size: 9px;">
              Debug: {{ JSON.stringify({ status: tab.status, updatedAt: tab.updatedAt, createdAt: tab.createdAt }) }}
            </span>
            <span class="tab-info" style="color: red; font-size: 9px;">
              Debug: {{ tab }}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Contenu des onglets (tous les onglets sont rendus mais seul l'actif est visible) -->
    <div class="tab-content">
      <!-- Onglets parents - utilisation de keep-alive pour conserver l'instance des composants -->
      <keep-alive>
        <div 
          v-for="tab in store.parentTabs" 
          :key="tab.id_tab" 
          v-show="store.isParentTabActive(tab.id_tab)"
          class="tab-content-wrapper"
        >
          <!-- Composant spécial pour les onglets admin -->
          <component 
            v-if="tab.component"
            :is="tab.component"
          />
          <!-- Composant par défaut pour les grilles -->
          <ObjectsTab 
            v-else
            :data="tab"
            :tabId="tab.id_tab"
          />
        </div>
      </keep-alive>
      
      <!-- Onglets enfants - Utilisation de keep-alive pour conserver l'instance des composants -->
      <keep-alive>
        <div 
          v-for="tab in store.tabs.filter(t => t.parentId)" 
          :key="tab.id_tab" 
          v-show="store.activeChildTabId === tab.id_tab"
          class="tab-content-wrapper"
        >
          <ObjectCreationsAndUpdates 
            :mode="tab.mode"
            :objectId="tab.objectId"
            :tabId="tab.id_tab"
            :className="tab.className"
          />
        </div>
      </keep-alive>
    </div>
  </div>
</template>

<script>
import { useTabsStore } from '@/stores/tabsStore'
import { getClassByName } from '@/services/classMapping'
import ObjectsTab from '@/components/objectsTab.vue'
import ObjectCreationsAndUpdates from '@/components/coreForms/objectCreationsAndUpdates.vue'
import AdminPortals from '@/components/admin/AdminPortals.vue'

export default {
  name: 'HierarchicalTabs',
  components: {
    ObjectsTab,
    ObjectCreationsAndUpdates,
    AdminPortals
  },
  setup() {
    console.log('[HierarchicalTabs] Exécution de setup()')
    const store = useTabsStore()
    return { 
      store,
      getClassByName // Exposer la fonction au template
    }
  },
  computed: {
  },
  created() {
    console.log('[HierarchicalTabs] Exécution de created()')
    console.info('[HierarchicalTabs] Initialisation du composant')
  },
  mounted() {
    console.log('[HierarchicalTabs] Exécution de mounted()')
    console.info('[HierarchicalTabs] Composant monté')
  },
  methods: {
    /**
     * Gère le changement d'onglet parent
     * @param {Object} tab - L'onglet à activer
     */
    handleTabSwitch(tab) {
      console.log('[HierarchicalTabs] Exécution de handleTabSwitch()', tab)
      // Vérifie si l'onglet est déjà réellement actif (affiché)
      if (this.store.isParentTabActive(tab.id_tab)) {
        console.info(`[HierarchicalTabs] Onglet ${tab.id_tab} déjà actif, pas de mise à jour.`)
        return
      }
      
      // Active l'onglet et désactive les enfants si nécessaire
      const wasActive = this.store.switchTab(tab.id_tab)
      if (!wasActive) {
        console.info(`[HierarchicalTabs] Changement d'onglet parent : ${tab.id_tab}`)
      }
    },
    
    /**
     * Gère le changement d'onglet enfant
     * @param {Object} tab - L'onglet enfant à activer
     */
    handleChildTabSwitch(tab) {
      console.log('[HierarchicalTabs] Exécution de handleChildTabSwitch()', tab)
      // Vérifie si l'onglet enfant est déjà actif
      if (this.store.activeChildTabId === tab.id_tab) {
        console.info(`[HierarchicalTabs] Onglet enfant ${tab.id_tab} déjà actif, pas de mise à jour.`)
        return
      }

      // Active l'onglet enfant
      const wasActive = this.store.switchChildTab(tab.id_tab)
      if (!wasActive) {
        console.info(`[HierarchicalTabs] Changement d'onglet enfant : ${tab.id_tab}`)
      }
    },

    /**
     * Formate un UUID en version courte (8 premiers caractères)
     * @param {string} uuid - L'UUID complet
     * @returns {string} - Version courte de l'UUID
     */
    formatShortId(uuid) {
      if (!uuid) return 'N/A'
      return uuid.substring(0, 8)
    },

    /**
     * Formate une date en format court (JJ/MM/AAAA)
     * @param {string} dateString - Date au format ISO
     * @returns {string} - Date formatée
     */
    formatDate(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    },

    /**
     * Retourne la classe CSS appropriée pour un statut
     * @param {string} status - Le statut du ticket
     * @returns {string} - Nom de la classe CSS
     */
    getStatusClass(status) {
      if (!status) return 'unknown'
      const statusLower = status.toLowerCase()
      if (statusLower.includes('ouvert') || statusLower.includes('open')) return 'open'
      if (statusLower.includes('cours') || statusLower.includes('progress')) return 'in-progress'
      if (statusLower.includes('fermé') || statusLower.includes('close')) return 'closed'
      if (statusLower.includes('bloqué') || statusLower.includes('block')) return 'blocked'
      return 'default'
    }
  }
}
</script>

<style scoped src="@/assets/styles/hierarchicalTabs.css"></style>
