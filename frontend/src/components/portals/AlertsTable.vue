<template>
  <div class="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
    <DataTable
      :value="alerts"
      v-model:selection="selectedItems"
      dataKey="uuid"
      :paginator="alerts.length > 5"
      :rows="5"
      size="small"
      stripedRows
      class="text-sm"
    >
      <Column selectionMode="multiple" headerStyle="width: 3rem" />
      <Column field="code" :header="t('portals.admin.alertCode')" />
      <Column field="message" :header="t('portals.admin.alertMessage')">
        <template #body="{ data }">
          <span class="line-clamp-2">{{ data.message }}</span>
        </template>
      </Column>
      <Column field="severity" :header="t('portals.admin.alertSeverity')">
        <template #body="{ data }">
          <Tag 
            :value="data.severity" 
            :severity="getSeverityColor(data.severity)" 
          />
        </template>
      </Column>
      <Column field="icon" :header="t('portals.admin.alertIcon')">
        <template #body="{ data }">
          <i v-if="data.icon" :class="data.icon" class="text-primary"></i>
        </template>
      </Column>
      <Column field="is_active" :header="t('common.status')">
        <template #body="{ data }">
          <Tag 
            :value="data.is_active ? t('common.active') : t('common.inactive')" 
            :severity="data.is_active ? 'success' : 'secondary'" 
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'

const { t } = useI18n()

const props = defineProps({
  alerts: {
    type: Array,
    default: () => []
  },
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const selectedItems = computed({
  get: () => props.alerts.filter(a => props.modelValue.includes(a.uuid)),
  set: (val) => emit('update:modelValue', val.map(a => a.uuid))
})

const getSeverityColor = (severity) => {
  switch (severity) {
    case 'error': return 'danger'
    case 'warn': return 'warn'
    case 'info': return 'info'
    case 'success': return 'success'
    default: return 'secondary'
  }
}
</script>
