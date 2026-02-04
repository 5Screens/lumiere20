<template>
  <div class="flex flex-col gap-1 py-1">
    <!-- Row 1: Name and Version -->
    <div class="flex items-center gap-2">
      <span class="font-semibold text-surface-900 dark:text-surface-100 truncate">
        {{ data.name || '-' }}
      </span>
      <Tag 
        v-if="data.version"
        :value="data.version"
        severity="secondary"
        class="text-xs"
      />
    </div>
    
    <!-- Row 2: Business Criticality and Status -->
    <div class="flex items-center gap-2 flex-wrap">
      <!-- Business Criticality Tag -->
      <Tag 
        v-if="data.business_criticality"
        :value="data.business_criticality"
        :style="criticalityStyle"
        class="text-xs"
      >
        <template #default>
          <div class="flex items-center gap-1">
            <i :class="`pi ${criticalityIcon}`" />
            <span>{{ data.business_criticality }}</span>
          </div>
        </template>
      </Tag>
      
      <!-- Lifecycle Status Tag -->
      <Tag 
        v-if="data.status"
        :value="statusLabel"
        :style="statusStyle"
        class="text-xs"
      />
    </div>

    <!-- Row 3: Owner info -->
    <div v-if="ownerInfo" class="text-xs text-surface-500 dark:text-surface-400 truncate">
      <i class="pi pi-user mr-1" />
      {{ ownerInfo }}
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

// Business Criticality icon based on level
const criticalityIcon = computed(() => {
  const level = props.data.business_criticality?.toUpperCase()
  switch (level) {
    case 'CRITICAL': return 'pi-exclamation-circle'
    case 'HIGH': return 'pi-exclamation-triangle'
    case 'MEDIUM': return 'pi-info-circle'
    case 'LOW': return 'pi-minus-circle'
    default: return 'pi-circle'
  }
})

// Business Criticality style
const criticalityStyle = computed(() => {
  const level = props.data.business_criticality?.toUpperCase()
  switch (level) {
    case 'CRITICAL': return { backgroundColor: '#ef4444', color: 'white' }
    case 'HIGH': return { backgroundColor: '#f59e0b', color: 'white' }
    case 'MEDIUM': return { backgroundColor: '#3b82f6', color: 'white' }
    case 'LOW': return { backgroundColor: '#6b7280', color: 'white' }
    default: return { backgroundColor: '#6b7280', color: 'white' }
  }
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

// Owner info (owned_by or owning_entity)
const ownerInfo = computed(() => {
  const ownedBy = props.data.owned_by
  const owningEntity = props.data.owning_entity
  
  if (ownedBy) {
    return `${ownedBy.first_name || ''} ${ownedBy.last_name || ''}`.trim()
  }
  if (owningEntity) {
    return owningEntity.name
  }
  return null
})
</script>
