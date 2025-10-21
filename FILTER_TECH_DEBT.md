# Dette Technique - Système de Filtres

**Date de création** : 21 octobre 2025  
**Statut** : À planifier  
**Priorité** : Moyenne  
**Impact** : Maintenabilité, Performance

---

## 📋 Résumé

Le système actuel de récupération des valeurs de filtres utilise des endpoints spécifiques (`/filters/:columnName`) qui dupliquent la logique métier déjà présente dans les endpoints génériques existants. Cette architecture complexifie inutilement le code et crée de la duplication.

---

## 🔍 Problème Identifié

### Architecture Actuelle (Complexe)

**Flux pour récupérer les valeurs d'un filtre :**

1. **Frontend** (`sOneFilter.vue` ligne 455-467)
   ```javascript
   loadOptions(props.filter.column)
   ```

2. **FilterStore** (`filterStore.js` ligne 135-181)
   ```javascript
   await apiService.get(`${endpoint}/filters/${columnName}`)
   // Exemple: GET /tickets/tasks/filters/requested_by_uuid
   ```

3. **Backend** - Endpoint spécifique `/tickets/tasks/filters/:columnName`
   - Analyse les métadonnées de la colonne
   - Détecte si c'est une FK vers `persons`
   - Fait une requête JOIN complexe avec traductions
   - Retourne `{ value, label }`

### Problèmes

- ❌ **Duplication de logique** : Les métadonnées sont analysées côté backend pour déterminer l'endpoint
- ❌ **Endpoints redondants** : `/filters/:columnName` réinvente la roue alors qu'on a déjà `/persons`, `/entities`, etc.
- ❌ **Complexité inutile** : Logique métier dupliquée entre les endpoints génériques et les endpoints de filtres
- ❌ **Maintenance difficile** : Chaque nouvelle table nécessite un nouvel endpoint `/filters`
- ❌ **Incohérence** : Les champs de formulaire utilisent déjà les endpoints génériques avec succès

---

## 💡 Solution Proposée

### Architecture Simplifiée (Recommandée)

**Réutiliser les endpoints génériques existants :**

```javascript
// Exemple dans Change.js (ligne 309-323) - déjà fonctionnel !
requested_for_uuid: {
  type: 'sFilteredSearchField',
  endpoint: 'persons',           // ← Réutiliser cet endpoint !
  displayField: 'person_name',
  valueField: 'uuid',
  lazySearch: true
}
```

### Modifications Nécessaires

#### 1. Backend

**Supprimer :**
- Routes `/tickets/tasks/filters/:columnName`
- Routes `/persons/filters/:columnName`
- Logique d'analyse des métadonnées dans les services

**Conserver :**
- Endpoints génériques existants :
  - `GET /persons?lang=fr&limit=50`
  - `GET /entities?lang=fr&limit=50`
  - `GET /ticket_status?lang=fr&rel_ticket_type=TASK`

#### 2. Frontend

**Modifier `filterStore.js` (ligne 135-181) :**

```javascript
async loadFilterValues(tableName, columnName, searchQuery = null) {
  // Au lieu de : GET /${endpoint}/filters/${columnName}
  // Utiliser : GET /${related_endpoint}?lang=${lang}&limit=50
  
  const metadata = this.getColumnMetadata(tableName, columnName);
  const endpoint = metadata.form_endpoint; // Ex: 'persons'
  
  const params = { 
    lang: userProfileStore.language,
    limit: 50
  };
  
  if (searchQuery) {
    params.q = searchQuery;
  }
  
  const response = await apiService.get(endpoint, params);
  return response.data;
}
```

**Modifier `sOneFilter.vue` :**
- Utiliser les métadonnées `form_endpoint`, `form_display_field`, `form_value_field`
- Supprimer la logique spécifique aux filtres

#### 3. Métadonnées

**Utiliser les champs existants dans `table_metadata` :**

```sql
-- Déjà présent dans 17_populate_table_metadata.sql
form_endpoint: 'persons',
form_display_field: 'person_name',
form_value_field: 'uuid'
```

---

## ✅ Avantages de la Refonte

