<template>
  <div class="s-multi-filter" :class="{ 'collapsed': !isExpanded }">
    <!-- Header avec bouton toggle -->
    <div class="s-multi-filter__header" @click="togglePanel">
      <div class="s-multi-filter__title">
        <i class="fas fa-filter"></i>
        <span>{{ $t('filters.title') }}</span>
        <span v-if="activeFilterCount > 0" class="filter-badge">
          {{ activeFilterCount }}
        </span>
      </div>
      <button class="s-multi-filter__toggle">
        <i :class="isExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
      </button>
    </div>

    <!-- Contenu des filtres -->
    <transition name="slide">
      <div v-if="isExpanded" class="s-multi-filter__content">
        <!-- Loading state -->
        <div v-if="loading" class="s-multi-filter__loading">
          <i class="fas fa-spinner fa-spin"></i>
          <span>{{ $t('filters.loading') }}</span>
        </div>

        <!-- Filtres individuels -->
        <div v-else-if="filterConfig && filterConfig.length > 0" class="s-multi-filter__filters">
          <!-- Message si aucun filtre ajouté -->
          <div v-if="activeFilters.length === 0" class="s-multi-filter__empty">
            
            <span>{{ $t('filters.add_first_filter') }}</span>
            <button @click="addNewFilter" class="btn-add-first" :title="$t('filters.add_filter')">
              <i class="fas fa-plus"></i>
            </button>
          </div>

          <!-- Liste des filtres actifs -->
          <div v-else class="s-multi-filter__active-filters">
            <sOneFilter
              v-for="(filter, index) in activeFilters"
              :key="filter.id"
              :filter="filter"
              :filter-number="index + 1"
              :table-name="tableName"
              :available-columns="filterConfig"
              @update="updateFilter"
              @remove="removeFilter"
            />
          </div>

          <!-- Bouton pour ajouter un filtre -->
          <div v-if="activeFilters.length > 0" class="s-multi-filter__add-filter">
            <button @click="addNewFilter" class="btn-add-filter" :title="$t('filters.add_filter')">
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </div>

        <!-- Message si pas de configuration -->
        <div v-else class="s-multi-filter__no-config">
          <i class="fas fa-exclamation-triangle"></i>
          <span>{{ $t('filters.no_filters_available') }}</span>
        </div>

        <!-- Boutons d'action -->
        <div v-if="filterConfig && filterConfig.length > 0" class="s-multi-filter__actions">
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
import sOneFilter from './sOneFilter.vue';

export default {
  name: 'sMultiFilter',
  components: {
    sOneFilter
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
      return filterStore.getActiveFiltersForTable(props.tableName) || [];
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
        console.error('[sMultiFilter] Error loading filter config:', err);
      } finally {
        loading.value = false;
      }
    };

    const addNewFilter = () => {
      filterStore.addFilter(props.tableName);
    };

    const updateFilter = (filterId, updates) => {
      filterStore.updateFilter(props.tableName, filterId, updates);
    };

    const removeFilter = (filterId) => {
      filterStore.removeFilter(props.tableName, filterId);
    };

    const handleApply = async () => {
      try {
        // Convertir au format legacy pour l'API
        const legacyFilters = filterStore.convertFiltersToLegacyFormat(props.tableName);
        
        console.info('[sMultiFilter] Applying filters:', legacyFilters);
        emit('filters-applied', legacyFilters);
      } catch (err) {
        console.error('[sMultiFilter] Error applying filters:', err);
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
      addNewFilter,
      updateFilter,
      removeFilter,
      handleApply,
      handleReset,
      t
    };
  }
};
</script>

<style scoped>
@import '@/assets/styles/sMultiFilter.css';
</style>
