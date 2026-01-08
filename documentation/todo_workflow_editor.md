# Workflow Editor - Cahier des charges et TODO

## ✅ Réponses aux questions

| # | Question | Réponse |
|---|----------|----------|
| 1 | Association Workflow ↔ Type d'objet | Workflow lié à un **entity_type** générique (ci_types, ticket_types, persons, locations, etc.) |
| 2 | Historique des changements | Oui, via la table **audit_changes** existante |
| 3 | Actions automatiques | Oui (phase future) |
| 4 | Workflow par défaut | Pas de contrainte de statut si pas de workflow |
| 5 | Modification workflow actif | Message d'avertissement + obligation de repositionner les objets concernés |
| 6 | Multi-workflow par type | Oui, possible |
| 7 | Librairie graphique | **Vue Flow** |

## 📋 User Stories

| ID | Description |
|----|-------------|
| US1 | En tant qu'administrateur, je veux pouvoir créer graphiquement un workflow afin de définir le cycle de vie d'un objet |
| US2 | En tant qu'administrateur, je veux pouvoir visualiser et modifier un workflow existant |
| US3 | En tant qu'utilisateur métier, je veux que l'application me propose uniquement les statuts autorisés selon l'état actuel de l'objet |

---

## 🏗️ Architecture

### Menus d'administration
- `Configuration / Workflow / Catégories de statuts` - CRUD des 4 catégories
- `Configuration / Workflow / Créer un workflow` - Éditeur graphique
- `Configuration / Workflow / Gérer les workflows` - Liste, édition, suppression

