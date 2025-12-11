<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="$t('common.selectTagStyle')"
    :style="{ width: '90vw', maxWidth: '900px' }"
    :draggable="false"
    @hide="onCancel"
  >
    <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 overflow-auto" style="max-height: 60vh;">
      <button
        v-for="option in tagStyleOptions"
        :key="option.value"
        type="button"
        class="style-item p-4 rounded-lg border-2 hover:border-green-300 dark:hover:border-green-700 transition-all cursor-pointer flex flex-col items-center gap-2"
        :class="localValue === option.value ? 'border-green-500 ring-2 ring-green-500/30' : 'border-surface-200 dark:border-surface-700'"
        @click="localValue = option.value"
      >
        <Tag :style="option.style" class="text-sm px-4 py-2">{{ option.label }}</Tag>
      </button>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button :label="$t('common.clear')" severity="secondary" text @click="localValue = null" />
        <Button :label="$t('common.cancel')" severity="secondary" @click="onCancel" />
        <Button :label="$t('common.confirm')" @click="onConfirm" :loading="loading" />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { getTagStyleOptions } from '@/utils/tagStyles'

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  },
  show: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'update:show', 'confirm', 'cancel'])

const localValue = ref(null)
const tagStyleOptions = getTagStyleOptions()

const visible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

// Sync local value with prop when dialog opens
watch(() => props.show, (newVal) => {
  if (newVal) {
    localValue.value = props.modelValue
  }
})

const onConfirm = () => {
  emit('update:modelValue', localValue.value)
  emit('confirm', localValue.value)
}

const onCancel = () => {
  visible.value = false
  emit('cancel')
}
</script>
