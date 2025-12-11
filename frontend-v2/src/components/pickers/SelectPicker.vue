<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="title"
    :style="{ width: '90vw', maxWidth: '600px', height: 'auto' }"
    :draggable="false"
    @hide="onCancel"
  >
    <!-- Options grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="select-item p-4 rounded-lg border-2 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-700 transition-all cursor-pointer flex flex-col items-center gap-2"
        :class="localValue === option.value ? 'bg-green-100 dark:bg-green-900/40 border-green-500 ring-2 ring-green-500/30' : 'border-surface-200 dark:border-surface-700'"
        @click="localValue = option.value"
      >
        <div 
          class="flex items-center gap-2 px-3 py-2 rounded"
          :style="getTagStyle(option.color)"
        >
          <i v-if="option.icon" :class="['pi', option.icon]" />
          <span class="text-sm font-medium">{{ option.label }}</span>
        </div>
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
import { getTagStyle } from '@/utils/tagStyles'

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean],
    default: null
  },
  show: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  options: {
    type: Array,
    default: () => []
  },
  title: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'update:show', 'confirm', 'cancel'])

const localValue = ref(null)

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
