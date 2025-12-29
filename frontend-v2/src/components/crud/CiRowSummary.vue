<template>
  <div class="flex flex-col gap-1 py-1">
    <!-- Row 1: Name -->
    <div class="font-semibold text-surface-900 dark:text-surface-100 truncate">
      {{ translatedName }}
    </div>
    
    <!-- Row 2: CI Type and Status -->
    <div class="flex items-center gap-2 flex-wrap">
      <!-- CI Type Tag -->
      <Tag 
        v-if="ciTypeLabel"
        :value="ciTypeLabel"
        :style="ciTypeStyle"
        class="text-xs"
      >
        <template #default>
          <div class="flex items-center gap-1">
            <i v-if="ciTypeIcon" :class="`pi ${ciTypeIcon}`" />
            <span>{{ ciTypeLabel }}</span>
          </div>
        </template>
      </Tag>
      
      <!-- Status Tag -->
      <Tag 
        v-if="data.status"
        :value="statusLabel"
        :style="statusStyle"
        class="text-xs"
      />
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

// Translated name
const translatedName = computed(() => {
  const translations = props.data._translations?.name
  if (translations?.[locale.value]) {
    return translations[locale.value]
  }
  return props.data.name || '-'
})

// CI Type label (with translation support)
const ciTypeLabel = computed(() => {
  const ciType = props.data.ci_type
  if (!ciType) return null
  if (typeof ciType === 'object') {
    if (ciType._translations?.label?.[locale.value]) {
      return ciType._translations.label[locale.value]
    }
    return ciType.label || ciType.code
  }
  return ciType
})

// CI Type icon
const ciTypeIcon = computed(() => {
  const ciType = props.data.ci_type
  if (ciType && typeof ciType === 'object') {
    return ciType.icon
  }
  return null
})

// CI Type style
const ciTypeStyle = computed(() => {
  const ciType = props.data.ci_type
  if (ciType && typeof ciType === 'object' && ciType.color) {
    return { backgroundColor: ciType.color, color: 'white' }
  }
  return { backgroundColor: '#6b7280', color: 'white' }
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
</script>
