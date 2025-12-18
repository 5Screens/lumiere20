<template>
  <div class="flex flex-col gap-4 p-4">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <ProgressSpinner style="width: 40px; height: 40px" />
    </div>

    <!-- Form fields -->
    <template v-else>
      <div 
        v-for="field in filteredFormFields" 
        :key="field.field_name" 
        class="flex flex-col gap-2"
      >
        <label :for="field.field_name" class="font-semibold">
          {{ $t(field.label_key) }}
          <span v-if="field.is_required" class="text-red-500">*</span>
        </label>
        
        <!-- Translatable text input -->
        <TranslatableInput 
          v-if="field.field_type === 'text' && field.is_translatable"
          :id="field.field_name" 
          :modelValue="modelValue[field.field_name] || ''"
          :translations="modelValue._translations?.[field.field_name] || {}"
          :fieldLabel="$t(field.label_key)"
          :disabled="field.is_readonly"
          @update:modelValue="updateField(field.field_name, $event)"
          @update:translations="updateTranslations(field.field_name, $event)"
        />
        
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
        
        <!-- Translatable textarea -->
        <TranslatableInput 
          v-else-if="field.field_type === 'textarea' && field.is_translatable"
          :id="field.field_name" 
          :modelValue="modelValue[field.field_name] || ''"
          :translations="modelValue._translations?.[field.field_name] || {}"
          :fieldLabel="$t(field.label_key)"
          :disabled="field.is_readonly"
          :multiline="true"
          @update:modelValue="updateField(field.field_name, $event)"
          @update:translations="updateTranslations(field.field_name, $event)"
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
        
        <!-- Select -->
        <Select 
          v-else-if="field.field_type === 'select'"
          :id="field.field_name" 
          :modelValue="modelValue[field.field_name]"
          @update:modelValue="updateField(field.field_name, $event)"
          :options="getFieldOptions(field)" 
          optionLabel="label" 
          optionValue="value" 
          :disabled="field.is_readonly || isFieldDisabled(field)"
          fluid
        >
          <template #value="slotProps">
            <div 
              v-if="slotProps.value" 
              class="flex items-center gap-2"
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
              class="flex items-center gap-2"
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
          :modelValue="toDate(modelValue[field.field_name])"
          @update:modelValue="updateField(field.field_name, $event)"
          :disabled="field.is_readonly"
          dateFormat="dd/mm/yy"
          fluid 
        />
        
        <!-- Datetime picker -->
        <DatePicker 
          v-else-if="field.field_type === 'datetime'"
          :id="field.field_name" 
          :modelValue="toDate(modelValue[field.field_name])"
          @update:modelValue="updateField(field.field_name, $event)"
          :disabled="field.is_readonly"
          dateFormat="dd/mm/yy"
          showTime
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
        
        <!-- CI Category Selector -->
        <CICategorySelector 
          v-else-if="field.field_type === 'ci_category'"
          :id="field.field_name" 
          :modelValue="modelValue[field.field_name]"
          @update:modelValue="updateField(field.field_name, $event)"
          :disabled="field.is_readonly"
        />
        
        <!-- CI Model Selector -->
        <CiModelSelector 
          v-else-if="field.field_type === 'ci_model'"
          :id="field.field_name" 
          :modelValue="modelValue[field.field_name]"
          :ciTypeCode="modelValue.ci_type"
          @update:modelValue="updateField(field.field_name, $event)"
          :disabled="field.is_readonly"
        />
        
        <!-- CI Type Target Selector (for model CIs to select which type they are model for) -->
        <CiTypeTargetSelector 
          v-else-if="field.field_type === 'ci_type_target'"
          :id="field.field_name" 
          :modelValue="modelValue[field.field_name]"
          @update:modelValue="updateField(field.field_name, $event)"
          :disabled="field.is_readonly"
        />
        
        <!-- Person Selector -->
        <PersonSelector 
          v-else-if="field.field_type === 'person'"
          :id="field.field_name" 
          :modelValue="modelValue[field.field_name]"
          @update:modelValue="updateField(field.field_name, $event)"
          :disabled="field.is_readonly"
        />
        
        <!-- Configuration Item Selector -->
        <ConfigurationItemSelector 
          v-else-if="field.field_type === 'configuration_item'"
          :id="field.field_name" 
          :modelValue="modelValue[field.field_name]"
          @update:modelValue="updateField(field.field_name, $event)"
          :disabled="field.is_readonly"
        />
      </div>
      <!-- Status selector for configuration_items -->
      <div v-if="showStatusSelector" class="flex flex-col gap-2">
        <label class="font-semibold">{{ $t('common.status') }}</label>
        <StatusPicker 
          :currentStatus="modelValue.status"
          :availableTransitions="availableTransitions"
          @transition="applyTransition"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useReferenceDataStore } from '@/stores/referenceDataStore'

