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
    
    <!-- Contenu des onglets (tous les onglets sont rendus mais seul l'actif est visible) -->
    <div class="tab-content">
      <!-- Onglets parents -->
      <div v-for="tab in store.parentTabs" :key="tab.id_tab" v-show="store.activeTabId === tab.id_tab && !store.activeChildTabId">
        <component 
          :is="getComponentByType(tab.type)" 
          :data="getComponentData(tab)"
          :tabId="tab.id_tab"
        />
      </div>
      
      <!-- Onglets enfants -->
      <div v-for="tab in store.activeChildTabs" :key="tab.id_tab" v-show="store.activeChildTabId === tab.id_tab">
        <component 
          :is="getComponentByType(tab.type)" 
          :data="getComponentData(tab)"
          :tabId="tab.id_tab"
        />
      </div>
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
    const store = useTabsStore()
    return { store }
  },
  computed: {
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
