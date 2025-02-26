<template>
  <div class="symptoms-tab">
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

export default {
  name: 'SymptomsTab',
  components: {
    ReusableTableTab,
    TabControlButtons
  },
  data() {
    return {
      apiUrl: `symptoms`,
      selectedRow: null
    }
  },
  computed: {
    columns() {
      return [
        { key: 'uuid', label: this.$t('symptomsTable.headers.id'), type: 'uuid' },
        { key: 'date_creation', label: this.$t('symptomsTable.headers.createdDate'), type: 'date', format: 'YYYY-MM-DD' },
        { key: 'date_modification', label: this.$t('symptomsTable.headers.updateDate'), type: 'date', format: 'YYYY-MM-DD' },
        { key: 'symptom_code', label: this.$t('symptomsTable.headers.symptomCode'), type: 'text' },
        { key: 'libelle', label: this.$t('symptomsTable.headers.symptomLabel'), type: 'text' },
        { key: 'langue', label: this.$t('symptomsTable.headers.symptomLanguage'), type: 'text' }
      ]
    }
  },
  methods: {
    handleCreate() {
      // Générer un ID unique pour le nouvel onglet
      const tabId = 'symptom-form-' + Date.now()
      
      // Émettre un événement pour ouvrir un nouvel onglet avec le formulaire de création
      this.$emit('open-tab', {
        id: tabId,
        title: this.$t('symptoms.createTitle'),
        type: 'symptomForm',
        data: {
          title: this.$t('symptoms.createTitle'),
          symptomId: null // Pas d'ID car c'est une création
        }
      })
    },
    handleUpdate() {
      const selectedRows = this.$refs.table.filteredData.filter(row => row.selected)
      if (selectedRows.length >= 1) {
        // Récupérer les codes de symptômes uniques
        const uniqueSymptomCodes = [...new Set(selectedRows.map(row => row.symptom_code))]
        
        // Pour chaque code de symptôme unique, ouvrir un onglet avec le formulaire
        uniqueSymptomCodes.forEach(symptomCode => {
          if (!symptomCode) {
            return // Ignorer les lignes sans code de symptôme
          }
          
          // Générer un ID unique pour le nouvel onglet
          const tabId = 'symptom-form-' + symptomCode + '-' + Date.now()
          
          // Émettre un événement pour ouvrir un nouvel onglet avec le formulaire de modification
          this.$emit('open-tab', {
            id: tabId,
            title: this.$t('symptoms.updateTitle', { code: symptomCode }),
            type: 'symptomForm',
            data: {
              title: this.$t('symptoms.updateTitle', { code: symptomCode }),
              symptomCode: symptomCode // Code du symptôme à modifier (au lieu de l'UUID)
            }
          })
        })
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
                const response = await fetch(`${this.apiUrl}/import`, {
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
        const filename = `symptoms_export_${timestamp}.json`
        
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
@import '@/assets/styles/symptoms-tab.css';
</style>