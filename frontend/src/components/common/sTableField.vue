<template>
  <div class="s-table-field">
    <!-- Label du composant -->
    <div class="s-table-field__label-container" v-if="label">
      <label :class="['s-table-field__label', { 's-table-field__label--required': required }]">
        {{ label }}
      </label>
      <span v-if="helperText" class="s-table-field__helper-text">
        {{ helperText }}
      </span>
    </div>

    <!-- Contenu du tableau -->
    <div class="s-table-field__content">
      <!-- Message si aucune donnée -->
      <div v-if="!items || items.length === 0" class="s-table-field__no-data">
        {{ noDataText || $t('common.no_data') }}
      </div>

      <!-- Tableau avec données -->
      <div v-else class="s-table-field__table-wrapper">
        <table class="s-table-field__table">
          <thead>
            <tr>
              <th v-for="column in visibleColumns" :key="column.key" class="s-table-field__header">
                {{ getColumnLabel(column) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in displayedItems" :key="item.uuid || index" class="s-table-field__row">
              <td v-for="column in visibleColumns" :key="column.key" class="s-table-field__cell">
                <div class="s-table-field__cell-content">
                  <!-- Format HTML -->
                  <div v-if="column.format === 'html'" v-html="formatCellValue(item[column.key], column)"></div>
                  
                  <!-- Format Date -->
                  <span v-else-if="column.format === 'date'">
                    {{ formatDate(item[column.key]) }}
                  </span>
                  
                  <!-- Format DateTime -->
                  <span v-else-if="column.format === 'datetime'">
                    {{ formatDateTime(item[column.key]) }}
                  </span>
                  
                  <!-- Format Boolean -->
                  <span v-else-if="column.format === 'boolean'" class="s-table-field__boolean">
                    <i v-if="item[column.key]" class="fas fa-check-circle s-table-field__boolean--true"></i>
                    <i v-else class="fas fa-times-circle s-table-field__boolean--false"></i>
                  </span>
                  
                  <!-- Format Tags -->
                  <div v-else-if="column.format === 'tags'" class="s-table-field__tags">
                    <span v-for="(tag, tagIndex) in (Array.isArray(item[column.key]) ? item[column.key] : [])" 
                          :key="tagIndex" 
                          class="s-table-field__tag">
                      {{ tag }}
                    </span>
                  </div>
                  
                  <!-- Format Status/Badge -->
                  <span v-else-if="column.format === 'badge'" 
                        :class="['s-table-field__badge', `s-table-field__badge--${item[column.key]}`]">
                    {{ item[column.key] }}
                  </span>
                  
                  <!-- Format par défaut (texte) -->
                  <span v-else :title="item[column.key]">
                    {{ truncateText(item[column.key], column.maxLength || 50) }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination si nécessaire -->
      <div v-if="showPagination && totalPages > 1" class="s-table-field__pagination">
        <button 
          @click="currentPage = 1" 
          :disabled="currentPage === 1"
          class="s-table-field__pagination-btn"
        >
          <i class="fas fa-angle-double-left"></i>
        </button>
        <button 
          @click="currentPage--" 
          :disabled="currentPage === 1"
          class="s-table-field__pagination-btn"
        >
          <i class="fas fa-angle-left"></i>
        </button>
        
        <span class="s-table-field__pagination-info">
          {{ currentPage }} / {{ totalPages }}
        </span>
        
        <button 
          @click="currentPage++" 
          :disabled="currentPage === totalPages"
          class="s-table-field__pagination-btn"
        >
          <i class="fas fa-angle-right"></i>
        </button>
        <button 
          @click="currentPage = totalPages" 
          :disabled="currentPage === totalPages"
          class="s-table-field__pagination-btn"
        >
          <i class="fas fa-angle-double-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Props
const props = defineProps({
  // Valeur v-model (tableau d'objets)
  modelValue: {
    type: Array,
    default: () => []
  },
  
  // Label du champ
  label: {
    type: String,
    default: null
  },
  
  // Texte d'aide
  helperText: {
    type: String,
    default: null
  },
  
  // Champ requis
  required: {
    type: Boolean,
    default: false
  },
  
  // Configuration des colonnes
  columns: {
    type: Array,
    default: () => []
  },
  
  // Nombre d'éléments par page
  itemsPerPage: {
    type: Number,
    default: 5
  },
  
  // Afficher la pagination
  showPagination: {
    type: Boolean,
    default: true
  },
  
  // Texte à afficher si aucune donnée
  noDataText: {
    type: String,
    default: null
  },
  
  // Hauteur maximale du tableau (en pixels)
  maxHeight: {
    type: Number,
    default: 300
  }
});

// État local
const currentPage = ref(1);

// Computed
const items = computed(() => {
  return props.modelValue || [];
});

const visibleColumns = computed(() => {
  if (props.columns && props.columns.length > 0) {
    return props.columns.filter(col => col.visible !== false);
  }
  
  // Si aucune colonne n'est définie, générer automatiquement depuis les données
  if (items.value.length > 0) {
    const firstItem = items.value[0];
    return Object.keys(firstItem)
      .filter(key => key !== 'uuid' && !key.startsWith('_'))
      .map(key => ({
        key,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        visible: true
      }));
  }
  
  return [];
});

const totalPages = computed(() => {
  if (!props.showPagination) return 1;
  return Math.ceil(items.value.length / props.itemsPerPage);
});

const displayedItems = computed(() => {
  if (!props.showPagination) {
    return items.value;
  }
  
  const start = (currentPage.value - 1) * props.itemsPerPage;
  const end = start + props.itemsPerPage;
  return items.value.slice(start, end);
});

// Watchers
watch(() => items.value, () => {
  // Réinitialiser la page si les données changent
  currentPage.value = 1;
});

// Méthodes
const getColumnLabel = (column) => {
  if (column.label) {
    // Si le label commence par un chemin de traduction, le traduire
    if (column.label.includes('.')) {
      return t(column.label);
    }
    return column.label;
  }
  return column.key;
};

const formatCellValue = (value, column) => {
  if (value === null || value === undefined) {
    return '-';
  }
  return value;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  } catch {
    return dateString;
  }
};

const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  } catch {
    return dateString;
  }
};

const truncateText = (text, maxLength) => {
  if (!text) return '-';
  const str = String(text);
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
};
</script>

<style scoped>
@import '@/assets/styles/sTableField.css';
</style>
