<template>
  <div class="reusable-table-tab">
    <!-- Tableau -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th class="resizable" v-if="selectable" :style="getThWidthStyle(-1)">
              <div class="th-content">
                <input type="checkbox" 
                       @change="toggleAllRows" 
                       :checked="filteredData.length > 0 && filteredData.every(row => row.selected)"
                       :indeterminate.prop="filteredData.some(row => row.selected) && !filteredData.every(row => row.selected)" />
                <div class="resize-handle" @mousedown="startResize($event, 0)"></div>
              </div>
            </th>
            <th v-for="(column, index) in columns" :key="column.key" class="resizable" :style="getThWidthStyle(index)">
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
                <div class="filter-container">
                  <input type="text" v-model="filters[column.key]" class="column-filter" />
                  <div class="filter-icon" 
                       @click="openAdvancedFilter(column, $event)"
                       :class="{ 'active': hasActiveAdvancedFilter(column.key) }">
                    <i class="fas fa-filter"></i>
                  </div>
                </div>
              </template>
            </th>
          </tr>
        </thead>
        <transition-group name="list" tag="tbody">
          <tr v-for="row in paginatedData" 
              :key="row.uuid" 
              @click="toggleRowSelection(row)"
              :class="{ 'selected-row': row.selected }"
              style="cursor: pointer;">
            <td v-if="selectable" @click.stop :style="getTdWidthStyle(-1)"><input type="checkbox" v-model="row.selected" /></td>
            <td v-for="(column, cIndex) in columns" 
                :key="column.key"
                :style="getTdWidthStyle(cIndex)"
                @click.stop="selectCell(row, column)"
                @contextmenu.prevent="showCopyIcon($event, row[column.key])">
              <div class="cell" :class="{ 'cell-selected': isSelectedCell(row, column) }">
                <div
                  class="cell-inner"
                  :ref="setCellRef(row.uuid, column.key)"
                  v-if="column.format === 'html'"
                >
                  {{ formatCellContent(row[column.key], column.format) }}
                </div>
                <div v-else-if="column.format === 'tags'" class="tags-container">
                  <template v-if="row[column.key] && Array.isArray(row[column.key])">
                    <span v-for="(tag, tagIndex) in row[column.key]" 
                         :key="tagIndex" 
                         class="tag">{{ tag }}</span>
                  </template>
                </div>
                <div v-else class="cell-inner" :ref="setCellRef(row.uuid, column.key)">
                  {{ formatCellContent(row[column.key], column.format) }}
                </div>
                <span
                  v-if="shouldShowEllipsis(row, column)"
                  class="ellipsis-trigger"
                  @click.stop="openCellPopover(row, column, $event)">...</span>
              </div>
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

  <!-- Fenêtre contextuelle de filtrage avancé -->
  <div v-if="showAdvancedFilter" class="advanced-filter-modal" :style="filterPositionStyle" @click.self="closeAdvancedFilter">
    <div class="advanced-filter-content">
      <!-- Zone A -->
      <div class="filter-search">
        <input type="text" v-model="advancedFilterSearch" placeholder="Rechercher des valeurs..." />
      </div>
      
      <!-- Zone B -->
      <div class="filter-values">
        <!-- Blanks Option -->
        <div v-if="hasBlankValues" class="filter-value-item">
          <div class="checkbox-container">
            <input type="checkbox" 
                   v-model="advancedFilterBlanks" 
                   @change="updateAdvancedFilter" />
          </div>
          <div class="value-label">(blanks)</div>
        </div>
        
        <!-- Unique Values -->
        <div v-for="value in filteredUniqueValues" 
             :key="value" 
             class="filter-value-item">
          <div class="checkbox-container">
            <input type="checkbox" 
                   v-model="selectedAdvancedFilterValues" 
                   :value="value"
                   @change="updateAdvancedFilter" />
          </div>
          <div class="value-label">{{ value }}</div>
        </div>
      </div>
    </div>
  </div>
  <!-- Popover for truncated cell content -->
  <div v-if="cellPopover.visible" class="cell-popover" @click.self="closeCellPopover">
    <div class="cell-popover-content" :style="cellPopoverContentStyle" @mousedown.stop>
      <div v-if="cellPopover.format === 'html'" v-html="cellPopover.content"></div>
      <div v-else>{{ cellPopover.content }}</div>
    </div>
  </div>
