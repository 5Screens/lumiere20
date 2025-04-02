<template>
  <div 
    :class="[
      's-filtered-search-field', 
      { 's-filtered-search-field--editing': isEditing }
    ]"
  >
    <div class="s-filtered-search-field__label-container" v-if="label">
      <label 
        :class="[
          's-filtered-search-field__label',
          { 's-filtered-search-field__label--required': required }
        ]"
      >
        {{ label }}
      </label>
    </div>
    
    <div class="s-filtered-search-field__content-container">
      <!-- Selected value display -->
      <div 
        :class="[
          's-filtered-search-field__selected-value',
          { 's-filtered-search-field__selected-value--editing': isEditing && editMode },
          { 's-filtered-search-field__selected-value--placeholder': !selectedItem }
        ]"
        @click="toggleDropdown"
      >
        <span v-if="selectedItem">{{ getDisplayValue(selectedItem) }}</span>
        <span v-else>{{ placeholder }}</span>
        <span>▼</span>
      </div>
      
      <!-- Action buttons for edit mode -->
      <div v-if="isEditing && valueChanged && editMode" class="s-filtered-search-field__actions">
        <RgButton
          @confirm="confirmChange"
          @cancel="cancelChange"
          :disabled="disabled"
        />
      </div>
      
      <!-- Dropdown with search and table -->
      <Transition name="dropdown">
        <div v-if="showDropdown" class="s-filtered-search-field__dropdown">
          <!-- Search input -->
          <div class="s-filtered-search-field__search-container">
            <input 
              type="text" 
              v-model="searchQuery" 
              class="s-filtered-search-field__search-input"
              placeholder="Search..."
              @click.stop
              ref="searchInput"
            />
          </div>
          
          <!-- Loading state -->
          <div v-if="loading" class="s-filtered-search-field__loading">
            <div class="s-filtered-search-field__spinner"></div>
          </div>
          
          <!-- Table with data -->
          <div v-else-if="filteredItems.length > 0" class="s-filtered-search-field__table-container">
            <table class="s-filtered-search-field__table">
              <thead>
                <tr>
                  <th v-for="column in visibleColumns" :key="column.field">{{ column.label }}</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="item in filteredItems" 
                  :key="item.uuid"
                  :class="{ 'selected': isItemSelected(item) }"
                  @click.stop="selectItem(item)"
                >
                  <td v-for="column in visibleColumns" :key="column.field">
                    {{ getItemValue(item, column.field || column.key) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- No results message -->
          <div v-else class="s-filtered-search-field__no-results">
            No results found
          </div>
        </div>
      </Transition>
      
      <!-- Error or helper text -->
      <span v-if="error" class="s-filtered-search-field__error">{{ error }}</span>
      <span v-else-if="helperText" class="s-filtered-search-field__helper">{{ helperText }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import apiService from '@/services/apiService'
import RgButton from './rgButton.vue'
import '@/assets/styles/sFilteredSearchField.css'

// Component state
const isEditing = ref(false)
const showDropdown = ref(false)
const loading = ref(false)
const items = ref([])
const searchQuery = ref('')
const selectedItem = ref(null)
const originalItem = ref(null)
const valueChanged = ref(false)
const columns = ref([])
const visibleColumns = computed(() => {
  // Si une configuration de colonnes est fournie, l'utiliser
  if (props.columnsConfig && props.columnsConfig.length > 0) {
    return props.columnsConfig
      .filter(column => column.visible !== false)
      .map(column => ({
        field: column.key,
        label: column.label
      }));
  }
  // Sinon, utiliser les colonnes détectées automatiquement
  return columns.value.filter(column => column.isVisible !== false);
})
const error = ref('')
const searchInput = ref(null)

// Props
const props = defineProps({
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Select an item'
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  helperText: {
    type: String,
    default: ''
  },
  modelValue: {
    type: [String, Object],
    default: null
  },
  displayField: {
    type: String,
    default: 'name'
  },
  valueField: {
    type: String,
    default: 'uuid'
  },
  endpoint: {
    type: [String, Function],
    required: true
  },
  ticketData: {
    type: Object,
    default: () => ({})
  },
  uuid: {
    type: String,
    default: ''
  },
  fieldName: {
    type: String,
    default: ''
  },
  patchEndpoint: {
    type: String,
    default: ''
  },
  editMode: {
    type: Boolean,
    default: false
  },
  columnsConfig: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'update:success', 'update:error'])

// Computed properties
const filteredItems = computed(() => {
  if (!searchQuery.value) return items.value
  
  const query = searchQuery.value.toLowerCase()
  return items.value.filter(item => {
    // Check if any column value contains the search query
    return visibleColumns.value.some(column => {
      const value = getItemValue(item, column.field || column.key)
      return value && value.toString().toLowerCase().includes(query)
    })
  })
})

const resolvedEndpoint = computed(() => {
  if (typeof props.endpoint === 'function') {
    // Si la fonction endpoint attend le ticket complet
    return props.endpoint(props.ticketData)
  }
  return props.endpoint
})

// Methods
const fetchItems = async () => {
  loading.value = true
  error.value = ''
  
  // Skip fetching if endpoint is null or undefined
  if (!resolvedEndpoint.value) {
    loading.value = false
    items.value = []
    return
  }
  
  try {
    const data = await apiService.get(resolvedEndpoint.value)
    items.value = Array.isArray(data) ? data : []
    
    // Si une configuration de colonnes est fournie, l'utiliser
    if (props.columnsConfig && props.columnsConfig.length > 0) {
      // Pas besoin de déterminer les colonnes automatiquement
      // car elles sont déjà définies dans columnsConfig
    } else {
      // Determine columns automatically from the first item
      if (items.value.length > 0) {
        const firstItem = items.value[0]
        columns.value = Object.keys(firstItem)
          .filter(key => !key.startsWith('_') && key !== 'uuid')
          .map(key => ({
            field: key,
            label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
            isVisible: true
          }))
        
        // Always add uuid as the first column if it exists
        if ('uuid' in firstItem) {
          columns.value.unshift({
            field: 'uuid',
            label: 'ID',
            isVisible: true
          })
        }
      }
    }
    
    // If modelValue is set, find the corresponding item
    if (props.modelValue) {
      findAndSelectInitialItem()
    }
  } catch (err) {
    console.error("Error fetching items:", err)
    error.value = `Failed to load items: ${err.message}`
  } finally {
    loading.value = false
  }
}

const findAndSelectInitialItem = () => {
  // If modelValue is an object with uuid, use that
  if (typeof props.modelValue === 'object' && props.modelValue?.uuid) {
    const found = items.value.find(item => item.uuid === props.modelValue.uuid)
    if (found) {
      selectedItem.value = found
      originalItem.value = { ...found }
    }
  } 
  // If modelValue is a string (uuid), find the corresponding item
  else if (typeof props.modelValue === 'string') {
    const found = items.value.find(item => item.uuid === props.modelValue)
    if (found) {
      selectedItem.value = found
      originalItem.value = { ...found }
    }
  }
}

const toggleDropdown = () => {
  if (props.disabled) return
  
  showDropdown.value = !showDropdown.value
  
  if (showDropdown.value) {
    // Focus the search input when dropdown opens
    nextTick(() => {
      if (searchInput.value) {
        searchInput.value.focus()
      }
    })
  }
}

const selectItem = (item) => {
  const previousItem = selectedItem.value
  selectedItem.value = item
  
  // In edit mode, track if value has changed
  if (props.editMode) {
    valueChanged.value = !isEqual(item, originalItem.value)
    isEditing.value = true
  }
  
  // Close dropdown
  showDropdown.value = false
  
  // Emit update event if value has changed
  if (!isEqual(item, previousItem)) {
    emit('update:modelValue', item.uuid)
  }
}

const isItemSelected = (item) => {
  return selectedItem.value && selectedItem.value.uuid === item.uuid
}

const getItemValue = (item, field) => {
  if (!item) return ''
  
  // Handle both field and key properties (for compatibility with columnsConfig)
  const fieldName = field
  return item[fieldName] !== undefined ? item[fieldName] : ''
}

const getDisplayValue = (item) => {
  console.log('[getDisplayValue] Input item:', item);
  console.log('[getDisplayValue] Display field:', props.displayField);
  const value = getItemValue(item, props.displayField);
  console.log('[getDisplayValue] Computed value:', value);
  return value;
}

const confirmChange = async () => {
  if (!props.uuid || !props.patchEndpoint || !props.fieldName) {
    console.warn('UUID, patch endpoint, or field name not provided for field update')
    emit('update:error', {
      fieldName: props.fieldName,
      error: 'UUID, patch endpoint, or field name not provided'
    })
    return
  }
  
  try {
    // Prepare the endpoint with UUID
    const endpointWithUuid = `${props.patchEndpoint}/${props.uuid}`
    
    // Prepare the data object for PATCH request
    const data = {
      [props.fieldName]: selectedItem.value.uuid
    }
    
    // Use apiService to make the PATCH request
    await apiService.patch(endpointWithUuid, data)
    
    // Update original value after successful update
    originalItem.value = { ...selectedItem.value }
    valueChanged.value = false
    isEditing.value = false
    
    // Emit success event
    emit('update:success', {
      fieldName: props.fieldName,
      value: selectedItem.value.uuid
    })
  } catch (err) {
    console.error("Error updating field:", err)
    error.value = `Failed to update: ${err.message}`
    
    // Emit error event
    emit('update:error', {
      fieldName: props.fieldName,
      error: err.message
    })
  }
}

const cancelChange = () => {
  // Revert to original value
  selectedItem.value = originalItem.value
  valueChanged.value = false
  isEditing.value = false
  
  // Emit update event with original value
  if (originalItem.value) {
    emit('update:modelValue', originalItem.value.uuid)
  } else {
    emit('update:modelValue', null)
  }
  
  // Emit cancel event
  emit('field-change-cancelled', {
    fieldName: props.fieldName
  })
}

// Helper function to compare objects
const isEqual = (obj1, obj2) => {
  if (!obj1 && !obj2) return true
  if (!obj1 || !obj2) return false
  return obj1.uuid === obj2.uuid
}

// Click outside handler to close dropdown
const handleClickOutside = (event) => {
  const element = event.target
  const isInsideComponent = element.closest('.s-filtered-search-field')
  
  if (!isInsideComponent && showDropdown.value) {
    showDropdown.value = false
  }
}

// Watch for modelValue changes
watch(() => props.modelValue, (newValue) => {
  console.log('[watch modelValue] New value:', newValue);
  console.log('[watch modelValue] Items length:', items.value.length);
  
  if (items.value.length > 0) {
    findAndSelectInitialItem();
  }
});

// Watch for endpoint changes
watch(() => resolvedEndpoint.value, (newEndpoint, oldEndpoint) => {
  console.log('[watch resolvedEndpoint] Endpoint changed from:', oldEndpoint, 'to:', newEndpoint);
  if (newEndpoint !== oldEndpoint) {
    console.log('[watch resolvedEndpoint] Fetching items with new endpoint');
    fetchItems();
  }
});

// Watch for items changes to handle async loading
watch(() => items.value, (newItems) => {
  console.log('[watch items] Items loaded, length:', newItems.length);
  console.log('[watch items] Current modelValue:', props.modelValue);
  if (props.modelValue && newItems.length > 0) {
    console.log('[watch items] Attempting to select initial item');
    findAndSelectInitialItem();
  }
}, { immediate: true })

// Lifecycle hooks
onMounted(() => {
  fetchItems()
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
