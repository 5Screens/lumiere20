# Plan d'implémentation du système de filtrage dynamique - Frontend

## Vue d'ensemble
Créer un système de filtrage dynamique et scalable pour les tableaux de données, en commençant par la classe Person.

## Architecture proposée

### 1. Store Pinia - filterStore.js
```javascript
// Structure du store
{
  state: {
    // Configuration des filtres par table
    filterConfigs: {
      'configuration.persons': { /* config */ }
    },
    
    // Valeurs actuelles des filtres par table
    activeFilters: {
      'configuration.persons': {
        first_name: '',
        active: [true],
        ref_entity_uuid: null,
        // ...
      }
    },
    
    // Cache des valeurs possibles pour les filtres
    filterValues: {
      'configuration.persons': {
        job_role: ['Manager', 'Developer', ...],
        ref_entity_uuid: [{value: 'uuid1', label: 'Entity 1'}, ...]
      }
    },
    
    // État de chargement
    loading: {
      config: false,
      values: false,
      search: false
    }
  },
  
  actions: {
    // Charger la configuration des filtres pour une table
    async loadFilterConfig(tableName),
    
    // Charger les valeurs possibles pour un filtre
    async loadFilterValues(tableName, columnName, searchQuery),
    
    // Appliquer les filtres et rechercher
    async applyFilters(tableName, filters, sort, pagination),
    
    // Réinitialiser les filtres d'une table
    resetFilters(tableName),
    
    // Sauvegarder/Charger les filtres depuis localStorage
    saveFiltersToStorage(tableName),
    loadFiltersFromStorage(tableName)
  }
}
```

### 2. Composant FilterPanel.vue
Panneau principal contenant tous les filtres pour une table.

**Fonctionnalités:**
- Affichage dynamique des filtres selon la configuration
- Support de différents types de filtres (checkbox, search, date_range, select)
- Gestion de l'état collapsed/expanded
- Boutons Apply/Reset
- Indicateur du nombre de filtres actifs

**Props:**
- `tableName`: String - Nom de la table
- `columns`: Array - Colonnes à filtrer (optionnel, sinon utilise la config)

**Events:**
- `filters-applied`: Émis quand les filtres sont appliqués
- `filters-reset`: Émis quand les filtres sont réinitialisés

### 3. Composants de filtres individuels

#### FilterCheckbox.vue
- Liste de checkboxes pour sélection multiple
- Support du "Select All" / "Deselect All"
- Recherche dans la liste si > 10 items

#### FilterSearch.vue
- Input avec debounce configurable
- Autocomplete avec résultats dynamiques
- Clear button

#### FilterDateRange.vue
- Deux date pickers (from/to)
- Presets (Today, Last 7 days, Last month, etc.)
- Validation des dates

#### FilterSelect.vue
- Dropdown simple ou multiple
- Chargement lazy des options
- Support de la recherche

### 4. Intégration dans reusableTableTab.vue

```vue
<template>
  <div class="reusable-table-tab">
    <!-- Bouton pour afficher/masquer les filtres -->
    <div class="table-controls">
      <button @click="toggleFilters" class="filter-toggle-btn">
        <i class="fas fa-filter"></i>
        Filtres
        <span v-if="activeFilterCount > 0" class="filter-badge">
          {{ activeFilterCount }}
        </span>
      </button>
      <!-- Autres contrôles existants -->
    </div>
    
    <!-- Panneau de filtres -->
    <FilterPanel
      v-if="showFilters"
      :table-name="tableName"
      @filters-applied="handleFiltersApplied"
      @filters-reset="handleFiltersReset"
    />
    
    <!-- Table existante -->
    <div class="table-container">
      <!-- ... -->
    </div>
  </div>
</template>
```

### 5. Modifications de l'API Service

