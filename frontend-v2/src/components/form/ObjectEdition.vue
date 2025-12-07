<template>
  <div class="flex flex-col gap-4">
    <!-- Dynamic form fields from metadata -->
    <div 
      v-for="field in formFields" 
      :key="field.field_name" 
      class="flex flex-col gap-2"
    >
      <label :for="field.field_name" class="font-semibold">
        {{ $t(field.label_key) }}
        <span v-if="field.is_required" class="text-red-500">*</span>
      </label>
      
      <!-- Special CI Type selector for configuration_items -->
      <Select 
        v-if="isConfigurationItems && field.field_name === 'ci_type'"
        :id="field.field_name" 
        :modelValue="modelValue[field.field_name]"
        @update:modelValue="handleCiTypeChange"
        :options="ciTypes" 
        optionLabel="label" 
        optionValue="value" 
        :disabled="field.is_readonly"
        :loading="extendedFieldsLoading"
        fluid
      >
        <template #value="slotProps">
          <div 
            v-if="slotProps.value" 
            class="flex items-center gap-2"
          >
            <i 
              v-if="ciTypes.find(ct => ct.value === slotProps.value)?.icon" 
              :class="['pi', ciTypes.find(ct => ct.value === slotProps.value)?.icon]" 
            />
            <span>{{ ciTypes.find(ct => ct.value === slotProps.value)?.label }}</span>
          </div>
          <span v-else>{{ $t('configurationItems.selectType') }}</span>
        </template>
        <template #option="slotProps">
          <div class="flex items-center gap-2">
            <i 
              v-if="slotProps.option.icon" 
              :class="['pi', slotProps.option.icon]" 
            />
            <span>{{ slotProps.option.label }}</span>
          </div>
        </template>
      </Select>
      
      <!-- Text input -->
      <InputText 
        v-else-if="field.field_type === 'text'"
        :id="field.field_name" 
        :modelValue="modelValue[field.field_name]"
        @update:modelValue="updateField(field.field_name, $event)"
        :disabled="field.is_readonly"
        :maxlength="field.max_length"
        fluid 
      />
      
      <!-- Textarea -->
      <Textarea 
        v-else-if="field.field_type === 'textarea'"
        :id="field.field_name" 
        :modelValue="modelValue[field.field_name]"
        @update:modelValue="updateField(field.field_name, $event)"
        :disabled="field.is_readonly"
        rows="3" 
        fluid 
      />
      
      <!-- Number input -->
      <InputNumber 
        v-else-if="field.field_type === 'number'"
        :id="field.field_name" 
        :modelValue="modelValue[field.field_name]"
        @update:modelValue="updateField(field.field_name, $event)"
        :disabled="field.is_readonly"
        :min="field.min_value"
        :max="field.max_value"
        fluid 
      />
      
      <!-- Select with refresh button -->
      <div v-else-if="field.field_type === 'select'" class="flex gap-2">
        <Select 
          :id="field.field_name" 
          :modelValue="modelValue[field.field_name]"
          @update:modelValue="updateField(field.field_name, $event)"
          :options="getFieldOptions(field)" 
          optionLabel="label" 
          optionValue="value" 
          :disabled="field.is_readonly"
          :loading="refreshingField === field.field_name"
          class="flex-1"
        >
          <template #value="slotProps">
            <div 
              v-if="slotProps.value" 
              class="flex items-center gap-2 px-2 py-1 rounded"
              :style="getTagStyle(getOptionByValue(field, slotProps.value)?.color)"
            >
              <i 
                v-if="getOptionByValue(field, slotProps.value)?.icon" 
                :class="['pi', getOptionByValue(field, slotProps.value)?.icon]" 
              />
              <span>{{ getOptionByValue(field, slotProps.value)?.label }}</span>
            </div>
            <span v-else>{{ slotProps.placeholder }}</span>
          </template>
          <template #option="slotProps">
            <div 
              class="flex items-center gap-2 px-2 py-1 rounded"
              :style="getTagStyle(slotProps.option.color)"
            >
              <i 
                v-if="slotProps.option.icon" 
                :class="['pi', slotProps.option.icon]" 
              />
              <span>{{ slotProps.option.label }}</span>
            </div>
          </template>
        </Select>
        <Button 
          v-if="isApiOptionsSource(field)"
          icon="pi pi-refresh" 
          severity="secondary" 
          @click="$emit('refresh-options', field)"
          :loading="refreshingField === field.field_name"
          v-tooltip.top="$t('common.refresh')"
        />
      </div>
      
      <!-- Boolean toggle -->
      <ToggleSwitch 
        v-else-if="field.field_type === 'boolean'"
        :id="field.field_name" 
        :modelValue="modelValue[field.field_name]"
        @update:modelValue="updateField(field.field_name, $event)"
        :disabled="field.is_readonly"
      />
      
      <!-- Date picker -->
      <DatePicker 
        v-else-if="field.field_type === 'date'"
        :id="field.field_name" 
        :modelValue="modelValue[field.field_name]"
        @update:modelValue="updateField(field.field_name, $event)"
        :disabled="field.is_readonly"
        dateFormat="dd/mm/yy"
        fluid 
      />
      
      <!-- Datetime picker -->
      <DatePicker 
        v-else-if="field.field_type === 'datetime'"
        :id="field.field_name" 
        :modelValue="modelValue[field.field_name]"
        @update:modelValue="updateField(field.field_name, $event)"
        :disabled="field.is_readonly"
        dateFormat="dd/mm/yy"
        showTime
        fluid 
      />
      
      <!-- Relation (placeholder - will need autocomplete) -->
      <InputText 
        v-else-if="field.field_type === 'relation'"
        :id="field.field_name" 
        :modelValue="modelValue[field.field_name]"
        @update:modelValue="updateField(field.field_name, $event)"
        :disabled="field.is_readonly"
        :placeholder="`Select ${field.relation_object}...`"
        fluid 
      />
      
      <!-- Tag Style Selector -->
      <TagStyleSelector 
        v-else-if="field.field_type === 'tag_style'"
        :id="field.field_name" 
        :modelValue="modelValue[field.field_name]"
        @update:modelValue="updateField(field.field_name, $event)"
        :disabled="field.is_readonly"
      />
      
      <!-- Icon Picker -->
      <IconSelector 
        v-else-if="field.field_type === 'icon_picker'"
        :id="field.field_name" 
        :modelValue="modelValue[field.field_name]"
        @update:modelValue="updateField(field.field_name, $event)"
        :disabled="field.is_readonly"
      />
    </div>
    
    <!-- Extended fields section for configuration_items -->
    <template v-if="isConfigurationItems && extendedFields.length > 0">
      <div class="border-t border-surface-200 dark:border-surface-700 pt-4 mt-2">
        <h4 class="text-sm font-semibold text-surface-600 dark:text-surface-400 mb-4">
          {{ $t('configurationItems.extendedFields') }}
        </h4>
        
        <!-- Loading state -->
        <div v-if="extendedFieldsLoading" class="flex items-center gap-2 text-surface-500">
          <i class="pi pi-spin pi-spinner" />
          <span>{{ $t('common.loading') }}</span>
        </div>
        
        <!-- Extended fields -->
        <div 
          v-else
          v-for="field in extendedFields" 
          :key="field.field_name" 
          class="flex flex-col gap-2 mb-4"
        >
          <label :for="'ext_' + field.field_name" class="font-semibold text-sm">
            {{ field.label }}
            <span v-if="field.is_required" class="text-red-500">*</span>
            <span v-if="field.unit" class="text-surface-400 font-normal">({{ field.unit }})</span>
          </label>
          
          <!-- Text input -->
          <InputText 
            v-if="field.field_type === 'text'"
            :id="'ext_' + field.field_name" 
            :modelValue="getExtendedFieldValue(field.field_name)"
            @update:modelValue="setExtendedFieldValue(field.field_name, $event)"
            :disabled="field.is_readonly"
            :maxlength="field.max_length"
            :placeholder="field.pattern ? `Format: ${field.pattern}` : ''"
            fluid 
          />
          
          <!-- Textarea -->
          <Textarea 
            v-else-if="field.field_type === 'textarea'"
            :id="'ext_' + field.field_name" 
            :modelValue="getExtendedFieldValue(field.field_name)"
            @update:modelValue="setExtendedFieldValue(field.field_name, $event)"
            :disabled="field.is_readonly"
            rows="3" 
            fluid 
          />
          
          <!-- Number input -->
          <InputNumber 
            v-else-if="field.field_type === 'number'"
            :id="'ext_' + field.field_name" 
            :modelValue="getExtendedFieldValue(field.field_name)"
            @update:modelValue="setExtendedFieldValue(field.field_name, $event)"
            :disabled="field.is_readonly"
            :min="field.min_value"
            :max="field.max_value"
            fluid 
          />
          
          <!-- Select -->
          <Select 
            v-else-if="field.field_type === 'select'"
            :id="'ext_' + field.field_name" 
            :modelValue="getExtendedFieldValue(field.field_name)"
            @update:modelValue="setExtendedFieldValue(field.field_name, $event)"
            :options="getExtendedFieldOptions(field)" 
            optionLabel="label" 
            optionValue="value" 
            :disabled="field.is_readonly"
            fluid
          />
          
          <!-- Multiselect -->
          <MultiSelect 
            v-else-if="field.field_type === 'multiselect'"
            :id="'ext_' + field.field_name" 
            :modelValue="getExtendedFieldValue(field.field_name) || []"
            @update:modelValue="setExtendedFieldValue(field.field_name, $event)"
            :options="getExtendedFieldOptions(field)" 
            optionLabel="label" 
            optionValue="value" 
            :disabled="field.is_readonly"
            display="chip"
            fluid
          />
          
          <!-- Boolean toggle -->
          <ToggleSwitch 
            v-else-if="field.field_type === 'boolean'"
            :id="'ext_' + field.field_name" 
            :modelValue="getExtendedFieldValue(field.field_name) || false"
            @update:modelValue="setExtendedFieldValue(field.field_name, $event)"
            :disabled="field.is_readonly"
          />
          
          <!-- Date picker -->
          <DatePicker 
            v-else-if="field.field_type === 'date'"
            :id="'ext_' + field.field_name" 
            :modelValue="getExtendedFieldValue(field.field_name)"
            @update:modelValue="setExtendedFieldValue(field.field_name, $event)"
            :disabled="field.is_readonly"
            dateFormat="dd/mm/yy"
            fluid 
          />
          
          <!-- Datetime picker -->
          <DatePicker 
            v-else-if="field.field_type === 'datetime'"
            :id="'ext_' + field.field_name" 
            :modelValue="getExtendedFieldValue(field.field_name)"
            @update:modelValue="setExtendedFieldValue(field.field_name, $event)"
            :disabled="field.is_readonly"
            dateFormat="dd/mm/yy"
            showTime
            fluid 
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// PrimeVue components
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import ToggleSwitch from 'primevue/toggleswitch'
import MultiSelect from 'primevue/multiselect'

