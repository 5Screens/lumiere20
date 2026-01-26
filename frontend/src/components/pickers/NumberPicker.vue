<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="title"
    :style="{ width: '400px' }"
    :draggable="false"
    @hide="onCancel"
  >
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-2">
        <InputNumber 
          v-model="localValue" 
          :placeholder="$t('common.enterValue')"
          class="flex-1"
          autofocus
        />
        <span v-if="unit" class="text-surface-500">{{ unit }}</span>
      </div>
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
import InputNumber from 'primevue/inputnumber'

const props = defineProps({
  modelValue: {
    type: [Number, String],
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
  title: {
    type: String,
    default: ''
  },
  unit: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'update:show', 'confirm', 'cancel'])

const localValue = ref(null)
const initialValue = ref(null)

const visible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

// Sync local value with prop when dialog opens
watch(() => props.show, (newVal) => {
  if (newVal) {
    localValue.value = props.modelValue
    initialValue.value = props.modelValue
  }
})

const onConfirm = () => {
  // Skip if no change
  if (localValue.value === initialValue.value) {
    visible.value = false
    return
  }
  emit('update:modelValue', localValue.value)
  emit('confirm', localValue.value)
}

const onCancel = () => {
  visible.value = false
  emit('cancel')
}
</script>
