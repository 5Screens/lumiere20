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
    <div v-else class="flex items-center gap-1">
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
      
      <!-- Buttons stacked vertically -->
      <div class="flex flex-col gap-0">
        <!-- Save button (top) -->
        <Button
          icon="pi pi-check"
          severity="success"
          size="small"
          text
          @click.stop="save"
          :disabled="saving || !hasChanges"
          v-tooltip.left="$t('common.save')"
          :pt="{ root: { class: 'p-1 w-6 h-6' }, icon: { class: 'text-xs' } }"
        />
        
        <!-- Cancel button (bottom) -->
        <Button
          icon="pi pi-times"
          severity="danger"
          size="small"
          text
          @click.stop="cancel"
          :disabled="saving"
          v-tooltip.left="$t('common.cancel')"
          :pt="{ root: { class: 'p-1 w-6 h-6' }, icon: { class: 'text-xs' } }"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import personsService from '@/services/personsService'
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

const hasChanges = computed(() => {
  const currentUuid = localValue.value?.uuid || null
  const initialUuid = initialValue.value?.uuid || null
  return currentUuid !== initialUuid
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
      filters.global = { value: query, matchMode: 'contains' }
    }
    
    const result = await personsService.search({
      filters,
      page: 1,
      limit: 20,
      sortField: 'last_name',
      sortOrder: 1
    })
    
    suggestions.value = (result.data || []).map(p => ({
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
