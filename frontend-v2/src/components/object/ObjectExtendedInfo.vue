<template>
  <div class="h-full flex flex-col gap-4 p-4">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <ProgressSpinner style="width: 40px; height: 40px" />
    </div>

    <!-- CI Types: Full CRUD of field definitions -->
    <template v-else-if="objectType === 'ci_types'">
      <ExtendedFieldsEditor 
        v-if="modelValue?.uuid"
        entityType="ci_types"
        :parentUuid="modelValue.uuid"
        :parentCode="modelValue.code"
      />
      <div v-else class="text-center py-8 text-surface-500">
        <i class="pi pi-info-circle text-2xl mb-2" />
        <p>{{ $t('common.saveFirst') }}</p>
      </div>
    </template>

    <!-- Ticket Types: Full CRUD of field definitions -->
    <template v-else-if="objectType === 'ticket_types'">
      <ExtendedFieldsEditor 
        v-if="modelValue?.uuid"
        entityType="ticket_types"
        :parentUuid="modelValue.uuid"
        :parentCode="modelValue.code"
      />
      <div v-else class="text-center py-8 text-surface-500">
        <i class="pi pi-info-circle text-2xl mb-2" />
        <p>{{ $t('common.saveFirst') }}</p>
      </div>
    </template>

    <!-- Configuration Items & Tickets: Key/Value table of extended fields -->
    <template v-else-if="['configuration_items', 'tickets'].includes(objectType) && extendedFields.length > 0">
      <DataTable 
        :value="extendedFieldsData" 
        dataKey="field_name"
        size="small"
        editMode="cell"
        @cellEditComplete="onCellEditComplete"
        scrollable
        scrollHeight="flex"
        class="text-sm flex-1"
      >
        <!-- Field label column -->
        <Column field="label" :header="$t('common.field')" style="min-width: 200px">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <span class="font-medium">{{ data.label }}</span>
              <span v-if="data.is_required" class="text-red-500">*</span>
              <span v-if="data.unit" class="text-surface-400 text-xs">({{ data.unit }})</span>
            </div>
          </template>
        </Column>

        <!-- Value column (inline editable) -->
        <Column field="value" :header="$t('common.value')" style="min-width: 250px">
          <template #body="{ data }">
            <!-- Boolean display -->
            <template v-if="data.field_type === 'boolean'">
              <i :class="data.value ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'" />
            </template>
            <!-- Relation display/edit (rendered in body to avoid PrimeVue cell edit issues) -->
            <template v-else-if="data.field_type === 'relation'">
              <InlineRelationEditor
                v-if="data.is_editable !== false"
                :modelValue="data.value"
                :relationData="data._relationObject"
                :relationObject="data.relation_object"
                :relationFilter="parseRelationFilter(data.relation_filter)"
                :placeholder="getRelationPlaceholder(data)"
                :embedded="true"
                @click.stop
                @save="({ uuid, data: relatedObj }) => onRelationSave(data, uuid, relatedObj)"
              />
              <span v-else :class="{ 'text-surface-400': !data.value }">
                {{ getRelationDisplayValue(data) }}
              </span>
            </template>
            <!-- Select display with icon/color -->
            <template v-else-if="data.field_type === 'select'">
              <div v-if="data.value" class="flex items-center gap-2" :style="getTagStyle(getOptionByValue(data, data.value)?.color)">
                <i v-if="getOptionByValue(data, data.value)?.icon" :class="['pi', getOptionByValue(data, data.value)?.icon]" />
                <span>{{ getSelectLabel(data) }}</span>
              </div>
              <span v-else class="text-surface-400">-</span>
            </template>
            <!-- Date display -->
            <template v-else-if="data.field_type === 'date' || data.field_type === 'datetime'">
              {{ formatDate(data.value, data.field_type) }}
            </template>
            <!-- Textarea display (rich text with hover preview) -->
            <template v-else-if="data.field_type === 'textarea'">
              <div 
                v-if="data.value" 
                class="textarea-preview"
                v-tooltip.bottom="{ 
                  value: data.value, 
                  escape: false, 
                  autoHide: false, 
                  pt: { 
                    root: {
                      style: {
                        maxWidth: '800px'
                      }
                    },
                    text: { 
                      style: {
                        minWidth: '350px',
                        maxWidth: '800px',
                        maxHeight: '500px',
                        overflowY: 'auto'
                      }
                    } 
                  } 
                }"
              >
                <span class="line-clamp-2">{{ stripHtml(data.value) }}</span>
              </div>
              <span v-else class="text-surface-400">-</span>
            </template>
            <!-- Relation display -->
            <template v-else-if="data.field_type === 'relation'">
              <span :class="{ 'text-surface-400': !data.value }">
                {{ getRelationDisplayValue(data) }}
              </span>
            </template>
            <!-- Default text display -->
            <template v-else>
              <span :class="{ 'text-surface-400': !data.value }">
                {{ data.value ?? '-' }}
              </span>
            </template>
          </template>

          <!-- Editor template -->
          <template #editor="{ data }">
            <!-- Text input -->
            <InputText 
              v-if="data.field_type === 'text'"
              v-model="data.value" 
              autofocus 
              fluid
              size="small"
            />
            <!-- Textarea (rich text editor) -->
            <Editor 
              v-else-if="data.field_type === 'textarea'"
              v-model="data.value" 
              editorStyle="height: 150px"
              @keydown="onEditorKeydown"
            />
            <!-- Number input -->
            <InputNumber 
              v-else-if="data.field_type === 'number'"
              v-model="data.value" 
              autofocus 
              fluid
              size="small"
              :min="data.min_value"
              :max="data.max_value"
            />
            <!-- Boolean toggle -->
            <ToggleSwitch 
              v-else-if="data.field_type === 'boolean'"
              v-model="data.value"
            />
            <!-- Select with icon/color templates -->
            <Select 
              v-else-if="data.field_type === 'select'"
              v-model="data.value" 
              :options="getFieldSelectOptions(data)" 
              optionLabel="label" 
              optionValue="value"
              autofocus
              fluid
              size="small"
            >
              <template #value="slotProps">
                <div v-if="slotProps.value" class="flex items-center gap-2" :style="getTagStyle(getOptionByValue(data, slotProps.value)?.color)">
                  <i v-if="getOptionByValue(data, slotProps.value)?.icon" :class="['pi', getOptionByValue(data, slotProps.value)?.icon]" />
                  <span>{{ getOptionByValue(data, slotProps.value)?.label }}</span>
                </div>
                <span v-else class="text-surface-400">{{ $t('common.select') }}</span>
              </template>
              <template #option="slotProps">
                <div class="flex items-center gap-2" :style="getTagStyle(slotProps.option.color)">
                  <i v-if="slotProps.option.icon" :class="['pi', slotProps.option.icon]" />
                  <span>{{ slotProps.option.label }}</span>
                </div>
              </template>
            </Select>
            <!-- Date picker -->
            <InlinePickerButton 
              v-else-if="data.field_type === 'date'"
              :placeholder="$t('common.selectDate')" 
              @click="openDatePicker(data, false)"
            >
              <span v-if="data.value" class="text-sm">{{ formatDate(data.value, 'date') }}</span>
            </InlinePickerButton>
            <!-- Datetime picker -->
            <InlinePickerButton 
              v-else-if="data.field_type === 'datetime'"
              :placeholder="$t('common.selectDate')" 
              @click="openDatePicker(data, true)"
            >
              <span v-if="data.value" class="text-sm">{{ formatDate(data.value, 'datetime') }}</span>
            </InlinePickerButton>
            <!-- Default fallback -->
            <InputText 
              v-else
              v-model="data.value" 
              autofocus 
              fluid
              size="small"
            />
          </template>
        </Column>
      </DataTable>
    </template>

    <!-- No extended fields for configuration_items -->
    <template v-else-if="objectType === 'configuration_items'">
      <div class="text-center py-8 text-surface-500 bg-surface-50 dark:bg-surface-800 rounded-lg">
        <i class="pi pi-inbox text-4xl mb-2" />
        <p>{{ $t('configurationItems.noExtendedFields') }}</p>
        <p class="text-sm mt-2">{{ $t('configurationItems.selectCiTypeHint') }}</p>
      </div>
    </template>

    <!-- No extended fields for tickets -->
    <template v-else-if="objectType === 'tickets'">
      <div class="text-center py-8 text-surface-500 bg-surface-50 dark:bg-surface-800 rounded-lg">
        <i class="pi pi-inbox text-4xl mb-2" />
        <p>{{ $t('tickets.noExtendedFields') }}</p>
        <p class="text-sm mt-2">{{ $t('tickets.selectTicketTypeHint') }}</p>
      </div>
    </template>

    <!-- Other object types: No extended info -->
    <template v-else>
      <div class="text-center py-8 text-surface-500">
        <i class="pi pi-info-circle text-2xl mb-2" />
        <p>{{ $t('common.noExtendedInfo') }}</p>
      </div>
    </template>

    <!-- DateTimePicker Dialog -->
    <DateTimePicker
      v-model="datePickerValue"
      :show="datePickerVisible"
      :loading="datePickerSaving"
      :title="datePickerTitle"
      :show-time="datePickerShowTime"
      @update:show="datePickerVisible = $event"
      @confirm="confirmDatePicker"
      @cancel="cancelDatePicker"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import metadataService from '@/services/metadataService'

