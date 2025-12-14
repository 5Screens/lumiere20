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
      :x="labelX - 60"
      :y="labelY - 12"
      width="120"
      height="24"
    >
      <div class="transition-label" :class="{ selected }">
        {{ data.name }}
      </div>
    </foreignObject>
  </g>
</template>

<script setup>
import { computed } from 'vue'

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
</script>

<style scoped>
.transition-edge {
  stroke: #9ca3af;
  transition: stroke 0.2s;
}
.transition-edge.selected {
  stroke: #3b82f6;
}
.transition-label {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  padding: 2px 10px;
  font-size: 11px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.transition-label.selected {
  background: #dbeafe;
  border-color: #3b82f6;
}
</style>
