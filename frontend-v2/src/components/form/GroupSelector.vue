<template>
  <div class="group-selector">
    <AutoComplete
      ref="autocompleteRef"
      v-model="selectedGroup"
      :suggestions="suggestions"
      :placeholder="$t('common.searchGroup')"
      :disabled="disabled"
      :virtualScrollerOptions="{ itemSize: 48 }"
      optionLabel="group_name"
      dataKey="uuid"
      dropdown
      forceSelection
      :loading="loading"
      class="w-full"
      @complete="onSearch"
      @item-select="onSelect"
      @clear="onClear"
    >
      <template #option="{ option }">
        <div class="flex items-center gap-3 py-1">
          <div class="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-semibold shrink-0">
            <i class="pi pi-users"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium truncate">{{ option.group_name }}</div>
            <div v-if="option.support_level" class="text-sm text-surface-500 truncate">
              {{ $t('groups.supportLevel') }}: {{ option.support_level }}
            </div>
          </div>
        </div>
      </template>
    </AutoComplete>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import AutoComplete from 'primevue/autocomplete'
import groupsService from '@/services/groupsService'

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

const autocompleteRef = ref(null)
const selectedGroup = ref(null)
const suggestions = ref([])
const loading = ref(false)
const allGroups = ref([])

// Load all groups on mount (groups are usually a small list)
onMounted(async () => {
  await loadAllGroups()
  
  // If we have a modelValue, find and set the selected group
  if (props.modelValue) {
    await loadSelectedGroup()
  }
})

// Load all groups for dropdown
const loadAllGroups = async () => {
  try {
    loading.value = true
    const result = await groupsService.search({ page: 1, limit: 100 })
    allGroups.value = result.data || []
  } catch (error) {
    console.error('Failed to load groups:', error)
    allGroups.value = []
  } finally {
    loading.value = false
  }
}

// Load selected group by UUID
const loadSelectedGroup = async () => {
  if (!props.modelValue) {
    selectedGroup.value = null
    return
  }
  
  try {
    // First check if it's in our cached list
    const cached = allGroups.value.find(g => g.uuid === props.modelValue)
    if (cached) {
      selectedGroup.value = cached
      return
    }
    
    // Otherwise fetch it
    const group = await groupsService.getByUuid(props.modelValue)
    if (group) {
      selectedGroup.value = group
    }
  } catch (error) {
    console.error('Failed to load selected group:', error)
    selectedGroup.value = null
  }
}

// Search handler
const onSearch = (event) => {
  const query = event.query?.toLowerCase() || ''
  
  if (!query) {
    suggestions.value = [...allGroups.value]
  } else {
    suggestions.value = allGroups.value.filter(group => 
      group.group_name?.toLowerCase().includes(query)
    )
  }
}

// Selection handler
const onSelect = (event) => {
  const group = event.value
  if (group?.uuid) {
    emit('update:modelValue', group.uuid)
  }
}

// Clear handler
const onClear = () => {
  selectedGroup.value = null
  emit('update:modelValue', null)
}

// Watch for external modelValue changes
watch(() => props.modelValue, async (newVal) => {
  if (newVal !== selectedGroup.value?.uuid) {
    await loadSelectedGroup()
  }
})
</script>

<style scoped>
.group-selector :deep(.p-autocomplete) {
  width: 100%;
}

.group-selector :deep(.p-autocomplete-input) {
  width: 100%;
}
</style>
