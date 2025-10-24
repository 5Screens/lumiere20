<template>
  <div class="reusable-table-tab">
    <!-- Multi Filter Panel -->
    <sMultiFilter
      v-if="filterable"
      :object-name="objectName"
      @filters-applied="handleFiltersApplied"
      @filters-reset="handleFiltersReset"
    />
    
    <!-- Tableau -->
    <div class="table-container" ref="tableContainer">
      <table ref="tableEl">
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
                <div class="th-header-wrapper">
                  <div @click="column.key !== 'uuid' ? sortBy(column.key) : null" :class="{ 'sortable': column.key !== 'uuid' }">
                    {{ column.label }}
                    <span v-if="column.key !== 'uuid'" class="sort-icon">
                      <template v-if="sortColumn === column.key">
                        {{ sortDirection === 'asc' ? '▲' : '▼' }}
                      </template>
                      <template v-else>▲▼</template>
                    </span>
                  </div>
                  <!-- Tags de filtres actifs pour cette colonne -->
                  <div v-if="getActiveFiltersForColumn(column.key).length > 0" class="th-filter-tags">
                    <sFilterTag
                      v-for="filter in getActiveFiltersForColumn(column.key)"
                      :key="filter.id"
                      :filter="filter"
                      :column-config="getColumnConfig(column.key)"
                      :object-name="objectName"
                      @remove="handleRemoveFilterTag"
                      @update-value="handleUpdateFilterValue"
                    />
                  </div>
                </div>
                <div class="resize-handle" @mousedown="startResize($event, index + (selectable ? 1 : 0))"></div>
              </div>
            </th>
          </tr>
        </thead>
        <transition-group name="list" tag="tbody">
          <tr v-for="row in paginatedData" 
              :key="row.uuid" 
              @click="toggleRowSelection(row)"
              :class="{ 'selected-row': row.selected }"
              style="cursor: pointer;">
            <td v-if="selectable" @click.stop :style="getTdWidthStyle(-1)"><input type="checkbox" v-model="row.selected" @change="$emit('row-selected')" /></td>
            <td v-for="(column, cIndex) in columns" 
                :key="column.key"
                :style="getTdWidthStyle(cIndex)"
                :class="{ 'cell-selected-td': isSelectedCell(row, column) }"
                @click="selectCell(row, column)"
                @contextmenu.prevent="showCopyIcon($event, row[column.key])">
              <div class="cell" :class="{ 'cell-selected': isSelectedCell(row, column) }">
                <div
                  class="cell-inner"
                  :ref="setCellRef(row.uuid, column.key)"
                  v-if="column.format === 'html'"
                  v-html="formatCellContent(row[column.key], column.format)"
                >
                </div>
                <div v-else-if="column.format === 'tags'" class="tags-container">
                  <template v-if="row[column.key] && Array.isArray(row[column.key])">
                    <span v-for="(tag, tagIndex) in row[column.key]" 
                         :key="tagIndex" 
                         class="tag">{{ tag }}</span>
                  </template>
                </div>
                <div v-else-if="column.type === 'boolean'" class="cell-inner boolean-cell" :ref="setCellRef(row.uuid, column.key)">
                  <span v-if="row[column.key] === true" class="boolean-true">
                    <i class="fas fa-check-circle"></i> {{ $t('common.yes') }}
                  </span>
                  <span v-else-if="row[column.key] === false" class="boolean-false">
                    <i class="fas fa-times-circle"></i> {{ $t('common.no') }}
                  </span>
                  <span v-else class="boolean-null">
                    <i class="fas fa-question-circle"></i> {{ $t('common.na') }}
                  </span>
                </div>
                <div v-else class="cell-inner" :ref="setCellRef(row.uuid, column.key)">
                  {{ truncateIfUUID(formatCellContent(row[column.key], column.format), column.key) }}
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
      <!-- Scroll Sentinel for Infinite Scroll (moved inside scrollable container) -->
      <div v-if="infiniteScrollEnabled" ref="scrollSentinel" class="scroll-sentinel"></div>
    </div>

    <!-- Table footer -->
    <div class="table-footer">
      <template v-if="infiniteScrollEnabled">
        {{ $t('common.totalFetchedData') }} {{ totalRecords }} ({{ filteredData.length }} {{$t('common.totalLoadedData')}})
      </template>
      <template v-else>
        {{ $t('common.totalFetchedData') }} {{ filteredData.length }}
      </template>
    </div>

    <!-- Traditional Pagination (fallback) -->
    <div class="pagination" v-if="!infiniteScrollEnabled && paginated">
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

  <!-- Ligne verticale de redimensionnement -->
  <div v-if="resizing" class="resize-line" :style="resizeLineStyle"></div>

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
</template>

