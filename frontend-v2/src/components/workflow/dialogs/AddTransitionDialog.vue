<template>
  <Dialog 
    v-model:visible="dialogVisible" 
    :header="$t('workflow.createTransition')" 
    modal 
    :style="{ width: '500px' }"
    @hide="resetForm"
  >
    <p class="text-sm text-surface-500 mb-4">{{ $t('workflow.createTransitionDescription') }}</p>
    
    <!-- From states -->
    <div class="field mb-4">
      <label class="text-sm font-medium block mb-1">{{ $t('workflow.fromState') }}</label>
      <MultiSelect 
        v-model="sources" 
        :options="statusOptions" 
        optionLabel="name" 
        optionValue="uuid"
        :placeholder="$t('workflow.selectSourceStates')"
        class="w-full"
        display="chip"
      >
        <template #option="{ option }">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded" :style="{ background: option.category?.color }" />
            <span>{{ option.name }}</span>
          </div>
        </template>
      </MultiSelect>
    </div>
    
    <!-- To state -->
    <div class="field mb-4">
      <label class="text-sm font-medium block mb-1">{{ $t('workflow.toState') }}</label>
      <Select 
        v-model="target" 
        :options="statuses" 
        optionLabel="name" 
        optionValue="uuid"
        :placeholder="$t('workflow.selectTargetState')"
        class="w-full"
      >
        <template #option="{ option }">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded" :style="{ background: option.category?.color }" />
            <span>{{ option.name }}</span>
          </div>
        </template>
      </Select>
    </div>
    
    <!-- Name -->
    <div class="field mb-4">
      <label class="text-sm font-medium block mb-1">{{ $t('common.name') }}</label>
      <InputText v-model="name" class="w-full" :placeholder="$t('workflow.transitionNamePlaceholder')" />
      <small class="text-surface-500">{{ $t('workflow.transitionNameHint') }}</small>
    </div>
    
    <template #footer>
      <Button :label="$t('common.cancel')" text @click="dialogVisible = false" />
      <Button :label="$t('common.create')" @click="submit" :disabled="!isValid" />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  visible: Boolean,
  statuses: Array,
  preSelectedSource: String,
  preSelectedTarget: String
})

const emit = defineEmits(['update:visible', 'add'])
const { t } = useI18n()

const sources = ref([])
const target = ref('')
const name = ref('')

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const statusOptions = computed(() => {
  return [
    { uuid: '__ANY__', name: t('workflow.anyState'), category: { color: '#9ca3af' } },
    ...(props.statuses || [])
  ]
})

const isValid = computed(() => {
  return sources.value.length > 0 && target.value && name.value.trim()
})

watch(() => props.visible, (val) => {
  if (val) {
    if (props.preSelectedSource) sources.value = [props.preSelectedSource]
    if (props.preSelectedTarget) target.value = props.preSelectedTarget
  }
})

const resetForm = () => {
  sources.value = []
  target.value = ''
  name.value = ''
}

const submit = () => {
  if (!isValid.value) return
  
  emit('add', {
    name: name.value.trim(),
    rel_to_status_uuid: target.value,
    sources: sources.value.filter(s => s !== '__ANY__')
  })
}
</script>
