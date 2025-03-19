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
        <span class="tab-title">{{ tab.label }}</span>
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
        <span class="tab-title">{{ tab.label }}</span>
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
import SymptomsTab from '@/components/SymptomsTab.vue'
import EntitiesTab from '@/components/entitiesTab.vue'
import SymptomsForm from '@/components/coreForms/symptomsForm.vue'
import EntityForm from '@/components/coreForms/entityForm.vue'

export default {
  name: 'HierarchicalTabs',
  components: {
    SymptomsTab,
    EntitiesTab,
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
        'symptoms': 'SymptomsTab',
        'entities': 'EntitiesTab',
        'symptom': 'SymptomsForm',
        'entity': 'EntityForm'
      }
      return componentMap[type] || null
    }
  }
}
</script>

<style scoped src="@/assets/styles/hierarchicalTabs.css"></style>
