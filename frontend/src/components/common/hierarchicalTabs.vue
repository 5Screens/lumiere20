<template>
  <div class="hierarchical-tabs">
    <!-- Onglets principaux (niveau 1) -->
    <div class="tabs-container primary-tabs">
      <div 
        v-for="tab in store.parentTabs" 
        :key="tab.id_tab" 
        class="tab" 
        :class="{ active: store.isParentTabActive(tab.id_tab) }"
        @click="handleTabSwitch(tab)"
      >
        <i v-if="tab.icon" :class="tab.icon"></i>
        <span class="tab-title">{{ $t(tab.label) }}</span>
        <button class="close-tab" @click.stop="store.closeTab(tab.id_tab)">×</button>
      </div>
    </div>
    
    <!-- Onglets secondaires (niveau 2) si un onglet parent est actif -->
    <div v-if="store.activeChildTabs.length > 0" class="tabs-container secondary-tabs">
      <div 
        v-for="tab in store.activeChildTabs" 
        :key="tab.id_tab" 
        class="tab" 
        :class="{ active: store.activeChildTabId === tab.id_tab }"
        @click="handleChildTabSwitch(tab)"
      >
        <i v-if="tab.icon" :class="tab.icon"></i>
        <span class="tab-title">{{ $t(tab.label) }}</span>
        <button class="close-tab" @click.stop="store.closeTab(tab.id_tab)">×</button>
      </div>
    </div>
    
    <!-- Contenu des onglets (tous les onglets sont rendus mais seul l'actif est visible) -->
    <div class="tab-content">
      <!-- Onglets parents - affichés uniquement s'ils sont réellement actifs (pas d'onglet enfant actif) -->
      <div v-for="tab in store.parentTabs" :key="tab.id_tab" v-show="store.isParentTabActive(tab.id_tab)">
        <component 
          :is="getComponentByType(tab.type)" 
          :data="getComponentData(tab)"
          :tabId="tab.id_tab"
        />
      </div>
      
      <!-- Onglets enfants - Utilisation de keep-alive pour conserver l'instance des composants -->
      <keep-alive>
        <div v-for="tab in store.tabs.filter(t => t.parentId)" :key="tab.id_tab" v-show="store.activeChildTabId === tab.id_tab">
          <component 
            :is="getComponentByType(tab.type)" 
            :data="getComponentData(tab)"
            :tabId="tab.id_tab"
          />
        </div>
      </keep-alive>
    </div>
  </div>
</template>

<script>
import { useTabsStore } from '@/stores/tabsStore'
import ObjectsTab from '@/components/objectsTab.vue'
import SymptomsForm from '@/components/coreForms/symptomsForm.vue'
import EntityForm from '@/components/coreForms/entityForm.vue'
import { Entity } from '@/models/Entity'
import { Symptom } from '@/models/Symptom'
import { Ticket } from '@/models/Ticket'
import { Incident } from '@/models/Incident'
import { Problem } from '@/models/Problem'
import { Change } from '@/models/Change'
import { Knowledge_article } from '@/models/Knowledge_article'
import { Project } from '@/models/Project'
import { Sprint } from '@/models/Sprint'
import { Epic } from '@/models/Epic'
import { Story } from '@/models/Story'
import { Defect } from '@/models/Defect'

export default {
  name: 'HierarchicalTabs',
  components: {
    ObjectsTab,
    SymptomsForm,
    EntityForm
  },
  setup() {
    console.log('[HierarchicalTabs] Exécution de setup()')
    const store = useTabsStore()
    return { store }
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
    
    // Obtenir le nom du composant en fonction du type d'onglet
    getComponentByType(type) {
      console.log('[HierarchicalTabs] Exécution de getComponentByType()', type);
      console.log('[HierarchicalTabs] Stack trace de getComponentByType:', new Error().stack);
      const componentMap = {
        'symptoms': 'ObjectsTab',
        'entities': 'ObjectsTab',
        'tickets': 'ObjectsTab',
        'incidents': 'ObjectsTab',
        'problems': 'ObjectsTab',
        'changes': 'ObjectsTab',
        'knowledge': 'ObjectsTab',
        'projects': 'ObjectsTab',
        'sprints': 'ObjectsTab',
        'epics': 'ObjectsTab',
        'stories': 'ObjectsTab',
        'defects': 'ObjectsTab',
        'symptom': 'SymptomsForm',
        'entity': 'EntityForm'
        // 'incident': 'ObjectTab' // À implémenter plus tard
      }
      return componentMap[type] || null
    },
    
    // Obtenir les données du composant en fonction de l'onglet
    getComponentData(tab) {
      console.log('[HierarchicalTabs] Exécution de getComponentData()', tab);
      console.log('[HierarchicalTabs] Stack trace de getComponentData:', new Error().stack);
      // Pour ObjectsTab, ajouter des données supplémentaires
      if (tab) {
        const modelMap = {
          'symptoms': Symptom,
          'entities': Entity,
          'tickets': Ticket,
          'incidents': Incident,
          'problems': Problem,
          'changes': Change,
          'knowledge': Knowledge_article,
          'projects': Project,
          'sprints': Sprint,
          'epics': Epic,
          'stories': Story,
          'defects': Defect
        }
        
        const model = modelMap[tab.type]
        if (model && typeof model.getApiEndpoint === 'function') {
          return {
            ...tab,
            apiEndpoint: model.getApiEndpoint(),
            objectType: tab.type
          }
        }
      }
      
      return tab || null
    }
  }
}
</script>

<style scoped src="@/assets/styles/hierarchicalTabs.css"></style>
