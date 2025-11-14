<template>
  <div class="widgets-table">
    <!-- Toolbar -->
    <div class="widgets-table__toolbar">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Filtrer par titre..."
        class="widgets-table__search"
      />
      <span class="widgets-table__count">
        {{ selectedWidgets.length }} / {{ filteredData.length }} sélectionné(s)
      </span>
    </div>

    <!-- Table Container -->
    <div class="widgets-table__container">
      <table class="widgets-table__table">
        <thead class="widgets-table__thead">
          <tr>
            <th class="widgets-table__th widgets-table__th--checkbox">
              <input
                type="checkbox"
                :checked="isAllSelected"
                :indeterminate.prop="isIndeterminate"
                @change="toggleSelectAll"
                class="widgets-table__checkbox"
              />
            </th>
            <th class="widgets-table__th widgets-table__th--sortable" @click="toggleSort('display_title')">
              <div class="widgets-table__th-content">
                Titre
                <i 
                  class="fas" 
                  :class="getSortIcon('display_title')"
                ></i>
              </div>
            </th>
            <th class="widgets-table__th widgets-table__th--sortable" @click="toggleSort('widget_type')">
              <div class="widgets-table__th-content">
                Type
                <i 
                  class="fas" 
                  :class="getSortIcon('widget_type')"
                ></i>
              </div>
            </th>
            <th class="widgets-table__th widgets-table__th--sortable" @click="toggleSort('api_endpoint')">
              <div class="widgets-table__th-content">
                Endpoint
                <i 
                  class="fas" 
                  :class="getSortIcon('api_endpoint')"
                ></i>
              </div>
            </th>
            <th class="widgets-table__th widgets-table__th--sortable" @click="toggleSort('refresh_interval')">
              <div class="widgets-table__th-content">
                Intervalle
                <i 
                  class="fas" 
                  :class="getSortIcon('refresh_interval')"
                ></i>
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="widgets-table__tbody">
          <tr 
            v-for="widget in sortedData" 
            :key="widget.uuid"
            class="widgets-table__tr"
            :class="{ 'widgets-table__tr--selected': isSelected(widget.uuid) }"
          >
            <td class="widgets-table__td widgets-table__td--checkbox">
              <input
                type="checkbox"
                :checked="isSelected(widget.uuid)"
                @change="toggleSelect(widget.uuid)"
                class="widgets-table__checkbox"
              />
            </td>
            <td class="widgets-table__td widgets-table__td--title">
              {{ widget.display_title }}
            </td>
            <td class="widgets-table__td">
              <span class="widgets-table__badge" :class="`widgets-table__badge--${widget.widget_type}`">
                {{ widget.widget_type }}
              </span>
            </td>
            <td class="widgets-table__td widgets-table__td--endpoint">
              <code class="widgets-table__code">{{ widget.api_endpoint || '-' }}</code>
            </td>
            <td class="widgets-table__td widgets-table__td--interval">
              {{ formatInterval(widget.refresh_interval) }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="filteredData.length === 0" class="widgets-table__empty">
        <i class="fas fa-inbox"></i>
        <p>{{ searchQuery ? 'Aucun widget ne correspond à votre recherche' : 'Aucun widget disponible' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  widgets: {
    type: Array,
    required: true,
    default: () => []
  },
  modelValue: {
    type: Array,
    required: true,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

// Local state
const searchQuery = ref('')
const sortColumn = ref('display_title')
const sortDirection = ref('asc') // 'asc' or 'desc'

// Computed
const selectedWidgets = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const filteredData = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.widgets
  }
  
  const query = searchQuery.value.toLowerCase()
  return props.widgets.filter(widget => 
    widget.display_title?.toLowerCase().includes(query)
  )
})

const sortedData = computed(() => {
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
         filteredData.value.every(w => selectedWidgets.value.includes(w.uuid))
})

const isIndeterminate = computed(() => {
  const selectedCount = filteredData.value.filter(w => selectedWidgets.value.includes(w.uuid)).length
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
    // Deselect all visible widgets
    const visibleUuids = filteredData.value.map(w => w.uuid)
    selectedWidgets.value = selectedWidgets.value.filter(uuid => !visibleUuids.includes(uuid))
  } else {
    // Select all visible widgets
    const visibleUuids = filteredData.value.map(w => w.uuid)
    const newSelection = [...new Set([...selectedWidgets.value, ...visibleUuids])]
    selectedWidgets.value = newSelection
  }
}

function toggleSelect(uuid) {
  if (selectedWidgets.value.includes(uuid)) {
    selectedWidgets.value = selectedWidgets.value.filter(id => id !== uuid)
  } else {
    selectedWidgets.value = [...selectedWidgets.value, uuid]
  }
}

function isSelected(uuid) {
  return selectedWidgets.value.includes(uuid)
}

function formatInterval(seconds) {
  if (!seconds || seconds === 0) return 'Aucun'
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}min`
}
</script>

<style scoped>
.widgets-table {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

/* Toolbar */
.widgets-table__toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

.widgets-table__search {
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

.widgets-table__search:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-color-light);
}

.widgets-table__count {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
  white-space: nowrap;
}

/* Table Container */
.widgets-table__container {
  position: relative;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--card-bg);
}

/* Table */
.widgets-table__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

/* Table Header */
.widgets-table__thead {
  position: sticky;
  top: 0;
  background: var(--bg-secondary);
  z-index: 10;
  box-shadow: 0 1px 0 var(--border-color);
}

.widgets-table__th {
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: var(--text-color);
  border-bottom: 2px solid var(--border-color);
  white-space: nowrap;
}

.widgets-table__th--checkbox {
  width: 40px;
  text-align: center;
}

.widgets-table__th--sortable {
  cursor: pointer;
  user-select: none;
  transition: background 0.2s ease;
}

.widgets-table__th--sortable:hover {
  background: var(--hover-color);
}

.widgets-table__th-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.widgets-table__th-content i {
  color: var(--text-secondary);
  font-size: 0.75rem;
}

/* Table Body */
.widgets-table__tbody {
  background: var(--card-bg);
}

.widgets-table__tr {
  transition: background 0.2s ease;
  border-bottom: 1px solid var(--border-color);
}

.widgets-table__tr:hover {
  background: var(--hover-color);
}

.widgets-table__tr--selected {
  background: var(--primary-color-light);
}

.widgets-table__tr--selected:hover {
  background: var(--primary-color-light);
}

.widgets-table__td {
  padding: 0.75rem;
  color: var(--text-color);
  vertical-align: middle;
}

.widgets-table__td--checkbox {
  width: 40px;
  text-align: center;
}

.widgets-table__td--title {
  font-weight: 500;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.widgets-table__td--endpoint {
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.widgets-table__td--interval {
  text-align: center;
  font-weight: 500;
}

/* Checkbox */
.widgets-table__checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--primary-color);
}

/* Badge */
.widgets-table__badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.widgets-table__badge--counter {
  background: var(--light-blue);
  color: #1565c0;
}

.widgets-table__badge--list {
  background: var(--light-green);
  color: #2e7d32;
}

.widgets-table__badge--chart {
  background: var(--light-purple);
  color: #5e35b1;
}

.widgets-table__badge--custom {
  background: var(--light-orange);
  color: #e65100;
}

/* Code */
.widgets-table__code {
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  padding: 0.125rem 0.375rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 3px;
  color: var(--text-color);
}

/* Empty State */
.widgets-table__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: var(--text-secondary);
  text-align: center;
}

.widgets-table__empty i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.3;
}

.widgets-table__empty p {
  margin: 0;
  font-size: 0.95rem;
}

/* Scrollbar styling */
.widgets-table__container::-webkit-scrollbar {
  width: 8px;
}

.widgets-table__container::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

.widgets-table__container::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

.widgets-table__container::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}
</style>