// PrimeVue components
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import DatePicker from 'primevue/datepicker'
import ProgressSpinner from 'primevue/progressspinner'

const { locale } = useI18n()
const referenceDataStore = useReferenceDataStore()

// Custom form components
import TagStyleSelector from '@/components/form/TagStyleSelector.vue'
import IconSelector from '@/components/form/IconSelector.vue'
import TranslatableInput from '@/components/form/TranslatableInput.vue'
import CICategorySelector from '@/components/form/CICategorySelector.vue'
import CiModelSelector from '@/components/form/CiModelSelector.vue'
import CiTypeTargetSelector from '@/components/form/CiTypeTargetSelector.vue'
import StatusPicker from '@/components/form/StatusPicker.vue'
import PersonSelector from '@/components/form/PersonSelector.vue'
import ConfigurationItemSelector from '@/components/form/ConfigurationItemSelector.vue'

// Utils
import { getTagStyle } from '@/utils/tagStyles'

// Convert ISO string or Date to Date object for DatePicker
const toDate = (value) => {
  if (!value) return null
  if (value instanceof Date) return value
  return new Date(value)
}

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
  // Field options cache (for select fields)
  fieldOptions: {
    type: Object,
    default: () => ({})
  },
  // Loading state
  loading: {
    type: Boolean,
    default: false
  },
  // Forced CI type UUID (disables ci_type field when set)
  forcedCiTypeUuid: {
    type: String,
    default: null
  },
  // Show status selector (for configuration_items)
  showStatusSelector: {
    type: Boolean,
    default: false
  },
  // Available transitions for current status
  availableTransitions: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'apply-transition'])

// Apply a transition (change status)
const applyTransition = (transition) => {
  emit('apply-transition', transition)
}

// Methods

// Update a field value (preserves _translations explicitly)
const updateField = (fieldName, value) => {
  const currentTranslations = props.modelValue._translations || {}
  emit('update:modelValue', {
    ...props.modelValue,
    _translations: currentTranslations,
    [fieldName]: value
  })
}

// Update translations for a translatable field
const updateTranslations = (fieldName, translations) => {
  const currentTranslations = props.modelValue._translations || {}
  emit('update:modelValue', {
    ...props.modelValue,
    _translations: {
      ...currentTranslations,
      [fieldName]: translations
    }
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

// Check if a field should be disabled (e.g., ci_type when forcedCiTypeUuid is set)
const isFieldDisabled = (field) => {
  // Disable ci_type field when forcedCiTypeUuid is set
  if (field.field_name === 'ci_type' && props.forcedCiTypeUuid) {
    return true
  }
  return false
}

// Use store for reference data (autonomous)
const ciTypes = computed(() => referenceDataStore.ciTypes)
const ciCategories = computed(() => referenceDataStore.ciCategories)

// Filter form fields based on CI type properties
const filteredFormFields = computed(() => {
  // For configuration_items: check CI type's has_model property
  const currentCiType = ciTypes.value.find(ct => ct.code === props.modelValue?.ci_type)
  const hasModel = currentCiType?.has_model === true
  
  // For ci_types: check if selected category is MODELS
  const selectedCategoryUuid = props.modelValue?.rel_category_uuid
  const selectedCategory = ciCategories.value.find(cat => cat.uuid === selectedCategoryUuid)
  const isModelsCategorySelected = selectedCategory?.code === 'MODELS'
  
  return props.formFields.filter(field => {
    // Hide rel_model_uuid if CI type doesn't have has_model (for configuration_items)
    if (field.field_name === 'rel_model_uuid') {
      return hasModel
    }
    // Show is_model_for_ci_type_uuid only if category is MODELS (for ci_types)
    if (field.field_name === 'is_model_for_ci_type_uuid') {
      return isModelsCategorySelected
    }
    return true
  })
})
</script>
