# Tickets Refactoring Workflow

## Objectif
Refactoriser le système de tickets pour qu'il fonctionne comme les configuration_items :
- Les tickets sont composés de types (ticket_types) comme les CI sont composés de ci_types
- Chaque type de ticket a ses propres champs étendus (ticket_type_fields) comme ci_type_fields
- Le workflow engine fonctionne de la même manière pour tickets et configuration_items
- Le frontend affiche des vues filtrées par type (Tâches, Incidents, etc.)

---

## Phase 1 : Database Schema

### 1.1 Créer la table `ticket_type_fields`
Modèle basé sur `ci_type_fields` :
```sql
CREATE TABLE configuration.ticket_type_fields (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rel_ticket_type_code VARCHAR(50) NOT NULL REFERENCES configuration.ticket_types(code),
  field_name VARCHAR(100) NOT NULL,
  label_key VARCHAR(200),
  field_type VARCHAR(50) NOT NULL, -- text, number, select, date, datetime, boolean, textarea, relation, etc.
  field_options JSONB, -- pour les selects: options ou endpoint
  is_required BOOLEAN DEFAULT false,
  is_translatable BOOLEAN DEFAULT false,
  default_value TEXT,
  display_order INTEGER DEFAULT 0,
  show_in_table BOOLEAN DEFAULT true,
  show_in_form BOOLEAN DEFAULT true,
  min_width VARCHAR(20),
  validation_rules JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rel_ticket_type_code, field_name)
);
```

### 1.2 Mettre à jour le schema Prisma
Ajouter le modèle `ticket_type_fields` dans `backend-v2/prisma/schema.prisma`

### 1.3 Créer la migration
```bash
npx prisma migrate dev --name add_ticket_type_fields
```

---

## Phase 2 : Backend - Renommer tasks → tickets

### 2.1 Renommer le dossier API
- `backend-v2/src/api/v1/tasks/` → `backend-v2/src/api/v1/tickets/`

### 2.2 Mettre à jour les routes
- Fichier: `backend-v2/src/api/v1/tickets/routes.js`
- Changer toutes les références de 'tasks' à 'tickets'

### 2.3 Mettre à jour le service
- Fichier: `backend-v2/src/api/v1/tickets/service.js`
- Adapter pour supporter les champs étendus via `ticket_type_fields`
- Copier le pattern de `configuration_items/service.js` pour:
  - Charger les champs étendus selon le `ticket_type_code`
  - Sauvegarder les champs étendus dans `extended_core_fields`

### 2.4 Mettre à jour server.js
- Changer l'import de `tasksRouter` à `ticketsRouter`
- Changer la route de `/api/v1/tasks` à `/api/v1/tickets`

### 2.5 Créer le service ticket_type_fields
Copier le pattern de `ci_type_fields`:
- `backend-v2/src/api/v1/ticket_type_fields/routes.js`
- `backend-v2/src/api/v1/ticket_type_fields/controller.js`
- `backend-v2/src/api/v1/ticket_type_fields/service.js`

---

## Phase 3 : Seeds

### 3.1 Mettre à jour object-metadata.js
- Renommer `tasks` en `tickets`
- Garder les champs de base communs à tous les tickets
- L'API endpoint devient `/api/v1/tickets`

### 3.2 Créer le seed ticket_type_fields.seed.js
Définir les champs spécifiques par type de ticket :

**TASK** (champs spécifiques) :
- initial_target_date (date) - Date cible initiale
- revised_target_date (date) - Date cible révisée
- postponement_count (number, readonly) - Nombre de reports

**INCIDENT** (champs spécifiques) :
- symptoms_uuid (relation)
- impact (select)
- urgency (select)
- priority (computed/select)
- contact_type (select)
- rel_service (relation)
- rel_service_offerings (relation multiple)
- resolution_notes (textarea)
- resolution_code (select)
- cause_code (select)
- rel_problem_id (relation)
- rel_change_request (relation)
- sla_assignation_due_at (datetime)
- assigned_to_at (datetime)
- sla_resolution_due_at (datetime)
- resolved_at (datetime)
- reopen_count (number, readonly)
- assignment_count (number, readonly)
- assignment_to_count (number, readonly)
- standby_count (number, readonly)

**PROBLEM** (champs spécifiques) :
- rel_problem_categories_code (select)
- impact (select)
- urgency (select)
- rel_service (relation)
- rel_service_offerings (relation multiple)
- symptoms_description (textarea)
- workaround (textarea)
- root_cause (textarea)
- definitive_solution (textarea)
- target_resolution_date (date)
- actual_resolution_date (date)
- actual_resolution_workload (number)
- closure_justification (text)

**PROJECT** (champs spécifiques) :
- key (text, unique)
- start_date (date)
- end_date (date)
- issue_type_id (relation multiple)
- visibility (select: PUBLIC, PRIVATE, RESTRICTED)
- project_type (select)
- access_to_groups (relation multiple)
- access_to_users (relation multiple)

---

## Phase 4 : Frontend - Renommer et adapter

### 4.1 Mettre à jour le service frontend
- `frontend-v2/src/services/ticketsService.js` (renommer de tasksService.js)
- Changer l'endpoint de `/tasks` à `/tickets`

### 4.2 Mettre à jour les composables
- Vérifier `useObjectService.js` pour le mapping

### 4.3 Vues filtrées par type de ticket
Chaque menu affiche une vue filtrée sur `ticket_type_code` :
- **ServiceHub / Incidents** : filtre `ticket_type_code=INCIDENT`
- **ServiceHub / Problèmes** : filtre `ticket_type_code=PROBLEM`
- **SprintCenter / Projets** : filtre `ticket_type_code=PROJECT`
- **Tâches** : filtre `ticket_type_code=TASK`

Pattern similaire à "Modèle de serveur" qui filtre sur `ci_type=MODEL_SERVER`

### 4.4 Adapter ObjectsCrud.vue
- Supporter le chargement des champs étendus via `ticket_type_fields`
- Comme pour les configuration_items avec `ci_type_fields`

---

## Phase 5 : Workflow Engine

### 5.1 Vérifier workflow_entity_config
La config existe déjà pour `tickets`:
```javascript
{
  entity_type: 'tickets',
  subtype_field: 'ticket_type_code',
  subtype_table: 'ticket_types',
  subtype_uuid_field: 'uuid',
  subtype_code_field: 'code',
  subtype_label_field: 'label'
}
```

### 5.2 Tester le workflow
- Créer un workflow pour le type TASK
- Vérifier que les transitions fonctionnent

---

## Phase 6 : Nettoyage

### 6.1 Supprimer les logs de debug
- Retirer les console.log ajoutés dans ObjectViewInTab.vue

### 6.2 Mettre à jour les traductions
- Vérifier que les clés i18n sont cohérentes

### 6.3 Tests
- Tester la création/édition de tickets
- Tester les transitions de workflow
- Tester les champs étendus par type

---

## Ordre d'exécution recommandé

1. **Database** : Créer ticket_type_fields (schema + migration)
2. **Backend** : Renommer tasks → tickets
3. **Backend** : Créer ticket_type_fields API
4. **Seeds** : object-metadata + ticket_type_fields
5. **Frontend** : Adapter les services et composants
6. **Test** : Vérifier le fonctionnement complet
7. **Cleanup** : Supprimer les logs de debug
