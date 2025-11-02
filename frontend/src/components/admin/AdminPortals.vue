<template>
  <section class="admin-portals">
    <!-- Header & Toolbar -->
    <header class="admin-portals__header">
      <div class="admin-portals__title-section">
        <h1 class="admin-portals__title">
          <i class="fas fa-portal"></i>
          {{ t('portals.page_title') }}
        </h1>
        <p class="admin-portals__subtitle">{{ t('portals.page_subtitle') }}</p>
      </div>
      
      <div class="admin-portals__toolbar">
        <!-- Search -->
        <div class="admin-portals__search">
          <i class="fas fa-search"></i>
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('portals.search_placeholder')"
            class="admin-portals__search-input"
            @input="debouncedSearch"
          />
          <button
            v-if="searchQuery"
            class="admin-portals__search-clear"
            @click="clearSearch"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <!-- Filter by status -->
        <select
          v-model="stateFilter"
          class="admin-portals__filter"
          @change="fetchData"
        >
          <option value="all">{{ t('portals.filter_all') }}</option>
          <option value="active">{{ t('portals.filter_active') }}</option>
          <option value="inactive">{{ t('portals.filter_inactive') }}</option>
        </select>
        
        <!-- Refresh button -->
        <button
          class="admin-portals__refresh-btn"
          :disabled="loading"
          @click="fetchData"
        >
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          {{ t('portals.refresh') }}
        </button>
      </div>
    </header>

    <!-- Loading state -->
    <div v-if="loading && !items.length" class="admin-portals__loading">
      <div class="admin-portals__skeleton-grid">
        <div v-for="i in 6" :key="i" class="admin-portals__skeleton-card">
          <div class="skeleton-thumbnail"></div>
          <div class="skeleton-content">
            <div class="skeleton-line skeleton-line--title"></div>
            <div class="skeleton-line skeleton-line--text"></div>
            <div class="skeleton-line skeleton-line--text"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!loading && !items.length" class="admin-portals__empty">
      <i class="fas fa-portal fa-4x"></i>
      <h2>{{ t('portals.empty_title') }}</h2>
      <p>{{ t('portals.empty_message') }}</p>
    </div>

    <!-- Grid of portals -->
    <div v-else class="admin-portals__grid">
      <PortalCard
        v-for="portal in items"
        :key="portal.uuid"
        :portal="portal"
        :loading-action="!!toggling[portal.uuid]"
        @toggle="onToggle(portal)"
      />
    </div>

    <!-- Stats footer -->
    <footer v-if="items.length" class="admin-portals__footer">
      <div class="admin-portals__stats">
        <span class="admin-portals__stat">
          <i class="fas fa-layer-group"></i>
          {{ t('portals.total_count', { count: items.length }) }}
        </span>
        <span class="admin-portals__stat">
          <i class="fas fa-check-circle"></i>
          {{ t('portals.active_count', { count: activeCount }) }}
        </span>
        <span class="admin-portals__stat">
          <i class="fas fa-times-circle"></i>
          {{ t('portals.inactive_count', { count: inactiveCount }) }}
        </span>
      </div>
    </footer>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTabsStore } from '@/stores/tabsStore';
import portalsService from '@/services/portalsService';
import PortalCard from './portals/PortalCard.vue';

const { t } = useI18n();
const tabsStore = useTabsStore();

// State
const loading = ref(false);
const items = ref([]);
const searchQuery = ref('');
const stateFilter = ref('all');
const toggling = ref({});

// Debounce timer
let searchTimeout = null;

// Computed
const activeCount = computed(() => items.value.filter(p => p.is_active).length);
const inactiveCount = computed(() => items.value.filter(p => !p.is_active).length);

// Methods
const fetchData = async () => {
  loading.value = true;
  try {
    const params = {};
    
    // Apply state filter
    if (stateFilter.value === 'active') {
      params.is_active = true;
    } else if (stateFilter.value === 'inactive') {
      params.is_active = false;
    }
    
    // Apply search query
    if (searchQuery.value.trim()) {
      params.q = searchQuery.value.trim();
    }
    
    console.info('[ADMIN PORTALS] Fetching portals with params:', params);
    const data = await portalsService.listPortals(params);
    items.value = Array.isArray(data) ? data : [];
    console.info(`[ADMIN PORTALS] Loaded ${items.value.length} portals`);
  } catch (error) {
    console.error('[ADMIN PORTALS] Error fetching portals:', error);
    items.value = [];
  } finally {
    loading.value = false;
  }
};

