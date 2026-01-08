# DEVBOOK - Projet Lumière 16

## Vue d'ensemble

**Lumière 16** est une application web de gestion de services IT (ITSM) de type Service Desk, permettant la gestion complète de tickets (incidents, problèmes, changements, tâches), de projets agiles (sprints, epics, stories), de base de connaissances et d'actifs de configuration.

---

## Architecture Technique

### Stack Technologique

**Frontend**
- Vue.js 3 (Composition API)
- Pinia (state management avec persistance)
- Vue-i18n (internationalisation FR/EN)
- Vue Router
- Axios (via apiService centralisé)

**Backend**
- Node.js + Express
- PostgreSQL (avec extensions: uuid-ossp, unaccent)
- Winston (logging avec format `YYYY-MM-DD HH:mm:ss`)
- Joi (validation des données)

**Base de données**
- PostgreSQL avec schémas multiples (core, configuration, translations, audit)
- Contraintes DEFERRABLE pour gestion des mises à jour de codes
- Système d'audit automatique via triggers
- Support multilingue via tables de traduction

---

## Backend (`backend/src`)

### Architecture API RESTful

**Pattern MVC standardisé** pour chaque module :
```
api/v1/<module>/
├── controller.js   # Gestion des requêtes HTTP, logging [CONTROLLER]
├── service.js      # Logique métier, requêtes SQL, logging [SERVICE]
├── routes.js       # Définition des routes, logging [ROUTES]
└── validation.js   # Schémas Joi, logging [VALIDATION]
```

### Modules API principaux (38 modules)

**Gestion des tickets** (endpoint `/api/v1/tickets`)
- Types supportés: TASK, INCIDENT, PROBLEM, CHANGE, KNOWLEDGE, PROJECT, SPRINT, EPIC, STORY, DEFECT
- Services spécialisés: `taskService.js`, `incidentService.js`, `problemService.js`, etc.
- Infinite scroll via POST `/tickets/search/<type>` avec filtres avancés
- Lazy search via GET `/tickets?ticket_type=<TYPE>&search=<query>`

**Configuration** (tables factorisées avec metadata)
- `incident_setup` : urgences, impacts, causes, résolutions (metadata: URGENCY, IMPACT, CAUSE_CODE, RESOLUTION_CODE)
- `change_setup` : types, catégories, priorités de changements
- `knowledge_setup` : catégories, audiences cibles, périmètres métiers
- `project_setup` : méthodologies, statuts, priorités de projets
- `defect_setup` : sévérités, environnements, zones d'impact
- `entity_setup` : types d'entités organisationnelles

**Référentiels**
- `persons` : utilisateurs avec recherche multi-termes insensible aux accents
- `groups` : groupes d'utilisateurs
- `entities` : entités organisationnelles
- `locations` : localisations géographiques
- `configuration_items` : actifs de configuration (CI)
- `services` / `service_offerings` : catalogue de services
- `symptoms` : symptômes techniques

**Métadonnées dynamiques**
- `table_metadata` : configuration des colonnes, filtres et formulaires
- Permet la génération dynamique des interfaces frontend

### Fonctionnalités Backend clés

**Filtrage avancé**
- Support de 4 types de filtres: `search`, `checkbox`, `select`, `date_range`
- Filtres multilingues avec traductions automatiques
- Filtrage par type de ticket (ex: statuts filtrés par `rel_ticket_type`)
- Recherche multi-termes avec opérateur AND et insensibilité aux accents (via `unaccent()`)

**Tri intelligent**
- Mapping explicite des colonnes calculées (`sortColumnMapping`)
- Support du tri sur colonnes avec jointures, concaténations et subqueries
- Exemple: tri sur `person_name` = `"first_name || ' ' || last_name"`

**Pagination et infinite scroll**
- Pagination classique avec `offset`/`limit`
- Infinite scroll avec `hasMore` et métadonnées de pagination
- Optimisé pour grandes volumétries (3000+ tickets)

**Gestion des relations**
- Relations parent-enfant entre tickets (`rel_parent_child_tickets`)
- Assignations et observateurs (`rel_tickets_groups_persons`)
- Gestion automatique de `ended_at` lors des mises à jour
- Historisation complète des relations

**Audit et traçabilité**
- Trigger automatique sur toutes les tables critiques
- Fonction `audit.log_changes()` avec traitement spécial pour relations
- Exclusion des champs système (`created_at`, `updated_at`)
- Logs détaillés avec préfixes par couche

---

## Frontend (`frontend/src`)

### Architecture Composants

**Structure des dossiers**
```
src/
├── components/
│   ├── common/          # Composants réutilisables
│   └── forms/           # Composants de formulaires
├── models/              # Classes métier (Task, Incident, Problem, etc.)
├── stores/              # Stores Pinia (tabs, filters, panes, etc.)
├── i18n/                # Traductions FR/EN
├── assets/styles/       # CSS globaux et thèmes
└── config/              # Configuration (API_BASE_URL)
```

### Composants clés

