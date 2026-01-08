# Documentation : Utilisation des métadonnées de table_metadata dans le Frontend

## Vue d'ensemble

Le fichier `database/scripts/16_create_table_metadata.sql` définit la table `administration.table_metadata` qui centralise toutes les métadonnées pour la configuration dynamique des tableaux, filtres et formulaires dans l'application.

Cette documentation détaille où et comment chaque champ de métadonnée est utilisé dans le frontend.

## Flux de données

### 1. Chargement de la configuration des filtres

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Composant sMultiFilter.vue                                   │
│    - Appelle filterStore.loadFilterConfig(tableName)            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. filterStore.js                                               │
│    - GET /api/v1/table_metadata/filter_config/{tableName}      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Backend API                                                  │
│    - Requête SQL sur administration.table_metadata             │
│    - WHERE table_name = {tableName}                            │
│    - AND data_is_filterable = TRUE                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Réponse JSON                                                 │
│    {                                                            │
│      "column_name": {                                           │
│        "label": "column_label",                                 │
│        "type": "filter_type",                                   │
│        "options": filter_options,                               │
│        "form_endpoint": "...",                                  │
│        "form_display_field": "...",                             │
│        "form_value_field": "..."                                │
│      }                                                           │
│    }                                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. filterStore.js                                               │
│    - Transformation en tableau de filtres                       │
│    - Stockage dans filterConfigs[tableName]                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Composant sOneFilter.vue                                     │
│    - Affichage des filtres selon filter_type                   │
│    - Chargement des valeurs via form_endpoint                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Chargement des valeurs de filtres

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Composant sOneFilter.vue                                     │
│    - Utilisateur sélectionne une colonne                        │
│    - Appelle filterStore.loadFilterValues(tableName, column)   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. filterStore.js                                               │
│    - Récupère metadata.form_endpoint                           │
│    - Récupère metadata.form_display_field                      │
│    - Récupère metadata.form_value_field                        │
│    - GET {form_endpoint}?search=...&limit=...&offset=...       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Backend API                                                  │
│    - Retourne les données selon l'endpoint                     │
│    - Exemple : GET /api/v1/groups?search=dev&limit=10          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. filterStore.js                                               │
│    - Transformation des données :                               │
│      values = response.map(item => ({                           │
│        value: item[form_value_field],                           │
│        label: item[form_display_field]                          │
│      }))                                                        │
│    - Stockage dans filterValues[tableName][columnName]         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Composant sOneFilter.vue                                     │
│    - Affichage des valeurs dans le filtre                      │
│    - Support de l'infinite scroll si form_lazy_search = true   │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Utilisation dans les formulaires

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Composant objectCreationsAndUpdates.vue                      │
│    - Appelle modelInstance.getRenderableFields(mode)           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Modèle (ex: Task.js)                                        │
│    - Retourne la configuration des champs :                    │
│      {                                                          │
│        field_name: {                                            │
│          type: "form_field_type",                               │
│          label: "...",                                          │
│          placeholder: "form_placeholder",                       │
│          required: form_required,                               │
│          readonly: form_readonly,                               │
│          endpoint: "form_endpoint",                             │
│          displayField: "form_display_field",                    │
│          valueField: "form_value_field",                        │
│          lazySearch: form_lazy_search                           │
│        }                                                        │
│      }                                                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Composant objectCreationsAndUpdates.vue                      │
│    - Affiche les champs selon leur type                        │
│    - v-if="field.type === 'sTextField'"                        │
│    - v-else-if="field.type === 'sSelectField'"                 │
│    - v-else-if="field.type === 'sRichTextEditor'"              │
│    - etc.                                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Composants Frontend utilisant table_metadata

### 1. Stores

| Fichier | Métadonnées utilisées | Lignes |
|---------|----------------------|--------|
| `stores/filterStore.js` | `table_name`, `column_name`, `column_label`, `filter_type`, `filter_options`, `form_endpoint`, `form_display_field`, `form_value_field`, `form_lazy_search` | 98, 102-106, 135-147, 200-252, 287 |

