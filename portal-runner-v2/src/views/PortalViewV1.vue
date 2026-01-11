<template>
  <div class="portal-v1 min-h-screen flex flex-col" :style="themeStyles">
    <!-- Placeholder for V1 compatibility -->
    <div class="flex-1 flex items-center justify-center">
      <p class="text-surface-500">PortalViewV1 - Legacy component placeholder</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  portalData: { type: Object, required: true },
  portalCode: { type: String, required: true }
})

const portal = computed(() => props.portalData || {})

const themeStyles = computed(() => ({
  '--portal-primary': portal.value.theme_primary_color || '#FF6B00',
  '--portal-secondary': portal.value.theme_secondary_color || '#1a1a2e'
}))
</script>
