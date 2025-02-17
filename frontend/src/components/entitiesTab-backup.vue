<template>
  <div class="symptoms-tab">
    <!-- Boutons de contrôle -->
    <div class="tab-symptom-button">
      <div class="left-buttons">
        <button class="control-button create" @click="handleCreate">Create</button>
        <button class="control-button update" @click="handleUpdate">Update</button>
        <button class="control-button delete" @click="handleDelete">Delete</button>
      </div>
      <div class="right-buttons">
        <button class="control-button import" @click="handleImport" :title="$t('configuration.import')">
          <i class="fas fa-file-import"></i>
        </button>
        <button class="control-button export" @click="handleExport" :title="$t('configuration.export')">
          <i class="fas fa-file-export"></i>
        </button>
        <button class="control-button refresh" @click="handleRefresh" :title="$t('configuration.refresh')">
          <i class="fas fa-sync-alt"></i>
        </button>
      </div>
    </div>

    <!-- Tableau des entités -->
    <div class="tab-symptom-table">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th class="resizable">
                <div class="th-content">
                  <input type="checkbox" @change="toggleAllRows" v-model="selectAll" />
                  <div class="resize-handle" @mousedown="startResize($event, 0)"></div>
                </div>
              </th>
              <th v-for="(column, index) in columns" :key="column.key" class="resizable">
                <div class="th-content">
                  <div @click="sortBy(column.key)" class="sortable">
                    {{ $t(`entitiesTable.headers.${column.key}`) }}
                    <span class="sort-icon">
                      <template v-if="sortColumn === column.key">
                        {{ sortDirection === 'asc' ? '▲' : '▼' }}
                      </template>
                      <template v-else>▲▼</template>
                    </span>
                  </div>
                  <div class="resize-handle" @mousedown="startResize($event, index + 1)"></div>
                </div>
              </th>
            </tr>
            <tr class="filter-row">
              <th></th>
              <th v-for="column in columns" :key="`filter-${column.key}`">
                <input v-if="column.type === 'text'" 
                       type="text" 
                       v-model="filters[column.key]" 
                       :placeholder="`Filter ${column.label}...`" 
                       class="column-filter" />
                <input v-else-if="column.type === 'date'" 
                       type="date" 
                       v-model="filters[column.key]" 
                       class="column-filter" />
                <select v-else-if="column.type === 'boolean'"
                        v-model="filters[column.key]"
                        class="column-filter">
                  <option value="">All</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </th>
            </tr>
          </thead>
          <transition-group name="list" tag="tbody">
            <tr v-for="row in paginatedData" 
                :key="row.uuid" 
                @click="toggleRowSelection(row)"
                :class="{ 'selected-row': row.selected }"
                style="cursor: pointer;">
              <td @click.stop><input type="checkbox" v-model="row.selected" /></td>
              <td v-for="column in columns" 
                  :key="`${row.uuid}-${column.key}`"
                  @contextmenu.prevent="showCopyIcon($event, row[column.key])">
                <template v-if="column.type === 'uuid'">
                  ...{{ row[column.key].slice(-5) }}
                </template>
                <template v-else-if="column.type === 'boolean'">
                  {{ row[column.key] ? 'Yes' : 'No' }}
                </template>
                <template v-else>
                  {{ row[column.key] }}
                </template>
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
      <div class="pagination">
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
  </div>
  <div class="copy-icon" v-if="showCopyIconAt" :style="copyIconStyle" @click="copyToClipboard" :class="{ 'fade-out': isFading }">
    <i class="fas fa-copy"></i>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'EntitiesTab',
  data() {
    return {
      columns: [
        { key: 'uuid', label: 'UUID', type: 'uuid' },
        { key: 'entity_id', label: 'Entity ID', type: 'text' },
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'parent_entity_name', label: 'Parent Entity', type: 'text' },
        { key: 'external_id', label: 'External ID', type: 'text' },
        { key: 'entity_type', label: 'Type', type: 'text' },
        { key: 'headquarters_location', label: 'Location', type: 'text' },
        { key: 'is_active', label: 'Active', type: 'boolean' },
        { key: 'budget_approver_name', label: 'Budget Approver', type: 'text' },
        { key: 'date_creation', label: 'Created Date', type: 'date' },
        { key: 'date_modification', label: 'Modified Date', type: 'date' }
      ],
      entities: [],
      selectAll: false,
      filters: {
        uuid: '',
        entity_id: '',
        name: '',
        parent_entity_name: '',
        external_id: '',
        entity_type: '',
        headquarters_location: '',
        is_active: '',
        budget_approver_name: '',
        date_creation: '',
        date_modification: ''
      },
      sortColumn: 'name',
      sortDirection: 'asc',
      currentPage: 1,
      itemsPerPage: 10,
      showCopyIconAt: null,
      copyContent: '',
      isFading: false,
      columnWidths: []
    };
  },
  computed: {
    filteredData() {
      return this.entities
        .map(entity => ({
          ...entity,
          selected: entity.selected || false
        }))
        .filter(entity => {
          return Object.keys(this.filters).every(key => {
            const filter = this.filters[key];
            if (!filter) return true;

            const value = entity[key];
            if (value === null || value === undefined) return false;

            if (key === 'is_active') {
              return filter === value.toString();
            }

            if (key.includes('date')) {
              const filterDate = new Date(filter);
              const valueDate = new Date(value);
              return filterDate.toDateString() === valueDate.toDateString();
            }

            return value.toString().toLowerCase()
              .includes(filter.toString().toLowerCase());
          });
        })
        .sort((a, b) => {
          const aVal = a[this.sortColumn];
          const bVal = b[this.sortColumn];

          if (aVal === null) return this.sortDirection === 'asc' ? 1 : -1;
          if (bVal === null) return this.sortDirection === 'asc' ? -1 : 1;

          if (this.sortDirection === 'asc') {
            return aVal > bVal ? 1 : -1;
          } else {
            return aVal < bVal ? 1 : -1;
          }
        });
    },
    paginatedData() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.filteredData.slice(start, start + this.itemsPerPage);
    },
    totalPages() {
      return Math.ceil(this.filteredData.length / this.itemsPerPage);
    },
    copyIconStyle() {
      if (!this.showCopyIconAt) return {};
      return {
        top: `${this.showCopyIconAt.y}px`,
        left: `${this.showCopyIconAt.x}px`
      };
    }
  },
  methods: {
    async getAllEntitiesFromServer() {
      try {
        const response = await axios.get('http://localhost:3000/api/v1/entities');
        this.entities = response.data.map(entity => ({
          ...entity,
          date_creation: this.formatDate(entity.date_creation),
          date_modification: this.formatDate(entity.date_modification)
        }));
      } catch (error) {
        console.error('Error fetching entities:', error);
        this.$emit('show-error', 'Failed to fetch entities');
      }
    },
    formatDate(date) {
      if (!date) return '';
      return new Date(date).toISOString().split('T')[0];
    },
    toggleAllRows() {
      this.entities = this.entities.map(entity => ({
        ...entity,
        selected: this.selectAll
      }));
    },
    async handleCreate() {
      // À implémenter
    },
    async handleRefresh() {
      this.selectAll = false;
      await this.getAllEntitiesFromServer();
    },
    async handleUpdate() {
      // À implémenter
    },
    async handleDelete() {
      // À implémenter
    },
    previousPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    },
    handleItemsPerPageChange() {
      this.currentPage = 1;
    },
    async handleImport() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const data = JSON.parse(e.target.result);
              // Validation des données importées
              if (!Array.isArray(data)) {
                throw new Error('Invalid data format');
              }
              
              // TODO: Implémenter l'import des données
              console.log('Importing data:', data);
              
            } catch (error) {
              console.error('Error parsing import file:', error);
              this.$emit('show-error', 'Failed to parse import file');
            }
          };
          reader.readAsText(file);
        } catch (error) {
          console.error('Error reading import file:', error);
          this.$emit('show-error', 'Failed to read import file');
        }
      };
      
      input.click();
    },
    handleExport() {
      try {
        const dataToExport = this.filteredData.map(({ selected, ...rest }) => rest);
        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        a.href = url;
        a.download = `entities-export-${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Erreur lors de l\'export:', error);
        this.$emit('show-error', 'Failed to export data');
      }
    },
    sortBy(column) {
      if (this.sortColumn === column) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortColumn = column;
        this.sortDirection = 'asc';
      }
    },
    showCopyIcon(event, content) {
      if (content === null || content === undefined) return;
      
      const rect = event.target.getBoundingClientRect();
      this.showCopyIconAt = {
        x: event.clientX,
        y: event.clientY
      };
      this.copyContent = content.toString();
      
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
      }
      this.hideTimeout = setTimeout(this.hideIconWithFade, 2000);
    },
    hideIconWithFade() {
      this.isFading = true;
      setTimeout(() => {
        this.showCopyIconAt = null;
        this.isFading = false;
      }, 300);
    },
    async copyToClipboard() {
      try {
        await navigator.clipboard.writeText(this.copyContent);
        this.hideIconWithFade();
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    },
    startResize(event, columnIndex) {
      event.preventDefault();
      const table = event.target.closest('table');
      const initialX = event.clientX;
      const columnWidth = this.columnWidths[columnIndex] || 100;

      const handleMouseMove = (moveEvent) => {
        const deltaX = moveEvent.clientX - initialX;
        const newWidth = Math.max(50, columnWidth + deltaX);
        this.columnWidths[columnIndex] = newWidth;
        table.style.setProperty(`--col-${columnIndex}-width`, `${newWidth}px`);
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    initializeColumnWidths() {
      this.columnWidths = Array(this.columns.length + 1).fill(100);
      this.$nextTick(() => {
        const table = this.$el.querySelector('table');
        if (table) {
          const headers = table.querySelectorAll('th');
          headers.forEach((header, index) => {
            if (this.columnWidths[index]) {
              header.style.width = `${this.columnWidths[index]}px`;
            }
          });
        }
      });
    },
    toggleRowSelection(row) {
      row.selected = !row.selected;
    }
  },
  mounted() {
    this.getAllEntitiesFromServer();
    this.initializeColumnWidths();
  }
}
</script>

<style>
@import '@/assets/styles/symptoms-tab.css';
</style>
