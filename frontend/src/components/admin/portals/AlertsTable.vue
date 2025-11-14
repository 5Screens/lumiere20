<template>
  <Table
    :data="alerts"
    :columns="columns"
    v-model="selectedAlerts"
    item-key="uuid"
    :searchable="true"
    search-placeholder="Filtrer par message..."
    :search-keys="['message']"
    max-height="400px"
    empty-message="Aucune alerte disponible"
  >
    <!-- Custom cell for message with truncation -->
    <template #cell-message="{ value }">
      <div class="message-cell" :title="value">
        {{ value }}
      </div>
    </template>

    <!-- Custom cell for alert_type with badge -->
    <template #cell-alert_type="{ value }">
      <span class="badge" :class="`badge--${value}`">
        {{ formatAlertType(value) }}
      </span>
    </template>

    <!-- Custom cell for start_date with formatted date -->
    <template #cell-start_date="{ value }">
      {{ formatDate(value) }}
    </template>

    <!-- Custom cell for end_date with formatted date -->
    <template #cell-end_date="{ value }">
      {{ value ? formatDate(value) : 'Permanent' }}
    </template>
  </Table>
</template>

<script setup>
import { computed } from 'vue'
import Table from '@/components/common/Table.vue'

const props = defineProps({
  alerts: {
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
const selectedAlerts = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Columns configuration
const columns = [
  {
    key: 'message',
    label: 'Message',
    sortable: true,
    class: 'td--message'
  },
  {
    key: 'alert_type',
    label: 'Type',
    sortable: true,
    class: 'td--type'
  },
  {
    key: 'start_date',
    label: 'Début',
    sortable: true,
    class: 'td--date'
  },
  {
    key: 'end_date',
    label: 'Fin',
    sortable: true,
    class: 'td--date'
  }
]

// Methods
function formatAlertType(type) {
  const types = {
    info: 'Info',
    warning: 'Attention',
    error: 'Erreur'
  }
  return types[type] || type
}

function formatDate(dateString) {
  if (!dateString) return '-'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}
</script>

<style scoped>
/* Custom cell styles */
.td--message {
  max-width: 350px;
}

.td--type {
  text-align: center;
}

.td--date {
  text-align: center;
  font-size: 0.85rem;
  white-space: nowrap;
}

/* Message cell */
.message-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.badge--info {
  background: var(--light-blue);
  color: #1565c0;
}

.badge--warning {
  background: var(--light-orange);
  color: #e65100;
}

.badge--error {
  background: var(--light-red);
  color: #c62828;
}
</style>