<script>
// Import du service API centralisé pour gérer les appels HTTP
import apiService, { filterAPI } from '@/services/apiService'
import { usePopoverStore } from '@/stores/popoverStore'
import { useTabsStore } from '@/stores/tabsStore'
import { useFilterStore } from '@/stores/filterStore'
import { useUserProfileStore } from '@/stores/userProfileStore'
import { DEBOUNCE_DELAY_MS, PAGINATION_CONFIG } from '@/config/config'
import sMultiFilter from './sMultiFilter.vue'
import sFilterTag from './sFilterTag.vue'

export default {
  name: 'ReusableTableTab',
  components: {
    sMultiFilter,
    sFilterTag
  },
  emits: ['row-selected', 'error'],
  setup() {
    const popoverStore = usePopoverStore()
    const tabsStore = useTabsStore()
    const filterStore = useFilterStore()
    const userProfileStore = useUserProfileStore()
    return { popoverStore, tabsStore, filterStore, userProfileStore }
  },
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
    },
    infiniteScrollEnabled: {
      type: Boolean,
      default: false
    },
    pageSize: {
      type: Number,
      default: PAGINATION_CONFIG.defaultPageSize
    },
    objectName: {
      type: String,
      default: null
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
      resizeLineX: 0,
      resizeLineTop: 0,
      resizeLineHeight: 0,
      tempColumnWidths: [],
      showAdvancedFilter: false,
      currentFilterColumn: null,
      filterPosition: { x: 0, y: 0 },
      advancedFilterSearch: '',
      advancedFilterBlanks: false,
      selectedAdvancedFilterValues: [],
      advancedFilters: {},
      // Freeze values list while the advanced filter modal is open
      currentFilterUniqueValues: [],
      currentFilterHasBlanks: false,
      // Persisted cache of available values per column (survives close/open)
      advancedFilterOptionsCache: {},
      scrollListener: null,
      // Cell selection & truncation
      selectedCell: { rowUuid: null, colKey: null },
      cellRefs: {},
      truncatedCells: {},
      rafId: null,
      // Infinite scroll data
      isLoadingMore: false,
      hasMoreData: true,
      totalRecords: 0,
      currentOffset: 0,
      error: null,
      intersectionObserver: null,
      lastSearchTerm: '',
      lastSortColumn: '',
      lastSortDirection: 'asc',
      debounceTimeout: null,
      // Prevent column width growth on subsequent reloads
      hasMeasuredColumnWidths: false
    }
  },
  computed: {
    filteredData() {
      if (this.infiniteScrollEnabled) {
        // For infinite scroll, filtering and sorting is done server-side
        return this.tableData
      }
      
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
        
        // Trouver le type de la colonne
        const column = this.columns.find(col => col.key === this.sortColumn)
        const columnType = column ? column.type : 'text'
        
        let aVal = a[this.sortColumn]
        let bVal = b[this.sortColumn]
        
        // Gestion des valeurs nulles/undefined
        if (aVal === null || aVal === undefined) aVal = ''
        if (bVal === null || bVal === undefined) bVal = ''
        
        // Tri spécifique selon le type de colonne
        if (columnType === 'number') {
          // Conversion en nombre pour le tri numérique
          const aNum = parseFloat(aVal) || 0
          const bNum = parseFloat(bVal) || 0
          
          if (this.sortDirection === 'asc') {
            return aNum - bNum
          }
          return bNum - aNum
        } else if (columnType === 'date') {
          // Tri par date
          const aDate = new Date(aVal)
          const bDate = new Date(bVal)
          
          if (this.sortDirection === 'asc') {
            return aDate - bDate
          }
          return bDate - aDate
        } else if (columnType === 'boolean') {
          // Tri booléen (false avant true)
          const aBool = Boolean(aVal)
          const bBool = Boolean(bVal)
          
          if (this.sortDirection === 'asc') {
            return aBool === bBool ? 0 : (aBool ? 1 : -1)
          }
          return aBool === bBool ? 0 : (aBool ? -1 : 1)
        } else {
          // Tri alphabétique pour text et autres types
          const aStr = String(aVal).toLowerCase()
          const bStr = String(bVal).toLowerCase()
          
          if (this.sortDirection === 'asc') {
            return aStr.localeCompare(bStr)
          }
          return bStr.localeCompare(aStr)
        }
      })
    },
    
    hasBlankValues() {
      return !!this.currentFilterHasBlanks
    },
    
    uniqueValues() {
      // Use the frozen snapshot captured on openAdvancedFilter
      return this.currentFilterUniqueValues || []
    },
    
    filteredUniqueValues() {
      if (!this.advancedFilterSearch) return this.uniqueValues
      return this.uniqueValues.filter(value => 
        value.toLowerCase().includes(this.advancedFilterSearch.toLowerCase())
      )
    },
    paginatedData() {
      if (this.infiniteScrollEnabled) {
        // For infinite scroll, return all loaded data
        return this.filteredData
      }
      
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
    resizeLineStyle() {
      return {
        left: `${this.resizeLineX}px`,
        top: `${this.resizeLineTop}px`,
        height: `${this.resizeLineHeight}px`
      }
    },
    filterPositionStyle() {
      return {
        left: `${this.filterPosition.x}px`,
        top: `${this.filterPosition.y}px`
      }
    },
  },
  watch: {
    apiUrl: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          // Load data when apiUrl changes or on initial mount
          if (this.infiniteScrollEnabled) {
            this.loadInitialData();
          } else {
            this.loadData();
          }
        }
      }
    }
  },
  updated() {
    // Ensure ellipsis state is kept in sync after any reactive update
    this.scheduleTruncationRecompute()
  },
  mounted() {
    // Initialize column widths and truncation after initial render
    this.$nextTick(() => {
      this.initializeColumnWidths()
      this.measureColumnWidths()
      this.recomputeAllTruncation()
      
      // Setup infinite scroll if enabled
      if (this.infiniteScrollEnabled) {
        // Utiliser await pour attendre que setupInfiniteScroll soit terminé
        this.setupInfiniteScroll()
      }
    })
    window.addEventListener('resize', this.scheduleTruncationRecompute)
    const tableContainer = this.$refs.tableContainer
    if (tableContainer) {
      tableContainer.addEventListener('scroll', this.hidePopoverOnScroll)
    }
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.scheduleTruncationRecompute)
    const tableContainer = this.$refs.tableContainer || null
    if (tableContainer) {
      tableContainer.removeEventListener('scroll', this.hidePopoverOnScroll)
    }
    
    // Cleanup infinite scroll
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect()
    }
    
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout)
    }
  },
  methods: {
    /**
     * Handle filters applied from the filter panel
     */
    async handleFiltersApplied(filters) {
      console.log('[ReusableTableTab] Filters applied:', filters);
      
      // Store active filters
      this.filters = filters || {};
      
      // Reset pagination
      this.currentPage = 1;
      
      if (this.infiniteScrollEnabled) {
        // Reset and reload for infinite scroll
        await this.resetAndReload();
      } else {
        // Reload data with filters
        await this.loadData();
      }
    },
    
    /**
     * Handle filters reset from the filter panel
     */
    async handleFiltersReset() {
      console.log('[ReusableTableTab] Filters reset');
      
      // Clear all filters
      this.filters = {};
      this.advancedFilters = {};
      
      // Reset pagination
      this.currentPage = 1;
      
      if (this.infiniteScrollEnabled) {
        // Reset and reload for infinite scroll
        await this.resetAndReload();
      } else {
        // Reload data without filters
        await this.loadData();
      }
    },
    
    /**
     * Load data with current filters (replaces fetchData for filtered data)
     */
    async loadData() {
      console.log('[ReusableTableTab] Loading data with filters');
      
      try {
        // Check if we have date range filters
        const hasDateRange = Object.values(this.filters).some(
          value => value && typeof value === 'object' && (value.gte || value.lte)
        );
        
        let response;
        
        if (hasDateRange || Object.keys(this.filters).length > 0) {
          // Use filter store for complex filtering
          const objectName = this.objectName || this.apiUrl;
          response = await this.filterStore.applyFilters(
            objectName,
            this.filters,
            this.sortColumn ? { by: this.sortColumn, direction: this.sortDirection } : null,
            { page: this.currentPage, limit: this.pageSize }
          );
        } else {
          // Use simple GET for no filters
          response = await apiService.get(this.apiUrl);
        }
        
        // Process response
        if (response) {
          const data = response.data || response;
          this.tableData = (Array.isArray(data) ? data : []).map(item => ({
            ...item,
            selected: false
          }));
          
          // Update pagination info if available
          if (response.total !== undefined) {
            this.totalRecords = response.total;
          }
          
          // Measure column widths after first load
          if (!this.hasMeasuredColumnWidths) {
            this.$nextTick(() => this.measureColumnWidths());
          }
        }
      } catch (error) {
        console.error('[ReusableTableTab] Error loading data:', error);
        this.$emit('error', error.message || 'Error loading data');
        
        if (this.tabsStore && typeof this.tabsStore.setMessage === 'function') {
          this.tabsStore.setMessage(this.$t('notifications.loadingError'));
        }
      }
    },
    
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
      if (this.hasMeasuredColumnWidths) return
      this.$nextTick(() => {
        const tableEl = this.$refs.tableEl
        if (!tableEl) return
        const headerRow = (tableEl.tHead && tableEl.tHead.rows && tableEl.tHead.rows[0])
          ? tableEl.tHead.rows[0]
          : tableEl.querySelector('thead tr:first-child')
        if (!headerRow) return
        const ths = headerRow.querySelectorAll('th')
        if (!ths || ths.length === 0) return
        const widths = Array.from(ths).map(th => Math.ceil(th.getBoundingClientRect().width))
        if (widths.some(w => w > 0)) {
          this.columnWidths = widths
          // Lock widths after first measurement to avoid growth on each reload
          this.hasMeasuredColumnWidths = true
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
        // Route error to global notification system
        if (this.tabsStore && typeof this.tabsStore.setMessage === 'function') {
          this.tabsStore.setMessage(this.$t('notifications.loadingError'))
        }
      } finally {
        console.log('[ReusableTableTab] Fin fetchData()');
      }
    },
    /**
     * Truncate UUID to first 7 characters for display
     * Only applies when column.key === 'uuid'
     */
    truncateIfUUID(content, columnKey) {
      if (columnKey === 'uuid' && content && typeof content === 'string') {
        return content.substring(0, 7)
      }
      return content
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
      const oldSortColumn = this.sortColumn;
      const oldSortDirection = this.sortDirection;
      
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
      
      // Reload data for infinite scroll if sorting changed
      if (this.infiniteScrollEnabled && 
          (oldSortColumn !== this.sortColumn || oldSortDirection !== this.sortDirection)) {
        this.resetAndReload();
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
      this.startWidth = this.columnWidths[columnIndex] || 100
      this.resizeLineX = event.pageX
      
      // Calculer la position et hauteur de la table pour limiter la ligne
      const tableContainer = this.$refs.tableContainer
      if (tableContainer) {
        const rect = tableContainer.getBoundingClientRect()
        this.resizeLineTop = rect.top
        this.resizeLineHeight = rect.height
      }
      
      // Copie des largeurs actuelles pour modification temporaire
      this.tempColumnWidths = [...this.columnWidths]
      
      document.addEventListener('mousemove', this.handleResize)
      document.addEventListener('mouseup', this.stopResize)
    },
    handleResize(event) {
      if (!this.resizing) return
      
      // Déplacer uniquement la ligne verticale, pas les colonnes
      const dx = event.pageX - this.startX
      const newWidth = this.startWidth + dx
      
      if (newWidth >= 50) {
        this.resizeLineX = event.pageX
      }
    },
    stopResize() {
      if (!this.resizing) return
      
      // Appliquer le redimensionnement une seule fois au relâchement
      const dx = this.resizeLineX - this.startX
      const newWidth = this.startWidth + dx
      
      if (newWidth >= 50) {
        this.columnWidths[this.currentResizingColumn] = newWidth
        this.recomputeAllTruncation()
      }
      
      this.resizing = false
      this.resizeLineX = 0
      this.resizeLineTop = 0
      this.resizeLineHeight = 0
      this.tempColumnWidths = []
      
      document.removeEventListener('mousemove', this.handleResize)
      document.removeEventListener('mouseup', this.stopResize)
    },
    toggleRowSelection(row) {
      row.selected = !row.selected;
      this.$emit('row-selected');
    },
    initializeColumnWidths() {
      // Compute uniform initial widths (keep checkbox column narrow)
      const totalCols = this.columns.length + (this.selectable ? 1 : 0)
      const container = this.$refs.tableContainer || null
      const containerWidth = container ? container.clientWidth : 800
      const checkboxWidth = this.selectable ? 28 : 0
      const uuidWidth = 70 // Largeur fixe pour colonne UUID (7 caractères + padding)
      
      // Calculer l'espace disponible en excluant checkbox et colonnes UUID
      let reservedWidth = checkboxWidth
      let uuidColumnsCount = 0
      
      // Compter les colonnes UUID
      this.columns.forEach(col => {
        if (col.key === 'uuid') {
          uuidColumnsCount++
          reservedWidth += uuidWidth
        }
      })
      
      const dataCols = this.columns.length
      const remainingCols = dataCols - uuidColumnsCount
      const available = Math.max(100, containerWidth - reservedWidth)
      const equalWidth = remainingCols > 0 ? Math.max(130, Math.floor(available / remainingCols)) : 130
      
      const widths = []
      if (this.selectable) widths.push(checkboxWidth)
      
      // Assigner les largeurs selon le type de colonne
      for (let i = 0; i < dataCols; i++) {
        if (this.columns[i].key === 'uuid') {
          widths.push(uuidWidth)
        } else {
          widths.push(equalWidth)
        }
      }
      
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
      const content = this.formatCellContent(raw, column.format)
      const format = column.format || null
      
      // Utiliser le store global pour afficher le popover
      this.popoverStore.showPopover(
        content,
        format,
        event.clientX + 8,
        event.clientY + 8,
        event.target
      )
    },
    hidePopoverOnScroll() {
      // Fermer le popover lors du défilement
      if (this.popoverStore.isVisible) {
        this.popoverStore.hidePopover()
      }
    },
    selectCell(row, column) {
      this.selectedCell = { rowUuid: row.uuid, colKey: column.key }
      // Explicitly close the global popover when clicking a cell
      if (this.popoverStore.isVisible) {
        this.popoverStore.hidePopover()
      }
      // Do not toggle row selection here; let the row's click handler handle it via event bubbling
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
      
      // Snapshot available values once to keep the list stable while the modal is open
      const key = column.key
      const cached = this.advancedFilterOptionsCache[key]
      if (cached) {
        this.currentFilterUniqueValues = [...cached.values]
        this.currentFilterHasBlanks = !!cached.hasBlanks
      } else {
        const valuesSet = new Set()
        let hasBlanks = false
        this.tableData.forEach(row => {
          const v = row[key]
          if (v === null || v === undefined || v === '') {
            hasBlanks = true
          } else {
            valuesSet.add(String(v))
          }
        })
        const snapshot = Array.from(valuesSet).sort()
        this.currentFilterUniqueValues = snapshot
        this.currentFilterHasBlanks = hasBlanks
        // Persist to cache so future openings (even after server-filtered reloads) keep full list
        this.advancedFilterOptionsCache[key] = { values: snapshot, hasBlanks }
      }

      // Initialize local selection from existing advanced filter (do not mutate store here)
      const existing = this.advancedFilters[key]
      this.advancedFilterBlanks = existing ? !!existing.blanks : false
      this.selectedAdvancedFilterValues = existing && Array.isArray(existing.values)
        ? [...existing.values]
        : []
      this.advancedFilterSearch = ''
      
      // Afficher la fenêtre après avoir tout initialisé
      this.showAdvancedFilter = true
      
      // Ajouter des écouteurs d'événements pour suivre le défilement
      const tableContainer = this.$refs.tableContainer
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
      const tableContainer = this.$refs.tableContainer
      if (tableContainer && this.scrollListener) {
        tableContainer.removeEventListener('scroll', this.scrollListener)
        window.removeEventListener('scroll', this.scrollListener)
        window.removeEventListener('resize', this.scrollListener)
      }
      
      // Fermer aussi le popover si ouvert
      if (this.popoverStore.isVisible) {
        this.popoverStore.hidePopover()
      }
    },
    
    updateAdvancedFilter() {
      if (!this.currentFilterColumn) return
      
      const key = this.currentFilterColumn.key
      const blanks = !!this.advancedFilterBlanks
      const values = Array.isArray(this.selectedAdvancedFilterValues)
        ? [...this.selectedAdvancedFilterValues]
        : []

      // If no constraint selected, remove the filter key (funnel inactive, avoids empty payloads)
      const hasAnyConstraint = blanks || values.length > 0
      if (!hasAnyConstraint) {
        if (this.advancedFilters[key]) {
          // Remove key to clear the filter explicitly
          const { [key]: _, ...rest } = this.advancedFilters
          this.advancedFilters = rest
        }
        // Also clear the cached options for this column to allow a fresh snapshot next time
        if (this.advancedFilterOptionsCache && this.advancedFilterOptionsCache[key]) {
          const { [key]: __, ...restCache } = this.advancedFilterOptionsCache
          this.advancedFilterOptionsCache = restCache
        }
        return
      }

      // Persist constraints
      this.advancedFilters[key] = { blanks, values }
    },
    
    hasActiveAdvancedFilter(columnKey) {
      const filter = this.advancedFilters[columnKey]
      if (!filter) return false
      
      // Actif si au moins une contrainte est choisie (valeurs ou blanks)
      return !!filter.blanks || (Array.isArray(filter.values) && filter.values.length > 0)
    },

    /**
     * Setup infinite scroll functionality
     */
    async setupInfiniteScroll() {
      console.log('[ReusableTableTab] Setting up infinite scroll');
      
      // Attendre que le filterStore ait chargé la configuration et restauré les filtres
      // Cela évite de charger les données sans les filtres restaurés depuis localStorage
      if (this.objectName === 'Person' || this.objectName === 'Task') {
        console.log('[ReusableTableTab] Waiting for filter config to load...');
        try {
          await this.filterStore.loadFilterConfig(this.objectName);
          console.log('[ReusableTableTab] Filter config loaded, filters restored from localStorage');
        } catch (error) {
          console.error('[ReusableTableTab] Error loading filter config:', error);
          // Continuer même en cas d'erreur
        }
      }
      
      // Load initial data
      this.loadInitialData();
      
      // Setup intersection observer for scroll sentinel with delay to ensure DOM is ready
      this.$nextTick(() => {
        console.log('[ReusableTableTab] Setting up intersection observer');
        console.log('[ReusableTableTab] scrollSentinel ref:', this.$refs.scrollSentinel);
        
        if (this.$refs.scrollSentinel) {
          this.intersectionObserver = new IntersectionObserver(
            (entries) => {
              entries.forEach(entry => {
                console.log('[ReusableTableTab] Intersection entry:', {
                  isIntersecting: entry.isIntersecting,
                  isLoadingMore: this.isLoadingMore,
                  hasMoreData: this.hasMoreData,
                  currentOffset: this.currentOffset,
                  totalRecords: this.totalRecords,
                  tableDataLength: this.tableData.length
                });
                
                if (entry.isIntersecting && !this.isLoadingMore && this.hasMoreData) {
                  console.log('[ReusableTableTab] ✅ Conditions met, loading more data');
                  this.loadMoreData();
                } else if (entry.isIntersecting) {
                  console.log('[ReusableTableTab] ❌ Intersection detected but conditions not met:', {
                    isLoadingMore: this.isLoadingMore,
                    hasMoreData: this.hasMoreData
                  });
                }
              });
            },
            {
              root: this.$refs.tableContainer, // Use table container as root
              rootMargin: '300px', // Smaller margin - trigger when closer
              threshold: 0.1 // Require 10% visibility
            }
          );
          
          this.intersectionObserver.observe(this.$refs.scrollSentinel);
          console.log('[ReusableTableTab] Intersection observer configured successfully');
        } else {
          console.error('[ReusableTableTab] scrollSentinel ref not found!');
        }
      });
    },

    /**
     * Load initial data for infinite scroll
     */
    async loadInitialData() {
      console.log('[ReusableTableTab] Loading initial data');
      
      this.isLoadingMore = true;
      this.error = null;
      this.currentOffset = 0;
      // NE PAS vider tableData ici - sera remplacé dans loadDataBatch
      
      try {
        await this.loadDataBatch();
        console.log('[ReusableTableTab] Initial data loaded:', this.tableData.length, 'items');
      } catch (error) {
        console.error('[ReusableTableTab] Error loading initial data:', error);
        this.error = error.message || 'Erreur lors du chargement des données';
        // Notify error globally (do not notify normal states)
        if (this.tabsStore && typeof this.tabsStore.setMessage === 'function') {
          this.tabsStore.setMessage(this.$t('notifications.load_initial_error'))
        }
      } finally {
        this.isLoadingMore = false;
      }
    },

    /**
     * Load more data for infinite scroll
     */
    async loadMoreData() {
      if (this.isLoadingMore || !this.hasMoreData) {
        return;
      }
      
      console.log('[ReusableTableTab] Loading more data, offset:', this.currentOffset);
      
      this.isLoadingMore = true;
      this.error = null;
      
      try {
        await this.loadDataBatch();
      } catch (error) {
        console.error('[ReusableTableTab] Error loading more data:', error);
        this.error = error.message || 'Erreur lors du chargement de données supplémentaires';
        // Notify error globally (do not notify normal states)
        if (this.tabsStore && typeof this.tabsStore.setMessage === 'function') {
          this.tabsStore.setMessage(this.$t('notifications.load_more_error'))
        }
      } finally {
        this.isLoadingMore = false;
        console.log('[ReusableTableTab] ✅ More data loaded, isLoadingMore set to false');
      }
    },

    /**
     * Load a batch of data for infinite scroll using POST
     * Supports both persons (via filterStore) and tickets (direct POST)
     */
    async loadDataBatchForInfiniteScroll() {
      console.log('[ReusableTableTab] Loading batch - offset:', this.currentOffset, 'pageSize:', this.pageSize);
      
      // Calculer la page actuelle basée sur l'offset
      const currentPage = Math.floor(this.currentOffset / this.pageSize) + 1;
      
      // Construire les paramètres de tri
      const sort = {
        by: this.sortColumn || 'created_at',
        direction: this.sortDirection || 'desc'
      };
      
      // Construire les paramètres de pagination
      const pagination = {
        page: currentPage,
        limit: this.pageSize
      };
      
      let response;
      
      // Différencier l'appel selon le type d'objet
      if (this.objectName === 'Person' || this.objectName === 'Task') {
        // Pour Person et Task, utiliser le filterStore qui gère la conversion des filtres
        const lang = this.userProfileStore.language || 'en';
        console.log(`[ReusableTableTab] Calling filterStore.applySearch for ${this.objectName} with:`, { sort, pagination, lang });
        response = await this.filterStore.applySearch(
          this.objectName,
          sort,
          pagination,
          lang
        );
      } else {
        // Pour les autres tables (tickets, etc.), appel direct
        const requestBody = {
          filters: {
            mode: 'include',
            operator: 'AND',
            conditions: []
          },
          sort: sort,
          pagination: pagination,
          lang: this.userProfileStore.language || 'en'
        };
        
        console.log('[ReusableTableTab] Calling POST with body:', requestBody);
        response = await apiService.post(this.apiUrl, requestBody);
      }
      
      // Traitement commun de la réponse
      if (response && response.data) {
        // Add new data to existing data
        const newItems = response.data.map(item => ({
          ...item,
          selected: false
        }));
        
        if (this.currentOffset === 0) {
          // Initial load - REMPLACER les données existantes
          this.tableData = newItems;
        } else {
          // Append new data
          this.tableData.push(...newItems);
        }
        
        // Update pagination info
        this.totalRecords = response.total || 0;
        this.hasMoreData = response.hasMore || false;
        this.currentOffset += newItems.length;
        
        console.log(`[ReusableTableTab] Loaded ${newItems.length} items, total: ${this.tableData.length}/${this.totalRecords}`);
        
        // Measure column widths after first load (only once)
        if (this.currentOffset === newItems.length && !this.hasMeasuredColumnWidths) {
          this.$nextTick(() => this.measureColumnWidths());
        }
      } else {
        console.warn('[ReusableTableTab] Invalid response format for infinite scroll');
        this.hasMoreData = false;
      }
    },

    /**
     * Load a batch of data from the paginated API
     */
    async loadDataBatch() {
      // Si l'infinite scroll est activé, utiliser la méthode POST unifiée
      if (this.infiniteScrollEnabled) {
        return await this.loadDataBatchForInfiniteScroll();
      }
      
      // Sinon, utiliser l'ancienne méthode GET avec query params
      const params = new URLSearchParams();
      params.append('offset', this.currentOffset.toString());
      params.append('limit', this.pageSize.toString());
      
      // Add sorting
      if (this.sortColumn) {
        params.append('sortBy', this.sortColumn);
        params.append('sortDirection', this.sortDirection);
      }
      
      // Add search
      const searchTerm = this.getGlobalSearchTerm();
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      // Add filters
      // Determine which advanced filters are active (values selected or blanks toggled)
      const activeAdvancedKeys = Object.keys(this.advancedFilters || {}).filter(k => {
        const f = this.advancedFilters[k];
        return f && (f.blanks || (Array.isArray(f.values) && f.values.length > 0));
      });

      // Append basic column filters, but skip keys that have active advanced filters
      Object.keys(this.filters).forEach(key => {
        if (activeAdvancedKeys.includes(key)) {
          return; // advanced filter will handle this key
        }
        const value = this.filters[key];
        if (Array.isArray(value)) {
          // For multi-select filters, send as JSON payload for server-side parsing
          if (value.length > 0) {
            params.append(`filter_${key}`, JSON.stringify({ blanks: false, values: value }));
          }
        } else if (typeof value === 'string' && value.trim()) {
          params.append(`filter_${key}`, value.trim());
        }
      });

      // Append advanced filters as JSON payloads understood by the backend
      activeAdvancedKeys.forEach(key => {
        const f = this.advancedFilters[key] || {};
        const payload = {
          blanks: !!f.blanks,
          values: Array.isArray(f.values) ? f.values : []
        };
        params.append(`filter_${key}`, JSON.stringify(payload));
      });
      
      const url = `${this.apiUrl}?${params.toString()}`;
      console.log('[ReusableTableTab] Loading batch from URL:', url);
      
      const response = await apiService.get(url);
      
      if (response && response.data) {
        // Add new data to existing data
        const newItems = response.data.map(item => ({
          ...item,
          selected: false
        }));
        
        if (this.currentOffset === 0) {
          // Initial load
          this.tableData = newItems;
        } else {
          // Append new data
          this.tableData.push(...newItems);
        }
        
        // Update pagination info
        this.totalRecords = response.total || 0;
        this.hasMoreData = response.hasMore || false;
        this.currentOffset += newItems.length;
        
        console.log(`[ReusableTableTab] Loaded ${newItems.length} items, total: ${this.tableData.length}/${this.totalRecords}`);
        
        // Measure column widths after first load (only once)
        if (this.currentOffset === newItems.length && !this.hasMeasuredColumnWidths) {
          this.$nextTick(() => this.measureColumnWidths());
        }
      } else {
        console.warn('[ReusableTableTab] Invalid response format for paginated data');
        this.hasMoreData = false;
        // Notify invalid response globally
        if (this.tabsStore && typeof this.tabsStore.setMessage === 'function') {
          this.tabsStore.setMessage(this.$t('notifications.invalid_response'))
        }
      }
    },


    /**
     * Get global search term from filters
     */
    getGlobalSearchTerm() {
      // You can implement logic to combine multiple filters into a global search
      // For now, we'll use the first non-empty STRING filter as global search
      const firstString = Object.values(this.filters).find(v => typeof v === 'string' && v.trim());
      return firstString ? firstString.trim() : '';
    },

    /**
     * Reset and reload data for infinite scroll
     */
    resetAndReload() {
      console.log('[ReusableTableTab] Reset and reload');
      
      if (this.infiniteScrollEnabled) {
        // Reset infinite scroll state
        // NE PAS vider tableData immédiatement pour éviter la disparition visuelle
        // Les nouvelles données remplaceront les anciennes dans loadInitialData
        this.currentOffset = 0;
        this.hasMoreData = true;
        this.totalRecords = 0;
        this.error = null;
        
        // Reload initial data (qui remplacera tableData)
        this.loadInitialData();
      } else {
        // Traditional reload
        this.fetchData();
      }
    },

    /**
     * Reset and reload data when filters or sorting change
     */
    async resetInfiniteScrollData() {
      if (!this.infiniteScrollEnabled) {
        return;
      }
      
      console.log('[ReusableTableTab] Resetting infinite scroll data');
      
      this.currentOffset = 0;
      this.hasMoreData = true;
      this.error = null;
      
      await this.loadInitialData();
    },

    /**
     * Debounced reload for search/filter changes
     */
    debouncedReload() {
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
      }
      
      this.debounceTimeout = setTimeout(() => {
        this.resetAndReload();
      }, DEBOUNCE_DELAY_MS); // global debounce delay
    },

    /**
     * Retry loading data after an error
     */
    async retryLoad() {
      console.log('[ReusableTableTab] Retrying data load');
      await this.loadMoreData();
    },

    /**
     * Get active filters for a specific column
     */
    getActiveFiltersForColumn(columnKey) {
      const activeFilters = this.filterStore.getActiveFiltersForTable(this.objectName) || [];
      
      // Trouver la configuration de la colonne pour obtenir le filterKey si défini
      const columnConfig = this.columns.find(col => col.key === columnKey);
      const filterKey = columnConfig?.filterKey || columnKey;
      
      // Filtrer par colonne ET vérifier que le filtre a une valeur
      // Pour les filtres checkbox, on affiche le tag dès qu'une valeur est sélectionnée
      return activeFilters.filter(filter => {
        // Utiliser filterKey pour la comparaison au lieu de columnKey
        if (filter.column !== filterKey) {
          return false;
        }
        
        // Vérifier si le filtre a une valeur
        return this.isFilterActive(filter);
      });
    },

    /**
     * Check if a filter is active (has a value)
     */
    isFilterActive(filter) {
      const value = filter.value;
      
      // Opérateurs sans valeur sont toujours actifs
      if (['is_null', 'is_not_null', 'is_true', 'is_false'].includes(filter.type)) {
        return true;
      }
      
      // Vérifier si la valeur est présente
      if (value === null || value === undefined || value === '') {
        return false;
      }
      
      // Tableau vide
      if (Array.isArray(value) && value.length === 0) {
        return false;
      }
      
      // Objet date range vide
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return (value.gte && value.gte !== '') || (value.lte && value.lte !== '');
      }
      
      return true;
    },

    /**
     * Get column configuration from filter config
     */
    getColumnConfig(columnKey) {
      const config = this.filterStore.getConfigForTable(this.objectName) || [];
      return config.find(col => col.column === columnKey) || { column: columnKey, label: columnKey };
    },

    /**
     * Handle filter tag removal
     */
    handleRemoveFilterTag(filterId) {
      console.log('[ReusableTableTab] Removing filter tag:', filterId);
      this.filterStore.removeFilter(this.objectName, filterId);
      
      // Recharger les données
      if (this.infiniteScrollEnabled) {
        this.resetAndReload();
      } else {
        this.loadData();
      }
    },

    /**
     * Handle filter value update (when removing one item from array)
     */
    handleUpdateFilterValue(filterId, newValue) {
      console.log('[ReusableTableTab] Updating filter value:', filterId, newValue);
      this.filterStore.updateFilter(this.objectName, filterId, { value: newValue });
      
      // Recharger les données
      if (this.infiniteScrollEnabled) {
        this.resetAndReload();
      } else {
        this.loadData();
      }
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
  
  watch: {
    // Watch for filter changes in infinite scroll mode
    filters: {
      handler(newFilters, oldFilters) {
        if (this.infiniteScrollEnabled) {
          // Check if any filter actually changed
          const hasChanged = Object.keys(newFilters).some(key => 
            newFilters[key] !== oldFilters[key]
          );
          
          if (hasChanged) {
            console.log('[ReusableTableTab] Filters changed, reloading data');
            this.debouncedReload();
          }
        }
      },
      deep: true
    },
    
    // Watch for advanced filter changes
    advancedFilters: {
      handler() {
        if (this.infiniteScrollEnabled) {
          console.log('[ReusableTableTab] Advanced filters changed, reloading data');
          this.debouncedReload();
        }
      },
      deep: true
    }
  }
}
</script>

<style scoped>
@import "@/assets/styles/reusableTableTab.css";

</style>
