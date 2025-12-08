<template>
  <div class="h-full flex flex-col gap-4 p-4">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <ProgressSpinner style="width: 40px; height: 40px" />
    </div>

    <!-- CI Types: Full CRUD of field definitions -->
    <template v-else-if="objectType === 'ci_types'">
      <CiTypeFieldsEditor 
        v-if="modelValue?.uuid"
        :ciTypeUuid="modelValue.uuid"
        :ciTypeCode="modelValue.code"
      />
      <div v-else class="text-center py-8 text-surface-500">
        <i class="pi pi-info-circle text-2xl mb-2" />
        <p>{{ $t('common.saveFirst') }}</p>
      </div>
    </template>

    <!-- Configuration Items: Key/Value table of extended fields -->
    <template v-else-if="objectType === 'configuration_items' && extendedFields.length > 0">
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
            <!-- Select display -->
            <template v-else-if="data.field_type === 'select'">
              <Tag v-if="data.value" :value="getSelectLabel(data)" severity="info" />
              <span v-else class="text-surface-400">-</span>
            </template>
            <!-- Date display -->
            <template v-else-if="data.field_type === 'date' || data.field_type === 'datetime'">
              {{ formatDate(data.value, data.field_type) }}
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
            <!-- Textarea -->
            <Textarea 
              v-else-if="data.field_type === 'textarea'"
              v-model="data.value" 
              autofocus 
              rows="2"
              fluid
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
            <!-- Select -->
            <Select 
              v-else-if="data.field_type === 'select'"
              v-model="data.value" 
              :options="getFieldSelectOptions(data)" 
              optionLabel="label" 
              optionValue="value"
              autofocus
              fluid
              size="small"
            />
            <!-- Date picker -->
            <DatePicker 
              v-else-if="data.field_type === 'date'"
              v-model="data.value" 
              dateFormat="dd/mm/yy"
              autofocus
              fluid
              size="small"
            />
            <!-- Datetime picker -->
            <DatePicker 
              v-else-if="data.field_type === 'datetime'"
              v-model="data.value" 
              dateFormat="dd/mm/yy"
              showTime
              autofocus
              fluid
              size="small"
            />
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

    <!-- No extended fields -->
    <template v-else-if="objectType === 'configuration_items'">
      <div class="text-center py-8 text-surface-500 bg-surface-50 dark:bg-surface-800 rounded-lg">
        <i class="pi pi-inbox text-4xl mb-2" />
        <p>{{ $t('configurationItems.noExtendedFields') }}</p>
        <p class="text-sm mt-2">{{ $t('configurationItems.selectCiTypeHint') }}</p>
      </div>
    </template>

    <!-- Other object types: No extended info -->
    <template v-else>
      <div class="text-center py-8 text-surface-500">
        <i class="pi pi-info-circle text-2xl mb-2" />
        <p>{{ $t('common.noExtendedInfo') }}</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// PrimeVue components
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import DatePicker from 'primevue/datepicker'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'

// Custom components
import CiTypeFieldsEditor from '@/components/object/CiTypeFieldsEditor.vue'

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
const { locale } = useI18n()

// Computed: Transform extended fields into table data
const extendedFieldsData = computed(() => {
  return props.extendedFields.map(field => ({
    ...field,
    value: props.modelValue?.extended_core_fields?.[field.field_name] ?? null
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

// Get select options for a field
const getFieldSelectOptions = (field) => {
  if (field.options) return field.options
  if (field.options_source) {
    try {
      return JSON.parse(field.options_source)
    } catch {
      return []
    }
  }
  return []
}

// Get label for select value
const getSelectLabel = (field) => {
  const options = getFieldSelectOptions(field)
  const option = options.find(o => o.value === field.value)
  return option?.label || field.value
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
</script>
