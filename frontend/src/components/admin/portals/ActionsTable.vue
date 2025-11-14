<template>
  <Table
    :data="actions"
    :columns="columns"
    v-model="selectedActions"
    item-key="uuid"
    :searchable="true"
    search-placeholder="Filtrer par titre ou description..."
    :search-keys="['display_title', 'description', 'action_code']"
    max-height="400px"
    empty-message="Aucune action disponible"
  >
    <!-- Custom cell for display_title with icon -->
    <template #cell-display_title="{ item }">
      <div class="action-title">
        <i v-if="item.icon_type === 'fontawesome'" :class="`fas ${item.icon_value}`"></i>
        <span>{{ item.display_title || item.action_code }}</span>
      </div>
    </template>

    <!-- Custom cell for http_method with badge -->
    <template #cell-http_method="{ value }">
      <span class="badge" :class="`badge--${value.toLowerCase()}`">
        {{ value }}
      </span>
    </template>

    <!-- Custom cell for endpoint with code styling -->
    <template #cell-endpoint="{ value }">
      <code class="code">{{ value }}</code>
    </template>

    <!-- Custom cell for is_quick_action with icon -->
    <template #cell-is_quick_action="{ value }">
      <i 
        :class="value ? 'fas fa-check-circle check-icon' : 'fas fa-times-circle times-icon'"
        :title="value ? 'Action rapide' : 'Action standard'"
      ></i>
    </template>
  </Table>
</template>

<script setup>
import { computed } from 'vue'
import Table from '@/components/common/Table.vue'

const props = defineProps({
  actions: {
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
const selectedActions = computed({
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
    key: 'http_method',
    label: 'Méthode',
    sortable: true,
    class: 'td--method'
  },
  {
    key: 'endpoint',
    label: 'Endpoint',
    sortable: true,
    class: 'td--endpoint'
  },
  {
    key: 'is_quick_action',
    label: 'Rapide',
    sortable: true,
    class: 'td--quick'
  }
]
</script>

<style scoped>
/* Custom cell styles */
.td--title {
  font-weight: 500;
  max-width: 250px;
}

.td--method {
  text-align: center;
}

.td--endpoint {
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td--quick {
  text-align: center;
}

/* Action title with icon */
.action-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-title i {
  color: var(--primary-color);
  font-size: 0.9rem;
}

/* Badge */
.badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge--get {
  background: var(--light-blue);
  color: #1565c0;
}

.badge--post {
  background: var(--light-green);
  color: #2e7d32;
}

.badge--put,
.badge--patch {
  background: var(--light-orange);
  color: #e65100;
}

.badge--delete {
  background: var(--light-red);
  color: #c62828;
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

/* Icons */
.check-icon {
  color: var(--success-color);
  font-size: 1.1rem;
}

.times-icon {
  color: var(--text-secondary);
  font-size: 1.1rem;
  opacity: 0.5;
}
</style>
