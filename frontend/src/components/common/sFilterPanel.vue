<template>
  <div class="s-filter-panel" :class="{ 'collapsed': !isExpanded }">
    <!-- Header avec bouton toggle -->
    <div class="s-filter-panel__header" @click="togglePanel">
      <div class="s-filter-panel__title">
        <i class="fas fa-filter"></i>
        <span>{{ $t('filters.title') }}</span>
        <span v-if="activeFilterCount > 0" class="filter-badge">
          {{ activeFilterCount }}
        </span>
      </div>
      <button class="s-filter-panel__toggle">
        <i :class="isExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
      </button>
    </div>

    <!-- Contenu des filtres -->
    <transition name="slide">
      <div v-if="isExpanded" class="s-filter-panel__content">
        <!-- Loading state -->
        <div v-if="loading" class="s-filter-panel__loading">
          <i class="fas fa-spinner fa-spin"></i>
          <span>{{ $t('filters.loading') }}</span>
        </div>

        <!-- Filtres -->
        <div v-else-if="filterConfig && filterConfig.length > 0" class="s-filter-panel__filters">
          <div 
            v-for="filter in filterConfig" 
            :key="filter.column"
            class="s-filter-panel__filter-item"
          >
            <sFilter
              :config="filter"
              :value="activeFilters[filter.column]"
              :table-name="tableName"
              @update="updateFilter(filter.column, $event)"
              @load-values="loadFilterValues(filter.column)"
            />
          </div>
        </div>

        <!-- Message si pas de filtres -->
        <div v-else class="s-filter-panel__no-filters">
          <i class="fas fa-info-circle"></i>
          <span>{{ $t('filters.no_filters_available') }}</span>
        </div>

        <!-- Boutons d'action -->
        <div v-if="filterConfig && filterConfig.length > 0" class="s-filter-panel__actions">
          <button 
            class="btn-reset"
            @click="handleReset"
            :disabled="activeFilterCount === 0"
          >
            <i class="fas fa-undo"></i>
            {{ $t('filters.reset') }}
          </button>
          <button 
            class="btn-apply"
            @click="handleApply"
          >
            <i class="fas fa-check"></i>
            {{ $t('filters.apply') }}
            <span v-if="activeFilterCount > 0" class="count">
              ({{ activeFilterCount }})
            </span>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useFilterStore } from '@/stores/filterStore';
import { useI18n } from 'vue-i18n';
import sFilter from './sFilter.vue';

export default {
  name: 'sFilterPanel',
  components: {
    sFilter
  },
  props: {
    tableName: {
      type: String,
      required: true
    },
    columns: {
      type: Array,
      default: null
    }
  },
  emits: ['filters-applied', 'filters-reset'],
  setup(props, { emit }) {
    const { t } = useI18n();
    const filterStore = useFilterStore();

    // État local
    const isExpanded = ref(false);
    const loading = ref(false);
    const error = ref(null);

    // Computed
    const filterConfig = computed(() => {
      const config = filterStore.getConfigForTable(props.tableName);
      
      // Si des colonnes spécifiques sont demandées, filtrer la config
      if (props.columns && props.columns.length > 0) {
        return config?.filter(f => props.columns.includes(f.column)) || [];
      }
      
      return config || [];
    });

    const activeFilters = computed(() => {
      return filterStore.getActiveFiltersForTable(props.tableName) || {};
    });

    const activeFilterCount = computed(() => {
      return filterStore.getActiveFilterCount(props.tableName);
    });

    // Méthodes
    const togglePanel = () => {
      isExpanded.value = !isExpanded.value;
      filterStore.setPanelState(props.tableName, isExpanded.value);
    };

    const loadFilterConfig = async () => {
      if (filterConfig.value && filterConfig.value.length > 0) {
        // Config déjà chargée
        return;
      }

      loading.value = true;
      error.value = null;

      try {
        await filterStore.loadFilterConfig(props.tableName);
      } catch (err) {
        error.value = err.message;
        console.error('[sFilterPanel] Error loading filter config:', err);
      } finally {
        loading.value = false;
      }
    };

    const loadFilterValues = async (columnName) => {
      try {
        await filterStore.loadFilterValues(props.tableName, columnName);
      } catch (err) {
        console.error(`[sFilterPanel] Error loading values for ${columnName}:`, err);
      }
    };

    const updateFilter = (columnName, value) => {
      filterStore.updateFilter(props.tableName, columnName, value);
    };

    const handleApply = async () => {
      try {
        const filters = activeFilters.value;
        
        // Nettoyer les filtres vides
        const cleanedFilters = {};
        Object.keys(filters).forEach(key => {
          const value = filters[key];
          if (value !== null && value !== undefined && value !== '') {
            if (Array.isArray(value) && value.length > 0) {
              cleanedFilters[key] = value;
            } else if (typeof value === 'object' && (value.gte || value.lte)) {
              cleanedFilters[key] = value;
            } else if (!Array.isArray(value) && value) {
              cleanedFilters[key] = value;
            }
          }
        });

        console.info('[sFilterPanel] Applying filters:', cleanedFilters);
        emit('filters-applied', cleanedFilters);
      } catch (err) {
        console.error('[sFilterPanel] Error applying filters:', err);
      }
    };

    const handleReset = () => {
      filterStore.resetFilters(props.tableName);
      emit('filters-reset');
    };

    // Lifecycle
    onMounted(async () => {
      await loadFilterConfig();
      
      // Restaurer l'état du panneau depuis le store
      const savedState = filterStore.getPanelState(props.tableName);
      if (savedState !== undefined) {
        isExpanded.value = savedState;
      }
    });

    // Watchers
    watch(() => props.tableName, async (newTable) => {
      if (newTable) {
        await loadFilterConfig();
      }
    });

    return {
      isExpanded,
      loading,
      error,
      filterConfig,
      activeFilters,
      activeFilterCount,
      togglePanel,
      loadFilterValues,
      updateFilter,
      handleApply,
      handleReset,
      t
    };
  }
};
</script>

<style scoped>
@import '@/assets/styles/sFilterPanel.css';
</style>
