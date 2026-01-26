<template>
  <div class="icon-selector">
    <!-- Trigger button showing selected icon -->
    <Button
      type="button"
      :label="selectedValue ? undefined : $t('common.selectIcon')"
      :icon="selectedValue ? `pi ${selectedValue}` : 'pi pi-image'"
      severity="secondary"
      outlined
      class="w-full justify-start"
      :disabled="disabled"
      @click="dialogVisible = true"
    >
      <template #default v-if="selectedValue">
        <i :class="`pi ${selectedValue} mr-2`" />
        <span class="text-sm text-surface-600 dark:text-surface-300">{{ selectedValue }}</span>
      </template>
    </Button>

    <!-- Icon Picker Dialog -->
    <IconPicker
      v-model="selectedValue"
      :show="dialogVisible"
      @update:show="dialogVisible = $event"
      @confirm="onConfirm"
      @cancel="dialogVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Button from 'primevue/button'
import IconPicker from '@/components/pickers/IconPicker.vue'

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

const selectedValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const onConfirm = (value) => {
  selectedValue.value = value
  dialogVisible.value = false
}
</script>

