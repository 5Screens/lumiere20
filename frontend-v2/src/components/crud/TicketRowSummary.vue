<template>
  <div class="flex flex-col gap-1 py-1">
    <!-- Row 1: Title -->
    <div class="font-semibold text-surface-900 dark:text-surface-100 truncate">
      {{ data.title || '-' }}
    </div>
    
    <!-- Row 2: Requester / Beneficiary -->
    <div class="flex items-center gap-3 text-sm text-surface-600 dark:text-surface-400">
      <span v-if="requesterName" class="flex items-center gap-1">
        <i class="pi pi-user text-xs" />
        {{ requesterName }}
      </span>
      <span v-if="beneficiaryName" class="flex items-center gap-1">
        <i class="pi pi-arrow-right text-xs" />
        {{ beneficiaryName }}
      </span>
    </div>
    
    <!-- Row 3: Status, Group, Watchers, Date -->
    <div class="flex items-center gap-2 flex-wrap">
      <!-- Status Tag -->
      <Tag 
        v-if="data.status"
        :value="statusLabel"
        :style="statusStyle"
        class="text-xs"
      />
      
      <!-- Assigned Group -->
      <span v-if="groupName" class="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
        <i class="pi pi-users" />
        {{ groupName }}
      </span>
      
      <!-- Watchers count -->
      <span v-if="watchersCount > 0" class="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
        <i class="pi pi-eye" />
        {{ watchersCount }}
      </span>
      
      <!-- Created date -->
      <span class="flex items-center gap-1 text-xs text-surface-400 dark:text-surface-500 ml-auto">
        <i class="pi pi-calendar" />
        {{ formattedDate }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Tag from 'primevue/tag'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const { locale } = useI18n()

// Requester name
const requesterName = computed(() => {
  const person = props.data.requested_by
  if (person && typeof person === 'object') {
    return `${person.first_name || ''} ${person.last_name || ''}`.trim()
  }
  return null
})

// Beneficiary name
const beneficiaryName = computed(() => {
  const person = props.data.requested_for
  if (person && typeof person === 'object') {
    return `${person.first_name || ''} ${person.last_name || ''}`.trim()
  }
  return null
})

// Group name
const groupName = computed(() => {
  const group = props.data.assigned_group
  if (group && typeof group === 'object') {
    return group.group_name
  }
  return null
})

// Status label (with translation support)
const statusLabel = computed(() => {
  const status = props.data.status
  if (!status) return ''
  if (status._translations?.name?.[locale.value]) {
    return status._translations.name[locale.value]
  }
  return status.name || ''
})

// Status style
const statusStyle = computed(() => {
  const status = props.data.status
  if (!status?.category?.color) {
    return { backgroundColor: '#6b7280', color: 'white' }
  }
  return { backgroundColor: status.category.color, color: 'white' }
})

// Watchers count
const watchersCount = computed(() => {
  const watchers = props.data.watchers
  if (Array.isArray(watchers)) {
    return watchers.length
  }
  return 0
})

// Formatted date
const formattedDate = computed(() => {
  if (!props.data.created_at) return '-'
  const date = new Date(props.data.created_at)
  return date.toLocaleDateString()
})
</script>
