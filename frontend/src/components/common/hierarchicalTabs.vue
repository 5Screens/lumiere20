<template>
  <div class="hierarchical-tabs">
    <!-- Onglets principaux (niveau 1) -->
    <div class="tabs-container primary-tabs">
      <div 
        v-for="tab in store.parentTabs" 
        :key="tab.id_tab" 
        class="tab" 
        :class="{ active: store.activeTabId === tab.id_tab }"
        @click="store.switchTab(tab.id_tab)"
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
        @click="store.switchChildTab(tab.id_tab)"
      >
        <i v-if="tab.icon" :class="tab.icon"></i>
        <span class="tab-title">{{ $t(tab.label) }}</span>
        <button class="close-tab" @click.stop="store.closeTab(tab.id_tab)">×</button>
      </div>
    </div>
    
    <!-- Contenu de l'onglet actif -->
    <div class="tab-content">
      <component 
        :is="activeComponent" 
        :data="activeComponentData"
        :key="activeComponentKey"
      />
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

export default {
  name: 'HierarchicalTabs',
  components: {
    ObjectsTab,
    SymptomsForm,
    EntityForm
  },
  setup() {
    const store = useTabsStore()
    return { store }
  },
  computed: {
    // Déterminer le composant à afficher en fonction de l'onglet actif
    activeComponent() {
      const activeTab = this.store.activeChildTab || this.store.activeTab
      return activeTab ? this.getComponentByType(activeTab.type) : null
    },
    
    // Obtenir les données du composant actif
    activeComponentData() {
      const activeTab = this.store.activeChildTab || this.store.activeTab
      
      // Pour ObjectsTab, ajouter des données supplémentaires
      if (activeTab) {
        if (activeTab.type === 'symptoms') {
          return {
            ...activeTab,
            apiEndpoint: Symptom.getApiEndpoint(),
            objectType: activeTab.type
          }
        } else if (activeTab.type === 'entities') {
          return {
            ...activeTab,
            apiEndpoint: Entity.getApiEndpoint(),
            objectType: activeTab.type
          }
        } else if (activeTab.type === 'tickets') {
          return {
            ...activeTab,
            apiEndpoint: Ticket.getApiEndpoint(),
            objectType: activeTab.type
          }
        } else if (activeTab.type === 'incidents') {
          return {
            ...activeTab,
            apiEndpoint: Incident.getApiEndpoint(),
            objectType: activeTab.type
          }
        } else if (activeTab.type === 'problems') {
          return {
            ...activeTab,
            apiEndpoint: Problem.getApiEndpoint(),
            objectType: activeTab.type
          }
        } else if (activeTab.type === 'changes') {
          return {
            ...activeTab,
            apiEndpoint: Change.getApiEndpoint(),
            objectType: activeTab.type
          }
        } else if (activeTab.type === 'knowledge') {
          return {
            ...activeTab,
            apiEndpoint: Knowledge_article.getApiEndpoint(),
            objectType: activeTab.type
          }
        } else if (activeTab.type === 'projects') {
          return {
            ...activeTab,
            apiEndpoint: Project.getApiEndpoint(),
            objectType: activeTab.type
          }
        } else if (activeTab.type === 'sprints') {
          return {
            ...activeTab,
            apiEndpoint: Sprint.getApiEndpoint(),
            objectType: activeTab.type
          }
        }
      }
      
      return activeTab || null
    },
    
    // Clé unique pour forcer la réinitialisation du composant
    activeComponentKey() {
      if (this.store.activeChildTabId) {
        return `child-${this.store.activeChildTabId}`
      }
      return `parent-${this.store.activeTabId}`
    }
  },
  methods: {
    // Obtenir le nom du composant en fonction du type d'onglet
    getComponentByType(type) {
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
        'symptom': 'SymptomsForm',
        'entity': 'EntityForm'
        // 'incident': 'ObjectTab' // À implémenter plus tard
      }
      return componentMap[type] || null
    }
  }
}
</script>

<style scoped src="@/assets/styles/hierarchicalTabs.css"></style>
