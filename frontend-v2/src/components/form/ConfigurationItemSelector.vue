<template>
  <div class="configuration-item-selector">
    <!-- Trigger button showing selected item -->
    <Button
      type="button"
      severity="secondary"
      outlined
      class="w-full justify-start"
      :disabled="disabled"
      @click="openDialog"
    >
      <template #default>
        <div v-if="selectedItem" class="flex items-center gap-2">
          <i class="pi pi-box" />
          <span>{{ selectedItem.name }}</span>
          <Tag 
            v-if="selectedItem.ci_type" 
            :value="selectedItem.ci_type" 
            severity="secondary"
            class="text-xs ml-auto"
          />
        </div>
        <span v-else class="text-surface-400">
          {{ $t('common.selectConfigurationItem') }}
        </span>
      </template>
    </Button>

    <!-- Configuration Item Picker Dialog -->
    <ConfigurationItemPicker
      v-model="localValue"
      v-model:show="dialogVisible"
      :title="$t('common.selectConfigurationItem')"
      @confirm="onConfirm"
      @cancel="dialogVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { ConfigurationItemPicker } from '@/components/pickers'
import configurationItemsService from '@/services/configurationItemsService'

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const dialogVisible = ref(false)
const localValue = ref(null)
const selectedItem = ref(null)

// Load item details for display
const loadSelectedItem = async () => {
  if (!props.modelValue) {
    selectedItem.value = null
    return
  }
  
  try {
    const item = await configurationItemsService.getByUuid(props.modelValue)
    selectedItem.value = item
  } catch (error) {
    console.error('Failed to load configuration item:', error)
    selectedItem.value = null
  }
}

const openDialog = () => {
  localValue.value = props.modelValue
  dialogVisible.value = true
}

const onConfirm = async (value) => {
  emit('update:modelValue', value)
  dialogVisible.value = false
  
  // Update selected item display
  if (value) {
    try {
      const item = await configurationItemsService.getByUuid(value)
      selectedItem.value = item
    } catch (error) {
      console.error('Failed to load configuration item:', error)
    }
  } else {
    selectedItem.value = null
  }
}

// Load selected item on mount
onMounted(() => {
  if (props.modelValue) {
    loadSelectedItem()
  }
})

// Watch for external changes to modelValue
watch(() => props.modelValue, (newVal) => {
  if (newVal !== localValue.value) {
    loadSelectedItem()
  }
})
</script>
