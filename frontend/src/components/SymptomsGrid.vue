<template>
  <div class="symptoms-grid">
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
      columnDefs: [
        {
          field: 'id',
          headerName: this.$t('symptoms.id'),
          sortable: true,
          filter: 'agTextColumnFilter',
          resizable: true
        },
        {
          field: 'name',
          headerName: this.$t('symptoms.name'),
          sortable: true,
          filter: 'agTextColumnFilter',
          resizable: true,
          editable: true
        },
        {
          field: 'description',
          headerName: this.$t('symptoms.description'),
          sortable: true,
          filter: 'agTextColumnFilter',
          resizable: true,
          editable: true
        }
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
}

.ag-theme-alpine {
  height: 100%;
  width: 100%;
}
</style>
