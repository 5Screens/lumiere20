<template>
  <div class="hierarchical-tabs">
    <!-- Onglets principaux (niveau 1) -->
    <div class="tabs-container primary-tabs">
      <div 
        v-for="tab in primaryTabs" 
        :key="tab.id" 
        class="tab" 
        :class="{ active: activeTabId === tab.id }"
        @click="switchTab(tab.id)"
      >
        <span class="tab-title">{{ tab.title }}</span>
        <button class="close-tab" @click.stop="closeTab(tab.id)">×</button>
      </div>
    </div>
    
    <!-- Onglets secondaires (niveau 2) si un onglet parent est actif -->
    <div v-if="hasChildTabs" class="tabs-container secondary-tabs">
      <div 
        v-for="tab in childTabsOfActiveTab" 
        :key="tab.id" 
        class="tab" 
        :class="{ active: activeChildTabId === tab.id }"
        @click="switchChildTab(tab.id)"
      >
        <span class="tab-title">{{ tab.title }}</span>
        <button class="close-tab" @click.stop="closeChildTab(tab.id)">×</button>
      </div>
    </div>
    
    <!-- Contenu de l'onglet actif -->
    <div class="tab-content">
      <component 
        :is="activeComponent" 
        :data="activeComponentData"
        :key="activeComponentKey"
        @open-tab="handleOpenTab"
        @open-child-tab="handleOpenChildTab"
        @close-tab="closeTab"
        @close-child-tab="closeChildTab"
      />
    </div>
  </div>
</template>

<script>
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
  props: {
    tabs: {
      type: Array,
      required: true
    },
    activeTabId: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      activeChildTabId: null
    };
  },
  computed: {
    // Filtrer les onglets de premier niveau (sans parentId)
    primaryTabs() {
      return this.tabs.filter(tab => !tab.parentId);
    },
    
    // Vérifier si l'onglet actif a des onglets enfants
    hasChildTabs() {
      return this.childTabsOfActiveTab.length > 0;
    },
    
    // Obtenir tous les onglets enfants de l'onglet actif
    childTabsOfActiveTab() {
      return this.tabs.filter(tab => tab.parentId === this.activeTabId);
    },
    
    // Déterminer le composant à afficher en fonction de l'onglet actif et de l'onglet enfant actif
    activeComponent() {
      if (this.activeChildTabId) {
        const childTab = this.tabs.find(tab => tab.id === this.activeChildTabId);
        return childTab ? this.getComponentByType(childTab.type) : null;
      }
      
      const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
      return activeTab ? this.getComponentByType(activeTab.type) : null;
    },
    
    // Obtenir les données du composant actif
    activeComponentData() {
      if (this.activeChildTabId) {
        const childTab = this.tabs.find(tab => tab.id === this.activeChildTabId);
        return childTab ? childTab.data : null;
      }
      
      const activeTab = this.tabs.find(tab => tab.id === this.activeTabId);
      return activeTab ? activeTab.data : null;
    },
    
    // Clé unique pour forcer la réinitialisation du composant
    activeComponentKey() {
      if (this.activeChildTabId) {
        return `child-${this.activeChildTabId}`;
      }
      return `parent-${this.activeTabId}`;
    }
  },
  methods: {
    // Changer l'onglet principal actif
    switchTab(tabId) {
      this.$emit('update:activeTabId', tabId);
      this.activeChildTabId = null; // Réinitialiser l'onglet enfant actif
    },
    
    // Changer l'onglet enfant actif
    switchChildTab(tabId) {
      this.activeChildTabId = tabId;
    },
    
    // Fermer un onglet principal
    closeTab(tabId) {
      // Trouver tous les onglets enfants associés à cet onglet
      const childTabs = this.tabs.filter(tab => tab.parentId === tabId);
      
      // Émettre un événement pour fermer l'onglet et tous ses enfants
      this.$emit('close-tab', { tabId, childTabIds: childTabs.map(tab => tab.id) });
      
      // Si l'onglet fermé est l'onglet actif, réinitialiser l'onglet enfant actif
      if (tabId === this.activeTabId) {
        this.activeChildTabId = null;
      }
    },
    
    // Fermer un onglet enfant
    closeChildTab(tabId) {
      this.$emit('close-child-tab', tabId);
      
      // Si l'onglet enfant fermé est l'onglet enfant actif, réinitialiser
      if (tabId === this.activeChildTabId) {
        this.activeChildTabId = null;
      }
    },
    
    // Gérer l'ouverture d'un nouvel onglet principal
    handleOpenTab(tabData) {
      this.$emit('open-tab', tabData);
    },
    
    // Gérer l'ouverture d'un nouvel onglet enfant
    handleOpenChildTab(tabData) {
      // Ajouter le parentId à tabData
      const childTabData = {
        ...tabData,
        parentId: this.activeTabId
      };
      
      this.$emit('open-child-tab', childTabData);
      this.activeChildTabId = childTabData.id;
    },
    
    // Obtenir le nom du composant en fonction du type d'onglet
    getComponentByType(type) {
      const componentMap = {
        'symptoms': 'SymptomsTab',
        'entities': 'EntitiesTab',
        'symptomForm': 'SymptomsForm',
        'entityForm': 'EntityForm'
        // Ajouter d'autres mappages de types vers des composants ici
      };
      
      return componentMap[type] || null;
    }
  },
  watch: {
    // Surveiller les changements dans les onglets pour mettre à jour l'onglet enfant actif si nécessaire
    tabs: {
      handler(newTabs) {
        // Si l'onglet enfant actif n'existe plus, le réinitialiser
        if (this.activeChildTabId && !newTabs.some(tab => tab.id === this.activeChildTabId)) {
          this.activeChildTabId = null;
        }
      },
      deep: true
    },
    
    // Surveiller les changements dans l'onglet actif pour mettre à jour l'onglet enfant actif si nécessaire
    activeTabId(newTabId) {
      // Vérifier si l'onglet enfant actif appartient toujours à l'onglet parent actif
      if (this.activeChildTabId) {
        const childTab = this.tabs.find(tab => tab.id === this.activeChildTabId);
        if (!childTab || childTab.parentId !== newTabId) {
          this.activeChildTabId = null;
        }
      }
    }
  }
};
</script>

<style scoped>
.hierarchical-tabs {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tabs-container {
  display: flex;
  overflow-x: auto;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.primary-tabs {
  background-color: #f0f0f0;
}

.secondary-tabs {
  background-color: #f8f8f8;
  padding-left: 20px; /* Indentation pour montrer la hiérarchie */
}

.tab {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  border-right: 1px solid #ddd;
  transition: background-color 0.2s ease;
}

.tab:hover {
  background-color: #e0e0e0;
}

.tab.active {
  background-color: #fff;
  border-bottom: 2px solid #4285f4;
}

.tab-title {
  margin-right: 8px;
}

.close-tab {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.close-tab:hover {
  opacity: 1;
}

.tab-content {
  flex: 1;
  padding: 16px;
  overflow: auto;
}
</style>
