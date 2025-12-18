<template>
  <div class="person-selector">
    <AutoComplete
      v-model="selectedPerson"
      :suggestions="suggestions"
      :placeholder="$t('common.searchPerson')"
      :disabled="disabled"
      :virtualScrollerOptions="{ itemSize: 56 }"
      optionLabel="display_name"
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
          <div class="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-semibold shrink-0">
            {{ getInitials(option) }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium truncate">{{ option.first_name }} {{ option.last_name }}</div>
            <div class="text-sm text-surface-500 truncate">{{ option.email }}</div>
          </div>
        </div>
      </template>
    </AutoComplete>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import AutoComplete from 'primevue/autocomplete'
import personsService from '@/services/personsService'

const MIN_SEARCH_LENGTH = 2

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const selectedPerson = ref(null)
const suggestions = ref([])

// Get initials for avatar
const getInitials = (person) => {
  const first = person?.first_name?.[0] || ''
  const last = person?.last_name?.[0] || ''
  return (first + last).toUpperCase()
}

// Search persons via API
const onSearch = async (event) => {
  const query = event.query?.trim() || ''
  
  if (query.length < MIN_SEARCH_LENGTH) {
    suggestions.value = []
    return
  }

  try {
    const result = await personsService.search({
      filters: {
        global: { value: query, matchMode: 'contains' }
      },
      page: 1,
      limit: 50,
      sortField: 'last_name',
      sortOrder: 1,
      globalSearchFields: ['first_name', 'last_name', 'email']
    })
    
    // Add display_name for optionLabel
    suggestions.value = (result.data || []).map(p => ({
      ...p,
      display_name: `${p.first_name} ${p.last_name}`
    }))
  } catch (error) {
    console.error('Failed to search persons:', error)
    suggestions.value = []
  }
}

// Handle selection
const onSelect = (event) => {
  const person = event.value
  emit('update:modelValue', person?.uuid || null)
}

// Handle clear
const onClear = () => {
  emit('update:modelValue', null)
}

// Load person details for display when modelValue is set
const loadSelectedPerson = async () => {
  if (!props.modelValue) {
    selectedPerson.value = null
    return
  }
  
  try {
    const person = await personsService.getByUuid(props.modelValue)
    if (person) {
      selectedPerson.value = {
        ...person,
        display_name: `${person.first_name} ${person.last_name}`
      }
    }
  } catch (error) {
    console.error('Failed to load person:', error)
    selectedPerson.value = null
  }
}

// Load selected person on mount
onMounted(() => {
  if (props.modelValue) {
    loadSelectedPerson()
  }
})

// Watch for external changes to modelValue
watch(() => props.modelValue, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    if (newVal && newVal !== selectedPerson.value?.uuid) {
      loadSelectedPerson()
    } else if (!newVal) {
      selectedPerson.value = null
    }
  }
})
</script>
