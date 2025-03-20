<template>
  <div class="entities-tab">
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
  name: 'EntitiesTab',
  components: {
    ReusableTableTab,
    TabControlButtons
  },
  setup() {
    const store = useTabsStore()
    return { store }
  },
  data() {
    return {
      apiUrl: `entities`,
      selectedRow: null
    }
  },
  computed: {
    columns() {
      return [
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
  },
  methods: {
    handleCreate() {
      this.store.openTab({
        id: 'entity-form-' + Date.now(),
        label: 'entities.createTitle',
        type: 'entity',
        icon: 'fas fa-plus',
        data: { mode: 'create' },
        parentId: this.store.activeTabId
      })
    },
    handleUpdate() {
      const selectedRows = this.$refs.table.filteredData.filter(row => row.selected)
      if (selectedRows.length > 0) {
        // Ouvrir un onglet pour chaque ligne sélectionnée
        selectedRows.forEach(row => {
          this.store.openTab({
            id: 'entity-form-' + row.uuid + '-' + Date.now(),
            label: row.name,
            type: 'entity',
            icon: 'fas fa-edit',
            mode: 'update',
            entityId: row.uuid,
            name: row.name,
            parentId: this.store.activeTabId
          })
        })
      } else {
        // Gérer le cas où aucune ligne n'est sélectionnée
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
                const response = await fetch(`${API_BASE_URL}/entities/import`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(jsonData)
                })
                
                if (response.ok) {
                  this.handleRefresh()
                } else {
                  throw new Error('Import failed')
                }
              } catch (error) {
                this.$emit('error', {
                  message: this.$t('errors.importFailed')
                })
              }
            }
            reader.readAsText(file)
          }
        }
        
        input.click()
      } catch (error) {
        this.$emit('error', {
          message: this.$t('errors.importFailed')
        })
      }
    },
    async handleExport() {
      try {
        const data = this.$refs.table.filteredData
        const jsonString = JSON.stringify(data, null, 2)
        const blob = new Blob([jsonString], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const fileName = `entities-export-${timestamp}.json`
        
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        
        // Nettoyage
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } catch (error) {
        this.$emit('error', {
          message: this.$t('errors.exportFailed')
        })
      }
    },
    onRowSelected(row) {
      // Mettre à jour selectedRow en fonction de l'état de sélection de la ligne
      const selectedRows = this.$refs.table.filteredData.filter(r => r.selected);
      this.selectedRow = selectedRows.length > 0 ? selectedRows[0] : null;
    },
    handleError(error) {
      this.$emit('error', error)
    }
  }
}
</script>

<style>
.entities-tab {
  padding: 1rem;
  height: 100%;
}
</style>
