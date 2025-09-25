<template>
  <div class="s-filter" :class="`s-filter--${config.type}`">
    <label class="s-filter__label">
      {{ config.label || config.column }}
      <span v-if="config.required" class="required">*</span>
    </label>

    <!-- Search Filter -->
    <div v-if="config.type === 'search'" class="s-filter__control">
      <div class="s-filter__search">
        <input
          type="text"
          :value="modelValue"
          :placeholder="config.placeholder || $t('filters.search_placeholder')"
          @input="handleSearchInput"
          class="s-filter__search-input"
        />
        <button 
          v-if="modelValue"
          @click="clearSearch"
          class="s-filter__search-clear"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>

    <!-- Checkbox Filter -->
    <div v-else-if="config.type === 'checkbox'" class="s-filter__control">
      <div class="s-filter__checkbox-list">
        <!-- Select All / None -->
        <div v-if="checkboxOptions.length > 5" class="s-filter__checkbox-actions">
          <button @click="selectAll" class="btn-link">
            {{ $t('filters.select_all') }}
          </button>
          <button @click="selectNone" class="btn-link">
            {{ $t('filters.select_none') }}
          </button>
        </div>

        <!-- Search in checkboxes if many items -->
        <input
          v-if="checkboxOptions.length > 10"
          v-model="checkboxSearch"
          type="text"
          :placeholder="$t('filters.search_in_list')"
          class="s-filter__checkbox-search"
        />

        <!-- Checkbox items -->
        <div class="s-filter__checkbox-items">
          <label 
            v-for="option in filteredCheckboxOptions" 
            :key="option.value"
            class="s-filter__checkbox-item"
          >
            <input
              type="checkbox"
              :value="option.value"
              :checked="isChecked(option.value)"
              @change="handleCheckboxChange(option.value, $event)"
            />
            <span>{{ option.label }}</span>
            <span v-if="option.count" class="count">({{ option.count }})</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Select Filter -->
    <div v-else-if="config.type === 'select'" class="s-filter__control">
      <select
        v-if="!config.multiple"
        :value="modelValue"
        @change="handleSelectChange"
        class="s-filter__select"
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

      <div v-else class="s-filter__multiselect">
        <div class="s-filter__multiselect-selected">
          <span v-if="!modelValue || modelValue.length === 0" class="placeholder">
            {{ $t('filters.select_multiple') }}
          </span>
          <span 
            v-for="val in modelValue" 
            :key="val"
            class="s-filter__multiselect-tag"
          >
            {{ getOptionLabel(val) }}
            <button @click="removeFromMultiselect(val)">
              <i class="fas fa-times"></i>
            </button>
          </span>
        </div>
        <select
          @change="handleMultiselectChange"
          class="s-filter__select"
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

    <!-- Date Range Filter -->
    <div v-else-if="config.type === 'date_range'" class="s-filter__control">
      <div class="s-filter__date-range">
        <div class="s-filter__date-field">
          <label>{{ $t('filters.from') }}</label>
          <input
            type="date"
            :value="modelValue?.gte || ''"
            @change="handleDateRangeChange('gte', $event)"
            class="s-filter__date-input"
          />
        </div>
        <div class="s-filter__date-field">
          <label>{{ $t('filters.to') }}</label>
          <input
            type="date"
            :value="modelValue?.lte || ''"
            @change="handleDateRangeChange('lte', $event)"
            class="s-filter__date-input"
          />
        </div>
      </div>

      <!-- Date presets -->
      <div v-if="config.presets" class="s-filter__date-presets">
        <button 
          v-for="preset in datePresets" 
          :key="preset.key"
          @click="applyDatePreset(preset)"
          class="btn-link"
        >
          {{ preset.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useFilterStore } from '@/stores/filterStore';
import { useI18n } from 'vue-i18n';

export default {
  name: 'sFilter',
  props: {
    config: {
      type: Object,
      required: true
    },
    value: {
      default: null
    },
    tableName: {
      type: String,
      required: true
    }
  },
  emits: ['update', 'load-values'],
  setup(props, { emit }) {
    const { t } = useI18n();
    const filterStore = useFilterStore();

    // État local
    const checkboxSearch = ref('');
    const selectOptions = ref([]);
    const checkboxOptions = ref([]);
    const searchDebounceTimer = ref(null);

    // Computed
    const modelValue = computed({
      get: () => props.value,
      set: (val) => emit('update', val)
    });

    const filteredCheckboxOptions = computed(() => {
      if (!checkboxSearch.value) {
        return checkboxOptions.value;
      }
      
      const search = checkboxSearch.value.toLowerCase();
      return checkboxOptions.value.filter(opt => 
        opt.label.toLowerCase().includes(search)
      );
    });

    const availableSelectOptions = computed(() => {
      if (!props.config.multiple || !modelValue.value) {
        return selectOptions.value;
      }
      
      return selectOptions.value.filter(opt => 
        !modelValue.value.includes(opt.value)
      );
    });

    const datePresets = computed(() => {
      const today = new Date();
      const presets = [
        {
          key: 'today',
          label: t('filters.today'),
          gte: today.toISOString().split('T')[0],
          lte: today.toISOString().split('T')[0]
        },
        {
          key: 'yesterday',
          label: t('filters.yesterday'),
          gte: new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0],
          lte: new Date(today.setDate(today.getDate())).toISOString().split('T')[0]
        },
        {
          key: 'last7days',
          label: t('filters.last_7_days'),
          gte: new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0],
          lte: new Date().toISOString().split('T')[0]
        },
        {
          key: 'last30days',
          label: t('filters.last_30_days'),
          gte: new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0],
          lte: new Date().toISOString().split('T')[0]
        },
        {
          key: 'thisMonth',
          label: t('filters.this_month'),
          gte: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
          lte: new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]
        }
      ];
      
      return presets;
    });

    // Méthodes
    const loadOptions = async () => {
      if (props.config.type === 'checkbox' || props.config.type === 'select') {
        try {
          const values = await filterStore.loadFilterValues(
            props.tableName,
            props.config.column
          );
          
          if (props.config.type === 'checkbox') {
            checkboxOptions.value = values || [];
          } else {
            selectOptions.value = values || [];
          }
        } catch (err) {
          console.error(`[sFilter] Error loading options for ${props.config.column}:`, err);
        }
      }
    };

    const handleSearchInput = (event) => {
      const value = event.target.value;
      
      // Debounce la recherche
      clearTimeout(searchDebounceTimer.value);
      searchDebounceTimer.value = setTimeout(() => {
        modelValue.value = value;
      }, 300);
    };

    const clearSearch = () => {
      modelValue.value = '';
    };

    const isChecked = (value) => {
      return Array.isArray(modelValue.value) && modelValue.value.includes(value);
    };

    const handleCheckboxChange = (value, event) => {
      const checked = event.target.checked;
      const currentValues = Array.isArray(modelValue.value) ? [...modelValue.value] : [];
      
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
      
      modelValue.value = currentValues;
    };

    const selectAll = () => {
      modelValue.value = filteredCheckboxOptions.value.map(opt => opt.value);
    };

    const selectNone = () => {
      modelValue.value = [];
    };

    const handleSelectChange = (event) => {
      modelValue.value = event.target.value || null;
    };

    const handleMultiselectChange = (event) => {
      const value = event.target.value;
      if (value) {
        const currentValues = Array.isArray(modelValue.value) ? [...modelValue.value] : [];
        if (!currentValues.includes(value)) {
          currentValues.push(value);
          modelValue.value = currentValues;
        }
        event.target.value = ''; // Reset select
      }
    };

    const removeFromMultiselect = (value) => {
      const currentValues = Array.isArray(modelValue.value) ? [...modelValue.value] : [];
      const index = currentValues.indexOf(value);
      if (index > -1) {
        currentValues.splice(index, 1);
        modelValue.value = currentValues;
      }
    };

    const getOptionLabel = (value) => {
      const option = selectOptions.value.find(opt => opt.value === value);
      return option ? option.label : value;
    };

    const handleDateRangeChange = (field, event) => {
      const value = event.target.value;
      const currentRange = modelValue.value || {};
      
      if (value) {
        currentRange[field] = value;
      } else {
        delete currentRange[field];
      }
      
      modelValue.value = Object.keys(currentRange).length > 0 ? currentRange : null;
    };

    const applyDatePreset = (preset) => {
      modelValue.value = {
        gte: preset.gte,
        lte: preset.lte
      };
    };

    // Lifecycle
    onMounted(() => {
      loadOptions();
    });

    // Watchers
    watch(() => props.config, () => {
      loadOptions();
    });

    return {
      modelValue,
      checkboxSearch,
      selectOptions,
      checkboxOptions,
      filteredCheckboxOptions,
      availableSelectOptions,
      datePresets,
      handleSearchInput,
      clearSearch,
      isChecked,
      handleCheckboxChange,
      selectAll,
      selectNone,
      handleSelectChange,
      handleMultiselectChange,
      removeFromMultiselect,
      getOptionLabel,
      handleDateRangeChange,
      applyDatePreset,
      t
    };
  }
};
</script>

<style scoped>
@import '@/assets/styles/sFilter.css';
</style>
