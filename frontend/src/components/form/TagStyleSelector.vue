<template>
  <div class="tag-style-selector">
    <!-- Trigger button showing selected style -->
    <Button
      type="button"
      severity="secondary"
      outlined
      class="w-full justify-start"
      :disabled="disabled"
      @click="openDialog"
    >
      <template #default>
        <Tag v-if="selectedValue" :style="getStyleForValue(selectedValue)" class="text-sm">
          {{ getLabelForValue(selectedValue) }}
        </Tag>
        <span v-else class="text-surface-400">
          {{ $t('common.selectTagStyle') }}
        </span>
      </template>
    </Button>

    <!-- Fullscreen Dialog -->
    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="$t('common.selectTagStyle')"
      :style="{ width: '90vw', maxWidth: '900px', height: '80vh' }"
      class="tag-style-dialog"
      :draggable="false"
    >
      <!-- Styles grid -->
      <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 overflow-auto" style="max-height: calc(80vh - 120px);">
        <button
          v-for="option in tagStyleOptions"
          :key="option.value"
          type="button"
          class="style-item p-4 rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 transition-all cursor-pointer flex flex-col items-center gap-2"
          :class="{ 'bg-primary-100 dark:bg-primary-900/40 border-primary-500': selectedValue === option.value }"
          @click="selectStyle(option.value)"
        >
          <Tag :style="option.style" class="text-sm px-4 py-2">
            {{ option.label }}
          </Tag>
          <i 
            v-if="selectedValue === option.value" 
            class="pi pi-check text-primary-500"
          />
        </button>
      </div>

      <!-- Footer -->
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            :label="$t('common.clear')"
            severity="secondary"
            text
            @click="clearSelection"
          />
          <Button
            :label="$t('common.cancel')"
            severity="secondary"
            @click="dialogVisible = false"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
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

const dialogVisible = ref(false)
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

const openDialog = () => {
  dialogVisible.value = true
}

const selectStyle = (value) => {
  selectedValue.value = value
  dialogVisible.value = false
}

const clearSelection = () => {
  selectedValue.value = null
  dialogVisible.value = false
}
</script>

<style scoped>
.style-item:focus {
  outline: 2px solid var(--p-primary-500);
  outline-offset: 2px;
}
</style>
