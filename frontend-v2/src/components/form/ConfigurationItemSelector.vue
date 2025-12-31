<template>
  <div class="configuration-item-selector">
    <AutoComplete
      v-model="selectedItem"
      :suggestions="suggestions"
      :placeholder="placeholder || $t('common.searchConfigurationItem')"
      :disabled="disabled"
      :virtualScrollerOptions="{ itemSize: 56 }"
      optionLabel="name"
      dataKey="uuid"
      dropdown
      forceSelection
      class="w-full"
      @complete="onSearch"
      @item-select="onSelect"
      @clear="onClear"
    >
      <template #option="{ option }">
        <div class="flex items-center gap-3 py-1">
          <div class="w-9 h-9 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-600 dark:text-surface-400 shrink-0">
            <i class="pi pi-box" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium truncate">{{ option.name }}</div>
            <div v-if="option.description" class="text-sm text-surface-500 truncate">{{ option.description }}</div>
          </div>
          <Tag 
            v-if="option.ci_type_code" 
            :value="option.ci_type_code" 
            severity="secondary"
            class="text-xs shrink-0"
          />
        </div>
      </template>
    </AutoComplete>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import AutoComplete from 'primevue/autocomplete'
import Tag from 'primevue/tag'
import configurationItemsService from '@/services/configurationItemsService'

const MIN_SEARCH_LENGTH = 2

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  },
  // Filter by CI type code (e.g., 'SERVICE', 'SERVICE_OFFERING', 'SERVER')
  ciTypeCode: {
    type: String,
    default: null
  },
  placeholder: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const selectedItem = ref(null)
const suggestions = ref([])

// Search configuration items via API
const onSearch = async (event) => {
  const query = event.query?.trim() || ''
  
  if (query.length < MIN_SEARCH_LENGTH) {
    suggestions.value = []
    return
  }

  try {
    const filters = {
      global: { value: query, matchMode: 'contains' }
    }
    
    // Add CI type filter if specified
    if (props.ciTypeCode) {
      filters.ci_type = { value: props.ciTypeCode, matchMode: 'equals' }
    }
    
    const result = await configurationItemsService.search({
      filters,
      page: 1,
      limit: 50,
      sortField: 'name',
      sortOrder: 1,
      globalSearchFields: ['name', 'description']
    })
    
    suggestions.value = result.data || []
  } catch (error) {
    console.error('Failed to search configuration items:', error)
    suggestions.value = []
  }
}

// Handle selection
const onSelect = (event) => {
  const item = event.value
  emit('update:modelValue', item?.uuid || null)
}

// Handle clear
const onClear = () => {
  emit('update:modelValue', null)
}

// Load item details for display when modelValue is set
const loadSelectedItem = async () => {
  if (!props.modelValue) {
    selectedItem.value = null
    return
  }
  
  try {
    const item = await configurationItemsService.getByUuid(props.modelValue)
    selectedItem.value = item
  } catch (error) {
    console.error('Failed to load configuration item:', error)
    selectedItem.value = null
  }
}

// Load selected item on mount
onMounted(() => {
  if (props.modelValue) {
    loadSelectedItem()
  }
})

// Watch for external changes to modelValue
watch(() => props.modelValue, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    if (newVal && newVal !== selectedItem.value?.uuid) {
      loadSelectedItem()
    } else if (!newVal) {
      selectedItem.value = null
    }
  }
})
</script>
