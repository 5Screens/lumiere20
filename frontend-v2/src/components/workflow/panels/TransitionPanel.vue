<template>
  <div class="transition-panel p-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">{{ $t('workflow.transition') }}</h3>
    </div>
    
    <p class="text-sm text-surface-500 mb-4">{{ $t('workflow.transitionDescription') }}</p>
    
    <!-- Name -->
    <div class="field mb-4">
      <label class="text-sm font-medium block mb-1">{{ $t('common.name') }}</label>
      <InputText v-model="localName" class="w-full" @blur="saveName" />
    </div>
    
    <!-- Path -->
    <div class="field mb-4">
      <label class="text-sm font-medium block mb-2">{{ $t('workflow.path') }}</label>
      
      <!-- From states -->
      <div class="mb-2">
        <label class="text-xs text-surface-500 block mb-1">{{ $t('workflow.fromState') }}</label>
        <MultiSelect 
          v-model="localSources" 
          :options="statuses" 
          optionLabel="name" 
          optionValue="uuid" 
          :placeholder="$t('workflow.selectStates')"
          class="w-full"
          display="chip"
          @change="saveSources"
        />
      </div>
      
      <!-- To state -->
      <div>
        <label class="text-xs text-surface-500 block mb-1">{{ $t('workflow.toState') }}</label>
        <Select 
          v-model="localTarget" 
          :options="statuses" 
          optionLabel="name" 
          optionValue="uuid" 
          :placeholder="$t('workflow.selectState')"
          class="w-full"
          @change="saveTarget"
        />
      </div>
    </div>
    
    <!-- Delete -->
    <Button 
      :label="$t('workflow.deleteTransition')" 
      icon="pi pi-trash" 
      severity="danger" 
      outlined 
      class="w-full" 
      @click="confirmDelete" 
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  transition: Object,
  statuses: Array
})

const emit = defineEmits(['update', 'delete'])
const confirm = useConfirm()
const { t } = useI18n()

const localName = ref('')
const localSources = ref([])
const localTarget = ref('')

watch(() => props.transition, (tr) => {
  if (tr) {
    localName.value = tr.name
    localSources.value = tr.sources?.map(s => s.from_status.uuid) || []
    localTarget.value = tr.to_status?.uuid || ''
  }
}, { immediate: true })

const saveName = () => {
  if (localName.value !== props.transition?.name) {
    emit('update', { uuid: props.transition.uuid, name: localName.value })
  }
}

const saveSources = () => {
  emit('update', { uuid: props.transition.uuid, sources: localSources.value })
}

const saveTarget = () => {
  emit('update', { uuid: props.transition.uuid, rel_to_status_uuid: localTarget.value })
}

const confirmDelete = () => {
  confirm.require({
    message: t('workflow.confirmDeleteTransition'),
    header: t('common.confirm'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => emit('delete', props.transition?.uuid)
  })
}
</script>