Ajouter dans `apiService.js`:
```javascript
// Méthodes pour le filtrage
export const filterAPI = {
  // Obtenir la configuration des filtres
  getFilterConfig(tableName) {
    return apiService.get(`table_metadata/filter_config/${tableName}`);
  },
  
  // Obtenir les valeurs pour un filtre
  getFilterValues(tableName, columnName, query = null) {
    const params = query ? { q: query } : {};
    return apiService.get(`table_metadata/filters/${tableName}/${columnName}`, { params });
  },
  
  // Recherche avec filtres
  searchWithFilters(endpoint, filters, sort, pagination) {
    return apiService.post(`${endpoint}/search`, {
      filters,
      sort,
      pagination
    });
  }
};
```

## Étapes d'implémentation

### Phase 1: Infrastructure de base
1. ✅ Créer la table `table_metadata` en base de données
2. ✅ Implémenter les endpoints API backend
3. ✅ Peupler les métadonnées pour la table `persons`
4. ⏳ Créer le store Pinia `filterStore`
5. ⏳ Ajouter les méthodes de filtrage dans `apiService.js`

### Phase 2: Composants de filtrage
1. ⏳ Créer le composant `FilterPanel.vue`
2. ⏳ Créer les composants de filtres individuels:
   - `FilterCheckbox.vue`
   - `FilterSearch.vue`
   - `FilterDateRange.vue`
   - `FilterSelect.vue`
3. ⏳ Ajouter les styles CSS pour les filtres

### Phase 3: Intégration
1. ⏳ Intégrer `FilterPanel` dans `reusableTableTab.vue`
2. ⏳ Modifier la logique de chargement des données pour utiliser les filtres
3. ⏳ Ajouter la persistance des filtres dans localStorage
4. ⏳ Gérer le state de pagination avec les filtres

### Phase 4: Optimisations
1. ⏳ Ajouter le cache pour les valeurs de filtres
2. ⏳ Implémenter le lazy loading pour les grandes listes
3. ⏳ Ajouter les indicateurs visuels (badges, highlights)
4. ⏳ Optimiser les performances avec debounce/throttle

### Phase 5: Extension
1. ⏳ Étendre à d'autres tables (tickets, entities, etc.)
2. ⏳ Ajouter des filtres avancés (expressions, conditions complexes)
3. ⏳ Permettre la sauvegarde de filtres prédéfinis
4. ⏳ Ajouter l'export des résultats filtrés

## Considérations techniques

### Performance
- Utiliser la pagination côté serveur
- Mettre en cache les configurations et valeurs de filtres
- Debounce sur les inputs de recherche
- Lazy loading pour les listes longues

### UX
- Afficher le nombre de résultats
- Indicateurs visuels pour les filtres actifs
- Possibilité de sauvegarder des combinaisons de filtres
- Responsive design pour mobile

### Sécurité
- Validation des inputs côté client et serveur
- Protection contre l'injection SQL (paramètres préparés)
- Limitation du nombre de résultats
- Rate limiting sur les endpoints de recherche

## Exemple d'utilisation

```javascript
// Dans un composant Vue
import { useFilterStore } from '@/stores/filterStore';

export default {
  setup() {
    const filterStore = useFilterStore();
    
    // Charger la configuration au montage
    onMounted(async () => {
      await filterStore.loadFilterConfig('configuration.persons');
    });
    
    // Appliquer les filtres
    const applyFilters = async () => {
      const results = await filterStore.applyFilters(
        'configuration.persons',
        { active: [true], job_role: ['Manager'] },
        { by: 'last_name', direction: 'asc' },
        { page: 1, limit: 20 }
      );
      // Utiliser les résultats
    };
    
    return {
      filterStore,
      applyFilters
    };
  }
};
```

## Notes d'implémentation

1. **Scalabilité**: Le système est conçu pour être facilement étendu à d'autres tables
2. **Réutilisabilité**: Les composants de filtres sont génériques et réutilisables
3. **Performance**: Utilisation de la pagination et du cache pour optimiser les performances
4. **Maintenabilité**: Configuration centralisée dans la base de données
5. **Flexibilité**: Support de différents types de filtres selon les besoins

## Prochaines étapes

1. Commencer par implémenter le filterStore
2. Créer un composant FilterPanel simple avec un seul type de filtre
3. Tester avec la table persons
4. Étendre progressivement avec d'autres types de filtres
5. Optimiser et raffiner l'UX
