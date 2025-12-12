<template>
  <div v-if="uuid" class="flex items-center gap-2 px-4 py-2 bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
    <span class="text-xs text-surface-500 dark:text-surface-400 font-medium">UUID:</span>
    <code class="text-xs text-surface-600 dark:text-surface-300 font-mono select-all">{{ uuid }}</code>
    <Button 
      icon="pi pi-copy" 
      severity="secondary" 
      text 
      rounded 
      size="small"
      @click="copyUuid"
      v-tooltip.top="$t('common.copy')"
      class="w-6 h-6"
    />
  </div>
</template>

<script setup>
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'

const props = defineProps({
  uuid: {
    type: String,
    default: null
  }
})

const toast = useToast()
const { t } = useI18n()

const copyUuid = async () => {
  if (!props.uuid) return
  
  try {
    await navigator.clipboard.writeText(props.uuid)
    toast.add({ 
      severity: 'success', 
      summary: t('common.copied'), 
      detail: 'UUID', 
      life: 2000 
    })
  } catch (error) {
    console.error('Failed to copy UUID:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Failed to copy', 
      life: 2000 
    })
  }
}
</script>
