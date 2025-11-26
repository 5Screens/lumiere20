<template>
  <Table
    :data="widgets"
    :columns="columns"
    v-model="selectedWidgets"
    item-key="uuid"
    :searchable="true"
    search-placeholder="Filtrer par titre..."
    :search-keys="['display_title']"
    max-height="400px"
    empty-message="Aucun widget disponible"
  >
    <!-- Custom cell for widget_type with badge -->
    <template #cell-widget_type="{ value }">
      <span class="badge" :class="`badge--${value}`">
        {{ value }}
      </span>
    </template>

    <!-- Custom cell for api_endpoint with code styling -->
    <template #cell-api_endpoint="{ value }">
      <code class="code">{{ value || '-' }}</code>
    </template>

    <!-- Custom cell for refresh_interval with formatted display -->
    <template #cell-refresh_interval="{ value }">
      {{ formatInterval(value) }}
    </template>
  </Table>
</template>

<script setup>
import { computed } from 'vue'
import Table from '@/components/common/Table.vue'

const props = defineProps({
  widgets: {
    type: Array,
    required: true,
    default: () => []
  },
  modelValue: {
    type: Array,
    required: true,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

// Computed
const selectedWidgets = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Columns configuration
const columns = [
  {
    key: 'display_title',
    label: 'Titre',
    sortable: true,
    class: 'td--title'
  },
  {
    key: 'widget_type',
    label: 'Type',
    sortable: true
  },
  {
    key: 'api_endpoint',
    label: 'Endpoint',
    sortable: true,
    class: 'td--endpoint'
  },
  {
    key: 'refresh_interval',
    label: 'Intervalle',
    sortable: true,
    class: 'td--interval'
  }
]

// Methods
function formatInterval(seconds) {
  if (!seconds || seconds === 0) return 'Aucun'
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}min`
}
</script>

<style scoped>
/* Custom cell styles */
.td--title {
  font-weight: 500;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td--endpoint {
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td--interval {
  text-align: center;
  font-weight: 500;
}

/* Badge */
.badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge--counter {
  background: var(--light-blue);
  color: #1565c0;
}

.badge--list {
  background: var(--light-green);
  color: #2e7d32;
}

.badge--chart {
  background: var(--light-purple);
  color: #5e35b1;
}

.badge--custom {
  background: var(--light-orange);
  color: #e65100;
}

/* Code */
.code {
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  padding: 0.125rem 0.375rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 3px;
  color: var(--text-color);
}
</style>