### Structure de l'éditeur (3 zones)
- **Zone A** : Canvas central (graphe du workflow)
- **Zone B** : Panel latéral droit (propriétés de l'élément sélectionné)
- **Zone C** : Header (actions : Add status, Add Transition, Save, Close)

---

## 📊 Modèle de données

### Tables à créer

```
workflow_status_categories
├── uuid (PK)
├── code (unique: BACKLOG, IN_PROGRESS, ON_HOLD, DONE)
├── color
├── display_order (ordre d'affichage)
├── is_active
├── created_at, updated_at

workflows
├── uuid (PK)
├── name
├── description
├── entity_type (VARCHAR: 'ci_types', 'ticket_types', 'persons', 'locations', etc.)
├── rel_entity_type_uuid (UUID optionnel: uuid du type spécifique, ex: uuid du ci_type "SERVER")
├── is_active
├── created_at, updated_at

workflow_statuses
├── uuid (PK)
├── rel_workflow_uuid (FK → workflows)
├── name (max 60 caractères)
├── rel_category_uuid (FK → workflow_status_categories)
├── allow_all_inbound (boolean - "Accessible depuis n'importe quel état")
├── is_initial (boolean - état de départ du workflow)
├── position_x, position_y (coordonnées sur le canvas)
├── created_at, updated_at

workflow_transitions
├── uuid (PK)
├── rel_workflow_uuid (FK → workflows)
├── name (label de la transition)
├── rel_to_status_uuid (FK → workflow_statuses) - destination unique
├── created_at, updated_at

workflow_transition_sources
├── uuid (PK)
├── rel_transition_uuid (FK → workflow_transitions)
├── rel_from_status_uuid (FK → workflow_statuses)
├── created_at

workflow_actions (phase future)
├── uuid (PK)
├── rel_transition_uuid (FK → workflow_transitions)
├── action_type (VARCHAR: 'email', 'webhook', 'field_update', etc.)
├── action_config (JSONB: configuration de l'action)
├── execution_order
├── created_at, updated_at
```

### Traductions (translated_fields)
- `workflow_status_categories` : label
- `workflows` : name, description
- `workflow_statuses` : name
- `workflow_transitions` : name

---

## 🎨 Spécifications UI

### Catégories de statuts (4 par défaut)
| Code | Label FR | Label EN | Couleur |
|------|----------|----------|---------|
| BACKLOG | À faire | To do | Gris/Blanc |
| IN_PROGRESS | En cours | In progress | Bleu |
| ON_HOLD | En attente | On hold | Orange/Jaune |
| DONE | Fini | Done | Vert |

### États (workflow_statuses)

#### Rendu visuel
- Rectangle aux bords arrondis
- Couleur fond/contour = couleur de la catégorie
- **État orphelin** (sans transition entrante valide) : contour rouge pointillé
- **Option "Accessible depuis n'importe quel état"** : chip grise "N'importe lequel" + flèche collée

#### Interactions
- **Survol** : 
  - Highlight des transitions liées (entrantes/sortantes)
  - Affichage de 8 pins autour de l'état
- **Drag & drop** : 
  - États déplaçables librement
  - Les transitions suivent automatiquement

### Transitions (workflow_transitions)

#### Rendu visuel
- Flèche grise entre deux états
- Chip au milieu avec le nom de la transition
- Uniquement traits horizontaux/verticaux (pas de diagonales)

#### Interactions
- **Non déplaçables** directement (suivent les états)
- **Drag depuis un pin** :
  - Segment pointillé entre pin source et curseur
  - Drop sur un état → ouvre modale "Créer transition" pré-remplie
  - Drop ailleurs → rien

---

## 🖼️ Modales

### Modale "Ajouter un statut"
| Champ | Type | Validation |
|-------|------|------------|
| Nom | Input texte | Max 60 car. Message erreur spécifique |
| Catégorie | Dropdown | Obligatoire, liste des 4 catégories |

**Comportement après "Add"** :
- Retour à l'éditeur
- Nouveau statut ajouté sur le canvas
- Option "Accessible depuis n'importe quel état" activée par défaut

### Modale "Créer une transition"
| Champ | Type | Description |
|-------|------|-------------|
| De l'état | Multi-select checkboxes | États sources (plusieurs possibles) + option "N'importe quel état" |
| À l'état | Single-select | État destination (un seul) |
| Nom | Input texte | Label de la transition (ex: "Démarrer le travail") |

---

## 📐 Panel latéral (Zone B)

### Comportement général
- Largeur fixe
- Chevron pour ouvrir/fermer
- Survol bordure gauche → highlight couleur primaire
- Aucune sélection → panel replié, contenu vide

### Contenu si ÉTAT sélectionné
1. Titre "État" (i18n)
2. Sous-titre descriptif (i18n)
3. Label "Nom" + valeur + bouton éditer
4. Label "Catégorie" + valeur avec couleur + bouton éditer
5. Label "Transitions" + bouton "+"
6. Checkbox "Autoriser depuis n'importe quel état"
7. Liste des transitions (nom + sources → destination)
8. Bouton "Supprimer l'état"

### Contenu si TRANSITION sélectionnée
1. Titre "Transition" (i18n)
2. Sous-titre descriptif (i18n)
3. Label "Nom" + input éditable
4. Label "Chemin"
5. "De l'état" : Multi-select chips avec ×
6. "À l'état" : Dropdown single-select
7. Bouton "Supprimer la transition"

---

## 🔌 API Backend

### Endpoints à créer

#### Catégories de statuts
```
GET    /api/v1/workflow-status-categories
POST   /api/v1/workflow-status-categories
GET    /api/v1/workflow-status-categories/:uuid
PUT    /api/v1/workflow-status-categories/:uuid
DELETE /api/v1/workflow-status-categories/:uuid
```

#### Workflows
```
GET    /api/v1/workflows
POST   /api/v1/workflows
GET    /api/v1/workflows/:uuid
PUT    /api/v1/workflows/:uuid
DELETE /api/v1/workflows/:uuid
```

#### Statuts de workflow
```
GET    /api/v1/workflows/:workflowUuid/statuses
POST   /api/v1/workflows/:workflowUuid/statuses
PUT    /api/v1/workflows/:workflowUuid/statuses/:uuid
DELETE /api/v1/workflows/:workflowUuid/statuses/:uuid
```

#### Transitions
```
GET    /api/v1/workflows/:workflowUuid/transitions
POST   /api/v1/workflows/:workflowUuid/transitions
PUT    /api/v1/workflows/:workflowUuid/transitions/:uuid
DELETE /api/v1/workflows/:workflowUuid/transitions/:uuid
```

#### API pour utilisateur final
```
GET    /api/v1/metadata/:objectUuid/available-statuses
```
→ Retourne les statuts possibles en fonction du type d'objet et du statut actuel

---

## ✅ TODO - Phases de développement

### Phase 1 : Base de données ✅
- [x] Créer le schéma Prisma pour les tables workflow
- [x] Migration Prisma (20251214170122_add_workflow_tables)
- [x] Seed des 4 catégories par défaut

### Phase 2 : Backend - Catégories ✅
- [x] CRUD workflow_status_categories
- [x] Traductions (translated_fields)
- [x] API fonctionnelle

### Phase 3 : Backend - Workflows ✅
- [x] CRUD workflows
- [x] CRUD workflow_statuses
- [x] CRUD workflow_transitions + sources
- [x] API available-statuses pour objets

### Phase 4 : Frontend - Vue Flow ✅
- [x] Installation @vue-flow/core, background, controls, minimap
- [x] WorkflowEditor.vue (layout 3 zones)
- [x] StatusNode.vue (nœuds colorés)
- [x] TransitionEdge.vue (flèches orthogonales)
- [x] StatusPanel.vue / TransitionPanel.vue
- [x] AddStatusDialog.vue / AddTransitionDialog.vue
- [x] Traductions i18n (fr, en)

### Phase 5 : Frontend - Pages ✅
- [x] WorkflowsList.vue (liste + CRUD)
- [x] Menu Configuration/Workflow ajouté
- [x] Composant enregistré dans AppTabs

### Phase 6 : Frontend - Éditeur graphique (à affiner)
- [x] Layout 3 zones (A, B, C)
- [x] Canvas avec Vue Flow
- [x] Rendu des états (rectangles colorés)
- [x] Rendu des transitions (flèches)
- [ ] Interactions avancées : 8 pins, drag & drop pour créer transitions
- [ ] État orphelin (contour rouge pointillé)
- [ ] Minimap et zoom

### Phase 7 : Frontend - Intégration utilisateur final
- [ ] Composant sélecteur de statut sur objets metadata
- [ ] Appel API available-statuses
- [ ] Affichage uniquement des statuts autorisés

---

## 🛠️ Technologies suggérées

### Canvas graphique
- **Vue Flow** (recommandé) - basé sur React Flow, adapté Vue 3
- Alternatives : JointJS, GoJS, custom SVG

### Composants UI
- PrimeVue v4 (Aura theme)
- Tailwind CSS v4

---

## 📝 Notes techniques

### Association Workflow ↔ Entités
Le workflow utilise une approche générique similaire à `translated_fields` :
- `entity_type` : type d'entité ('ci_types', 'ticket_types', 'persons', 'locations', etc.)
- `rel_entity_type_uuid` : UUID optionnel du type spécifique (ex: uuid du ci_type "SERVER")

Exemples :
| entity_type | rel_entity_type_uuid | Description |
|-------------|---------------------|-------------|
| ci_types | uuid-server | Workflow pour les serveurs |
| ci_types | uuid-contract | Workflow pour les contrats |
| ticket_types | uuid-incident | Workflow pour les incidents |
| ticket_types | uuid-problem | Workflow pour les problèmes |
| persons | NULL | Workflow pour toutes les personnes |

### Audit des changements de statut
Utiliser la table `audit_changes` existante :
- `object_type` : type de l'objet (ex: 'configuration_items')
- `object_uuid` : UUID de l'objet
- `event_type` : 'STATUS_CHANGED'
- `attribute_name` : 'status'
- `old_value` : ancien statut UUID
- `new_value` : nouveau statut UUID

### Gestion modification workflow actif
Lors de la suppression d'un état utilisé :
1. Afficher un message d'avertissement avec le nombre d'objets concernés
2. Demander à l'utilisateur de choisir un état de remplacement
3. Mettre à jour tous les objets concernés vers le nouvel état
4. Logger dans audit_changes
