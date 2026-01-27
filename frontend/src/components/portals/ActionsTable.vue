<template>
  <div class="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
    <DataTable
      :value="actions"
      v-model:selection="selectedItems"
      dataKey="uuid"
      :paginator="actions.length > 5"
      :rows="5"
      size="small"
      stripedRows
      class="text-sm"
    >
      <Column selectionMode="multiple" headerStyle="width: 3rem" />
      <Column field="label" :header="t('portals.admin.actionLabel')" />
      <Column field="description" :header="t('portals.admin.actionDescription')" />
      <Column field="icon" :header="t('portals.admin.actionIcon')">
        <template #body="{ data }">
          <i v-if="data.icon" :class="data.icon" class="text-primary"></i>
        </template>
      </Column>
      <Column field="action_type" :header="t('portals.admin.actionType')">
        <template #body="{ data }">
          <Tag :value="data.action_type" :severity="data.action_type === 'form' ? 'info' : 'secondary'" />
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
  actions: {
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
  get: () => props.actions.filter(a => props.modelValue.includes(a.uuid)),
  set: (val) => emit('update:modelValue', val.map(a => a.uuid))
})
</script>
