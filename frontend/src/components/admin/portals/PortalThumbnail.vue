<template>
  <div class="portal-thumbnail">
    <!-- Image thumbnail if available -->
    <img
      v-if="portal.thumbnail_url"
      :src="portal.thumbnail_url"
      :alt="`${portal.name} thumbnail`"
      class="portal-thumbnail__image"
      @error="handleImageError"
    />
    
    <!-- Iframe live preview (dev mode) -->
    <div v-else-if="portal.base_url && showIframe" class="portal-thumbnail__iframe-wrapper">
      <iframe
        :src="portal.base_url"
        :title="`${portal.name} preview`"
        class="portal-thumbnail__iframe"
        sandbox="allow-same-origin"
        loading="lazy"
      />
    </div>
    
    <!-- Fallback placeholder -->
    <div v-else class="portal-thumbnail__placeholder">
      <i class="fas fa-portal fa-3x"></i>
      <span class="portal-thumbnail__placeholder-text">{{ portal.code }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps } from 'vue';

const props = defineProps({
  portal: {
    type: Object,
    required: true
  },
  showIframe: {
    type: Boolean,
    default: false // Désactivé par défaut pour performance
  }
});

const handleImageError = (event) => {
  console.warn(`[PORTAL THUMBNAIL] Failed to load image for portal ${props.portal.code}`);
  event.target.style.display = 'none';
};
</script>

<style scoped>
.portal-thumbnail {
  width: 100%;
  height: 180px;
  background: var(--background-secondary);
  border-radius: 8px 8px 0 0;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.portal-thumbnail__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.portal-thumbnail__iframe-wrapper {
  width: 320px;
  height: 200px;
  overflow: hidden;
  position: relative;
  transform-origin: 0 0;
  transform: scale(0.5625); /* 180/320 = 0.5625 */
}

.portal-thumbnail__iframe {
  width: 320px;
  height: 200px;
  border: none;
  pointer-events: none;
  transform-origin: 0 0;
}

.portal-thumbnail__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-secondary);
  text-align: center;
  padding: 20px;
}

.portal-thumbnail__placeholder i {
  opacity: 0.3;
}

.portal-thumbnail__placeholder-text {
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.6;
}
</style>
