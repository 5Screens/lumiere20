<template>
  <div class="inline-select-editor">
    <!-- Display mode -->
    <div 
      v-if="!isEditing" 
      class="cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 px-2 py-1 rounded transition-colors"
      @click="startEditing"
    >
      <div v-if="displayOption" class="flex items-center gap-2" :style="getTagStyle(displayOption.color)">
        <i v-if="displayOption.icon" :class="['pi', displayOption.icon]" />
        <span>{{ displayOption.label }}</span>
      </div>
      <span v-else class="text-surface-400">-</span>
    </div>

    <!-- Edit mode -->
    <div v-else class="flex items-center gap-1">
      <Select
        ref="selectRef"
        v-model="localValue"
        :options="options"
        optionLabel="label"
        optionValue="value"
        :placeholder="placeholder"
        appendTo="body"
        class="flex-1"
        size="small"
        :pt="{ root: { class: 'w-full' } }"
        @change="onSelectChange"
      >
        <template #value="slotProps">
          <div v-if="slotProps.value" class="flex items-center gap-2" :style="getTagStyle(getOptionByValue(slotProps.value)?.color)">
            <i v-if="getOptionByValue(slotProps.value)?.icon" :class="['pi', getOptionByValue(slotProps.value)?.icon]" />
            <span>{{ getOptionByValue(slotProps.value)?.label }}</span>
          </div>
          <span v-else class="text-surface-400">{{ placeholder }}</span>
        </template>
        <template #option="slotProps">
          <div class="flex items-center gap-2" :style="getTagStyle(slotProps.option.color)">
            <i v-if="slotProps.option.icon" :class="['pi', slotProps.option.icon]" />
            <span>{{ slotProps.option.label }}</span>
          </div>
        </template>
      </Select>
      
      <!-- Buttons stacked vertically (hidden in embedded mode) -->
      <div v-if="!embedded" class="flex flex-col gap-0">
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
import Select from 'primevue/select'
import Button from 'primevue/button'
import { getTagStyle } from '@/utils/tagStyles'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: null
  },
  options: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  // Embedded mode: hide save/cancel buttons, emit on selection
  // Used when parent component handles the save (e.g., ObjectExtendedInfo in ObjectView)
  embedded: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

// State
const isEditing = ref(false)
const localValue = ref(null)
const initialValue = ref(null)
const saving = ref(false)
const selectRef = ref(null)

// Computed
const displayOption = computed(() => {
  if (!props.modelValue) return null
  return props.options.find(o => o.value === props.modelValue)
})

const hasChanges = computed(() => {
  return localValue.value !== initialValue.value
})

// Methods
const getOptionByValue = (value) => {
  return props.options.find(o => o.value === value)
}

const startEditing = () => {
  if (props.disabled) return
  
  isEditing.value = true
  localValue.value = props.modelValue
  initialValue.value = props.modelValue
  
  // Open the Select dropdown after render
  nextTick(() => {
    if (selectRef.value) {
      // Use PrimeVue Select's show() method to open the dropdown
      selectRef.value.show()
    }
  })
}

const save = async () => {
  saving.value = true
  try {
    emit('update:modelValue', localValue.value)
    emit('save', localValue.value)
    isEditing.value = false
  } finally {
    saving.value = false
  }
}

const cancel = () => {
  localValue.value = initialValue.value
  isEditing.value = false
  emit('cancel')
}

// Handle select change - in embedded mode, emit save immediately
const onSelectChange = (event) => {
  if (props.embedded) {
    emit('save', event.value)
    isEditing.value = false
  }
}
</script>

<style scoped>
.inline-select-editor {
  min-width: 150px;
}
</style>