// Custom form components
import TagStyleSelector from '@/components/form/TagStyleSelector.vue'
import IconSelector from '@/components/form/IconSelector.vue'

// Utils
import { getTagStyle } from '@/utils/tagStyles'

// Props
const props = defineProps({
  // The object being edited (v-model)
  modelValue: {
    type: Object,
    required: true
  },
  // Form fields metadata
  formFields: {
    type: Array,
    required: true
  },
  // Object type (e.g., 'configuration_items', 'persons')
  objectType: {
    type: String,
    required: true
  },
  // Field options cache (for select fields)
  fieldOptions: {
    type: Object,
    default: () => ({})
  },
  // CI types for configuration_items
  ciTypes: {
    type: Array,
    default: () => []
  },
  // Extended fields for configuration_items
  extendedFields: {
    type: Array,
    default: () => []
  },
  // Loading state for extended fields
  extendedFieldsLoading: {
    type: Boolean,
    default: false
  },
  // Field currently being refreshed
  refreshingField: {
    type: String,
    default: null
  },
  // Mode: 'create' or 'edit'
  mode: {
    type: String,
    default: 'create'
  }
})

// Emits
const emit = defineEmits([
  'update:modelValue',
  'ci-type-change',
  'refresh-options'
])

// Composables
const { t, locale } = useI18n()

