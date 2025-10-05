<template>
  <!-- Si la valeur est un tableau, afficher un tag par élément -->
  <template v-if="Array.isArray(filter.value) && filter.value.length > 0">
    <div 
      v-for="(item, index) in filter.value" 
      :key="`${filter.id}-${index}`"
      class="s-filter-tag"
    >
      <span class="s-filter-tag__value">{{ item }}</span>
      <button 
        class="s-filter-tag__remove" 
        @click.stop="handleRemoveArrayItem(index)"
        :title="$t('filters.remove_filter')"
      >
        <i class="fas fa-times"></i>
      </button>
    </div>
  </template>
  
  <!-- Sinon, afficher un seul tag -->
  <div v-else class="s-filter-tag">
    <span class="s-filter-tag__value">{{ valueLabel }}</span>
    <button 
      class="s-filter-tag__remove" 
      @click.stop="handleRemove"
      :title="$t('filters.remove_filter')"
    >
      <i class="fas fa-times"></i>
    </button>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

export default {
  name: 'sFilterTag',
  props: {
    filter: {
      type: Object,
      required: true
    },
    columnConfig: {
      type: Object,
      required: true
    }
  },
  emits: ['remove', 'update-value'],
  setup(props, { emit }) {
    const { t } = useI18n();

    // Computed pour le libellé de la colonne
    const columnLabel = computed(() => {
      return t(props.columnConfig.label);
    });

    // Computed pour le libellé de l'opérateur
    const operatorLabel = computed(() => {
      const operatorMap = {
        // TEXT
        'contains': t('filters.type_text_contains'),
        'is': t('filters.type_text_is'),
        
        // NUMBER
        'equals': t('filters.type_number_equals'),
        'lt': t('filters.type_number_lt'),
        'lte': t('filters.type_number_lte'),
        'gt': t('filters.type_number_gt'),
        'gte': t('filters.type_number_gte'),
        'between': t('filters.type_number_between'),
        
        // DATE
        'on': t('filters.type_date_on'),
        'after': t('filters.type_date_after'),
        'on_or_after': t('filters.type_date_on_or_after'),
        'before': t('filters.type_date_before'),
        'on_or_before': t('filters.type_date_on_or_before'),
        
        // BOOLEAN
        'is_true': t('filters.type_boolean_is_true'),
        'is_false': t('filters.type_boolean_is_false'),
        
        // UUID
        'is_not': t('filters.type_uuid_is_not'),
        
        // NULL
        'is_null': t('filters.is_null'),
        'is_not_null': t('filters.is_not_null')
      };

      return operatorMap[props.filter.type] || props.filter.type;
    });

    // Computed pour le libellé de la valeur
    const valueLabel = computed(() => {
      const value = props.filter.value;
      
      // Opérateurs sans valeur - afficher le nom de l'opérateur
      if (['is_null', 'is_not_null', 'is_true', 'is_false'].includes(props.filter.type)) {
        const operatorLabels = {
          'is_null': t('filters.is_null'),
          'is_not_null': t('filters.is_not_null'),
          'is_true': t('filters.type_boolean_is_true'),
          'is_false': t('filters.type_boolean_is_false')
        };
        return operatorLabels[props.filter.type] || props.filter.type;
      }
      
      // Valeur null ou vide
      if (value === null || value === undefined || value === '') {
        return '';
      }
      
      // Tableau (multi-select)
      if (Array.isArray(value)) {
        if (value.length === 0) return '';
        if (value.length === 1) return value[0];
        return `${value.length} ${t('filters.selected_items')}`;
      }
      
      // Objet (date range)
      if (typeof value === 'object' && value !== null) {
        if (value.gte && value.lte) {
          return `${value.gte} - ${value.lte}`;
        }
        if (value.gte) {
          return `>= ${value.gte}`;
        }
        if (value.lte) {
          return `<= ${value.lte}`;
        }
        return '';
      }
      
      // Valeur simple
      return String(value);
    });

    // Méthode pour supprimer le filtre entier
    const handleRemove = () => {
      emit('remove', props.filter.id);
    };

    // Méthode pour supprimer une valeur spécifique d'un tableau
    const handleRemoveArrayItem = (index) => {
      if (!Array.isArray(props.filter.value)) return;
      
      // Créer un nouveau tableau sans l'élément à l'index spécifié
      const newValue = props.filter.value.filter((_, i) => i !== index);
      
      // Si le tableau est vide après suppression, supprimer le filtre entier
      if (newValue.length === 0) {
        emit('remove', props.filter.id);
      } else {
        // Sinon, mettre à jour la valeur du filtre
        emit('update-value', props.filter.id, newValue);
      }
    };

    return {
      columnLabel,
      operatorLabel,
      valueLabel,
      handleRemove,
      handleRemoveArrayItem
    };
  }
};
</script>

<style scoped>
@import '@/assets/styles/sFilterTag.css';
</style>