</template>

<script>
// Import du service API centralisé pour gérer les appels HTTP
import apiService from '@/services/apiService'

export default {
  name: 'ReusableTableTab',
  emits: ['row-selected', 'error'],
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
      // Column widths: index 0 is the selectable column when selectable=true, followed by the data columns
      columnWidths: [],
      measureTimeoutId: null,
      showCopyIconAt: null,
      copyContent: '',
      isFading: false,
      resizing: false,
      currentResizingColumn: null,
      startX: 0,
      startWidth: 0,
      showAdvancedFilter: false,
      currentFilterColumn: null,
      filterPosition: { x: 0, y: 0 },
      advancedFilterSearch: '',
      advancedFilterBlanks: false,
      selectedAdvancedFilterValues: [],
      advancedFilters: {},
      scrollListener: null,
      // Cell selection & truncation
      selectedCell: { rowUuid: null, colKey: null },
      cellRefs: {},
      truncatedCells: {},
      cellPopover: { visible: false, x: 0, y: 0, content: '', format: null },
      rafId: null
    }
  },
  computed: {
    filteredData() {
      return this.tableData.filter(row => {
        return Object.keys(this.filters).every(key => {
          const column = this.columns.find(col => col.key === key)
          const value = row[key]
          const filterValue = this.filters[key]
          
          // Vérification du filtre primaire
          if (filterValue && filterValue.trim() !== '') {
            const normalizedFilter = filterValue.toLowerCase()
            const normalizedValue = (value?.toString() || '').toLowerCase()
            if (!normalizedValue.includes(normalizedFilter)) {
              return false
            }
          }
          
          // Vérification du filtre avancé (inclusion). Si aucun critère choisi, ne pas filtrer.
          if (this.advancedFilters[key]) {
            const filter = this.advancedFilters[key]
            const isBlank = value === null || value === undefined || value === ''
            const hasAnyConstraint = !!filter.blanks || (Array.isArray(filter.values) && filter.values.length > 0)
            if (!hasAnyConstraint) {
              return true
            }
            if (isBlank) {
              return !!filter.blanks
            }
            return Array.isArray(filter.values) && filter.values.includes((value ?? '').toString())
          }
          
          return true
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
    
    hasBlankValues() {
      if (!this.currentFilterColumn) return false
      return this.tableData.some(row => {
        const value = row[this.currentFilterColumn.key]
        return value === null || value === undefined || value === ''
      })
    },
    
    uniqueValues() {
      if (!this.currentFilterColumn) return []
      const values = new Set()
      this.tableData.forEach(row => {
        const value = row[this.currentFilterColumn.key]
        if (value !== null && value !== undefined && value !== '') {
          values.add(value.toString())
        }
      })
      return Array.from(values).sort()
    },
    
    filteredUniqueValues() {
      if (!this.advancedFilterSearch) return this.uniqueValues
      return this.uniqueValues.filter(value => 
        value.toLowerCase().includes(this.advancedFilterSearch.toLowerCase())
      )
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
    },
    filterPositionStyle() {
      return {
        left: `${this.filterPosition.x}px`,
        top: `${this.filterPosition.y}px`
      }
    },
    cellPopoverContentStyle() {
      return {
        left: `${this.cellPopover.x}px`,
        top: `${this.cellPopover.y}px`
      }
    }
  },
  updated() {
    // Ensure ellipsis state is kept in sync after any reactive update
    this.scheduleTruncationRecompute()
  },
  mounted() {
    // Use the bottom mounted() as the effective one; ensure init + truncation
    this.$nextTick(() => {
      this.initializeColumnWidths()
      this.measureColumnWidths()
      this.recomputeAllTruncation()
    })
    window.addEventListener('resize', this.scheduleTruncationRecompute)
    const tableContainer = this.$el.querySelector('.table-container')
    if (tableContainer) {
      tableContainer.addEventListener('scroll', this.closeCellPopover)
    }
    document.addEventListener('click', this.closeCellPopover)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.scheduleTruncationRecompute)
    const tableContainer = this.$el && this.$el.querySelector ? this.$el.querySelector('.table-container') : null
    if (tableContainer) {
      tableContainer.removeEventListener('scroll', this.closeCellPopover)
    }
    document.removeEventListener('click', this.closeCellPopover)
  },
  methods: {
    // Return width style for header cells. Index -1 refers to the selectable column when enabled.
    getThWidthStyle(index) {
      const idx = this.selectable ? (index === -1 ? 0 : index + 1) : index
      const width = this.columnWidths[idx]
      if (!width) return {}
      return { width: width + 'px', minWidth: width + 'px', maxWidth: width + 'px' }
    },
    // Return width style for body cells. Index -1 refers to the selectable column when enabled.
    getTdWidthStyle(index) {
      const idx = this.selectable ? (index === -1 ? 0 : index + 1) : index
      const width = this.columnWidths[idx]
      if (!width) return {}
      return { width: width + 'px', minWidth: width + 'px', maxWidth: width + 'px' }
    },
    // Measure header TH widths and lock them
    measureColumnWidths() {
      this.$nextTick(() => {
        const headerRow = this.$el.querySelector('thead tr:first-child')
        if (!headerRow) return
        const ths = headerRow.querySelectorAll('th')
        if (!ths || ths.length === 0) return
        const widths = Array.from(ths).map(th => Math.ceil(th.getBoundingClientRect().width))
        if (widths.some(w => w > 0)) {
          this.columnWidths = widths
        }
      })
    },
    /**
     * Récupère les données depuis l'API en utilisant le service API centralisé
     */
    async fetchData() {
      console.log('[ReusableTableTab] Début fetchData() - URL:', this.apiUrl);
      console.log('[ReusableTableTab] Stack trace:', new Error().stack);
      
      try {
        console.log('[ReusableTableTab] Envoi de la requête API...');
        const response = await apiService.get(this.apiUrl);
        console.log('[ReusableTableTab] Réponse API reçue, nombre d\'éléments:', response.length);
        
        // Traiter directement la réponse comme un tableau
        this.tableData = response.map(item => {
          return {
            ...item,
            selected: false
          };
        });
        console.log('[ReusableTableTab] Données traitées et stockées dans tableData');
        // After data is set, measure and lock widths once
        this.$nextTick(() => this.measureColumnWidths())
      } catch (error) {
        console.error('[ReusableTableTab] Erreur lors de la récupération des données:', error);
        this.$emit('error', error.message || 'Erreur lors de la récupération des données');
      } finally {
        console.log('[ReusableTableTab] Fin fetchData()');
      }
    },
    formatCellContent(content, format) {
      if (!content) return ''
      if (!format) return content
      
      // Add more format handlers as needed
      if (format === 'YYYY-MM-DD') {
        return new Date(content).toISOString().split('T')[0]
      }
      
      // Pour le contenu HTML, on le retourne tel quel pour l'afficher avec v-html
      if (format === 'html') {
        return content
      }
      
      // Pour le format tags, on le gère directement dans le template
      if (format === 'tags') {
        return content
      }
      
      return content
    },
    

    toggleAllRows() {
      // Détermine si toutes les lignes sont sélectionnées
      const allSelected = this.filteredData.every(row => row.selected);
      
      // Mise à jour de toutes les lignes du tableau
      this.tableData = this.tableData.map(row => ({
        ...row,
        selected: !allSelected
      }));
      
      this.$emit('row-selected');
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
      this.resizing = true
      this.startX = event.pageX
      this.currentResizingColumn = columnIndex
      
      document.addEventListener('mousemove', this.handleResize)
      document.addEventListener('mouseup', this.stopResize)
    },
    handleResize(event) {
      if (!this.resizing) return
      
      const dx = event.pageX - this.startX
      const current = this.columnWidths[this.currentResizingColumn] || 100
      const newWidth = current + dx
      
      if (newWidth >= 50) {
        this.columnWidths[this.currentResizingColumn] = newWidth
        this.startX = event.pageX
        this.scheduleTruncationRecompute()
      }
    },
    stopResize() {
      this.resizing = false
      document.removeEventListener('mousemove', this.handleResize)
      document.removeEventListener('mouseup', this.stopResize)
      this.recomputeAllTruncation()
    },
    toggleRowSelection(row) {
      row.selected = !row.selected;
      this.$emit('row-selected');
    },
    initializeColumnWidths() {
      // Compute uniform initial widths (keep checkbox column narrow)
      const totalCols = this.columns.length + (this.selectable ? 1 : 0)
      const container = this.$el && this.$el.querySelector ? this.$el.querySelector('.table-container') : null
      const containerWidth = container ? container.clientWidth : 800
      const checkboxWidth = this.selectable ? 28 : 0
      const dataCols = this.columns.length
      const available = Math.max(100, containerWidth - checkboxWidth)
      const equalWidth = Math.max(80, Math.floor(available / (dataCols || 1)))
      const widths = []
      if (this.selectable) widths.push(checkboxWidth)
      for (let i = 0; i < dataCols; i++) widths.push(equalWidth)
      this.columnWidths = widths
    },
    // Cell helpers
    cellKey(rowUuid, colKey) {
      return `${rowUuid}::${colKey}`
    },
    setCellRef(rowUuid, colKey) {
      const key = this.cellKey(rowUuid, colKey)
      return (el) => {
        if (el) {
          this.cellRefs[key] = el
        } else {
          delete this.cellRefs[key]
          delete this.truncatedCells[key]
        }
      }
    },
    scheduleTruncationRecompute() {
      if (this.rafId) cancelAnimationFrame(this.rafId)
      this.rafId = requestAnimationFrame(() => {
        this.recomputeAllTruncation()
      })
    },
    recomputeAllTruncation() {
      Object.keys(this.cellRefs).forEach(key => {
        const el = this.cellRefs[key]
        if (el) {
          this.truncatedCells[key] = el.scrollWidth > el.clientWidth
        }
      })
    },
    shouldShowEllipsis(row, column) {
      if (!column || column.format === 'tags') return false
      const key = this.cellKey(row.uuid, column.key)
      return !!this.truncatedCells[key]
    },
    openCellPopover(row, column, event) {
      const raw = row[column.key]
      this.cellPopover = {
        visible: true,
        x: event.clientX + 8,
        y: event.clientY + 8,
        content: this.formatCellContent(raw, column.format),
        format: column.format || null
      }
    },
    closeCellPopover() {
      if (this.cellPopover.visible) this.cellPopover.visible = false
    },
    selectCell(row, column) {
      this.selectedCell = { rowUuid: row.uuid, colKey: column.key }
      // Déclencher aussi la sélection de ligne pour maintenir la compatibilité
      this.toggleRowSelection(row)
    },
    isSelectedCell(row, column) {
      return this.selectedCell.rowUuid === row.uuid && this.selectedCell.colKey === column.key
    },
    // Nouvelles méthodes pour le filtrage avancé
    openAdvancedFilter(column, event) {
      // Vérifier si la fenêtre est déjà ouverte sur la même colonne
      if (this.showAdvancedFilter && this.currentFilterColumn && this.currentFilterColumn.key === column.key) {
        this.closeAdvancedFilter()
        return
      }

      // Définir d'abord la colonne courante
      this.currentFilterColumn = column
      
      // Calculer la position de la fenêtre de filtre
      const filterIcon = event.target.closest('.filter-icon')
      const rect = filterIcon.getBoundingClientRect()
      
      // Positionner le filtre avancé pour que son coin supérieur gauche
      // soit adjacent au coin inférieur droit du bouton de filtre
      this.filterPosition = {
        x: rect.right + window.scrollX,
        y: rect.bottom + window.scrollY
      }
      
      // Ajouter un petit délai pour s'assurer que le DOM est mis à jour
      setTimeout(() => {
        // Ajuster la position si le filtre dépasse de l'écran
        const filterModal = document.querySelector('.advanced-filter-modal')
        if (filterModal) {
          const modalRect = filterModal.getBoundingClientRect()
          const viewportWidth = window.innerWidth
          const viewportHeight = window.innerHeight
          
          // Ajuster horizontalement si nécessaire
          if (modalRect.right > viewportWidth) {
            this.filterPosition.x = viewportWidth - modalRect.width - 10
          }
          
          // Ajuster verticalement si nécessaire
          if (modalRect.bottom > viewportHeight) {
            this.filterPosition.y = viewportHeight - modalRect.height - 10
          }
        }
      }, 0)
      
      // Initialiser les valeurs du filtre (par défaut: aucun critère -> tout affiché)
      if (!this.advancedFilters[column.key]) {
        this.advancedFilters[column.key] = {
          blanks: false,
          values: []
        }
      }
      
      this.advancedFilterBlanks = !!this.advancedFilters[column.key].blanks
      this.selectedAdvancedFilterValues = [...(this.advancedFilters[column.key].values || [])]
      this.advancedFilterSearch = ''
      
      // Afficher la fenêtre après avoir tout initialisé
      this.showAdvancedFilter = true
      
      // Ajouter des écouteurs d'événements pour suivre le défilement
      const tableContainer = document.querySelector('.table-container')
      if (tableContainer) {
        this.scrollListener = () => {
          if (!this.showAdvancedFilter) return
          
          const newRect = filterIcon.getBoundingClientRect()
          this.filterPosition = {
            x: newRect.right + window.scrollX,
            y: newRect.bottom + window.scrollY
          }
        }
        
        tableContainer.addEventListener('scroll', this.scrollListener)
        window.addEventListener('scroll', this.scrollListener)
        window.addEventListener('resize', this.scrollListener)
      }
    },
    
    closeAdvancedFilter() {
      this.showAdvancedFilter = false
      this.currentFilterColumn = null
      this.advancedFilterSearch = ''
      
      // Supprimer les écouteurs d'événements
      const tableContainer = document.querySelector('.table-container')
      if (tableContainer && this.scrollListener) {
        tableContainer.removeEventListener('scroll', this.scrollListener)
        window.removeEventListener('scroll', this.scrollListener)
        window.removeEventListener('resize', this.scrollListener)
      }
    },
    
    updateAdvancedFilter() {
      if (!this.currentFilterColumn) return
      
      const key = this.currentFilterColumn.key
      this.advancedFilters[key] = {
        blanks: this.advancedFilterBlanks,
        values: [...this.selectedAdvancedFilterValues]
      }
    },
    
    hasActiveAdvancedFilter(columnKey) {
      const filter = this.advancedFilters[columnKey]
      if (!filter) return false
      
      // Actif si au moins une contrainte est choisie (valeurs ou blanks)
      return !!filter.blanks || (Array.isArray(filter.values) && filter.values.length > 0)
    }
  },
  created() {
    // Initialiser les filtres pour chaque colonne
    this.columns.forEach(column => {
      this.filters[column.key] = ''
    })
    // L'appel à fetchData() a été supprimé ici pour éviter la double initialisation
    // Le chargement des données est maintenant géré uniquement par le composant parent (objectsTab.vue)
  },
  mounted() {
    this.initializeColumnWidths()
  }
}
</script>

<style scoped>
@import "@/assets/styles/reusableTableTab.css";

</style>
