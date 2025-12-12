<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="title"
    :style="{ width: '500px' }"
    :draggable="false"
    @hide="onCancel"
  >
    <div class="flex flex-col gap-4">
      <!-- One field per language -->
      <div 
        v-for="lang in languages" 
        :key="lang.code"
        class="flex flex-col gap-2"
      >
        <label :for="`trans-${lang.code}`" class="flex items-center gap-2 font-medium">
          <span :class="`fi fi-${lang.flag_code || lang.code}`" :title="lang.name"></span>
          <span>{{ lang.name }}</span>
        </label>
        
        <!-- Textarea for textarea fields -->
        <Textarea
          v-if="fieldType === 'textarea'"
          :id="`trans-${lang.code}`"
          v-model="localTranslations[lang.code]"
          rows="3"
          class="w-full"
          :placeholder="`${lang.name}...`"
        />
        <!-- InputText for text fields -->
        <InputText
          v-else
          :id="`trans-${lang.code}`"
          v-model="localTranslations[lang.code]"
          class="w-full"
          :placeholder="`${lang.name}...`"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
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
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
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
  languages: {
    type: Array,
    default: () => []
  },
  fieldType: {
    type: String,
    default: 'text'
  }
})

const emit = defineEmits(['update:modelValue', 'update:show', 'confirm', 'cancel'])

const localTranslations = ref({})
const initialTranslations = ref({})

const visible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

// Sync local translations with prop when dialog opens
watch(() => props.show, (newVal) => {
  if (newVal) {
    localTranslations.value = { ...props.modelValue }
    initialTranslations.value = { ...props.modelValue }
  }
})

const onConfirm = () => {
  // Skip if no change (deep compare translations object)
  const hasChanged = Object.keys({ ...localTranslations.value, ...initialTranslations.value }).some(
    key => localTranslations.value[key] !== initialTranslations.value[key]
  )
  if (!hasChanged) {
    visible.value = false
    return
  }
  emit('update:modelValue', { ...localTranslations.value })
  emit('confirm', { ...localTranslations.value })
}

const onCancel = () => {
  visible.value = false
  emit('cancel')
}
</script>