const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    fetchData();
  }, 300);
};

const clearSearch = () => {
  searchQuery.value = '';
  fetchData();
};

const onToggle = async (portal) => {
  const nextState = !portal.is_active;
  const previousState = portal.is_active;
  
  // Set loading state
  toggling.value[portal.uuid] = true;
  
  // Optimistic update
  portal.is_active = nextState;
  
  try {
    console.info(`[ADMIN PORTALS] Toggling portal ${portal.code} to ${nextState}`);
    await portalsService.activatePortal(portal.uuid, nextState);
    
    // Success notification
    const message = nextState 
      ? t('portals.activation_success', { name: portal.name })
      : t('portals.deactivation_success', { name: portal.name });
    
    tabsStore.setMessage(message);
    console.info(`[ADMIN PORTALS] Portal ${portal.code} toggled successfully`);
  } catch (error) {
    // Rollback on error
    portal.is_active = previousState;
    console.error('[ADMIN PORTALS] Error toggling portal:', error);
    
    // Error notification
    const errorMessage = t('portals.toggle_error', { 
      name: portal.name,
      error: error.message 
    });
    tabsStore.setMessage(errorMessage);
  } finally {
    toggling.value[portal.uuid] = false;
  }
};

// Lifecycle
onMounted(() => {
  console.info('[ADMIN PORTALS] Component mounted, fetching data');
  fetchData();
});
</script>

<style scoped>
.admin-portals {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  height: 100%;
  overflow-y: auto;
}

/* Header */
.admin-portals__header {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.admin-portals__title-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.admin-portals__title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-portals__title i {
  color: var(--primary-color);
}

.admin-portals__subtitle {
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Toolbar */
.admin-portals__toolbar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.admin-portals__search {
  position: relative;
  flex: 1;
  min-width: 250px;
  max-width: 400px;
}

.admin-portals__search i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  pointer-events: none;
}

.admin-portals__search-input {
  width: 100%;
  padding: 10px 40px 10px 40px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--background-primary);
  color: var(--text-color);
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.admin-portals__search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.admin-portals__search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.admin-portals__search-clear:hover {
  background: var(--background-secondary);
  color: var(--text-color);
}

.admin-portals__filter {
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--background-primary);
  color: var(--text-color);
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.admin-portals__filter:focus {
  outline: none;
  border-color: var(--primary-color);
}

.admin-portals__refresh-btn {
  padding: 10px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.admin-portals__refresh-btn:hover:not(:disabled) {
  background: var(--primary-color-dark);
  transform: translateY(-1px);
}

.admin-portals__refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Grid */
.admin-portals__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

/* Loading skeleton */
.admin-portals__loading {
  flex: 1;
}

.admin-portals__skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.admin-portals__skeleton-card {
  background: var(--background-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-thumbnail {
  width: 100%;
  height: 180px;
  background: var(--background-secondary);
}

.skeleton-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-line {
  height: 16px;
  background: var(--background-secondary);
  border-radius: 4px;
}

.skeleton-line--title {
  width: 70%;
  height: 20px;
}

.skeleton-line--text {
  width: 90%;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* Empty state */
.admin-portals__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px 20px;
  text-align: center;
  color: var(--text-secondary);
}

.admin-portals__empty i {
  opacity: 0.3;
}

.admin-portals__empty h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.admin-portals__empty p {
  font-size: 1rem;
  margin: 0;
  max-width: 400px;
}

/* Footer stats */
.admin-portals__footer {
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.admin-portals__stats {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.admin-portals__stat {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.admin-portals__stat i {
  color: var(--primary-color);
}

/* Responsive */
@media (max-width: 768px) {
  .admin-portals {
    padding: 16px;
  }
  
  .admin-portals__toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .admin-portals__search {
    max-width: none;
  }
  
  .admin-portals__grid,
  .admin-portals__skeleton-grid {
    grid-template-columns: 1fr;
  }
}
</style>
