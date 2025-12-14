<template>
  <div 
    class="status-node"
    :class="{ 
      'selected': selected,
      'orphan': isOrphan,
      'allow-all-inbound': data.allow_all_inbound
    }"
    :style="nodeStyle"
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
</template>

<script setup>
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'

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
  // This would need to be passed from parent or computed based on edges
  // For now, we'll rely on the parent component to set a class
  return false
})
</script>

<style scoped>
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

.allow-all-arrow {
  color: var(--p-surface-400);
  font-size: 12px;
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
</style>
