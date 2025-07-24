<template>
  <div class="objects-tab">
    <!-- Boutons de contrôle -->
    <tab-control-buttons
      :has-selection="selectedRow !== null"
      @create="handleCreate"
      @update="handleUpdate"
      @delete="handleDelete"
      @import="handleImport"
      @export="handleExport"
      @refresh="handleRefresh"
    />
    <!-- Indicateur de chargement -->
    <div v-if="loading" class="loading-indicator">
      {{ $t('common.loading') }}
    </div>
    <!-- Tableau réutilisable -->
    <reusable-table-tab
      ref="table"
      :api-url="apiUrl"
      :columns="columns"
      @row-selected="onRowSelected"
      @error="handleError"
      :selectable="true"
      :filterable="true"
      :paginated="true"
    />
  </div>
</template>

<script>
import ReusableTableTab from './common/reusableTableTab.vue'
import TabControlButtons from './common/tabControlButtons.vue'
import { useTabsStore } from '@/stores/tabsStore'
import { Entity } from '@/models/Entity'
import { Symptom } from '@/models/Symptom'
import { Task } from '@/models/Task'
import { Incident } from '@/models/Incident'
import { Problem } from '@/models/Problem'
import { Change } from '@/models/Change'
import { Knowledge_article } from '@/models/Knowledge_article'
import { Project } from '@/models/Project'
import { Sprint } from '@/models/Sprint'
import { Epic } from '@/models/Epic'
import { Story } from '@/models/Story'
import { Defect } from '@/models/Defect'
import '../assets/styles/tab.css'