### 2. Composants de filtrage

| Fichier | Métadonnées utilisées | Lignes |
|---------|----------------------|--------|
| `components/common/sMultiFilter.vue` | `table_name`, `column_label` | 49, 134-143, 174 |
| `components/common/sOneFilter.vue` | `column_name`, `filter_type`, `data_type` | 376-384 |

### 3. Composants de formulaires

| Fichier | Métadonnées utilisées | Lignes |
|---------|----------------------|--------|
| `components/coreForms/objectCreationsAndUpdates.vue` | Utilise les champs retournés par `getRenderableFields()` | 318-326 |
| `components/formFields.vue` | Utilise les champs retournés par `getRenderableFields()` | 124-137 |

### 4. Modèles

| Fichier | Métadonnées utilisées | Méthodes |
|---------|----------------------|----------|
| `models/*.js` (tous) | `data_is_visible`, `data_is_sortable`, `data_is_filterable`, `form_field_type`, `form_placeholder`, `form_required`, `form_readonly`, `form_endpoint`, `form_display_field`, `form_value_field`, `form_lazy_search` | `getColumns()`, `getRenderableFields()` |

---

## Exemples concrets d'utilisation

### Exemple 1 : Configuration d'un filtre checkbox

**Dans la base de données :**
```sql
INSERT INTO administration.table_metadata (
    table_name, column_name, column_label,
    data_is_filterable, filter_type, filter_options,
    form_endpoint, form_display_field, form_value_field
) VALUES (
    'tasks', 'ticket_status_code', 'Status',
    TRUE, 'checkbox', '{"multiple": true}'::jsonb,
    'ticket_status', 'label', 'code'
);
```

**Utilisation dans le frontend :**
```javascript
// 1. filterStore.js charge la config
const config = await apiService.get('table_metadata/filter_config/tasks');
// config.ticket_status_code = {
//   label: 'Status',
//   type: 'checkbox',
//   options: { multiple: true },
//   form_endpoint: 'ticket_status',
//   form_display_field: 'label',
//   form_value_field: 'code'
// }

// 2. filterStore.js charge les valeurs
const values = await apiService.get('ticket_status');
// Transformation :
const transformedValues = values.map(item => ({
  value: item.code,      // form_value_field
  label: item.label      // form_display_field
}));

// 3. sOneFilter.vue affiche le filtre
// Type = 'checkbox' → Affiche des cases à cocher
// Multiple = true → Permet la sélection multiple
```

### Exemple 2 : Configuration d'un champ de formulaire

**Dans la base de données :**
```sql
INSERT INTO administration.table_metadata (
    table_name, column_name, column_label,
    form_field_type, form_placeholder, form_required,
    form_endpoint, form_display_field, form_value_field, form_lazy_search
) VALUES (
    'tasks', 'assigned_to_group', 'Assigned Team',
    'sFilteredSearchField', 'Select a team', TRUE,
    'groups', 'name', 'uuid', TRUE
);
```

**Utilisation dans le modèle Task.js :**
```javascript
static getRenderableFields(mode) {
  return {
    assigned_to_group: {
      type: "sFilteredSearchField",     // form_field_type
      label: "task.assigned_team_label",
      placeholder: "task.select_team",  // form_placeholder
      required: true,                   // form_required
      endpoint: "groups",               // form_endpoint
      displayField: "name",             // form_display_field
      valueField: "uuid",               // form_value_field
      lazySearch: true                  // form_lazy_search
    }
  };
}
```

**Affichage dans objectCreationsAndUpdates.vue :**
```vue
<sFilteredSearchField
  v-if="field.type === 'sFilteredSearchField'"
  :endpoint="field.endpoint"
  :display-field="field.displayField"
  :value-field="field.valueField"
  :lazy-search="field.lazySearch"
  :placeholder="$t(field.placeholder)"
  :required="field.required"
/>
```

### Exemple 3 : Configuration d'un filtre date_range

