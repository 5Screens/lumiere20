<template>
  <article class="bg-surface-0 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary flex flex-col h-full">
    <!-- Thumbnail -->
    <PortalThumbnail :portal="portal" />
    
    <!-- Content -->
    <div class="p-4 flex flex-col gap-3 flex-1">
      <!-- Header -->
      <div class="flex items-start justify-between gap-3">
        <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 leading-tight flex-1">
          {{ portal.name }}
        </h3>
        <Tag 
          :value="badgeLabel" 
          :severity="portal.is_active ? 'success' : 'secondary'"
          class="text-xs"
        />
      </div>
      
      <!-- Details -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2 text-sm text-surface-500 group">
          <i class="pi pi-code w-4 text-center opacity-60"></i>
          <span>{{ portal.code }}</span>
          <a 
            v-if="portal.base_url" 
            :href="`${portal.base_url}/${portal.code}`" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="ml-auto text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:text-primary-600"
            :title="t('portals.open_portal')"
          >
            <i class="pi pi-external-link"></i>
          </a>
        </div>
      </div>
      
      <!-- Description -->
      <p v-if="portal.subtitle" class="text-sm text-surface-500 line-clamp-2">
        {{ portal.subtitle }}
      </p>
      
      <!-- Footer -->
      <div class="flex items-center justify-between mt-auto pt-3 border-t border-surface-200 dark:border-surface-700">
        <div class="flex gap-3">
          <span class="flex items-center gap-1.5 text-xs text-surface-400">
            <i class="pi pi-calendar opacity-60"></i>
            {{ formatDate(portal.created_at) }}
          </span>
        </div>
        
        <!-- Actions -->
        <div class="flex items-center gap-3">
          <Button
            icon="pi pi-cog"
            severity="secondary"
            text
            rounded
            size="small"
            :title="t('portals.admin.openAdmin')"
            @click="$emit('admin')"
          />
          <ToggleSwitch
            :modelValue="portal.is_active"
            :disabled="loadingAction"
            @update:modelValue="$emit('toggle')"
          />
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import PortalThumbnail from './PortalThumbnail.vue'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import ToggleSwitch from 'primevue/toggleswitch'

const { t } = useI18n()

const props = defineProps({
  portal: {
    type: Object,
    required: true
  },
  loadingAction: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle', 'admin'])

const badgeLabel = computed(() => {
  return props.portal.is_active 
    ? t('portals.status_active') 
    : t('portals.status_inactive')
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}
</script>
