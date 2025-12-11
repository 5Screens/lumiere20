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
      <DatePicker 
        v-model="localValue" 
        :showTime="showTime"
        dateFormat="dd/mm/yy"
        showButtonBar
        inline
        class="w-full"
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
import DatePicker from 'primevue/datepicker'

const props = defineProps({
  modelValue: {
    type: [Date, String],
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
  showTime: {
    type: Boolean,
    default: false
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
    // Convert ISO string to Date object if needed
    if (props.modelValue && typeof props.modelValue === 'string') {
      localValue.value = new Date(props.modelValue)
    } else {
      localValue.value = props.modelValue
    }
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