// Computed
const isConfigurationItems = computed(() => props.objectType === 'configuration_items')

// Methods

// Update a field value
const updateField = (fieldName, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [fieldName]: value
  })
}

// Get options for select fields (from cache)
const getFieldOptions = (field) => {
  if (!field.options_source) return []
  return props.fieldOptions[field.field_name] || []
}

// Get option by value for a field
const getOptionByValue = (field, value) => {
  const options = getFieldOptions(field)
  return options.find(o => o.value === value)
}

// Check if field options come from API (not static JSON)
const isApiOptionsSource = (field) => {
  return field.options_source && field.options_source.startsWith('/api/')
}

// Handle CI type change
const handleCiTypeChange = (newValue) => {
  emit('ci-type-change', newValue)
}

// Get extended field value from extended_core_fields
const getExtendedFieldValue = (fieldName) => {
  return props.modelValue.extended_core_fields?.[fieldName] ?? null
}

// Set extended field value in extended_core_fields
const setExtendedFieldValue = (fieldName, value) => {
  const currentExtended = props.modelValue.extended_core_fields || {}
  emit('update:modelValue', {
    ...props.modelValue,
    extended_core_fields: {
      ...currentExtended,
      [fieldName]: value
    }
  })
}

// Get options for extended field
const getExtendedFieldOptions = (field) => {
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
</script>
