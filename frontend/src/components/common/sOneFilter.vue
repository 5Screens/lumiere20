<template>
  <div class="s-one-filter">
    <!-- Libellé et bouton de suppression -->
    <div class="s-one-filter__actions">
      <span class="s-one-filter__label">{{ $t('filters.title_2') }} {{ filterNumber }}</span>
      <button 
        @click="removeFilter"
        class="btn-remove"
        :title="$t('filters.remove_filter')"
      >
        <i class="fas fa-trash"></i>
      </button>
    </div>

    <!-- Sélecteur de colonne -->
    <div class="s-one-filter__column">
      <select 
        :value="filter.column"
        @change="updateColumn"
        class="s-one-filter__select"
      >
        <option value="">{{ $t('filters.select_column') }}</option>
        <option 
          v-for="column in availableColumns" 
          :key="column.column"
          :value="column.column"
        >
          {{ $t(column.label) }}
        </option>
      </select>
    </div>

    <!-- Sélecteur de type (si colonne sélectionnée) -->
    <div v-if="filter.column && selectedColumnConfig" class="s-one-filter__type">
      <select 
        :value="filter.type"
        @change="updateType"
        class="s-one-filter__select"
      >
        <option value="">{{ $t('filters.select_type') }}</option>
        <option 
          v-for="typeOption in availableFilterTypes" 
          :key="typeOption.value"
          :value="typeOption.value"
        >
          {{ $t(typeOption.label) }}
        </option>
      </select>
    </div>

    <!-- Champ de valeur (si type sélectionné et pas is_null/is_not_null) -->
    <div v-if="filter.column && filter.type && shouldShowValueField" class="s-one-filter__value">
      
      <!-- Search Filter -->
      <div v-if="selectedColumnConfig.type === 'search'" class="s-one-filter__search">
        <input
          type="text"
          :value="filter.value || ''"
          :placeholder="$t('filters.search_placeholder')"
          @input="updateValue($event.target.value)"
          @keydown.enter="handleEnterKey"
          @focus="showSearchSuggestions = true"
          @blur="hideSearchSuggestions"
          class="s-one-filter__input"
        />
        
        <!-- Search suggestions dropdown -->
        <div 
          v-if="showSearchSuggestions && searchSuggestions.length > 0" 
          class="s-one-filter__suggestions"
        >
          <div 
            v-for="suggestion in searchSuggestions" 
            :key="suggestion.value"
            @mousedown="selectSearchSuggestion(suggestion.value)"
            class="s-one-filter__suggestion"
          >
            {{ suggestion.label }}
          </div>
        </div>
      </div>

      <!-- Checkbox Filter -->
      <div v-else-if="selectedColumnConfig.type === 'checkbox'" class="s-one-filter__checkbox">
        <!-- Conteneur pour l'input de recherche (reste fixe) -->
        <div v-if="selectedColumnConfig.form_lazy_search" class="s-one-filter__checkbox-search-container">
          <input
            type="text"
            v-model="checkboxSearchQuery"
            :placeholder="$t('filters.search_in_list')"
            @input="handleCheckboxSearch"
            class="s-one-filter__input s-one-filter__input--search"
          />
        </div>
        
        <!-- Conteneur scrollable pour la liste des checkboxes -->
        <div 
          class="s-one-filter__checkbox-items"
          :class="{ 's-one-filter__checkbox-items--scrollable': selectedColumnConfig.form_lazy_search }"
          @scroll="handleCheckboxScroll"
          ref="checkboxContainer"
        >
          <label 
            v-for="option in checkboxOptions" 
            :key="option.value"
            class="s-one-filter__checkbox-item"
          >
            <input
              type="checkbox"
              :value="option.value"
              :checked="isChecked(option.value)"
              @change="handleCheckboxChange(option.value, $event)"
            />
            <span>{{ option.label }}</span>
          </label>
          
          <!-- Loading more indicator -->
          <div v-if="isLoadingMore" class="s-one-filter__loading-more">
            <span>Chargement...</span>
          </div>
        </div>
      </div>

      <!-- Select Filter -->
      <div v-else-if="selectedColumnConfig.type === 'select'" class="s-one-filter__select-wrapper">
        <select
          v-if="!selectedColumnConfig.multiple"
          :value="filter.value || ''"
          @change="updateValue($event.target.value)"
          class="s-one-filter__select"
        >
          <option value="">{{ $t('filters.select_option') }}</option>
          <option 
            v-for="option in selectOptions" 
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>

        <div v-else class="s-one-filter__multiselect">
          <div class="s-one-filter__multiselect-selected">
            <span v-if="!filter.value || filter.value.length === 0" class="placeholder">
              {{ $t('filters.select_multiple') }}
            </span>
            <span 
              v-for="val in (filter.value || [])" 
              :key="val"
              class="s-one-filter__multiselect-tag"
            >
              {{ getOptionLabel(val) }}
              <button @click="removeFromMultiselect(val)">
                <i class="fas fa-times"></i>
              </button>
            </span>
          </div>
          <select
            @change="handleMultiselectChange"
            class="s-one-filter__select"
          >
            <option value="">{{ $t('filters.add_option') }}</option>
            <option 
              v-for="option in availableSelectOptions" 
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- DateTime Filter -->
      <div v-else-if="selectedColumnConfig.type === 'datetime'" class="s-one-filter__datetime">
        <!-- Si between : deux champs -->
        <template v-if="filter.type === 'between'">
          <div class="s-one-filter__date-field">
            <label>{{ $t('filters.from') }}</label>
            <input
              type="datetime-local"
              :value="(filter.value && filter.value.gte) || ''"
              @change="handleDateRangeChange('gte', $event)"
              class="s-one-filter__input"
            />
          </div>
          <div class="s-one-filter__date-field">
            <label>{{ $t('filters.to') }}</label>
            <input
              type="datetime-local"
              :value="(filter.value && filter.value.lte) || ''"
              @change="handleDateRangeChange('lte', $event)"
              class="s-one-filter__input"
            />
          </div>
        </template>
        <!-- Sinon : un seul champ -->
        <template v-else>
          <input
            type="datetime-local"
            :value="filter.value || ''"
            @change="updateValue($event.target.value)"
            @keydown.enter="handleEnterKey"
            class="s-one-filter__input"
          />
        </template>
      </div>

      <!-- Date Range Filter -->
      <div v-else-if="selectedColumnConfig.type === 'date_range'" class="s-one-filter__date-range">
        <!-- Si between : deux champs -->
        <template v-if="filter.type === 'between'">
          <div class="s-one-filter__date-field">
            <label>{{ $t('filters.from') }}</label>
            <input
              type="date"
              :value="(filter.value && filter.value.gte) || ''"
              @change="handleDateRangeChange('gte', $event)"
              class="s-one-filter__input"
            />
          </div>
          <div class="s-one-filter__date-field">
            <label>{{ $t('filters.to') }}</label>
            <input
              type="date"
              :value="(filter.value && filter.value.lte) || ''"
              @change="handleDateRangeChange('lte', $event)"
              class="s-one-filter__input"
            />
          </div>
        </template>
        <!-- Sinon : un seul champ -->
        <template v-else>
          <input
            type="date"
            :value="filter.value || ''"
            @change="updateValue($event.target.value)"
            @keydown.enter="handleEnterKey"
            class="s-one-filter__input"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';
