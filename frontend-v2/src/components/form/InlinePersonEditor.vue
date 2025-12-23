<template>
  <div class="inline-person-editor">
    <!-- Display mode -->
    <div 
      v-if="!isEditing" 
      class="cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 px-2 py-1 rounded transition-colors"
      @click="startEditing"
    >
      <span v-if="displayValue">{{ displayValue }}</span>
      <span v-else class="text-surface-400 italic">{{ placeholder }}</span>
    </div>

    <!-- Edit mode -->
    <div v-else class="flex items-center gap-2">
      <AutoComplete
        ref="autocompleteRef"
        v-model="localValue"
        :suggestions="suggestions"
        @complete="onSearch"
        @item-select="onItemSelect"
        optionLabel="fullName"
        :placeholder="placeholder"
        :minLength="0"
        forceSelection
        dropdown
        appendTo="body"
        class="flex-1"
        :pt="{ root: { class: 'w-full' }, input: { class: 'w-full text-sm' } }"
      >
        <template #option="slotProps">
          <div class="flex items-center gap-2">
            <i class="pi pi-user" />
            <span>{{ slotProps.option.fullName }}</span>
            <span class="text-surface-400 text-sm">({{ slotProps.option.email }})</span>
          </div>
        </template>
      </AutoComplete>
      
      <!-- Save button -->
      <Button
        icon="pi pi-check"
        severity="success"
        size="small"
        rounded
        text
        @click.stop="save"
        :disabled="saving"
        v-tooltip.top="$t('common.save')"
      />
      
      <!-- Cancel button -->
      <Button
        icon="pi pi-times"
        severity="secondary"
        size="small"
        rounded
        text
        @click.stop="cancel"
        :disabled="saving"
        v-tooltip.top="$t('common.cancel')"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/services/api'
import AutoComplete from 'primevue/autocomplete'
import Button from 'primevue/button'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  },
  personObject: {
    type: Object,
    default: null
  },
  placeholder: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

// State
const isEditing = ref(false)
const localValue = ref(null)
const initialValue = ref(null)
const suggestions = ref([])
const saving = ref(false)
const autocompleteRef = ref(null)

// Computed
const displayValue = computed(() => {
  if (props.personObject) {
    return `${props.personObject.first_name} ${props.personObject.last_name}`
  }
  return null
})

// Methods
const startEditing = () => {
  if (props.disabled) return
  
  isEditing.value = true
  
  // Set initial value
  if (props.personObject) {
    localValue.value = {
      uuid: props.personObject.uuid,
      first_name: props.personObject.first_name,
      last_name: props.personObject.last_name,
      email: props.personObject.email,
      fullName: `${props.personObject.first_name} ${props.personObject.last_name}`
    }
  } else {
    localValue.value = null
  }
  initialValue.value = localValue.value ? { ...localValue.value } : null
  
  // Focus autocomplete after render
  nextTick(() => {
    if (autocompleteRef.value?.$el) {
      const input = autocompleteRef.value.$el.querySelector('input')
      if (input) input.focus()
    }
  })
}

const onItemSelect = (event) => {
  // When user selects an item (keyboard or mouse), update localValue
  localValue.value = event.value
}

const save = async () => {
  saving.value = true
  try {
    const newUuid = localValue.value?.uuid || null
    emit('save', { uuid: newUuid, person: localValue.value })
    isEditing.value = false
  } finally {
    saving.value = false
  }
}

const cancel = () => {
  localValue.value = initialValue.value ? { ...initialValue.value } : null
  isEditing.value = false
  emit('cancel')
}

const onSearch = async (event) => {
  try {
    const query = event.query || ''
    const filters = {}
    
    if (query.trim()) {
      filters.globalFilter = { value: query, matchMode: 'contains' }
    }
    
    const response = await api.post('/persons/search', {
      filters,
      page: 1,
      limit: 20,
      sortField: 'last_name',
      sortOrder: 1
    })
    
    suggestions.value = (response.data.data || []).map(p => ({
      uuid: p.uuid,
      first_name: p.first_name,
      last_name: p.last_name,
      email: p.email,
      fullName: `${p.first_name} ${p.last_name}`
    }))
  } catch (error) {
    console.error('[InlinePersonEditor] Error searching persons:', error)
    suggestions.value = []
  }
}
</script>

<style scoped>
.inline-person-editor {
  min-width: 200px;
}
</style>