export default {
  name: 'ObjectsTab',
  components: {
    ReusableTableTab,
    TabControlButtons
  },
  props: {
    data: {
      type: Object,
      required: true,
      default: () => ({})
    }
  },
  setup() {
    const store = useTabsStore()
    return { store }
  },
  data() {
    return {
      apiUrl: this.getApiEndpoint("GET"),
      selectedRow: null,
      objectType: this.data.objectType || '',
      loading: false
    }
  },
  mounted() {
    console.log('[ObjectsTab] Exécution de mounted()', this.store.activeTabId);
    // Après un rafraîchissement de la page, même si l'onglet est marqué comme chargé,
    // les données ne sont pas réellement présentes dans le composant ReusableTableTab
    // On vérifie donc si le tableau a des données
    this.$nextTick(() => {
      if (this.$refs.table && (!this.$refs.table.items || this.$refs.table.items.length === 0)) {
        console.log('[ObjectsTab] Tableau vide après rafraîchissement, rechargement des données');
        this.fetchData(true); // Force le rechargement
      } else if (!this.store.isTabLoaded(this.store.activeTabId)) {
        console.log('[ObjectsTab] Onglet non chargé, chargement initial des données');
        this.fetchData();
      }
    });
  },
  // Le watcher a été supprimé car il causait une double initialisation
  computed: {
    columns() {
      // Utiliser directement la classe du modèle depuis this.data.class
      console.log('[ObjectsTab] Calcul des colonnes - data:', this.data);
      console.log('[ObjectsTab] Calcul des colonnes - objectType:', this.objectType);
      
      const modelClass = this.data.class;
      console.log('[ObjectsTab] Classe du modèle:', modelClass);
      
      if (modelClass && typeof modelClass.getColumns === 'function') {
        const columns = modelClass.getColumns();
        console.log('[ObjectsTab] Colonnes récupérées:', columns.length, 'colonnes');
        return columns;
      }
      
      console.warn('[ObjectsTab] Aucune classe de modèle ou méthode getColumns disponible');
      // Colonnes par défaut si la classe n'existe pas
      return []
    },
    // Les computed properties formType, createTitle, uniqueIdentifier et nameField
    // ont été supprimées car elles sont remplacées par les getters de class
  },
  methods: {
    handleCreate() {
      // Utiliser les getters de la classe pour obtenir les informations
      const modelClass = this.data.class;
      if (!modelClass) {
        console.error('[ObjectsTab] Aucune classe de modèle définie pour ce type d’objet');
        return;
      }
      
      this.store.openTab({
        id_tab: `${this.objectType}-form-${Date.now()}`,
        label: this.$t(modelClass.getCreateTitle()),
        type: 'form',
        icon: 'fas fa-plus',
        mode: 'creation',
        objectClass: this.objectType,
        class: modelClass,
        parentId: this.store.activeTabId
      })
    },
    handleUpdate() {
      const selectedRows = this.$refs.table.filteredData.filter(row => row.selected)
      
      if (selectedRows.length > 0) {
        const modelClass = this.data.class;
        console.log('[ObjectsTab] DEBUG handleUpdate - objectType:', this.objectType);
        console.log('[ObjectsTab] DEBUG handleUpdate - this.data:', this.data);
        console.log('[ObjectsTab] DEBUG handleUpdate - modelClass:', modelClass);
        console.log('[ObjectsTab] DEBUG handleUpdate - modelClass type:', typeof modelClass);
        console.log('[ObjectsTab] DEBUG handleUpdate - modelClass.name:', modelClass?.name);
        console.log('[ObjectsTab] DEBUG handleUpdate - modelClass.getUniqueIdentifier:', typeof modelClass?.getUniqueIdentifier);
        
        if (!modelClass) {
          console.error('[ObjectsTab] Aucune classe de modele definie pour ce type d objet');
          return;
        }
        
        if (typeof modelClass.getUniqueIdentifier !== 'function') {
          console.error('[ObjectsTab] getUniqueIdentifier n est pas une fonction sur modelClass:', modelClass);
          return;
        }
        
        const uniqueIdentifier = modelClass.getUniqueIdentifier();
        const childTabLabel = modelClass.getChildTabLabel();
        
        if (this.objectType === 'symptoms') {
          // Logique spécifique pour les symptômes (grouper par code)
          const uniqueSymptomCodes = [...new Set(selectedRows.map(row => row.symptom_code))]
          
          uniqueSymptomCodes.forEach(symptomCode => {
            if (!symptomCode) return // Ignorer les lignes sans code de symptôme
            
            this.store.openTab({
              id_tab: `${this.objectType}-form-${symptomCode}-${Date.now()}`,
              label: symptomCode,
              type: 'form',
              icon: 'fas fa-edit',
              mode: 'update',
              objectClass: this.objectType,
              objectId: symptomCode,
              class: modelClass,
              parentId: this.store.activeTabId
            })
          })
        } else {
          // Logique pour les autres types d'objets
          selectedRows.forEach(row => {
            this.store.openTab({
              id_tab: `${this.objectType}-form-${row[uniqueIdentifier]}-${Date.now()}`,
              label: row[childTabLabel],
              type: 'form',
              icon: 'fas fa-edit',
              mode: 'update',
              objectClass: this.objectType,
              objectId: row.uuid,
              class: modelClass,
              parentId: this.store.activeTabId
            })
          })
        }
      } else {
        this.$emit('error', {
          message: this.$t('errors.selectRowsForUpdate')
        })
      }
    },
    handleDelete() {
      const selectedRows = this.$refs.table.filteredData.filter(row => row.selected)
      if (selectedRows.length > 0) {
        this.$emit('delete', selectedRows)
      } else {
        this.$emit('error', {
          message: this.$t('errors.selectRowsForDelete')
        })
      }
    },
    handleRefresh() {
      this.fetchData(true)
    },
    async fetchData(forceRefresh = false) {
      // Si les données sont déjà chargées et qu'on ne force pas le rafraîchissement, on ne fait rien
      if (!forceRefresh && this.store.isTabLoaded(this.store.activeTabId)) {
        return
      }
      
      // Ajout d'un log pour déboguer
      console.log('[ObjectsTab] Chargement des données pour l\'onglet', this.store.activeTabId)
      
      this.loading = true
      try {
        await this.$refs.table.fetchData()
        // Marquer l'onglet comme chargé dans le store
        this.store.markTabAsLoaded(this.store.activeTabId)
      } catch (error) {
        this.handleError(error)
      } finally {
        this.loading = false
      }
    },
    async handleImport() {
      try {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        
        input.onchange = async (e) => {
          const file = e.target.files[0]
          if (file) {
            const reader = new FileReader()
            reader.onload = async (event) => {
              try {
                const jsonData = JSON.parse(event.target.result)
                const importUrl = `${this.apiUrl}/import`
                
                const response = await fetch(importUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(jsonData)
                })
                
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`)
                }
                
                await this.handleRefresh()
                this.$emit('success', {
                  message: this.$t('success.importComplete')
                })
              } catch (error) {
                this.$emit('error', {
                  message: this.$t('errors.importFailed'),
                  details: error.message
                })
              }
            }
            reader.readAsText(file)
          }
        }
        input.click()
      } catch (error) {
        this.$emit('error', {
          message: this.$t('errors.importFailed'),
          details: error.message
        })
      }
    },
    async handleExport() {
      try {
        const data = this.$refs.table.filteredData
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const filename = `${this.objectType}_export_${timestamp}.json`
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        this.$emit('success', {
          message: this.$t('success.exportComplete')
        })
      } catch (error) {
        this.$emit('error', {
          message: this.$t('errors.exportFailed'),
          details: error.message
        })
      }
    },
    onRowSelected(row) {
      // Mettre à jour selectedRow en fonction de l'état de sélection de la ligne
      const selectedRows = this.$refs.table.filteredData.filter(r => r.selected)
      this.selectedRow = selectedRows.length > 0 ? selectedRows[0] : null
    },
    handleError(error) {
      this.$emit('error', error)
    },
    
    // Utiliser les getters de class pour obtenir l'endpoint API
    getApiEndpoint() {
      const modelClass = this.data.class;
      if (modelClass && typeof modelClass.getApiEndpoint === 'function') {
        return modelClass.getApiEndpoint()
      }
      
      // Endpoint par défaut si la classe n'existe pas
      return this.data.apiEndpoint || this.objectType || ''
    }
  }
}
</script>

<style>
  /* Styles spécifiques au composant */
  .objects-tab {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .loading-indicator {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: rgba(255, 255, 255, 0.8);
    padding: 10px 20px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 100;
  }
</style>