1. **Simplicité** : Code plus simple et lisible
2. **Maintenabilité** : Moins de duplication, un seul endroit à maintenir
3. **Cohérence** : Même logique pour les formulaires et les filtres
4. **Performance** : Identique (mêmes requêtes SQL)
5. **Extensibilité** : Pas besoin de créer de nouveaux endpoints pour chaque table
6. **Réutilisation** : Les endpoints génériques supportent déjà :
   - Pagination (`?limit=50&page=1`)
   - Recherche (`?q=...`)
   - Traductions (`?lang=fr`)
   - Filtres spécifiques (`?rel_ticket_type=TASK`)

---

## ⚠️ Risques et Contraintes

### Risques

- **Régressions** : Le système actuel est testé et stable
- **Temps de développement** : Nécessite refactorisation complète
- **Tests** : Tous les filtres doivent être retestés

### Contraintes

- **Compatibilité** : Assurer la rétrocompatibilité pendant la migration
- **Tests** : Plan de test complet nécessaire
- **Documentation** : Mettre à jour la documentation API

---

## 📅 Plan de Migration Recommandé

### Phase 1 : Préparation (1 jour)
- [ ] Créer une branche dédiée `refactor/filter-endpoints`
- [ ] Documenter tous les endpoints `/filters` existants
- [ ] Identifier les cas d'usage spécifiques

### Phase 2 : Backend (2 jours)
- [ ] Créer des fonctions utilitaires pour la conversion des métadonnées
- [ ] Adapter les endpoints génériques si nécessaire
- [ ] Marquer les routes `/filters` comme deprecated
- [ ] Ajouter des logs pour tracer l'utilisation

### Phase 3 : Frontend (2 jours)
- [ ] Refactoriser `filterStore.js`
- [ ] Adapter `sOneFilter.vue` et `sMultiFilter.vue`
- [ ] Mettre à jour les composants de filtres

### Phase 4 : Tests (2 jours)
- [ ] Tests unitaires des nouvelles fonctions
- [ ] Tests d'intégration des filtres
- [ ] Tests E2E sur les grilles principales (Person, Task)
- [ ] Tests de performance

### Phase 5 : Déploiement (1 jour)
- [ ] Déploiement en environnement de test
- [ ] Validation par l'équipe
- [ ] Déploiement en production
- [ ] Suppression des anciens endpoints `/filters`

**Durée totale estimée** : 8 jours de développement

---

## 🎯 Décision Actuelle

**NE PAS REFACTORISER IMMÉDIATEMENT**

### Raisons

1. ✅ Le système actuel **fonctionne correctement**
2. ✅ Les performances sont **acceptables**
3. ✅ La logique est **testée et stable**
4. ⚠️ Une refonte nécessite **temps et tests approfondis**
5. ⚠️ Risque de **régressions** si mal exécuté

### Actions Immédiates

1. **Documenter** cette dette technique ✅ (ce fichier)
2. **Éviter** d'ajouter de nouveaux endpoints `/filters` pour de nouvelles tables
3. **Réutiliser** les endpoints génériques pour les nouveaux filtres
4. **Planifier** la refonte pour une itération majeure future

---

## 📚 Références

### Fichiers Concernés

**Backend :**
- `backend/src/api/v1/tickets/taskService.js` (getTasksFilterValues)
- `backend/src/api/v1/persons/service.js` (getPersonsFilterValues)
- `backend/src/api/v1/tickets/routes.js` (route GET /filters/:columnName)

**Frontend :**
- `frontend/src/stores/filterStore.js` (loadFilterValues ligne 135-181)
- `frontend/src/components/common/sOneFilter.vue` (loadOptions ligne 455-467)
- `frontend/src/components/common/sMultiFilter.vue`

**Base de données :**
- `database/scripts/17_populate_table_metadata.sql` (métadonnées)

### Exemples de Réutilisation

**Champs de formulaire (déjà fonctionnels) :**
```javascript
// Change.js ligne 309-323
requested_for_uuid: {
  type: 'sFilteredSearchField',
  endpoint: 'persons',
  displayField: 'person_name',
  valueField: 'uuid',
  lazySearch: true
}
```

---

## 📝 Notes Additionnelles

- Cette dette technique a été identifiée le 21 octobre 2025
- Le système actuel reste fonctionnel et ne nécessite pas d'action urgente
- La refonte devrait être planifiée lors d'un sprint dédié à l'amélioration de la qualité du code
- Toute nouvelle implémentation de filtres devrait privilégier la réutilisation des endpoints génériques

---

**Dernière mise à jour** : 21 octobre 2025  
**Auteur** : Équipe de développement  
**Statut** : Documenté, en attente de planification
