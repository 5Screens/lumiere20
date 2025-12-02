<template>
  <div class="tag-style-selector">
    <Select
      v-model="selectedValue"
      :options="tagStyleOptions"
      optionLabel="label"
      optionValue="value"
      :placeholder="$t('common.selectTagStyle')"
      class="w-full"
      :disabled="disabled"
    >
      <template #value="slotProps">
        <div v-if="slotProps.value" class="flex items-center gap-2">
          <Tag :style="getStyleForValue(slotProps.value)" class="text-sm">
            {{ getLabelForValue(slotProps.value) }}
          </Tag>
        </div>
        <span v-else class="text-surface-400">
          {{ $t('common.selectTagStyle') }}
        </span>
      </template>
      <template #option="slotProps">
        <div class="flex items-center gap-2">
          <Tag :style="slotProps.option.style" class="text-sm">
            {{ slotProps.option.label }}
          </Tag>
        </div>
      </template>
    </Select>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import { getTagStyleOptions, getTagStyle, tagStyles } from '@/utils/tagStyles'

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

const tagStyleOptions = getTagStyleOptions()

const selectedValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const getStyleForValue = (value) => {
  return getTagStyle(value)
}

const getLabelForValue = (value) => {
  return tagStyles[value]?.label || value
}
</script>

<style scoped>
.tag-style-selector :deep(.p-select) {
  min-width: 10rem;
}
</style>