import { useFilterStore } from '@/stores/filterStore';
import { useI18n } from 'vue-i18n';
import { DEBOUNCE_DELAY_MS } from '@/config/config';

export default {
  name: 'sOneFilter',
  props: {
    filter: {
      type: Object,
      required: true
    },
    filterNumber: {
      type: Number,
      required: true
    },
    objectName: {
      type: String,
      required: true
    },
    availableColumns: {
      type: Array,
      required: true
    }
  },
  emits: ['update', 'remove', 'apply-filters'],
  setup(props, { emit }) {
    const { t } = useI18n();
    const filterStore = useFilterStore();

    // État local
    const searchSuggestions = ref([]);
    const showSearchSuggestions = ref(false);
    const checkboxOptions = ref([]);
    const selectOptions = ref([]);
    const searchSuggestionsTimer = ref(null);
    const checkboxSearchQuery = ref('');
    const checkboxSearchTimer = ref(null);
    
    // Infinite scroll pour les checkboxes
    const currentPage = ref(1);
    const hasMore = ref(true);
    const isLoadingMore = ref(false);

    // Computed
    const selectedColumnConfig = computed(() => {
      return props.availableColumns.find(col => col.column === props.filter.column);
    });

    const availableSelectOptions = computed(() => {
      if (!selectedColumnConfig.value?.multiple || !props.filter.value) {
        return selectOptions.value;
      }
      
      return selectOptions.value.filter(opt => 
        !props.filter.value.includes(opt.value)
      );
    });

    // Computed pour savoir si on doit afficher le champ de valeur
    const shouldShowValueField = computed(() => {
      console.log('[sOneFilter] shouldShowValueField check:', {
        filter_column: props.filter.column,
        filter_type: props.filter.type,
        selectedColumnConfig: selectedColumnConfig.value,
        filter_type_from_config: selectedColumnConfig.value?.filter_type,
        type_from_config: selectedColumnConfig.value?.type,
        all_keys: selectedColumnConfig.value ? Object.keys(selectedColumnConfig.value) : []
      });
      
      // Ne pas afficher si is_null ou is_not_null
      if (props.filter.type === 'is_null' || props.filter.type === 'is_not_null') {
        console.log('[sOneFilter] shouldShowValueField = false (is_null/is_not_null)');
        return false;
      }
      // Ne pas afficher si is_true ou is_false (boolean)
      if (props.filter.type === 'is_true' || props.filter.type === 'is_false') {
        console.log('[sOneFilter] shouldShowValueField = false (is_true/is_false)');
        return false;
      }
      console.log('[sOneFilter] shouldShowValueField = true');
      return true;
    });

    // Computed pour les types de filtres disponibles selon le data_type
    const availableFilterTypes = computed(() => {
      if (!selectedColumnConfig.value?.data_type) {
        return [];
      }

      const dataType = selectedColumnConfig.value.data_type.toUpperCase();
      const types = [];

      // TEXT / STRING
      if (['TEXT', 'STRING', 'VARCHAR', 'CHAR'].includes(dataType)) {
        types.push(
          { value: 'contains', label: 'filters.type_text_contains' },
          { value: 'is', label: 'filters.type_text_is' },
          { value: 'is_null', label: 'filters.is_null' },
          { value: 'is_not_null', label: 'filters.is_not_null' }
        );
      }
      // NUMBER / INTEGER / NUMERIC
      else if (['NUMBER', 'INTEGER', 'NUMERIC', 'INT', 'BIGINT', 'SMALLINT', 'DECIMAL', 'FLOAT', 'DOUBLE'].includes(dataType)) {
        types.push(
          { value: 'equals', label: 'filters.type_number_equals' },
          { value: 'lt', label: 'filters.type_number_lt' },
          { value: 'lte', label: 'filters.type_number_lte' },
          { value: 'gt', label: 'filters.type_number_gt' },
          { value: 'gte', label: 'filters.type_number_gte' },
          { value: 'between', label: 'filters.type_number_between' },
          { value: 'is_null', label: 'filters.is_null' },
          { value: 'is_not_null', label: 'filters.is_not_null' }
        );
      }
      // DATE / TIMESTAMP / DATETIME
      else if (['DATE', 'TIMESTAMP', 'DATETIME', 'TIMESTAMPTZ'].includes(dataType)) {
        types.push(
          { value: 'on', label: 'filters.type_date_on' },
          { value: 'after', label: 'filters.type_date_after' },
          { value: 'on_or_after', label: 'filters.type_date_on_or_after' },
          { value: 'before', label: 'filters.type_date_before' },
          { value: 'on_or_before', label: 'filters.type_date_on_or_before' },
          { value: 'between', label: 'filters.type_date_between' },
          { value: 'is_null', label: 'filters.is_null' },
          { value: 'is_not_null', label: 'filters.is_not_null' }
        );
      }
      // BOOLEAN / BOOL
      else if (['BOOLEAN', 'BOOL'].includes(dataType)) {
        types.push(
          { value: 'is_true', label: 'filters.type_boolean_is_true' },
          { value: 'is_false', label: 'filters.type_boolean_is_false' },
          { value: 'is_null', label: 'filters.is_null' },
          { value: 'is_not_null', label: 'filters.is_not_null' }
        );
      }
      // UUID
      else if (['UUID'].includes(dataType)) {
        types.push(
          { value: 'is', label: 'filters.type_uuid_is' },
          { value: 'is_not', label: 'filters.type_uuid_is_not' },
          { value: 'is_null', label: 'filters.is_null' },
          { value: 'is_not_null', label: 'filters.is_not_null' }
        );
      }

      return types;
    });

    // Méthodes
    const updateColumn = (event) => {
      const column = event.target.value;
      
      emit('update', props.filter.id, {
        column: column,
        type: '',
        value: null
      });

      // Ne pas charger les options ici car le watch s'en charge déjà
      // Cela évite un double appel à loadOptions
    };

    const updateType = (event) => {
      const type = event.target.value;
      const newType = event.target.value;
      
      // Déterminer si on doit préserver la valeur actuelle
      const noValueOperators = ['is_null', 'is_not_null', 'is_true', 'is_false'];
      const wasNoValueOperator = noValueOperators.includes(props.filter.type);
      const isNoValueOperator = noValueOperators.includes(newType);
      
      let newValue;
      
      if (isNoValueOperator) {
        // Si le nouveau type ne nécessite pas de valeur, mettre null
        newValue = null;
      } else if (wasNoValueOperator) {
        // Si l'ancien type ne nécessitait pas de valeur, initialiser avec une valeur par défaut
        newValue = getDefaultValueForType(newType);
      } else {
        // Sinon, préserver la valeur actuelle si elle est compatible
        newValue = props.filter.value;
      }
      
      emit('update', props.filter.id, {
        type: newType,
        value: newValue
      });
    };

    const updateValue = (value) => {
      emit('update', props.filter.id, { value });

      // Pour les filtres de recherche, charger les suggestions
      if (props.filter.type === 'search' && value && value.length >= 2) {
        clearTimeout(searchSuggestionsTimer.value);
        searchSuggestionsTimer.value = setTimeout(async () => {
          try {
            const suggestions = await filterStore.loadFilterValues(
              props.objectName,
              props.filter.column,
              value
            );
            searchSuggestions.value = suggestions || [];
            showSearchSuggestions.value = true;
          } catch (err) {
            console.error(`[sOneFilter] Error loading search suggestions:`, err);
            searchSuggestions.value = [];
          }
        }, 300);
      }
    };

    const removeFilter = () => {
      emit('remove', props.filter.id);
    };

    const getDefaultValueForType = (type) => {
      switch (type) {
        case 'checkbox':
        case 'select':
          return selectedColumnConfig.value?.multiple ? [] : null;
        case 'date_range':
          return { gte: null, lte: null };
        case 'search':
        default:
          return '';
      }
    };

    const getTypeLabel = (type) => {
      // Cette fonction n'est plus utilisée mais conservée pour compatibilité
      return type;
    };

    const loadOptions = async (column) => {
      try {
        // Réinitialiser la pagination pour le chargement initial
        currentPage.value = 1;
        hasMore.value = true;
        
        const result = await filterStore.loadFilterValues(props.objectName, column, null, 1);
        const values = result.values || result || [];
        const pagination = result.pagination;
        
        if (selectedColumnConfig.value?.type === 'checkbox') {
          checkboxOptions.value = values;
          
          // Mettre à jour l'état de pagination
          if (pagination) {
            currentPage.value = pagination.page;
            hasMore.value = pagination.hasMore;
          }
        } else {
          selectOptions.value = values;
        }
      } catch (err) {
        console.error(`[sOneFilter] Error loading options for ${column}:`, err);
      }
    };

    // Méthodes pour checkbox
    const isChecked = (value) => {
      return Array.isArray(props.filter.value) && props.filter.value.includes(value);
    };

    const handleCheckboxChange = (value, event) => {
      const checked = event.target.checked;
      const currentValues = Array.isArray(props.filter.value) ? [...props.filter.value] : [];
      
      if (checked) {
        if (!currentValues.includes(value)) {
          currentValues.push(value);
        }
      } else {
        const index = currentValues.indexOf(value);
        if (index > -1) {
          currentValues.splice(index, 1);
        }
      }
      
      emit('update', props.filter.id, { value: currentValues });
    };

    // Infinite scroll pour les checkboxes
    const handleCheckboxScroll = (event) => {
      console.info(`[sOneFilter] 📜 Scroll event detected`);
      
      if (!selectedColumnConfig.value?.form_lazy_search) {
        console.info(`[sOneFilter] ❌ form_lazy_search is false, ignoring scroll`);
        return;
      }
      
      const { scrollTop, scrollHeight, clientHeight } = event.target;
      const threshold = 50; // pixels avant le bas
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      console.info(`[sOneFilter] 📊 Scroll metrics:`, {
        scrollTop,
        scrollHeight,
        clientHeight,
        distanceFromBottom,
        threshold,
        hasMore: hasMore.value,
        isLoadingMore: isLoadingMore.value,
        currentPage: currentPage.value,
        checkboxOptionsLength: checkboxOptions.value.length
      });
      
      // Vérifier si l'utilisateur a scrollé près du bas
      if (distanceFromBottom < threshold) {
        console.info(`[sOneFilter] ✅ Near bottom! Triggering loadMore...`);
        loadMoreCheckboxes();
      } else {
        console.info(`[sOneFilter] ⏸️ Not near bottom yet (${distanceFromBottom}px remaining)`);
      }
    };

    const loadMoreCheckboxes = async () => {
      console.info(`[sOneFilter] 🔄 loadMoreCheckboxes called`, {
        form_lazy_search: selectedColumnConfig.value?.form_lazy_search,
        hasMore: hasMore.value,
        isLoadingMore: isLoadingMore.value,
        currentPage: currentPage.value
      });
      
      if (!selectedColumnConfig.value?.form_lazy_search) {
        console.warn(`[sOneFilter] ⚠️ Skipping: form_lazy_search is false`);
        return;
      }
      
      if (!hasMore.value) {
        console.warn(`[sOneFilter] ⚠️ Skipping: no more data (hasMore=false)`);
        return;
      }
      
      if (isLoadingMore.value) {
        console.warn(`[sOneFilter] ⚠️ Skipping: already loading`);
        return;
      }
      
      isLoadingMore.value = true;
      console.info(`[sOneFilter] 🚀 Starting to load page ${currentPage.value + 1}`);
      
      try {
        const result = await filterStore.loadFilterValues(
          props.objectName,
          props.filter.column,
          checkboxSearchQuery.value || null,
          currentPage.value + 1
        );
        
        const values = result.values || result || [];
        const pagination = result.pagination;
        
        console.info(`[sOneFilter] ✅ Received ${values?.length || 0} more values`, {
          pagination,
          currentOptionsLength: checkboxOptions.value.length
        });
        
        // Ajouter les nouvelles options aux existantes
        const oldLength = checkboxOptions.value.length;
        checkboxOptions.value = [...checkboxOptions.value, ...values];
        console.info(`[sOneFilter] 📊 Options updated: ${oldLength} → ${checkboxOptions.value.length}`);
        
        // Mettre à jour l'état de pagination
        if (pagination) {
          currentPage.value = pagination.page;
          hasMore.value = pagination.hasMore;
          console.info(`[sOneFilter] 📄 Pagination updated: page=${currentPage.value}, hasMore=${hasMore.value}`);
        }
      } catch (err) {
        console.error(`[sOneFilter] ❌ Error loading more checkbox options:`, err);
      } finally {
        isLoadingMore.value = false;
        console.info(`[sOneFilter] ✅ loadMoreCheckboxes completed`);
      }
    };

    // Recherche dans les checkboxes avec debounce
    const handleCheckboxSearch = () => {
      // Annuler le timer précédent
      if (checkboxSearchTimer.value) {
        clearTimeout(checkboxSearchTimer.value);
      }

      // Réinitialiser la pagination
      currentPage.value = 1;
      hasMore.value = true;

      // Créer un nouveau timer avec debounce
      checkboxSearchTimer.value = setTimeout(async () => {
        try {
          console.info(`[sOneFilter] 🔍 Searching checkboxes with query: "${checkboxSearchQuery.value}"`);
          console.info(`[sOneFilter] Current checkboxOptions length BEFORE: ${checkboxOptions.value.length}`);
          
          // Recharger les valeurs avec le critère de recherche (page 1)
          const result = await filterStore.loadFilterValues(
            props.objectName,
            props.filter.column,
            checkboxSearchQuery.value || null,
            1
          );
          
          const values = result.values || result || [];
          const pagination = result.pagination;
          
          console.info(`[sOneFilter] ✅ Received ${values?.length || 0} values from API`);
          console.info(`[sOneFilter] Pagination:`, pagination);
          console.info(`[sOneFilter] First 3 values:`, values?.slice(0, 3));
          
          // Remplacer les options (pas append car c'est une nouvelle recherche)
          checkboxOptions.value = values;
          
          // Mettre à jour l'état de pagination
          if (pagination) {
            currentPage.value = pagination.page;
            hasMore.value = pagination.hasMore;
          }
          
          console.info(`[sOneFilter] Current checkboxOptions length AFTER: ${checkboxOptions.value.length}`);
          console.info(`[sOneFilter] hasMore: ${hasMore.value}, currentPage: ${currentPage.value}`);
        } catch (err) {
          console.error(`[sOneFilter] ❌ Error loading filtered checkbox options:`, err);
          checkboxOptions.value = [];
        }
      }, DEBOUNCE_DELAY_MS);
    };

    // Méthodes pour select multiple
    const handleMultiselectChange = (event) => {
      const value = event.target.value;
      if (value) {
        const currentValues = Array.isArray(props.filter.value) ? [...props.filter.value] : [];
        if (!currentValues.includes(value)) {
          currentValues.push(value);
          emit('update', props.filter.id, { value: currentValues });
        }
        event.target.value = ''; // Reset select
      }
    };

    const removeFromMultiselect = (value) => {
      const currentValues = Array.isArray(props.filter.value) ? [...props.filter.value] : [];
      const index = currentValues.indexOf(value);
      if (index > -1) {
        currentValues.splice(index, 1);
        emit('update', props.filter.id, { value: currentValues });
      }
    };

    const getOptionLabel = (value) => {
      const option = selectOptions.value.find(opt => opt.value === value);
      return option ? option.label : value;
    };

    // Méthodes pour date range
    const handleDateRangeChange = (field, event) => {
      const value = event.target.value;
      const currentRange = props.filter.value || {};
      
      if (value) {
        currentRange[field] = value;
      } else {
        delete currentRange[field];
      }
      
      emit('update', props.filter.id, { 
        value: Object.keys(currentRange).length > 0 ? currentRange : null 
      });
    };

    // Méthodes pour search suggestions
    const selectSearchSuggestion = (value) => {
      emit('update', props.filter.id, { value });
      searchSuggestions.value = [];
      showSearchSuggestions.value = false;
    };

    const hideSearchSuggestions = () => {
      setTimeout(() => {
        showSearchSuggestions.value = false;
      }, 200);
    };

    const handleEnterKey = () => {
      emit('apply-filters');
    };

    // Variable pour éviter le double chargement au montage
    let isMounted = false;

    // Watchers
    watch(() => props.filter.column, (newColumn, oldColumn) => {
      // Ne charger que si la colonne a vraiment changé et que le composant est déjà monté
      if (isMounted && newColumn && newColumn !== oldColumn && selectedColumnConfig.value) {
        const type = selectedColumnConfig.value.type;
        if (type === 'checkbox' || type === 'select') {
          loadOptions(newColumn);
        }
      }
    });

    // Ref pour le conteneur scrollable
    const checkboxContainer = ref(null);

    // Lifecycle
    onMounted(() => {
      if (props.filter.column && selectedColumnConfig.value) {
        const type = selectedColumnConfig.value.type;
        if (type === 'checkbox' || type === 'select') {
          loadOptions(props.filter.column);
        }
      }
      // Marquer comme monté après le premier chargement
      isMounted = true;
      
      // Debug: Vérifier si le conteneur scrollable existe
      console.info(`[sOneFilter] 🔧 Component mounted, checking scroll container...`);
      console.info(`[sOneFilter] selectedColumnConfig:`, selectedColumnConfig.value);
      console.info(`[sOneFilter] form_lazy_search:`, selectedColumnConfig.value?.form_lazy_search);
      console.info(`[sOneFilter] checkboxContainer.value:`, checkboxContainer.value);
      
      // Ajouter un listener natif pour le scroll si form_lazy_search est activé
      if (selectedColumnConfig.value?.form_lazy_search && checkboxContainer.value) {
        console.info(`[sOneFilter] ✅ Adding native scroll listener to container`);
        checkboxContainer.value.addEventListener('scroll', handleCheckboxScroll);
      }
    });

    return {
      selectedColumnConfig,
      searchSuggestions,
      showSearchSuggestions,
      checkboxOptions,
      selectOptions,
      availableSelectOptions,
      availableFilterTypes,
      shouldShowValueField,
      checkboxSearchQuery,
      isLoadingMore,
      checkboxContainer,
      updateColumn,
      updateType,
      updateValue,
      removeFilter,
      getTypeLabel,
      isChecked,
      handleCheckboxChange,
      handleCheckboxSearch,
      handleCheckboxScroll,
      handleMultiselectChange,
      removeFromMultiselect,
      getOptionLabel,
      handleDateRangeChange,
      selectSearchSuggestion,
      hideSearchSuggestions,
      handleEnterKey,
      t
    };
  }
};
</script>

<style scoped>
@import '@/assets/styles/sOneFilter.css';
</style>
