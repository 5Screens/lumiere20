<template>
  <div class="inline-ticket-editor">
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
        optionLabel="title"
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
            <i :class="getTicketTypeIcon(slotProps.option.ticket_type_code)" />
            <span>{{ slotProps.option.title }}</span>
            <span v-if="!ticketTypeCode" class="text-surface-400 text-sm">
              ({{ slotProps.option.ticket_type_code }})
            </span>
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
import ticketsService from '@/services/ticketsService'
import AutoComplete from 'primevue/autocomplete'
import Button from 'primevue/button'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  },
  ticketObject: {
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
  },
  // Filter by ticket type code (e.g., 'PROJECT', 'EPIC', 'SPRINT', 'PROBLEM', 'CHANGE')
  ticketTypeCode: {
    type: String,
    default: null
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

// Get ticket type icon
const getTicketTypeIcon = (typeCode) => {
  const icons = {
    TASK: 'pi pi-check-square',
    INCIDENT: 'pi pi-exclamation-triangle',
    PROBLEM: 'pi pi-search',
    PROJECT: 'pi pi-folder',
    CHANGE: 'pi pi-sync',
    KNOWLEDGE: 'pi pi-book',
    USER_STORY: 'pi pi-user',
    SPRINT: 'pi pi-forward',
    EPIC: 'pi pi-star',
    DEFECT: 'pi pi-bug'
  }
  return icons[typeCode] || 'pi pi-ticket'
}

// Computed
const displayValue = computed(() => {
  if (props.ticketObject) {
    return props.ticketObject.title
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
  if (props.ticketObject) {
    localValue.value = {
      uuid: props.ticketObject.uuid,
      title: props.ticketObject.title,
      ticket_type_code: props.ticketObject.ticket_type_code
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
  localValue.value = event.value
}

const save = async () => {
  saving.value = true
  try {
    const newUuid = localValue.value?.uuid || null
    emit('save', { uuid: newUuid, ticket: localValue.value })
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
    
    const result = await ticketsService.search({
      filters,
      page: 1,
      limit: 20,
      sortField: 'title',
      sortOrder: 1
    }, props.ticketTypeCode)
    
    suggestions.value = (result.data || []).map(t => ({
      uuid: t.uuid,
      title: t.title,
      ticket_type_code: t.ticket_type_code
    }))
  } catch (error) {
    console.error('[InlineTicketEditor] Error searching tickets:', error)
    suggestions.value = []
  }
}
</script>

<style scoped>
.inline-ticket-editor {
  min-width: 200px;
}
</style>
