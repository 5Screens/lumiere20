<template>
  <g>
    <path
      :d="path"
      class="transition-edge"
      :class="{ selected }"
      fill="none"
      stroke-width="2"
    />
    
    <foreignObject
      :x="labelX - 70"
      :y="labelY - 12"
      width="140"
      :height="foreignObjectHeight"
    >
      <div class="transition-label-wrapper">
        <div class="transition-label" :class="{ selected }">
          {{ data.name }}
        </div>
        <!-- Action badges -->
        <div v-if="activeActions.length" class="transition-actions-badges">
          <div
            v-for="action in activeActions"
            :key="action.uuid"
            class="transition-action-badge"
            :title="action.label || actionLabel(action.action_type)"
          >
            <i :class="getActionIcon(action.action_type)" class="transition-action-icon" :style="{ color: getActionColor(action.action_type) }" />
            <span class="transition-action-label">{{ action.label || actionLabel(action.action_type) }}</span>
          </div>
        </div>
      </div>
    </foreignObject>
  </g>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getActionIcon, getActionColor } from '../utils/actionMeta'

const { t } = useI18n()

const props = defineProps({
  data: { type: Object, required: true },
  sourceX: { type: Number, required: true },
  sourceY: { type: Number, required: true },
  targetX: { type: Number, required: true },
  targetY: { type: Number, required: true },
  selected: { type: Boolean, default: false }
})

const path = computed(() => {
  const { sourceX, sourceY, targetX, targetY } = props
  const midX = (sourceX + targetX) / 2
  return `M ${sourceX} ${sourceY} L ${midX} ${sourceY} L ${midX} ${targetY} L ${targetX} ${targetY}`
})

const labelX = computed(() => (props.sourceX + props.targetX) / 2)
const labelY = computed(() => (props.sourceY + props.targetY) / 2)

const activeActions = computed(() => (props.data.actions || []).filter(a => a.is_active))

const foreignObjectHeight = computed(() => {
  const baseHeight = 24
  const actionsHeight = activeActions.value.length * 20 + (activeActions.value.length > 0 ? 6 : 0)
  return baseHeight + actionsHeight
})

const actionLabel = (actionType) => t(`workflow.actions.types.${actionType}`)
</script>

<style scoped>
.transition-edge {
  stroke: var(--p-surface-400);
  transition: stroke 0.2s;
}
.transition-edge.selected {
  stroke: var(--p-primary-500);
}

.transition-label-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.transition-label {
  background: var(--p-surface-50);
  border: 1px solid var(--p-surface-200);
  color: var(--p-surface-900);
  border-radius: 12px;
  padding: 2px 10px;
  font-size: 11px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: fit-content;
  max-width: 100%;
}

 [data-theme="dark"] .transition-edge {
   stroke: var(--p-surface-500);
 }

 [data-theme="dark"] .transition-label {
   background: var(--p-surface-800);
   border-color: var(--p-surface-700);
   color: var(--p-surface-0);
 }

.transition-label.selected {
  background: var(--p-primary-100);
  border-color: var(--p-primary-500);
}

 [data-theme="dark"] .transition-label.selected {
   background: color-mix(in srgb, var(--p-primary-500) 25%, transparent);
   border-color: var(--p-primary-400);
 }

/* Transition action badges */
.transition-actions-badges {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--p-surface-0);
  border: 1px solid var(--p-surface-200);
  border-radius: 4px;
  padding: 2px;
  width: 100%;
  box-sizing: border-box;
}

[data-theme="dark"] .transition-actions-badges {
  background: var(--p-surface-800);
  border-color: var(--p-surface-600);
}

.transition-action-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 1px 5px;
  border-radius: 3px;
  background: var(--p-surface-50);
  border-left: 2px solid var(--p-primary-400);
  min-height: 16px;
}

[data-theme="dark"] .transition-action-badge {
  background: var(--p-surface-700);
  border-left-color: var(--p-primary-300);
}

.transition-action-icon {
  font-size: 8px;
  flex-shrink: 0;
}

.transition-action-label {
  font-size: 8px;
  color: var(--p-surface-700);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

[data-theme="dark"] .transition-action-label {
  color: var(--p-surface-200);
}
</style>
