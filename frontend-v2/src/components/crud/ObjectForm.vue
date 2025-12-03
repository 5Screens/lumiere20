<template>
  <div class="flex flex-col gap-4">
    <div 
      v-for="field in fields" 
      :key="field.field_name" 
      class="flex flex-col gap-2"
    >
      <label :for="field.field_name" class="font-semibold">
        {{ $t(field.label_key) }}
        <span v-if="field.is_required" class="text-red-500">*</span>
      </label>
      
      <!-- Text input -->
      <InputText 
        v-if="field.field_type === 'text'"
        :id="field.field_name" 
        :modelValue="item[field.field_name]"
        @update:modelValue="updateField(field.field_name, $event)"
        :disabled="field.is_readonly"
        :maxlength="field.max_length"
        fluid 
      />
      
      <!-- Textarea -->
      <Textarea 
        v-else-if="field.field_type === 'textarea'"
        :id="field.field_name" 
        :modelValue="item[field.field_name]"
        @update:modelValue="updateField(field.field_name, $event)"
        :disabled="field.is_readonly"
        rows="3" 
        fluid 
      />
      
      <!-- Number input -->
      <InputNumber 
        v-else-if="field.field_type === 'number'"
        :id="field.field_name" 
        :modelValue="item[field.field_name]"
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
        :modelValue="item[field.field_name]"
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
          <div class="flex items-center gap-2">
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
        :modelValue="item[field.field_name]"
        @update:modelValue="updateField(field.field_name, $event)"
        :disabled="field.is_readonly"
      />
      
      <!-- Date picker -->
      <DatePicker 
        v-else-if="field.field_type === 'date'"
        :id="field.field_name" 
        :modelValue="item[field.field_name]"
        @update:modelValue="updateField(field.field_name, $event)"
        :disabled="field.is_readonly"
        dateFormat="dd/mm/yy"
        fluid 
      />
      
      <!-- Datetime picker -->
      <DatePicker 
        v-else-if="field.field_type === 'datetime'"
        :id="field.field_name" 
        :modelValue="item[field.field_name]"
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
        :modelValue="item[field.field_name]"
        @update:modelValue="updateField(field.field_name, $event)"
        :disabled="field.is_readonly"
      />
      
      <!-- Icon Picker -->
      <IconSelector 
        v-else-if="field.field_type === 'icon_picker'"
        :id="field.field_name" 
        :modelValue="item[field.field_name]"
        @update:modelValue="updateField(field.field_name, $event)"
        :disabled="field.is_readonly"
      />
    </div>
  </div>
</template>

<script setup>
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import DatePicker from 'primevue/datepicker'
import TagStyleSelector from '@/components/form/TagStyleSelector.vue'
import IconSelector from '@/components/form/IconSelector.vue'

const props = defineProps({
  fields: {
    type: Array,
    required: true
  },
  item: {
    type: Object,
    required: true
  },
  fieldOptions: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:item'])

const updateField = (fieldName, value) => {
  emit('update:item', { ...props.item, [fieldName]: value })
}

const getFieldOptions = (field) => {
  return props.fieldOptions[field.field_name] || []
}

const getOptionByValue = (field, value) => {
  const options = getFieldOptions(field)
  return options.find(o => o.value === value)
}
</script>
