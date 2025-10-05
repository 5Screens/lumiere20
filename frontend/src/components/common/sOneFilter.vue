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
        <div class="s-one-filter__checkbox-items">
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
    tableName: {
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
      const columnConfig = props.availableColumns.find(col => col.column === column);
      
      emit('update', props.filter.id, {
        column: column,
        type: '',
        value: null
      });

      // Charger les options si nécessaire
      if (columnConfig && (columnConfig.type === 'checkbox' || columnConfig.type === 'select')) {
        loadOptions(column);
      }
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
              props.tableName,
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
        const values = await filterStore.loadFilterValues(props.tableName, column);
        
        if (selectedColumnConfig.value?.type === 'checkbox') {
          checkboxOptions.value = values || [];
        } else {
          selectOptions.value = values || [];
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

    // Watchers
    watch(() => props.filter.column, (newColumn) => {
      if (newColumn && selectedColumnConfig.value) {
        const type = selectedColumnConfig.value.type;
        if (type === 'checkbox' || type === 'select') {
          loadOptions(newColumn);
        }
      }
    });

    // Lifecycle
    onMounted(() => {
      if (props.filter.column && selectedColumnConfig.value) {
        const type = selectedColumnConfig.value.type;
        if (type === 'checkbox' || type === 'select') {
          loadOptions(props.filter.column);
        }
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
      updateColumn,
      updateType,
      updateValue,
      removeFilter,
      getTypeLabel,
      isChecked,
      handleCheckboxChange,
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
