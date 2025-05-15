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
      apiUrl: this.getApiEndpoint(),
      selectedRow: null,
      objectType: this.data.objectType || '',
      loading: false
    }
  },
  mounted() {
    // Vérifier si les données ont déjà été chargées pour cet onglet
    if (!this.store.isTabLoaded(this.store.activeTabId)) {
      this.fetchData()
    }
  },
  // Le watcher a été supprimé car il causait une double initialisation
  computed: {
    columns() {
      // Utiliser les modèles pour obtenir les colonnes
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
      
      const model = modelMap[this.objectType]
      if (model && typeof model.getColumns === 'function') {
        return model.getColumns()
      }
      
      // Colonnes par défaut si le modèle n'existe pas
      return []
    },
    formType() {
      const formTypeMap = {
        'symptoms': 'symptom',
        'entities': 'entity',
        'tickets': 'ticket',
        'incidents': 'incident',
        'problems': 'problem',
        'changes': 'change'
      }
      return formTypeMap[this.objectType] || ''
    },
    createTitle() {
      const titleMap = {
        'symptoms': 'symptoms.createTitle',
        'entities': 'entities.createTitle',
        'tickets': 'tickets.createTitle',
        'incidents': 'incidents.createTitle',
        'problems': 'problems.createTitle',
        'changes': 'changes.createTitle'
      }
      return titleMap[this.objectType] || ''
    },
    uniqueIdentifier() {
      const identifierMap = {
        'symptoms': 'symptom_code',
        'entities': 'uuid',
        'tickets': 'uuid',
        'incidents': 'uuid',
        'problems': 'uuid',
        'changes': 'uuid'
      }
      return identifierMap[this.objectType] || 'uuid'
    },
    nameField() {
      const nameMap = {
        'symptoms': 'symptom_code',
        'entities': 'name',
        'tickets': 'title',
        'incidents': 'title',
        'problems': 'title',
        'changes': 'title'
      }
      return nameMap[this.objectType] || 'name'
    }
  },
  methods: {
    handleCreate() {
      this.store.openTab({
        id: `${this.formType}-form-${Date.now()}`,
        label: this.createTitle,
        type: this.formType,
        icon: 'fas fa-plus',
        data: { mode: 'create' },
        parentId: this.store.activeTabId
      })
    },
    handleUpdate() {
      const selectedRows = this.$refs.table.filteredData.filter(row => row.selected)
      
      if (selectedRows.length > 0) {
        if (this.objectType === 'symptoms') {
          // Logique spécifique pour les symptômes (grouper par code)
          const uniqueSymptomCodes = [...new Set(selectedRows.map(row => row.symptom_code))]
          
          uniqueSymptomCodes.forEach(symptomCode => {
            if (!symptomCode) return // Ignorer les lignes sans code de symptôme
            
            this.store.openTab({
              id: `${this.formType}-form-${symptomCode}-${Date.now()}`,
              label: symptomCode,
              type: this.formType,
              icon: 'fas fa-edit',
              mode: 'update',
              symptomCode: symptomCode,
              parentId: this.store.activeTabId
            })
          })
        } else {
          // Logique pour les autres types d'objets
          selectedRows.forEach(row => {
            this.store.openTab({
              id: `${this.formType}-form-${row[this.uniqueIdentifier]}-${Date.now()}`,
              label: row[this.nameField],
              type: this.formType,
              icon: 'fas fa-edit',
              mode: 'update',
              entityId: row.uuid,
              name: row[this.nameField],
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
    
    // Utiliser les modèles pour obtenir l'endpoint API
    getApiEndpoint() {
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
        'stories': Story,
        'defects': Defect
      }
      
      const model = modelMap[this.objectType]
      if (model && typeof model.getApiEndpoint === 'function') {
        return model.getApiEndpoint()
      }
      
      // Endpoint par défaut si le modèle n'existe pas
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
