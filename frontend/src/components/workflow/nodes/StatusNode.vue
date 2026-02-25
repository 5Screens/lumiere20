<template>
  <div class="status-node-wrapper" :style="nodeStyle">
    <div 
      class="status-node"
      :class="{ 
        'selected': selected,
        'orphan': isOrphan,
        'allow-all-inbound': data.allow_all_inbound
      }"
    >
      <!-- Allow all inbound indicator -->
      <div v-if="data.allow_all_inbound" class="allow-all-indicator">
        <span class="allow-all-chip">{{ $t('workflow.anyState') }}</span>
        <i class="pi pi-arrow-right allow-all-arrow" />
      </div>
      
      <!-- Node content -->
      <div class="node-content">
        <span class="node-label">{{ data.name }}</span>
      </div>
      
      <!-- Initial state indicator -->
      <div v-if="data.is_initial" class="initial-indicator">
        <i class="pi pi-play" />
      </div>
      
      <!-- Connection handles -->
      <Handle type="target" :position="Position.Left" class="handle handle-left" />
      <Handle type="target" :position="Position.Top" class="handle handle-top" />
      <Handle type="source" :position="Position.Right" class="handle handle-right" />
      <Handle type="source" :position="Position.Bottom" class="handle handle-bottom" />
    </div>

    <!-- Action badges panel -->
    <div v-if="hasActions" class="actions-badges">
      <!-- On Enter actions -->
      <div v-if="activeOnEnter.length" class="actions-section">
        <div
          v-for="action in activeOnEnter"
          :key="action.uuid"
          class="action-badge"
          :title="action.label || $t(`workflow.actions.types.${action.action_type}`)"
        >
          <i :class="getActionIcon(action.action_type)" class="action-badge-icon" :style="{ color: getActionColor(action.action_type) }" />
          <span class="action-badge-label">{{ action.label || $t(`workflow.actions.types.${action.action_type}`) }}</span>
        </div>
      </div>
      <!-- On Exit actions -->
      <div v-if="activeOnExit.length" class="actions-section">
        <div
          v-for="action in activeOnExit"
          :key="action.uuid"
          class="action-badge action-badge--exit"
          :title="action.label || $t(`workflow.actions.types.${action.action_type}`)"
        >
          <i :class="getActionIcon(action.action_type)" class="action-badge-icon" :style="{ color: getActionColor(action.action_type) }" />
          <span class="action-badge-label">{{ action.label || $t(`workflow.actions.types.${action.action_type}`) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { getActionIcon, getActionColor } from '../utils/actionMeta'

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['edit'])

const categoryColor = computed(() => props.data.category?.color || '#6b7280')

const nodeStyle = computed(() => ({
  '--category-color': categoryColor.value,
  '--category-color-light': `${categoryColor.value}20`,
  '--category-color-medium': `${categoryColor.value}40`
}))

const isOrphan = computed(() => {
  return false
})

const activeOnEnter = computed(() => (props.data.on_enter_actions || []).filter(a => a.is_active))
const activeOnExit = computed(() => (props.data.on_exit_actions || []).filter(a => a.is_active))
const hasActions = computed(() => activeOnEnter.value.length > 0 || activeOnExit.value.length > 0)
</script>

<style scoped>
.status-node-wrapper {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.status-node {
  position: relative;
  min-width: 120px;
  padding: 12px 20px;
  background: var(--category-color-light);
  border: 2px solid var(--category-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.status-node:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.status-node.selected {
  box-shadow: 0 0 0 3px var(--category-color-medium), 0 4px 12px rgba(0, 0, 0, 0.2);
}

.status-node.orphan {
  border-style: dashed;
  border-color: #ef4444;
}

.node-content {
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-label {
  font-weight: 600;
  font-size: 13px;
  color: var(--p-surface-900);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

 [data-theme="dark"] .node-label {
   color: var(--p-surface-0);
 }

.initial-indicator {
  position: absolute;
  left: -24px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  background: var(--category-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.initial-indicator i {
  color: white;
  font-size: 10px;
}

.allow-all-indicator {
  position: absolute;
  top: -28px;
  right: -10px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.allow-all-chip {
  background: var(--p-surface-400);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  white-space: nowrap;
}

 [data-theme="dark"] .allow-all-chip {
   background: var(--p-surface-700);
   color: var(--p-surface-0);
 }

.allow-all-arrow {
  color: var(--p-surface-400);
  font-size: 12px;
}

 [data-theme="dark"] .allow-all-arrow {
   color: var(--p-surface-500);
 }

/* Handles */
.handle {
  width: 8px;
  height: 8px;
  background: var(--p-surface-300);
  border: 2px solid var(--p-surface-0);
  opacity: 0;
  transition: opacity 0.2s ease;
}

 [data-theme="dark"] .handle {
   background: var(--p-surface-500);
   border-color: var(--p-surface-900);
 }

.status-node:hover .handle {
  opacity: 1;
}

.handle-left {
  left: -4px;
}

.handle-right {
  right: -4px;
}

.handle-top {
  top: -4px;
}

.handle-bottom {
  bottom: -4px;
}

/* Action badges panel */
.actions-badges {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--p-surface-0);
  border: 1px solid var(--p-surface-200);
  border-radius: 6px;
  padding: 3px;
  width: 100%;
  box-sizing: border-box;
}

[data-theme="dark"] .actions-badges {
  background: var(--p-surface-800);
  border-color: var(--p-surface-600);
}

.actions-section {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.action-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--p-surface-50);
  border-left: 3px solid var(--p-primary-400);
  min-height: 16px;
}

[data-theme="dark"] .action-badge {
  background: var(--p-surface-700);
  border-left-color: var(--p-primary-300);
}

.action-badge--exit {
  border-left-color: var(--p-orange-400);
}

[data-theme="dark"] .action-badge--exit {
  border-left-color: var(--p-orange-300);
}

.action-badge-icon {
  font-size: 8px;
  flex-shrink: 0;
}

.action-badge-label {
  font-size: 8px;
  color: var(--p-surface-700);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

[data-theme="dark"] .action-badge-label {
  color: var(--p-surface-200);
}
</style>
