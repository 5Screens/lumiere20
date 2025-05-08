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
      apiUrl: this.data.apiEndpoint || '',
      selectedRow: null,
      objectType: this.data.objectType || ''
    }
  },
  computed: {
    columns() {
      // Colonnes par défaut (vide)
      const defaultColumns = []
      
      // Colonnes spécifiques par type d'objet
      const columnsByType = {
        'symptoms': [
          { key: 'uuid', label: this.$t('symptomsTable.headers.id'), type: 'uuid' },
          { key: 'date_creation', label: this.$t('symptomsTable.headers.createdDate'), type: 'date', format: 'YYYY-MM-DD' },
          { key: 'date_modification', label: this.$t('symptomsTable.headers.updateDate'), type: 'date', format: 'YYYY-MM-DD' },
          { key: 'symptom_code', label: this.$t('symptomsTable.headers.symptomCode'), type: 'text' },
          { key: 'libelle', label: this.$t('symptomsTable.headers.symptomLabel'), type: 'text' },
          { key: 'langue', label: this.$t('symptomsTable.headers.symptomLanguage'), type: 'text' }
        ],
        'entities': [
          { key: 'uuid', label: this.$t('entitiesTable.headers.uuid'), type: 'uuid', format: 'text' },
          { key: 'entity_id', label: this.$t('entitiesTable.headers.entity_id'), type: 'text', format: 'text' },
          { key: 'name', label: this.$t('entitiesTable.headers.name'), type: 'text', format: 'text' },
          { key: 'parent_entity_name', label: this.$t('entitiesTable.headers.parent_entity_name'), type: 'text', format: 'text' },
          { key: 'external_id', label: this.$t('entitiesTable.headers.external_id'), type: 'text', format: 'text' },
          { key: 'entity_type', label: this.$t('entitiesTable.headers.entity_type'), type: 'text', format: 'text' },
          { key: 'headquarters_location_name', label: this.$t('entitiesTable.headers.headquarters_location'), type: 'text', format: 'text' },
          { key: 'is_active', label: this.$t('entitiesTable.headers.is_active'), type: 'select', options: ['Yes', 'No'], format: 'text' },
          { key: 'budget_approver_name', label: this.$t('entitiesTable.headers.budget_approver_name'), type: 'text', format: 'text' },
          { key: 'date_creation', label: this.$t('entitiesTable.headers.date_creation'), type: 'date', format: 'YYYY-MM-DD' },
          { key: 'date_modification', label: this.$t('entitiesTable.headers.date_modification'), type: 'date', format: 'YYYY-MM-DD' }
        ]
      }
      
      return columnsByType[this.objectType] || defaultColumns
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
  created() {
    // Initialiser l'API URL et le type d'objet si non définis dans les props
    if (!this.apiUrl && this.objectType) {
      this.apiUrl = this.objectType
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
