<template>
  <div class="flex flex-col gap-4 p-4">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <ProgressSpinner style="width: 40px; height: 40px" />
    </div>

    <!-- Form fields -->
    <template v-else>
      <div 
        v-for="field in formFields" 
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
          :disabled="field.is_readonly"
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
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// PrimeVue components
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import DatePicker from 'primevue/datepicker'
import ProgressSpinner from 'primevue/progressspinner'

// Custom form components
import TagStyleSelector from '@/components/form/TagStyleSelector.vue'
import IconSelector from '@/components/form/IconSelector.vue'
import TranslatableInput from '@/components/form/TranslatableInput.vue'
import CICategorySelector from '@/components/form/CICategorySelector.vue'

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
  // Field options cache (for select fields)
  fieldOptions: {
    type: Object,
    default: () => ({})
  },
  // Loading state
  loading: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue'])

// Methods

// Update a field value (preserves _translations explicitly)
const updateField = (fieldName, value) => {
  console.log('[ObjectGeneralInfo] updateField called:', fieldName, value)
  const currentTranslations = props.modelValue._translations || {}
  emit('update:modelValue', {
    ...props.modelValue,
    _translations: currentTranslations, // Explicitly preserve translations
    [fieldName]: value
  })
}

// Update translations for a translatable field
const updateTranslations = (fieldName, translations) => {
  console.log('[ObjectGeneralInfo] updateTranslations called:', fieldName, translations)
  const currentTranslations = props.modelValue._translations || {}
  const newModelValue = {
    ...props.modelValue,
    _translations: {
      ...currentTranslations,
      [fieldName]: translations
    }
  }
  console.log('[ObjectGeneralInfo] emitting update:modelValue with:', JSON.stringify(newModelValue, null, 2))
  emit('update:modelValue', newModelValue)
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
</script>
