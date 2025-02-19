<template>
  <div class="reusable-table-tab">
    <!-- Tableau -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th class="resizable" v-if="selectable">
              <div class="th-content">
                <input type="checkbox" @change="toggleAllRows" v-model="selectAll" />
                <div class="resize-handle" @mousedown="startResize($event, 0)"></div>
              </div>
            </th>
            <th v-for="(column, index) in columns" :key="column.key" class="resizable">
              <div class="th-content">
                <div @click="sortBy(column.key)" class="sortable">
                  {{ column.label }}
                  <span class="sort-icon">
                    <template v-if="sortColumn === column.key">
                      {{ sortDirection === 'asc' ? '▲' : '▼' }}
                    </template>
                    <template v-else>▲▼</template>
                  </span>
                </div>
                <div class="resize-handle" @mousedown="startResize($event, index + (selectable ? 1 : 0))"></div>
              </div>
            </th>
          </tr>
          <tr class="filter-row" v-if="filterable">
            <th v-if="selectable"></th>
            <th v-for="column in columns" :key="column.key">
              <template v-if="column.type === 'date'">
                <input type="date" v-model="filters[column.key]" class="column-filter" />
              </template>
              <template v-else-if="column.type === 'select'">
                <div class="custom-multiselect">
                  <div class="multiselect-header" @click="toggleDropdown(column.key)">
                    <span v-if="!filters[column.key] || filters[column.key].length === 0">All</span>
                    <span v-else>{{ filters[column.key].length }} sélectionné(s)</span>
                    <span class="dropdown-arrow">▼</span>
                  </div>
                  <div class="multiselect-dropdown" v-show="dropdowns[column.key]">
                    <div class="multiselect-option" v-for="option in column.options" :key="option">
                      <label>
                        <input type="checkbox" 
                               :value="option" 
                               v-model="filters[column.key]">
                        {{ option }}
                      </label>
                    </div>
                  </div>
                </div>
              </template>
              <template v-else>
                <input type="text" v-model="filters[column.key]" :placeholder="'Filter ' + column.label + '...'" class="column-filter" />
              </template>
            </th>
          </tr>
        </thead>
        <transition-group name="list" tag="tbody">
          <tr v-for="row in paginatedData" 
              :key="row.id" 
              @click="toggleRowSelection(row)"
              :class="{ 'selected-row': row.selected }"
              style="cursor: pointer;">
            <td v-if="selectable" @click.stop><input type="checkbox" v-model="row.selected" /></td>
            <td v-for="column in columns" 
                :key="column.key"
                :title="row[column.key]"
                @contextmenu.prevent="showCopyIcon($event, row[column.key])">
              {{ formatCellContent(row[column.key], column.format) }}
            </td>
          </tr>
        </transition-group>
      </table>
    </div>

    <!-- Table footer -->
    <div class="table-footer">
      Total éléments trouvés : {{ filteredData.length }}
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="paginated">
      <button @click="previousPage" :disabled="currentPage === 1">&lt;</button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages">&gt;</button>
      <div class="items-per-page">
        <select v-model="itemsPerPage" @change="handleItemsPerPageChange">
          <option v-for="n in [5, 10, 20, 50, 100]" :key="n" :value="n">
            {{ n }} éléments
          </option>
        </select>
      </div>
    </div>
  </div>
  <div class="copy-icon" v-if="showCopyIconAt" :style="copyIconStyle" @click="copyToClipboard" :class="{ 'fade-out': isFading }">
    <i class="fas fa-copy"></i>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'ReusableTableTab',
  props: {
    apiUrl: {
      type: String,
      required: true
    },
    columns: {
      type: Array,
      required: true,
      // Example: [{ key: 'id', label: 'ID', type: 'text', format: null },
      //          { key: 'date', label: 'Date', type: 'date', format: 'YYYY-MM-DD' }]
    },
    selectable: {
      type: Boolean,
      default: true
    },
    filterable: {
      type: Boolean,
      default: true
    },
    paginated: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      tableData: [],
      filters: {},
      dropdowns: {},
      currentPage: 1,
      itemsPerPage: 10,
      sortColumn: '',
      sortDirection: 'asc',
      selectAll: false,
      columnWidths: [],
      showCopyIconAt: null,
      copyContent: '',
      isFading: false,
      isResizing: false,
      startX: 0,
      currentColumnIndex: -1
    }
  },
  computed: {
    filteredData() {
      return this.tableData.filter(row => {
        return Object.keys(this.filters).every(key => {
          if (!this.filters[key]) return true
          
          const column = this.columns.find(col => col.key === key)
          const value = row[key]
          
          if (column.type === 'date') {
            return !this.filters[key] || value.includes(this.filters[key])
          }
          
          if (column.type === 'select') {
            return this.filters[key].length === 0 || this.filters[key].includes(value)
          }
          
          return value.toString().toLowerCase()
            .includes(this.filters[key].toLowerCase())
        })
      }).sort((a, b) => {
        if (!this.sortColumn) return 0
        
        const aVal = a[this.sortColumn]
        const bVal = b[this.sortColumn]
        
        if (this.sortDirection === 'asc') {
          return aVal > bVal ? 1 : -1
        }
        return aVal < bVal ? 1 : -1
      })
    },
    paginatedData() {
      if (!this.paginated) return this.filteredData
      
      const start = (this.currentPage - 1) * this.itemsPerPage
      return this.filteredData.slice(start, start + this.itemsPerPage)
    },
    totalPages() {
      return Math.ceil(this.filteredData.length / this.itemsPerPage)
    },
    copyIconStyle() {
      if (!this.showCopyIconAt) return {}
      return {
        top: `${this.showCopyIconAt.y}px`,
        left: `${this.showCopyIconAt.x}px`
      }
    }
  },
  methods: {
    async fetchData() {
      try {
        const response = await axios.get(this.apiUrl)
        this.tableData = response.data.map(item => ({
          ...item,
          selected: false
        }))
      } catch (error) {
        console.error('Error fetching data:', error)
        this.$emit('error', error)
      }
    },
    formatCellContent(content, format) {
      if (!content) return ''
      if (!format) return content
      
      // Add more format handlers as needed
      if (format === 'YYYY-MM-DD') {
        return new Date(content).toISOString().split('T')[0]
      }
      
      return content
    },
    toggleAllRows() {
      this.tableData = this.tableData.map(row => ({
        ...row,
        selected: this.selectAll
      }))
    },
    previousPage() {
      if (this.currentPage > 1) {
        this.currentPage--
      }
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
      }
    },
    toggleDropdown(key) {
      this.dropdowns[key] = !this.dropdowns[key]
    },
    handleItemsPerPageChange() {
      this.currentPage = 1
    },
    sortBy(column) {
      if (this.sortColumn === column) {
        if (this.sortDirection === 'asc') {
          this.sortDirection = 'desc'
        } else if (this.sortDirection === 'desc') {
          this.sortColumn = ''
          this.sortDirection = 'asc'
        }
      } else {
        this.sortColumn = column
        this.sortDirection = 'asc'
      }
    },
    showCopyIcon(event, content) {
      if (this.showCopyIconAt) {
        clearTimeout(this.hideTimeout)
      }
      
      this.showCopyIconAt = {
        x: event.clientX + 10,
        y: event.clientY - 10
      }
      this.copyContent = content
      this.isFading = false
      
      this.hideTimeout = setTimeout(this.hideIconWithFade, 2000)
    },
    hideIconWithFade() {
      this.isFading = true
      setTimeout(() => {
        this.showCopyIconAt = null
        this.isFading = false
      }, 300)
    },
    async copyToClipboard() {
      try {
        await navigator.clipboard.writeText(this.copyContent)
        this.hideIconWithFade()
      } catch (err) {
        console.error('Failed to copy text:', err)
      }
    },
    startResize(event, columnIndex) {
      this.isResizing = true
      this.startX = event.pageX
      this.currentColumnIndex = columnIndex
      
      document.addEventListener('mousemove', this.handleResize)
      document.addEventListener('mouseup', this.stopResize)
    },
    handleResize(event) {
      if (!this.isResizing) return
      
      const dx = event.pageX - this.startX
      const newWidth = (this.columnWidths[this.currentColumnIndex] || 100) + dx
      
      if (newWidth >= 50) {
        this.columnWidths[this.currentColumnIndex] = newWidth
        this.startX = event.pageX
      }
    },
    stopResize() {
      this.isResizing = false
      document.removeEventListener('mousemove', this.handleResize)
      document.removeEventListener('mouseup', this.stopResize)
    },
    toggleRowSelection(row) {
      row.selected = !row.selected
      this.$emit('row-selected', row)
    },
    initializeColumnWidths() {
      this.columnWidths = new Array(this.columns.length + (this.selectable ? 1 : 0)).fill(100)
    }
  },
  created() {
    this.filters = {}
    this.dropdowns = {}
    
    this.columns.forEach(column => {
      this.filters[column.key] = column.type === 'select' ? [] : ''
      this.dropdowns[column.key] = false
    })
  },
  mounted() {
    this.fetchData()
    this.initializeColumnWidths()
  }
}
</script>

<style scoped>
@import "@/assets/styles/reusableTableTab.css";
</style>
