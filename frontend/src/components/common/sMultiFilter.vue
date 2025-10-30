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
          <!-- Options de filtrage (mode et opérateur) -->
          <div v-if="activeFilters.length > 0" class="s-multi-filter__options">
            <select v-model="filterMode" class="filter-mode-select">
              <option value="include">{{ $t('filters.keep') }}</option>
              <option value="exclude">{{ $t('filters.remove') }}</option>
            </select>
            <span class="filter-options-label">{{ $t('filters.all_lines_that_match') }}</span>
            <select v-model="filterOperator" class="filter-operator-select">
              <option value="AND">{{ $t('filters.all_filters') }}</option>
              <option value="OR">{{ $t('filters.any_filters') }}</option>
            </select>
          </div>

          <!-- Message si aucun filtre ajouté -->
          <div v-if="activeFilters.length === 0" class="s-multi-filter__empty">
            <button @click="addNewFilter" class="btn-add-first" :title="$t('filters.add_first_filter')">
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
              :object-name="objectName"
              :available-columns="filterConfig"
              @update="updateFilter"
              @remove="removeFilter"
              @apply-filters="handleApply"
            />
          </div>

        </div>

        <!-- Message si pas de configuration -->
        <div v-else class="s-multi-filter__no-config">
          <i class="fas fa-exclamation-triangle"></i>
          <span>{{ $t('filters.no_filters_available') }}</span>
        </div>

        <!-- Boutons d'action (+ / Réinitialiser / Appliquer) -->
        <div v-if="filterConfig && filterConfig.length > 0 && activeFilters.length > 0" class="s-multi-filter__actions">
          <button 
            v-if="activeFilters.length > 0"
            @click="addNewFilter" 
            class="btn-add-filter" 
            :title="$t('filters.add_filter')"
          >
            <i class="fas fa-plus"></i>
          </button>
          <div class="s-multi-filter__actions-right">
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
    objectName: {
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
    const filterMode = ref('include'); // 'include' ou 'exclude'
    const filterOperator = ref('AND'); // 'AND' ou 'OR'

    // Computed
    const filterConfig = computed(() => {
      const config = filterStore.getConfigForTable(props.objectName);
      
      // Si des colonnes spécifiques sont demandées, filtrer la config
      if (props.columns && props.columns.length > 0) {
        return config?.filter(f => props.columns.includes(f.column)) || [];
      }
      
      return config || [];
    });

    const activeFilters = computed(() => {
      return filterStore.getActiveFiltersForTable(props.objectName) || [];
    });

    const activeFilterCount = computed(() => {
      return filterStore.getActiveFilterCount(props.objectName);
    });

    // Méthodes
    const togglePanel = () => {
      isExpanded.value = !isExpanded.value;
      filterStore.setPanelState(props.objectName, isExpanded.value);
    };

    const loadFilterConfig = async () => {
      if (filterConfig.value && filterConfig.value.length > 0) {
        // Config déjà chargée
        return;
      }

      loading.value = true;
      error.value = null;

      try {
        await filterStore.loadFilterConfig(props.objectName);
      } catch (err) {
        error.value = err.message;
        console.error('[sMultiFilter] Error loading filter config:', err);
      } finally {
        loading.value = false;
      }
    };

    const addNewFilter = () => {
      filterStore.addFilter(props.objectName);
    };

    const updateFilter = (filterId, updates) => {
      filterStore.updateFilter(props.objectName, filterId, updates);
    };

    const removeFilter = async (filterId) => {
      filterStore.removeFilter(props.objectName, filterId);
      
      // Déclencher le rechargement de la grille après suppression
      await handleApply();
    };

    const handleApply = async () => {
      try {
        // Stocker le mode et l'opérateur dans le filterStore
        filterStore.setFilterOptions(props.objectName, {
          mode: filterMode.value,
          operator: filterOperator.value
        });
        
        // Pour Person et tous les types de tickets, utiliser le filterStore qui gère la conversion en conditions
        // Pour les autres objets, convertir au format legacy
        const ticketTypes = ['Task', 'Incident', 'Problem', 'Change', 'Knowledge', 'Knowledge_article', 'Project', 'Defect', 'Sprint', 'Epic', 'UserStory'];
        if (props.objectName === 'Person' || ticketTypes.includes(props.objectName)) {
          console.info(`[sMultiFilter] Applying filters for ${props.objectName} (handled by filterStore)`);
          // Émettre un objet vide car le filterStore gère tout
          emit('filters-applied', {});
        } else {
          // Convertir au format legacy pour l'API
          const legacyFilters = filterStore.convertFiltersToLegacyFormat(props.objectName);
          
          console.info('[sMultiFilter] Applying filters:', legacyFilters);
          emit('filters-applied', legacyFilters);
        }
      } catch (err) {
        console.error('[sMultiFilter] Error applying filters:', err);
      }
    };

    const handleReset = () => {
      filterStore.resetFilters(props.objectName);
      
      // Ajouter automatiquement un filtre vide pour éviter le clic sur "+"
      filterStore.addFilter(props.objectName);
      
      // Garder le panneau ouvert après la réinitialisation pour une meilleure UX
      isExpanded.value = true;
      filterStore.setPanelState(props.objectName, true);
      
      emit('filters-reset');
    };

    // Lifecycle
    onMounted(async () => {
      await loadFilterConfig();
      
      // Restaurer l'état du panneau depuis le store
      const savedState = filterStore.getPanelState(props.objectName);
      if (savedState !== undefined) {
        isExpanded.value = savedState;
      }
      
      // Restaurer les options de filtrage (mode et operator)
      const savedOptions = filterStore.getFilterOptions(props.objectName);
      if (savedOptions) {
        filterMode.value = savedOptions.mode || 'include';
        filterOperator.value = savedOptions.operator || 'AND';
      }
    });

    // Watchers
    watch(() => props.objectName, async (newObject) => {
      if (newObject) {
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
      filterMode,
      filterOperator,
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
