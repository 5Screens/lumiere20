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
      objectType: this.data.objectType || ''
    }
  },
  computed: {
    columns() {
      // Utiliser les modèles pour obtenir les colonnes
      const modelMap = {
        'symptoms': Symptom,
        'entities': Entity
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
        'entities': 'entity'
      }
      return formTypeMap[this.objectType] || ''
    },
    createTitle() {
      const titleMap = {
        'symptoms': 'symptoms.createTitle',
        'entities': 'entities.createTitle'
      }
      return titleMap[this.objectType] || ''
    },
    uniqueIdentifier() {
      const identifierMap = {
        'symptoms': 'symptom_code',
        'entities': 'uuid'
      }
      return identifierMap[this.objectType] || 'uuid'
    },
    nameField() {
      const nameMap = {
        'symptoms': 'symptom_code',
        'entities': 'name'
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
      this.$refs.table.fetchData()
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
    }
  },
  methods: {
    // Utiliser les modèles pour obtenir l'endpoint API
    getApiEndpoint() {
      const modelMap = {
        'symptoms': Symptom,
        'entities': Entity
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
.objects-tab {
  padding: 1rem;
  height: 100%;
}
</style>
