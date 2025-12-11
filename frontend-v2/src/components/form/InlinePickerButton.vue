<template>
  <Button
    type="button"
    severity="secondary"
    outlined
    size="small"
    class="w-full justify-between"
    @click="$emit('click')"
  >
    <template #default>
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <slot>
          <span class="text-surface-400">{{ placeholder }}</span>
        </slot>
      </div>
      <i class="pi pi-pencil text-surface-400 ml-2 flex-shrink-0" />
    </template>
  </Button>
</template>

<script setup>
import Button from 'primevue/button'

defineProps({
  placeholder: {
    type: String,
    default: ''
  }
})

defineEmits(['click'])
</script>
