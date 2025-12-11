<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="title"
    :style="{ width: '600px' }"
    :draggable="false"
    @hide="onCancel"
  >
    <div class="flex flex-col gap-4">
      <Textarea 
        v-model="localValue" 
        :placeholder="$t('common.enterValue')"
        rows="6"
        class="w-full"
        autofocus
      />
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
import Textarea from 'primevue/textarea'

const props = defineProps({
  modelValue: {
    type: [String, Number],
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
