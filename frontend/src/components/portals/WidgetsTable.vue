<template>
  <div class="border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
    <DataTable
      :value="widgets"
      v-model:selection="selectedItems"
      dataKey="uuid"
      :paginator="widgets.length > 5"
      :rows="5"
      size="small"
      stripedRows
      class="text-sm"
    >
      <Column selectionMode="multiple" headerStyle="width: 3rem" />
      <Column field="title" :header="t('portals.admin.widgetTitle')" />
      <Column field="description" :header="t('portals.admin.widgetDescription')">
        <template #body="{ data }">
          <span class="line-clamp-2">{{ data.description }}</span>
        </template>
      </Column>
      <Column field="icon" :header="t('portals.admin.widgetIcon')">
        <template #body="{ data }">
          <i v-if="data.icon" :class="data.icon" class="text-primary"></i>
        </template>
      </Column>
      <Column field="widget_type" :header="t('portals.admin.widgetType')">
        <template #body="{ data }">
          <Tag :value="data.widget_type" severity="info" />
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
  widgets: {
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
  get: () => props.widgets.filter(w => props.modelValue.includes(w.uuid)),
  set: (val) => emit('update:modelValue', val.map(w => w.uuid))
})
</script>