// Utils
import { getTagStyle } from '@/utils/tagStyles'

// PrimeVue components
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Editor from 'primevue/editor'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'

// Custom components
import ExtendedFieldsEditor from '@/components/object/ExtendedFieldsEditor.vue'
import InlinePickerButton from '@/components/form/InlinePickerButton.vue'
import { DateTimePicker } from '@/components/pickers'
import InlineRelationEditor from '@/components/form/InlineRelationEditor.vue'

// Props
const props = defineProps({
  // The object being edited (v-model)
  modelValue: {
    type: Object,
    required: true
  },
  // Object type
  objectType: {
    type: String,
    required: true
  },
  // Extended fields definitions (for configuration_items)
  extendedFields: {
    type: Array,
    default: () => []
  },
  // Loading state
  loading: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue'])

// Composables
const { t, locale } = useI18n()

// Strip HTML tags and return plain text (for displaying rich text in table cells)
const stripHtml = (html) => {
  if (!html) return '-'
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || '-'
}

// DateTimePicker state
const datePickerVisible = ref(false)
const datePickerSaving = ref(false)
const datePickerValue = ref(null)
const datePickerShowTime = ref(false)
const datePickerTitle = ref('')
const datePickerFieldData = ref(null)

// Computed: Transform extended fields into table data
const extendedFieldsData = computed(() => {
  return props.extendedFields.map(field => ({
    ...field,
    value: props.modelValue?.extended_core_fields?.[field.field_name] ?? null,
    // Include the resolved relation object if available
    _relationObject: props.modelValue?._extendedRelations?.[field.field_name] ?? null
  }))
})

// Methods

// Handle cell edit complete
const onCellEditComplete = (event) => {
  const { data, newValue, field } = event
  
  if (field !== 'value') return
  
  // Update the extended_core_fields in modelValue
  const currentExtended = props.modelValue?.extended_core_fields || {}
  emit('update:modelValue', {
    ...props.modelValue,
    extended_core_fields: {
      ...currentExtended,
      [data.field_name]: newValue
    }
  })
}

// Cache for dynamically loaded options
const fieldOptionsCache = ref({})

const getOptionsSource = (field) => {
  if (!field) return null
  if (typeof field.options === 'string' && field.options) return field.options
  if (typeof field.options_source === 'string' && field.options_source) return field.options_source
  return null
}

// Load options for all select fields when extendedFields change
const loadSelectOptions = async () => {
  const selectFields = props.extendedFields.filter(f => f.field_type === 'select' && (f.options_source || f.options))
  
  for (const field of selectFields) {
    if (fieldOptionsCache.value[field.field_name]) continue // Already loaded

    const optionsSource = getOptionsSource(field)
    if (!optionsSource) {
      fieldOptionsCache.value[field.field_name] = []
      continue
    }

    if (metadataService.isApiEndpoint(optionsSource)) {
      try {
        const options = await metadataService.fetchOptions(optionsSource)
        fieldOptionsCache.value[field.field_name] = options
      } catch (error) {
        console.error(`Failed to load options for field ${field.field_name}:`, error)
        fieldOptionsCache.value[field.field_name] = []
      }
    } else {
      // Static JSON options
      try {
        fieldOptionsCache.value[field.field_name] = JSON.parse(optionsSource)
      } catch {
        fieldOptionsCache.value[field.field_name] = []
      }
    }
  }
}

// Watch for extendedFields changes to load options
watch(() => props.extendedFields, async (newFields) => {
  if (newFields && newFields.length > 0) {
    await loadSelectOptions()
  }
}, { immediate: true })

// Get select options for a field (from cache)
const getFieldSelectOptions = (field) => {
  if (Array.isArray(field.options)) return field.options
  return fieldOptionsCache.value[field.field_name] || []
}

// Get option by value for a field
const getOptionByValue = (field, value) => {
  const options = getFieldSelectOptions(field)
  return options.find(o => o.value === value)
}

// Get label for select value
const getSelectLabel = (field) => {
  const option = getOptionByValue(field, field.value)
  return option?.label || field.value
}

// Get display value for relation fields
const getRelationDisplayValue = (data) => {
  if (!data.value) return '-'
  
  // Use the resolved relation object from _extendedRelations
  if (data._relationObject) {
    // Return appropriate display field based on relation type
    if (data.relation_object === 'symptoms') {
      return data._relationObject.label || data._relationObject.code || data.value
    }
    if (data.relation_object === 'tickets') {
      return data._relationObject.title || data.value
    }
    if (data.relation_object === 'configuration_items') {
      return data._relationObject.name || data.value
    }
    // Fallback: try common display fields
    return data._relationObject.label || data._relationObject.name || data._relationObject.title || data.value
  }
  
  return data.value
}

// Get placeholder for relation field based on relation type
const getRelationPlaceholder = (data) => {
  const placeholders = {
    symptoms: t('common.searchSymptom'),
    tickets: t('common.searchTicket'),
    configuration_items: t('common.searchConfigurationItem'),
    persons: t('common.searchPerson'),
    groups: t('common.searchGroup'),
    locations: t('common.searchLocation'),
    entities: t('common.searchEntity')
  }
  return placeholders[data.relation_object] || t('common.search')
}

// Parse relation_filter from JSON string to object
const parseRelationFilter = (filter) => {
  if (!filter) return null
  if (typeof filter === 'object') return filter
  try {
    return JSON.parse(filter)
  } catch (e) {
    console.warn('[ObjectExtendedInfo] Failed to parse relation_filter:', filter)
    return null
  }
}

// Handle relation field save (from Inline*Editor components)
const onRelationSave = (data, newUuid, relatedObject) => {
  const currentExtended = props.modelValue?.extended_core_fields || {}
  const currentExtendedRelations = props.modelValue?._extendedRelations || {}
  
  // Update both extended_core_fields (UUID) and _extendedRelations (object for display)
  emit('update:modelValue', {
    ...props.modelValue,
    extended_core_fields: {
      ...currentExtended,
      [data.field_name]: newUuid
    },
    _extendedRelations: {
      ...currentExtendedRelations,
      [data.field_name]: relatedObject
    }
  })
}

// Prevent Enter key from exiting the Editor cell (allow line breaks)
const onEditorKeydown = (event) => {
  if (event.key === 'Enter') {
    event.stopPropagation()
  }
}

// Format date for display
const formatDate = (value, fieldType) => {
  if (!value) return '-'
  const date = new Date(value)
  if (fieldType === 'datetime') {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }
  return date.toLocaleDateString()
}

// Get field type severity for Tag
const getFieldTypeSeverity = (type) => {
  const severities = {
    text: 'info',
    textarea: 'info',
    number: 'success',
    boolean: 'warn',
    date: 'secondary',
    datetime: 'secondary',
    select: 'primary',
    multiselect: 'primary'
  }
  return severities[type] || 'secondary'
}

// Open DateTimePicker dialog
const openDatePicker = (data, showTime) => {
  datePickerFieldData.value = data
  datePickerShowTime.value = showTime
  datePickerTitle.value = data.label || t('common.selectDate')
  
  // Convert ISO string to Date object if needed
  if (data.value && typeof data.value === 'string') {
    datePickerValue.value = new Date(data.value)
  } else {
    datePickerValue.value = data.value
  }
  
  datePickerVisible.value = true
}

// Confirm DateTimePicker selection
const confirmDatePicker = (newValue) => {
  if (!datePickerFieldData.value) return
  
  const data = datePickerFieldData.value
  const oldValue = data.value
  
  // Skip if no change
  if (oldValue === newValue) {
    cancelDatePicker()
    return
  }
  
  // Update the extended_core_fields in modelValue
  const currentExtended = props.modelValue?.extended_core_fields || {}
  emit('update:modelValue', {
    ...props.modelValue,
    extended_core_fields: {
      ...currentExtended,
      [data.field_name]: newValue
    }
  })
  
  cancelDatePicker()
}

// Cancel DateTimePicker
const cancelDatePicker = () => {
  datePickerVisible.value = false
  datePickerFieldData.value = null
  datePickerValue.value = null
}
</script>