**Navigation et layout**
- `App.vue` : Shell principal avec header, menu latéral, système d'onglets
- `dynamicToolTipMenu.vue` : Tooltips de navigation au survol (340x340px)
- `hierarchicalTabs.vue` : Gestion des onglets hiérarchiques
- `DynamicPane.vue` : Panneaux latéraux contextuels

**Tableaux et données**
- `reusableTableTab.vue` : Tableau générique avec tri, pagination, infinite scroll
- `sMultiFilter.vue` : Panneau de filtres avancés avec persistance
- `sOneFilter.vue` : Composant de filtre individuel (search, checkbox, select, between)
- Support du redimensionnement des colonnes avec ligne de prévisualisation bleue
- Affichage tronqué des UUID (7 premiers caractères)
- Popover global pour contenu tronqué

**Formulaires dynamiques**
- `objectCreationsAndUpdates.vue` : Formulaire générique basé sur modèles
- Composants de champs: `sTextField`, `sSelectField`, `sRichTextEditor`, `sDatePicker`, `sFilteredSearchField`, `sPickList`, `sTagsList`, `sTableField`, `sFileUploader`
- Mode création/édition avec boutons de validation/annulation (composant `RgButton`)
- Gestion des changements avec suivi des modifications

**Modèles métier** (pattern standardisé)
```javascript
class Task {
  static getColumns()              // Colonnes pour tableaux
  static getApiEndpoint(method)    // Endpoints API
  static getById(uuid)             // Récupération par UUID
  getRenderableFields()            // Champs pour formulaires
  toAPI()                          // Transformation pour API
}
```

Classes disponibles: `Task`, `Incident`, `Problem`, `Change`, `Knowledge_article`, `Project`, `Sprint`, `Epic`, `Story`, `Defect`, `Entity`, `Symptom`, `Person`

### Stores Pinia

**tabsStore** : Gestion centralisée des onglets
- Ouverture/fermeture d'onglets
- Gestion de l'onglet actif
- Stockage des données d'onglets (objectId, objectClass, mode)
- Messages de notification

**filterStore** : Persistance des filtres
- Sauvegarde localStorage par table
- Chargement dynamique des valeurs de filtres
- Support infinite scroll pour filtres avec grandes volumétries
- État replié/déplié du panneau

**paneStore** : Configuration des panneaux latéraux
- Service Hub, Sprint Center, Data, Configuration, Admin
- Mapping des items avec icônes et traductions

**userProfileStore** : Profil utilisateur
- Thème (clair/sombre)
- Langue (FR/EN)
- Persistance automatique

### Système de thèmes

**Variables CSS dynamiques** (`themes.css`)
- Support thème clair/sombre avec `data-theme` attribute
- Variables: `--primary-color`, `--background-color`, `--text-color`, `--border-color`, etc.
- Bascule instantanée via bouton dans le header

### Internationalisation

**Vue-i18n** avec configuration spéciale
- Affichage de la clé si traduction manquante (facilite le debug)
- Traductions complètes FR/EN pour tous les modules
- Clés communes: `common.created_at`, `common.updated_at`, `common.closed_at`
- Clés spécifiques par type: `task.*`, `incident.*`, `problem.*`, etc.

---

## Base de données (`database/scripts`)

### Schémas PostgreSQL

**core** : Données métier
- `tickets` : table principale (tous types de tickets)
- `rel_parent_child_tickets` : relations hiérarchiques
- `rel_tickets_groups_persons` : assignations et observateurs
- `knowledge_article_versions` : versioning des articles

**configuration** : Référentiels
- `persons`, `groups`, `entities`, `locations`
- `configuration_items` : CMDB
- `symptoms` : symptômes techniques
- Tables `*_setup_codes` : configurations factorisées avec metadata
- `ticket_types`, `ticket_status` : types et statuts de tickets
- `table_metadata` : métadonnées pour génération dynamique d'UI

**translations** : Traductions multilingues
- Tables `*_labels` ou `*_translation` pour chaque référentiel
- Contraintes DEFERRABLE pour permettre les mises à jour de codes
- Clé étrangère vers table de configuration via `code` ou `uuid`

