import { defineStore } from 'pinia';
import apiService from '@/services/apiService';

export const useFilterStore = defineStore('filter', {
  state: () => ({
    // Configuration des filtres par table
    filterConfigs: {},
    
    // Valeurs actuelles des filtres par table
    activeFilters: {},
    
    // Cache des valeurs possibles pour les filtres
    filterValues: {},
    
    // État de chargement
    loading: {
      config: false,
      values: false,
      search: false
    },
    
    // État collapsed/expanded du panneau par table
    panelStates: {},
    
    // Erreurs
    errors: {}
  }),

  getters: {
    // Obtenir la configuration pour une table
    getConfigForTable: (state) => (tableName) => {
      return state.filterConfigs[tableName] || null;
    },
    
    // Obtenir les filtres actifs pour une table (nouveau format tableau)
    getActiveFiltersForTable: (state) => (tableName) => {
      return state.activeFilters[tableName] || [];
    },
    
    // Compter le nombre de filtres actifs
    getActiveFilterCount: (state) => (tableName) => {
      const filters = state.activeFilters[tableName] || [];
      return filters.filter(filter => {
        const value = filter.value;
        if (value === null || value === undefined || value === '') {
          return false;
        }
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        if (typeof value === 'object' && value !== null) {
          // Pour les objets date_range, vérifier que gte ou lte ont des valeurs
          return (value.gte && value.gte !== '') || (value.lte && value.lte !== '');
        }
        return true;
      }).length;
    },
    
    // Obtenir l'état du panneau pour une table
    getPanelState: (state) => (tableName) => {
      return state.panelStates[tableName] || false;
    }
  },

  actions: {
    // Charger la configuration des filtres pour une table
    async loadFilterConfig(tableName) {
      this.loading.config = true;
      this.errors[tableName] = null;
      
      try {
        console.info(`[FILTER_STORE] Loading filter config for table: ${tableName}`);
        
        const response = await apiService.get(`table_metadata/filter_config/${tableName}`);
        
        if (response && typeof response === 'object') {
          // Convertir l'objet de configuration en tableau de filtres
          const filtersArray = Object.keys(response).map(column => ({
            column: column,
            label: response[column].label || column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            ...response[column]
          }));
          
          this.filterConfigs[tableName] = filtersArray;
          
          // Initialiser les filtres actifs si pas déjà fait (nouveau format tableau)
          if (!this.activeFilters[tableName]) {
            this.activeFilters[tableName] = [];
          }
          
          // Charger depuis localStorage si disponible
          this.loadFiltersFromStorage(tableName);
          
          console.info(`[FILTER_STORE] Filter config loaded successfully for ${tableName}:`, filtersArray);
          return filtersArray;
        }
      } catch (error) {
        console.error(`[FILTER_STORE] Error loading filter config for ${tableName}:`, error);
        this.errors[tableName] = error.message || 'Failed to load filter configuration';
        throw error;
      } finally {
        this.loading.config = false;
      }
    },
    
    // Initialiser les filtres avec des valeurs par défaut
    initializeFilters(filterConfig) {
      const filters = {};
      
      filterConfig.forEach(filter => {
        switch (filter.type) {
          case 'checkbox':
          case 'select':
            filters[filter.column] = filter.multiple ? [] : null;
            break;
          case 'date_range':
            filters[filter.column] = { gte: null, lte: null };
            break;
          case 'search':
          default:
            filters[filter.column] = '';
            break;
        }
      });
      
      return filters;
    },
    
    // Charger les valeurs possibles pour un filtre
    async loadFilterValues(tableName, columnName, searchQuery = null) {
      const cacheKey = `${tableName}_${columnName}`;
      this.loading.values = true;
      
      try {
        console.info(`[FILTER_STORE] Loading filter values for ${tableName}.${columnName}`);
        
        // Construire l'endpoint selon le format de la table
        const endpoint = tableName.includes('.') 
          ? tableName.split('.')[1] // Extraire le nom de la table sans le schéma
          : tableName;
        
        const url = `${endpoint}/filters/${columnName}`;
        const params = searchQuery ? { q: searchQuery } : {};
        
        const response = await apiService.get(url, params);
        
        if (!this.filterValues[tableName]) {
          this.filterValues[tableName] = {};
        }
        
        this.filterValues[tableName][columnName] = response;
        
        console.info(`[FILTER_STORE] Filter values loaded for ${columnName}: ${response.length} items`);
        return response;
      } catch (error) {
        console.error(`[FILTER_STORE] Error loading filter values for ${columnName}:`, error);
        throw error;
      } finally {
        this.loading.values = false;
      }
    },
    
    // Appliquer les filtres et rechercher
    async applyFilters(tableName, filters = null, sort = null, pagination = null) {
      this.loading.search = true;
      
      try {
        // Utiliser les filtres fournis ou les filtres actifs
        const filtersToApply = filters || this.activeFilters[tableName] || {};
        
        // Sauvegarder les filtres actifs
        if (filters) {
          this.activeFilters[tableName] = filters;
          this.saveFiltersToStorage(tableName);
        }
        
        console.info(`[FILTER_STORE] Applying filters for ${tableName}:`, filtersToApply);
        
        // Construire les paramètres de requête
        const queryParams = this.buildQueryParams(filtersToApply, sort, pagination);
        
        // Déterminer si on doit utiliser POST ou GET
        const hasDateRange = Object.values(filtersToApply).some(
          value => value && typeof value === 'object' && (value.gte || value.lte)
        );
        
        const endpoint = tableName.includes('.') 
          ? tableName.split('.')[1]
          : tableName;
        
        let response;
        if (hasDateRange) {
          // Utiliser POST pour les filtres complexes
          response = await apiService.post(`${endpoint}/search`, {
            filters: filtersToApply,
            sort,
            pagination
          });
        } else {
          // Utiliser GET pour les filtres simples
          response = await apiService.get(endpoint, { params: queryParams });
        }
        
        console.info(`[FILTER_STORE] Search completed, ${response.data?.length || 0} results`);
        return response;
      } catch (error) {
        console.error(`[FILTER_STORE] Error applying filters:`, error);
        throw error;
      } finally {
        this.loading.search = false;
      }
    },
    
    // Construire les paramètres de requête
    buildQueryParams(filters, sort, pagination) {
      const params = {};
      
      // Ajouter les filtres
      Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value !== null && value !== undefined && value !== '') {
          if (Array.isArray(value) && value.length > 0) {
            params[`filter_${key}`] = value.join(',');
          } else if (typeof value === 'string' && value) {
            params[`filter_${key}`] = value;
          } else if (typeof value === 'boolean') {
            params[`filter_${key}`] = value;
          }
        }
      });
      
      // Ajouter le tri
      if (sort) {
        params.sort_by = sort.by;
        params.sort_direction = sort.direction;
      }
      
      // Ajouter la pagination
      if (pagination) {
        params.page = pagination.page;
        params.limit = pagination.limit;
      }
      
      return params;
    },
    
    // Mettre à jour un filtre spécifique
    updateFilter(tableName, columnName, value) {
      if (!this.activeFilters[tableName]) {
        this.activeFilters[tableName] = {};
      }
      
      this.activeFilters[tableName][columnName] = value;
      console.info(`[FILTER_STORE] Updated filter ${columnName} for ${tableName}:`, value);
    },
    
    // Réinitialiser les filtres d'une table
    resetFilters(tableName) {
      const config = this.filterConfigs[tableName];
      if (config) {
        this.activeFilters[tableName] = this.initializeFilters(config);
        this.saveFiltersToStorage(tableName);
        console.info(`[FILTER_STORE] Filters reset for ${tableName}`);
      }
    },
    
    // Sauvegarder les filtres dans localStorage
    saveFiltersToStorage(tableName) {
      try {
        const storageKey = `filters_${tableName}`;
        const dataToSave = {
          filters: this.activeFilters[tableName],
          panelState: this.panelStates[tableName],
          timestamp: Date.now()
        };
        
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        console.info(`[FILTER_STORE] Filters saved to localStorage for ${tableName}`);
      } catch (error) {
        console.error(`[FILTER_STORE] Error saving filters to localStorage:`, error);
      }
    },
    
    // Charger les filtres depuis localStorage
    loadFiltersFromStorage(tableName) {
      try {
        const storageKey = `filters_${tableName}`;
        const savedData = localStorage.getItem(storageKey);
        
        if (savedData) {
          const parsed = JSON.parse(savedData);
          
          // Vérifier que les données ne sont pas trop anciennes (24h)
          const maxAge = 24 * 60 * 60 * 1000; // 24 heures
          if (Date.now() - parsed.timestamp < maxAge) {
            if (parsed.filters) {
              this.activeFilters[tableName] = parsed.filters;
            }
            if (parsed.panelState !== undefined) {
              this.panelStates[tableName] = parsed.panelState;
            }
            
            console.info(`[FILTER_STORE] Filters loaded from localStorage for ${tableName}`);
            return true;
          } else {
            // Données trop anciennes, les supprimer
            localStorage.removeItem(storageKey);
            console.info(`[FILTER_STORE] Expired filters removed from localStorage for ${tableName}`);
          }
        }
      } catch (error) {
        console.error(`[FILTER_STORE] Error loading filters from localStorage:`, error);
      }
      
      return false;
    },
    
    // Basculer l'état du panneau
    togglePanelState(tableName) {
      this.panelStates[tableName] = !this.panelStates[tableName];
      this.saveFiltersToStorage(tableName);
    },
    
    // Définir l'état du panneau
    setPanelState(tableName, state) {
      this.panelStates[tableName] = state;
      this.saveFiltersToStorage(tableName);
    },
    
    // === NOUVELLES MÉTHODES POUR GESTION INDIVIDUELLE DES FILTRES ===
    
    // Créer un filtre vide
    createEmptyFilter() {
      return {
        id: `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        column: '',
        type: '',
        value: null,
        operator: 'equals'
      };
    },
    
    // Ajouter un nouveau filtre
    addFilter(tableName, filter = null) {
      if (!this.activeFilters[tableName]) {
        this.activeFilters[tableName] = [];
      }
      
      const newFilter = filter || this.createEmptyFilter();
      this.activeFilters[tableName].push(newFilter);
      this.saveFiltersToStorage(tableName);
      
      console.info(`[FILTER_STORE] Added filter for ${tableName}:`, newFilter);
      return newFilter.id;
    },
    
    // Supprimer un filtre
    removeFilter(tableName, filterId) {
      if (!this.activeFilters[tableName]) return;
      
      const index = this.activeFilters[tableName].findIndex(f => f.id === filterId);
      if (index !== -1) {
        this.activeFilters[tableName].splice(index, 1);
        this.saveFiltersToStorage(tableName);
        console.info(`[FILTER_STORE] Removed filter ${filterId} for ${tableName}`);
      }
    },
    
    // Mettre à jour un filtre
    updateFilter(tableName, filterId, updates) {
      if (!this.activeFilters[tableName]) return;
      
      const filter = this.activeFilters[tableName].find(f => f.id === filterId);
      if (filter) {
        Object.assign(filter, updates);
        this.saveFiltersToStorage(tableName);
        console.info(`[FILTER_STORE] Updated filter ${filterId} for ${tableName}:`, updates);
      }
    },
    
    // Réinitialiser tous les filtres
    resetFilters(tableName) {
      this.activeFilters[tableName] = [];
      this.saveFiltersToStorage(tableName);
      console.info(`[FILTER_STORE] Reset all filters for ${tableName}`);
    },
    
    // Convertir les filtres au format legacy pour l'API
    convertFiltersToLegacyFormat(tableName) {
      const filters = this.activeFilters[tableName] || [];
      const legacyFormat = {};
      
      filters.forEach(filter => {
        if (filter.column && filter.value !== null && filter.value !== undefined && filter.value !== '') {
          legacyFormat[filter.column] = filter.value;
        }
      });
      
      return legacyFormat;
    },
    
    // Convertir les filtres au format searchPersons (POST /persons/search)
    convertFiltersToSearchFormat(tableName, sort = null, pagination = null) {
      const filters = this.activeFilters[tableName] || [];
      
      // Structure de base
      const searchBody = {
        filters: {},
        sort: sort || { by: 'created_at', direction: 'desc' },
        pagination: pagination || { page: 1, limit: 50 }
      };
      
      // Si aucun filtre actif, retourner la structure de base
      if (filters.length === 0) {
        return searchBody;
      }
      
      // Construire les conditions à partir des filtres actifs
      const conditions = [];
      
      filters.forEach(filter => {
        if (!filter.column || filter.value === null || filter.value === undefined || filter.value === '') {
          return; // Skip invalid filters
        }
        
        // Déterminer l'opérateur selon le type de filtre
        let operator = filter.operator || 'equals';
        let value = filter.value;
        
        // Mapping des clés de traduction vers les opérateurs API
        // Basé sur buildFilterCondition dans backend/src/api/v1/persons/service.js
        const operatorMapping = {
          // TEXT operators
          'type_text_contains': 'contains',
          'type_text_is': 'equals',
          
          // NUMBER operators
          'type_number_equals': 'equals',
          'type_number_lt': 'lt',
          'type_number_lte': 'lte',
          'type_number_gt': 'gt',
          'type_number_gte': 'gte',
          'type_number_between': 'between',
          
          // DATE operators
          'type_date_on': 'equals',
          'type_date_after': 'after',
          'type_date_on_or_after': 'on_or_after',
          'type_date_before': 'before',
          'type_date_on_or_before': 'on_or_before',
          'type_date_between': 'between',
          
          // BOOLEAN operators
          'type_boolean_is_true': 'is_true',
          'type_boolean_is_false': 'is_false',
          'type_boolean_any': 'any',
          
          // UUID operators
          'type_uuid_is': 'equals',
          'type_uuid_is_not': 'not_equals',
          
          // NULL operators
          'is_null': 'is_null',
          'is_not_null': 'is_not_null'
        };
        
        // Traduire l'opérateur si nécessaire
        if (operatorMapping[operator]) {
          operator = operatorMapping[operator];
        }
        
        // Pour les tableaux (multi-select), utiliser 'in'
        if (Array.isArray(value) && value.length > 0) {
          operator = 'in';
        }
        
        // Construire la condition
        const condition = {
          column: filter.column,
          operator: operator,
          value: value
        };
        
        // Ajouter value2 si présent (pour between)
        if (filter.value2 !== undefined && filter.value2 !== null) {
          condition.value2 = filter.value2;
        }
        
        conditions.push(condition);
      });
      
      // Si on a des conditions, les ajouter au body
      if (conditions.length > 0) {
        searchBody.filters = {
          mode: 'include',
          operator: 'AND',
          conditions: conditions
        };
      }
      
      console.info(`[FILTER_STORE] Converted ${conditions.length} filters to search format:`, searchBody);
      return searchBody;
    },
    
    // Appliquer les filtres via POST /persons/search
    async applyPersonsSearch(tableName, sort = null, pagination = null) {
      this.loading.search = true;
      
      try {
        console.info(`[FILTER_STORE] Applying persons search for ${tableName}`);
        
        // Convertir les filtres au format searchPersons
        const searchBody = this.convertFiltersToSearchFormat(tableName, sort, pagination);
        
        console.info(`[FILTER_STORE] POST /persons/search with body:`, searchBody);
        
        // Appeler l'API POST /persons/search
        const response = await apiService.post('persons/search', searchBody);
        
        console.info(`[FILTER_STORE] Search completed, ${response.data?.length || 0} results, total: ${response.total}`);
        return response;
      } catch (error) {
        console.error(`[FILTER_STORE] Error applying persons search:`, error);
        throw error;
      } finally {
        this.loading.search = false;
      }
    },
    
    // Nettoyer les données d'une table
    clearTableData(tableName) {
      delete this.filterConfigs[tableName];
      delete this.activeFilters[tableName];
      delete this.filterValues[tableName];
      delete this.panelStates[tableName];
      delete this.errors[tableName];
      
      const storageKey = `filters_${tableName}`;
      localStorage.removeItem(storageKey);
      
      console.info(`[FILTER_STORE] Cleared all data for ${tableName}`);
    }
  }
});
