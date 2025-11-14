<template>
  <div class="table-component">
    <!-- Toolbar -->
    <div class="table-component__toolbar">
      <input
        v-if="searchable"
        v-model="searchQuery"
        type="text"
        :placeholder="searchPlaceholder"
        class="table-component__search"
      />
      <span class="table-component__count">
        {{ selectedItems.length }} / {{ filteredData.length }} sélectionné(s)
      </span>
    </div>

    <!-- Table Container -->
    <div class="table-component__container" :style="{ maxHeight: maxHeight }">
      <table class="table-component__table">
        <thead class="table-component__thead">
          <tr>
            <th class="table-component__th table-component__th--checkbox">
              <input
                type="checkbox"
                :checked="isAllSelected"
                :indeterminate.prop="isIndeterminate"
                @change="toggleSelectAll"
                class="table-component__checkbox"
              />
            </th>
            <th 
              v-for="column in columns" 
              :key="column.key"
              class="table-component__th"
              :class="{ 'table-component__th--sortable': column.sortable }"
              @click="column.sortable ? toggleSort(column.key) : null"
            >
              <div class="table-component__th-content">
                {{ column.label }}
                <i 
                  v-if="column.sortable"
                  class="fas" 
                  :class="getSortIcon(column.key)"
                ></i>
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="table-component__tbody">
          <tr 
            v-for="item in sortedData" 
            :key="item[itemKey]"
            class="table-component__tr"
            :class="{ 'table-component__tr--selected': isSelected(item[itemKey]) }"
          >
            <td class="table-component__td table-component__td--checkbox">
              <input
                type="checkbox"
                :checked="isSelected(item[itemKey])"
                @change="toggleSelect(item[itemKey])"
                class="table-component__checkbox"
              />
            </td>
            <td 
              v-for="column in columns" 
              :key="column.key"
              class="table-component__td"
              :class="column.class"
            >
              <slot 
                :name="`cell-${column.key}`" 
                :item="item" 
                :value="item[column.key]"
              >
                {{ formatCell(item[column.key], column) }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="filteredData.length === 0" class="table-component__empty">
        <i class="fas fa-inbox"></i>
        <p>{{ emptyMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  // Data
  data: {
    type: Array,
    required: true,
    default: () => []
  },
  // Columns configuration
  columns: {
    type: Array,
    required: true,
    default: () => []
    // Format: [{ key: 'name', label: 'Name', sortable: true, class: 'custom-class', formatter: (value) => value }]
  },
  // Selection
  modelValue: {
    type: Array,
    required: true,
    default: () => []
  },
  itemKey: {
    type: String,
    default: 'uuid'
  },
  // Search
  searchable: {
    type: Boolean,
    default: true
  },
  searchPlaceholder: {
    type: String,
    default: 'Filtrer...'
  },
  searchKeys: {
    type: Array,
    default: () => []
    // Keys to search in, e.g., ['name', 'description']
  },
  // Styling
  maxHeight: {
    type: String,
    default: '400px'
  },
  // Messages
  emptyMessage: {
    type: String,
    default: 'Aucune donnée disponible'
  }
})

const emit = defineEmits(['update:modelValue'])

// Local state
const searchQuery = ref('')
const sortColumn = ref(props.columns.find(c => c.sortable)?.key || '')
const sortDirection = ref('asc') // 'asc' or 'desc'

// Computed
const selectedItems = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const filteredData = computed(() => {
  if (!props.searchable || !searchQuery.value.trim()) {
    return props.data
  }
  
  const query = searchQuery.value.toLowerCase()
  
  return props.data.filter(item => {
    // If searchKeys are specified, search only in those keys
    if (props.searchKeys.length > 0) {
      return props.searchKeys.some(key => {
        const value = item[key]
        return value && String(value).toLowerCase().includes(query)
      })
    }
    
    // Otherwise, search in all columns
    return props.columns.some(column => {
      const value = item[column.key]
      return value && String(value).toLowerCase().includes(query)
    })
  })
})

const sortedData = computed(() => {
  if (!sortColumn.value) {
    return filteredData.value
  }
  
  const data = [...filteredData.value]
  
  data.sort((a, b) => {
    let aVal = a[sortColumn.value]
    let bVal = b[sortColumn.value]
    
    // Handle null/undefined
    if (aVal == null) aVal = ''
    if (bVal == null) bVal = ''
    
    // Convert to string for comparison
    aVal = String(aVal).toLowerCase()
    bVal = String(bVal).toLowerCase()
    
    if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })
  
  return data
})

const isAllSelected = computed(() => {
  return filteredData.value.length > 0 && 
         filteredData.value.every(item => selectedItems.value.includes(item[props.itemKey]))
})

const isIndeterminate = computed(() => {
  const selectedCount = filteredData.value.filter(item => 
    selectedItems.value.includes(item[props.itemKey])
  ).length
  return selectedCount > 0 && selectedCount < filteredData.value.length
})

// Methods
function toggleSort(column) {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

function getSortIcon(column) {
  if (sortColumn.value !== column) {
    return 'fa-sort'
  }
  return sortDirection.value === 'asc' ? 'fa-sort-up' : 'fa-sort-down'
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    // Deselect all visible items
    const visibleIds = filteredData.value.map(item => item[props.itemKey])
    selectedItems.value = selectedItems.value.filter(id => !visibleIds.includes(id))
  } else {
    // Select all visible items
    const visibleIds = filteredData.value.map(item => item[props.itemKey])
    const newSelection = [...new Set([...selectedItems.value, ...visibleIds])]
    selectedItems.value = newSelection
  }
}

function toggleSelect(id) {
  if (selectedItems.value.includes(id)) {
    selectedItems.value = selectedItems.value.filter(itemId => itemId !== id)
  } else {
    selectedItems.value = [...selectedItems.value, id]
  }
}

function isSelected(id) {
  return selectedItems.value.includes(id)
}

function formatCell(value, column) {
  if (column.formatter && typeof column.formatter === 'function') {
    return column.formatter(value)
  }
  return value || '-'
}
</script>

<style scoped>
.table-component {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

/* Toolbar */
.table-component__toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

.table-component__search {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 0.875rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.table-component__search:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-color-light);
}

.table-component__count {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
  white-space: nowrap;
}

/* Table Container */
.table-component__container {
  position: relative;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--card-bg);
}