**Dans la base de données :**
```sql
INSERT INTO administration.table_metadata (
    table_name, column_name, column_label,
    data_type, data_is_filterable, filter_type
) VALUES (
    'tasks', 'created_at', 'Created Date',
    'datetime', TRUE, 'date_range'
);
```

**Utilisation dans filterStore.js :**
```javascript
// Initialisation du filtre
initializeFilters(filterConfig) {
  filterConfig.forEach(filter => {
    if (filter.type === 'date_range') {
      filters[filter.column] = { gte: null, lte: null };
    }
  });
}

// Application du filtre
// Le backend recevra : { created_at: { gte: '2024-01-01', lte: '2024-12-31' } }
```

---

## Métadonnées non utilisées actuellement

Les champs suivants sont définis dans `table_metadata` mais **ne sont pas encore utilisés** dans le frontend :

1. **Identification de la table :**
   - `object_name` - Nom de l'objet métier
   - `table_label` - Nom d'affichage de la table
   - `table_description` - Description de la table
   - `column_description` - Description de la colonne

2. **Type de données :**
   - `data_is_nullable` - Accepte NULL
   - `data_default_value` - Valeur par défaut

3. **Relations :**
   - `is_foreign_key` - Indicateur de clé étrangère
   - `related_table` - Table liée (utilisé uniquement backend)
   - `related_column` - Colonne liée (utilisé uniquement backend)

4. **Multilingue :**
   - `is_multilang` - Colonne multilingue (géré backend)
   - `related_translation_table` - Table de traduction (géré backend)
   - `translation_foreign_key` - Clé étrangère traduction (géré backend)
   - `translation_label_column` - Colonne label traduit (géré backend)

5. **Formulaires avancés :**
   - `form_related_table` - Table liée pour champs relationnels
   - `form_columns_config` - Configuration colonnes liées
   - `form_visibility_condition` - Condition d'affichage

**Ces champs sont réservés pour des fonctionnalités futures.**

---

## Recommandations

### 1. Centralisation de la configuration

**Actuellement :** Les modèles (`models/*.js`) définissent manuellement les configurations dans `getColumns()` et `getRenderableFields()`.

**Amélioration possible :** Charger automatiquement la configuration depuis `table_metadata` pour éviter la duplication.

```javascript
// Exemple d'amélioration future
static async getColumns() {
  const metadata = await apiService.get(`table_metadata/columns/${this.tableName}`);
  return metadata.map(col => ({
    key: col.column_name,
    label: col.column_label,
    type: col.data_type,
    visible: col.data_is_visible,
    sortable: col.data_is_sortable,
    filterable: col.data_is_filterable
  }));
}
```

### 2. Utilisation des champs de description

Les champs `table_description` et `column_description` pourraient être utilisés pour :
- Afficher des tooltips d'aide dans les formulaires
- Générer une documentation automatique
- Améliorer l'accessibilité

### 3. Implémentation des conditions de visibilité

Le champ `form_visibility_condition` pourrait être utilisé pour :
- Afficher/masquer des champs selon d'autres valeurs
- Exemple : Afficher "Reason for closure" uniquement si status = "Closed"

### 4. Validation automatique

Les champs `data_is_nullable`, `data_default_value`, `form_required` pourraient être utilisés pour :
- Générer automatiquement les règles de validation
- Éviter la duplication de logique de validation

---

## Conclusion

La table `administration.table_metadata` centralise toute la configuration nécessaire pour :
- **Filtrage dynamique** : Types de filtres, options, endpoints
- **Affichage des tableaux** : Colonnes visibles, triables, filtrables
- **Formulaires** : Types de champs, endpoints, validation
- **Multilingue** : Support des traductions (côté backend)

Le frontend utilise principalement les métadonnées via :
1. `filterStore.js` - Chargement et gestion des filtres
2. `sMultiFilter.vue` / `sOneFilter.vue` - Affichage des filtres
3. `models/*.js` - Configuration des colonnes et formulaires
4. `objectCreationsAndUpdates.vue` - Rendu des formulaires

Cette architecture permet une grande flexibilité et facilite l'ajout de nouvelles tables et colonnes sans modifier le code frontend.