**audit** : Traçabilité
- `audit_changes` : historique complet des modifications
- Trigger automatique via `audit.log_changes()`
- Traitement spécial pour relations (affichage noms au lieu d'UUIDs)

### Scripts d'initialisation (ordre d'exécution)

1. **00_init_database.sql** : Création de la base et des schémas
2. **01_create_extensions.sql** : Extensions (uuid-ossp, unaccent)
3. **02_create_tables.sql** : Tables principales (core, configuration)
4. **03_create_audit_schema.sql** : Schéma d'audit + fonction `log_changes()`
5. **03_create_indexes.sql** : Index de performance
6. **04_create_functions.sql** : Fonctions métier
7. **05_create_triggers.sql** : Triggers d'audit
8. **06-15_create_*_tables.sql** : Tables spécialisées (incidents, problèmes, changements, KM, projets, défauts)
9. **16_create_table_metadata.sql** : Table de métadonnées
10. **17_populate_table_metadata_*.sql** : Métadonnées par type de ticket (11 fichiers)

### Conventions de nommage

- **Clés primaires** : `uuid` (UUID v4)
- **Clés étrangères** : préfixe `rel_` (ex: `rel_entity_uuid`, `rel_assigned_to_group`)
- **Champs système** : `created_at`, `updated_at`, `ended_at`
- **Codes** : `code` VARCHAR(50) UNIQUE pour référencement stable
- **Métadonnées** : `metadata` VARCHAR(50) pour distinguer les types dans tables factorisées

### Contraintes DEFERRABLE

Appliquées sur toutes les FK des tables de traduction pour permettre les mises à jour de codes :
```sql
DEFERRABLE INITIALLY IMMEDIATE
```
Utilisation dans les transactions :
```sql
SET CONSTRAINTS <constraint_name> DEFERRED;
```

---

## Patterns et bonnes pratiques

### Backend

**Logging standardisé**
```javascript
logger.info('[SERVICE] Operation description', { context });
logger.error('[CONTROLLER] Error description', { error });
```

**Gestion des erreurs**
- Erreur 23505 (contrainte unique) → HTTP 409 Conflict
- Erreur 404 → Ressource non trouvée
- Erreur 500 → Erreur serveur avec stack trace

**Validation Joi**
- Schémas pour CREATE, UPDATE, PATCH
- Validation des UUIDs, codes de langue, longueurs
- Messages d'erreur explicites

**Transactions**
- Utilisation systématique pour opérations multiples
- Rollback automatique en cas d'erreur
- Logging des étapes

### Frontend

**Ouverture d'onglets**
```javascript
tabsStore.openTab({
  id: 'unique-id',
  label: 'Titre',
  objectClass: TaskClass,
  objectId: 'uuid',
  mode: 'update' // ou 'create'
});
```

**Appels API**
```javascript
import apiService from '@/config/apiService';
const response = await apiService.get('endpoint');
const data = await apiService.post('endpoint', payload);
```

**Notifications**
```javascript
tabsStore.setMessage('Message d\'erreur');
// Affichage automatique dans la modale globale (App.vue)
```

---

## Fonctionnalités principales

### Gestion des tickets
- Création/édition/suppression de tickets (10 types)
- Assignation à des groupes et personnes
- Gestion des observateurs (watchers)
- Relations parent-enfant avec types de dépendance
- Historique complet via audit

### Recherche et filtrage
- Recherche textuelle multi-termes insensible aux accents
- Filtres avancés avec 4 types (search, checkbox, select, date_range)
- Persistance des filtres par table
- Infinite scroll avec chargement progressif

### Projets agiles
- Gestion de projets avec sprints
- Epics, User Stories, Défauts
- Relations hiérarchiques (projet → sprint → story)
- Suivi de la charge de travail

### Base de connaissances
- Articles avec versioning automatique
- Catégorisation par audience cible et périmètre métier
- Gestion des pièces jointes
- Statistiques de consultation

### CMDB
- Gestion des éléments de configuration
- Relations avec tickets et services
- Catégorisation par type d'entité

### Multilingue
- Interface complète FR/EN
- Référentiels traduits dynamiquement
- Paramètre `lang` dans toutes les requêtes API

---

## Points techniques importants

### Performance
- Index sur colonnes fréquemment filtrées/triées
- Pagination côté serveur
- Infinite scroll avec `hasMore`
- Éviter le tri sur colonnes avec subqueries (compteurs)

### Sécurité
- Validation Joi sur toutes les entrées
- Paramètres SQL préparés (protection injection SQL)
- Gestion des erreurs sans exposition de détails sensibles
- `.gitignore` pour données sensibles

### Extensibilité
- Architecture modulaire (facile d'ajouter un nouveau type de ticket)
- Métadonnées dynamiques (configuration UI sans code)
- Pattern standardisé pour tous les modules
- Système de traduction extensible

### Maintenance
- Logging détaillé à tous les niveaux
- Audit complet des modifications
- Contraintes DEFERRABLE pour flexibilité
- Documentation inline et devbook

---

## Commandes utiles

**Backend**
```bash
cd backend
npm install
npm run dev  # Démarre sur port 3000
```

**Frontend**
```bash
cd frontend
npm install
npm run serve  # Démarre sur port 8080
```

**Base de données**
```bash
# Exécuter les scripts dans l'ordre (00 à 17)
psql -U postgres -d lumiere16 -f database/scripts/00_init_database.sql
```

---

## Évolutions futures recommandées

1. **Authentification/Autorisation** : Système de rôles et permissions
2. **Notifications temps réel** : WebSockets pour mises à jour live
3. **Rapports et tableaux de bord** : Analytics et KPI
4. **API GraphQL** : Alternative à REST pour requêtes complexes
5. **Tests automatisés** : Jest (backend) + Vitest (frontend)
6. **CI/CD** : Pipeline de déploiement automatisé
7. **Vues matérialisées** : Pour compteurs et statistiques (performance)
8. **Elasticsearch** : Recherche full-text avancée

---

**Version** : 1.0  
**Dernière mise à jour** : Novembre 2024  
**Mainteneur** : Équipe Lumière 16