/* Table */
.table-component__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

/* Table Header */
.table-component__thead {
  position: sticky;
  top: 0;
  background: var(--bg-secondary);
  z-index: 10;
  box-shadow: 0 1px 0 var(--border-color);
}

.table-component__th {
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: var(--text-color);
  border-bottom: 2px solid var(--border-color);
  white-space: nowrap;
}

.table-component__th--checkbox {
  width: 40px;
  text-align: center;
}

.table-component__th--sortable {
  cursor: pointer;
  user-select: none;
  transition: background 0.2s ease;
}

.table-component__th--sortable:hover {
  background: var(--hover-color);
}

.table-component__th-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.table-component__th-content i {
  color: var(--text-secondary);
  font-size: 0.75rem;
}

/* Table Body */
.table-component__tbody {
  background: var(--card-bg);
}

.table-component__tr {
  transition: background 0.2s ease;
  border-bottom: 1px solid var(--border-color);
}

.table-component__tr:hover {
  background: var(--hover-color);
}

.table-component__tr--selected {
  background: var(--primary-color-light);
}

.table-component__tr--selected:hover {
  background: var(--primary-color-light);
}

.table-component__td {
  padding: 0.75rem;
  color: var(--text-color);
  vertical-align: middle;
}

.table-component__td--checkbox {
  width: 40px;
  text-align: center;
}

/* Checkbox */
.table-component__checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--primary-color);
}

/* Empty State */
.table-component__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: var(--text-secondary);
  text-align: center;
}

.table-component__empty i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.3;
}

.table-component__empty p {
  margin: 0;
  font-size: 0.95rem;
}

/* Scrollbar styling */
.table-component__container::-webkit-scrollbar {
  width: 8px;
}

.table-component__container::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

.table-component__container::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

.table-component__container::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}
</style>
