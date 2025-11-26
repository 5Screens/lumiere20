<template>
  <article class="portal-card">
    <!-- Thumbnail -->
    <PortalThumbnail :portal="portal" :show-iframe="false" />
    
    <!-- Content -->
    <div class="portal-card__content">
      <!-- Header -->
      <div class="portal-card__header">
        <h3 class="portal-card__name">{{ portal.name }}</h3>
        <span class="portal-card__badge" :class="badgeClass">
          {{ badgeLabel }}
        </span>
      </div>
      
      <!-- Details -->
      <div class="portal-card__details">
        <div class="portal-card__detail portal-card__detail--hoverable">
          <i class="fas fa-code"></i>
          <span>{{ portal.code }}</span>
          <a 
            v-if="portal.base_url" 
            :href="`${portal.base_url}/${portal.code}`" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="portal-card__link-icon"
            :title="t('portalsBuilder.openPortal')"
          >
            <i class="fas fa-link"></i>
          </a>
        </div>
      </div>
      
      <!-- Description -->
      <p v-if="portal.description" class="portal-card__description">
        {{ portal.description }}
      </p>
      
      <!-- Footer -->
      <div class="portal-card__footer">
        <div class="portal-card__meta">
          <span class="portal-card__meta-item">
            <i class="fas fa-calendar"></i>
            {{ formatDate(portal.created_at) }}
          </span>
        </div>
        
        <!-- Actions -->
        <div class="portal-card__actions">
          <button
            class="portal-card__admin-btn"
            :title="t('portals.admin.openAdmin')"
            @click="$emit('admin')"
          >
            <i class="fas fa-wrench"></i>
          </button>
          <PortalToggle
            :model-value="portal.is_active"
            :loading="loadingAction"
            @toggle="$emit('toggle')"
          />
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed, defineProps, defineEmits } from 'vue';
import PortalThumbnail from './PortalThumbnail.vue';
import PortalToggle from './PortalToggle.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  portal: {
    type: Object,
    required: true
  },
  loadingAction: {
    type: Boolean,
    default: false
  }
});

defineEmits(['toggle', 'preview', 'admin']);

const badgeClass = computed(() => ({
  'portal-card__badge--active': props.portal.is_active,
  'portal-card__badge--inactive': !props.portal.is_active
}));

const badgeLabel = computed(() => {
  return props.portal.is_active 
    ? t('portals.status_active') 
    : t('portals.status_inactive');
});

const truncateUrl = (url) => {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url.length > 30 ? url.substring(0, 30) + '...' : url;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};
</script>

<style scoped>
.portal-card {
  background: var(--background-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.portal-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-color);
}

.portal-card__content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.portal-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.portal-card__name {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
  line-height: 1.4;
  flex: 1;
}

.portal-card__badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.portal-card__badge--active {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.portal-card__badge--inactive {
  background: rgba(156, 163, 175, 0.1);
  color: #9ca3af;
}

.portal-card__details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.portal-card__detail {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: var(--text-secondary);
  position: relative;
}

.portal-card__detail--hoverable {
  padding-right: 32px;
}

.portal-card__detail i {
  width: 16px;
  text-align: center;
  opacity: 0.6;
}

.portal-card__link-icon {
  position: absolute;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--primary-color);
  text-decoration: none;
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
  cursor: pointer;
  border-radius: 4px;
}

.portal-card:hover .portal-card__link-icon {
  opacity: 1;
  transform: translateX(0);
}

.portal-card__link-icon:hover {
  color: var(--primary-hover);
  background: rgba(33, 150, 243, 0.1);
}

.portal-card__description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.portal-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.portal-card__meta {
  display: flex;
  gap: 12px;
}

.portal-card__meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.portal-card__meta-item i {
  opacity: 0.6;
}

.portal-card__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.portal-card__admin-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.portal-card__admin-btn:hover {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.portal-card__admin-btn i {
  font-size: 0.875rem;
}
</style>
