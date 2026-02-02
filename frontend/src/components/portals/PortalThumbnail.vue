<template>
  <div class="relative w-full h-44 bg-surface-100 dark:bg-surface-700 overflow-hidden">
    <!-- Gradient background -->
    <div 
      class="w-full h-full flex items-center justify-center"
      :style="gradientStyle"
    >
      <!-- Logo if available -->
      <img 
        v-if="portal.logo_url && !imageError"
        :src="portal.logo_url"
        :alt="portal.name"
        class="max-h-20 max-w-[80%] object-contain drop-shadow-lg"
        @error="onImageError"
      />
      <!-- Fallback icon -->
      <div v-else class="text-center text-white">
        <i class="pi pi-globe text-4xl opacity-80 mb-2"></i>
        <p class="text-sm font-medium opacity-90">{{ portal.code }}</p>
      </div>
    </div>
    
    <!-- Overlay with title -->
    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
      <p class="text-white text-sm font-medium truncate">{{ portal.title || portal.name }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  portal: {
    type: Object,
    required: true
  }
})

const imageError = ref(false)

const gradientStyle = computed(() => {
  const primary = props.portal.theme_primary_color || '#FF6B00'
  const secondary = props.portal.theme_secondary_color || '#111111'
  return {
    background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`
  }
})

const onImageError = () => {
  imageError.value = true
}
</script>
