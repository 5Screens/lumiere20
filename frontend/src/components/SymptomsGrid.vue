<template>
  <!--
  A wrapper div containing the symptoms grid.
  The ag-grid-vue component is styled with the 'ag-theme-alpine' class.
  The grid is configured for multiple row selection, cell text selection, and row drag management.
  The grid is also configured to animate rows when they are inserted, updated, or deleted.
  -->
  <div class="symptoms-grid">
    <div class="grid-container">
      <div class="floating-add-button" @click="addNewRow">
        <span>+</span>
      </div>
      <ag-grid-vue
        class="ag-theme-alpine"
        :columnDefs="columnDefs"
        :rowData="rowData"
        :defaultColDef="defaultColDef"
        :pagination="true"
        :rowSelection="'multiple'"
        :enableCellTextSelection="true"
        :rowDragManaged="true"
        :animateRows="true"
        @grid-ready="onGridReady"
      />
    </div>
  </div>
</template>

<script>
import { AgGridVue } from 'ag-grid-vue3'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

export default {
  name: 'SymptomsGrid',
  components: {
    AgGridVue
  },
  props: {
    data: {
      type: Array,
      required: true,
      default: () => []
    }
  },
  data() {
    return {
      gridApi: null,
      currentRowIndex: null,
      columnDefs: [
        {
          field: 'uuid',
          headerName: this.$t('symptoms.uuid'),
          sortable: true,
          filter: 'agTextColumnFilter',
          resizable: true
        },
        {
          field: 'code',
          headerName: this.$t('symptoms.code'),
          sortable: true,
          filter: 'agTextColumnFilter',
          resizable: true,
          editable: true
        },
        {
          field: 'libelle',
          headerName: this.$t('symptoms.libelle'),
          sortable: true,
          filter: 'agTextColumnFilter',
          resizable: true,
          editable: true
        },
        {
          field: 'langue',
          headerName: this.$t('symptoms.langue'),
          sortable: true,
          filter: 'agTextColumnFilter',
          resizable: true,
          editable: true
        },

      ],
      defaultColDef: {
        flex: 1,
        minWidth: 100,
        enableValue: true,
        enableRowGroup: true,
        enablePivot: true,
        sortable: true,
        filter: true
      }
    }
  },
  computed: {
    rowData() {
      return Array.isArray(this.data) ? this.data : []
    }
  },
  methods: {
    onGridReady(params) {
      this.gridApi = params.api
      this.gridApi.sizeColumnsToFit()

      // Ajout des événements pour gérer l'affichage du bouton flottant
      const gridElement = document.querySelector('.ag-center-cols-container')
      const gridContainer = document.querySelector('.grid-container')
      if (gridElement && gridContainer) {
        gridElement.addEventListener('mouseover', this.handleRowHover)
        gridContainer.addEventListener('mouseleave', this.handleGridLeave)
      }
    },
    
    handleRowHover(event) {
      const row = event.target.closest('.ag-row')
      if (row) {
        const addButton = document.querySelector('.floating-add-button')
        if (addButton) {
          const rowRect = row.getBoundingClientRect()
          const gridRect = document.querySelector('.grid-container').getBoundingClientRect()
          const rowHeight = row.offsetHeight
          addButton.style.opacity = '1'
          addButton.style.top = `${rowRect.top - gridRect.top + rowHeight}px`
          
          // Stocke l'index de la ligne courante
          this.currentRowIndex = parseInt(row.getAttribute('row-index'))
        }
      }
    },

    handleGridLeave() {
      const addButton = document.querySelector('.floating-add-button')
      if (addButton) {
        addButton.style.opacity = '0'
        this.currentRowIndex = null
      }
    },

    addNewRow() {
      const newRow = {
        uuid: crypto.randomUUID(),
        code: '',
        libelle: '',
        langue: 'fr'
      }

      if (this.currentRowIndex !== null && this.gridApi) {
        // Récupère toutes les lignes actuelles
        const allRows = []
        this.gridApi.forEachNode(node => allRows.push(node.data))
        
        // Insère la nouvelle ligne à la position currentRowIndex + 1
        allRows.splice(this.currentRowIndex + 1, 0, newRow)
        
        // Met à jour la grille avec les nouvelles données
        this.gridApi.setRowData(allRows)
        
        // Sélectionne la nouvelle ligne
        setTimeout(() => {
          this.gridApi.getDisplayedRowAtIndex(this.currentRowIndex + 1).setSelected(true)
        }, 100)
      }
    },
    
    exportToCsv() {
      if (this.gridApi) {
        this.gridApi.exportDataAsCsv()
      }
    }
  }
}
</script>

<style scoped>
.symptoms-grid {
  height: calc(100vh - 200px);
  width: 100%;
  position: relative;
}

.grid-container {
  position: relative;
  height: 100%;
  width: 100%;
}

.ag-theme-alpine {
  height: 100%;
  width: 100%;
}

/* Style pour le bouton flottant */
.floating-add-button {
  position: absolute;
  left: -20px;
  width: 40px;
  height: 40px;
  background-color: #4285f4;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s ease, transform 0.2s ease;
  z-index: 1000;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  transform: translateY(-50%);
}

.floating-add-button:hover {
  transform: translateY(-50%) scale(1.1);
}

/* Style pour l'animation au survol des lignes */
:deep(.ag-row) {
  transition: border-bottom 0.3s ease;
  border-bottom: 2px solid transparent;
}

:deep(.ag-row:hover) {
  border-bottom: 2px solid #4285f4;
}
</style>
