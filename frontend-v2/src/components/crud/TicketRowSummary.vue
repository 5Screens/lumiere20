<template>
  <div class="flex flex-col gap-1 py-1">
    <!-- Row 1: Title + Watchers (left) | Status (right) -->
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2 min-w-0">
        <span class="font-semibold text-surface-900 dark:text-surface-100 truncate">
          {{ data.title || '-' }}
        </span>
        <span v-if="watchersCount > 0" class="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400 shrink-0">
          <i class="pi pi-eye" />
          {{ watchersCount }}
        </span>
      </div>
      <Tag 
        v-if="data.status"
        :value="statusLabel"
        :style="statusStyle"
        class="text-xs shrink-0"
      />
    </div>
    
    <!-- Row 2: Requested for (left) | Relative date (right) -->
    <div class="flex items-center justify-between gap-2 text-sm text-surface-600 dark:text-surface-400">
      <span v-if="beneficiaryName" class="flex items-center gap-1">
        <i class="pi pi-user text-xs" />
        {{ beneficiaryName }}
      </span>
      <span v-else class="flex items-center gap-1 text-surface-400">
        <i class="pi pi-user text-xs" />
        -
      </span>
      <span class="flex items-center gap-1 text-xs text-surface-400 dark:text-surface-500 shrink-0">
        <i class="pi pi-hourglass" />
        {{ relativeDate }}
      </span>
    </div>
    
    <!-- Row 3: Assigned Group + Assigned Person -->
    <div class="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
      <i class="pi pi-users" />
      <span v-if="groupName">{{ groupName }}</span>
      <span v-else class="text-surface-400">-</span>
      <i class="pi pi-arrow-right" />
      <span v-if="assignedPersonName">{{ assignedPersonName }}</span>
      <span v-else class="text-surface-400">-</span>
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

const { locale, t } = useI18n()

// Beneficiary name (requested_for)
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

// Assigned person name
const assignedPersonName = computed(() => {
  const person = props.data.assigned_person
  if (person && typeof person === 'object') {
    return `${person.first_name || ''} ${person.last_name || ''}`.trim()
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

// Relative date computation
const relativeDate = computed(() => {
  if (!props.data.created_at) return '-'
  
  const now = new Date()
  const created = new Date(props.data.created_at)
  const diffMs = now - created
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffMonths = Math.floor(diffDays / 30)
  
  if (diffMinutes < 1) {
    return t('common.relativeTime.lessThanMinute')
  } else if (diffMinutes < 60) {
    return t('common.relativeTime.minutes', { count: diffMinutes })
  } else if (diffHours < 24) {
    return t('common.relativeTime.hours', { count: diffHours })
  } else if (diffDays < 30) {
    return t('common.relativeTime.days', { count: diffDays })
  } else {
    return t('common.relativeTime.months', { count: diffMonths })
  }
})
</script>
