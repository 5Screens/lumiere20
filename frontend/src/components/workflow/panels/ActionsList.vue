<template>
  <div class="actions-list">
    <div class="flex items-center justify-between mb-2">
      <label class="text-sm font-medium">{{ title }}</label>
      <Button icon="pi pi-plus" text size="small" @click="$emit('add')" />
    </div>

    <!-- Empty state -->
    <div v-if="!actions || actions.length === 0" class="text-center py-3 text-surface-400 text-sm italic">
      {{ $t('workflow.actions.noActions') }}
    </div>

    <!-- Actions list (draggable) -->
    <div v-else class="space-y-1">
      <div
        v-for="(action, index) in actions"
        :key="action.uuid"
        class="action-item flex items-center gap-2 p-2 rounded border border-surface-200 dark:border-surface-600 bg-surface-0 dark:bg-surface-800 hover:border-primary-300 dark:hover:border-primary-600 transition-colors cursor-pointer group"
        :class="{ 'opacity-50': !action.is_active }"
        @click="$emit('edit', action)"
      >
        <!-- Drag handle -->
        <i class="pi pi-bars text-surface-300 dark:text-surface-500 cursor-grab text-xs" />

        <!-- Action type icon -->
        <span
          class="action-icon w-6 h-6 rounded flex items-center justify-center text-white text-xs flex-shrink-0"
          :style="{ background: getActionColor(action.action_type) }"
        >
          <i :class="getActionIcon(action.action_type)" />
        </span>

        <!-- Label & type -->
        <div class="flex-1 min-w-0">
          <div class="text-xs font-medium truncate">
            {{ action.label || $t(`workflow.actions.types.${action.action_type}`) }}
          </div>
          <div class="text-[10px] text-surface-400 dark:text-surface-500 truncate">
            {{ $t(`workflow.actions.types.${action.action_type}`) }}
          </div>
        </div>

        <!-- Active toggle -->
        <ToggleSwitch
          :modelValue="action.is_active"
          @update:modelValue="(val) => $emit('toggle-active', action.uuid, val)"
          @click.stop
          class="flex-shrink-0"
          style="transform: scale(0.7);"
        />

        <!-- Delete button -->
        <Button
          icon="pi pi-trash"
          text
          size="small"
          severity="danger"
          class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          @click.stop="$emit('delete', action.uuid)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import Button from 'primevue/button'
import ToggleSwitch from 'primevue/toggleswitch'
import { getActionIcon, getActionColor } from '../utils/actionMeta'

defineProps({
  title: {
    type: String,
    default: ''
  },
  actions: {
    type: Array,
    default: () => []
  }
})

defineEmits(['add', 'edit', 'delete', 'toggle-active'])
</script>

<style scoped>
.action-item {
  transition: all 0.15s ease;
}
.action-item:hover {
  transform: translateX(2px);
}
</style>
