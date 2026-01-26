# Lumiere V2 - Action Plan
## Migration Frontend (PrimeVue + Tailwind) & Backend (Prisma)

**Date de création** : 2025-12-01  
**Méthodologie** : Développement parallèle frontend/backend, test par objet

---

# 🔷 PARTIE A : BACKEND-V2

## A.1 Analyse du Backend Actuel

### Endpoints existants (39 routes)
```
backend/src/api/v1/
├── agent/                    # Agent IA
├── attachments/              # Pièces jointes
├── audit_changes/            # Audit des modifications
├── change_options/           # Options de changement
├── change_options_labels/    # Labels options changement
├── change_questions/         # Questions changement
├── change_questions_labels/  # Labels questions changement
├── change_setup/             # Configuration changement
├── change_setup_label/       # Labels config changement
├── configuration_items/      # ✅ Déjà migré Prisma
├── contact_types/            # Types de contact
├── contact_types_labels/     # Labels types contact
├── defect_setup/             # Configuration défauts
├── defect_setup_labels/      # Labels config défauts
├── entities/                 # Entités
├── entity_setup/             # Configuration entités
├── entity_setup_labels/      # Labels config entités
├── groups/                   # Groupes
├── incident_priorities/      # Priorités incidents
├── incident_setup/           # Configuration incidents
├── incident_setup_labels/    # Labels config incidents
├── knowledge_setup/          # Configuration base connaissance
├── knowledge_setup_label/    # Labels config connaissance
├── languages/                # Langues
├── locations/                # Localisations
├── persons/                  # Personnes
├── portals/                  # Portails
├── problem_categories/       # Catégories problèmes
├── problem_categories_labels/# Labels catégories problèmes
├── project_setup/            # Configuration projets
├── project_setup_label/      # Labels config projets
├── service_offerings/        # Offres de service
├── services/                 # Services
├── symptoms/                 # Symptômes
├── symptoms_translations/    # Traductions symptômes
├── table_metadata/           # Métadonnées tables
├── ticket_status/            # Statuts tickets
├── ticket_types/             # Types tickets
└── tickets/                  # Tickets (15 fichiers)
```

### Tables SQL à migrer vers Prisma (depuis 02_create_tables.sql)

#### Schéma `configuration`
| Table | Priorité | Relations |
|-------|----------|-----------|
| `ticket_types` | 🔴 Haute | - |
| `ticket_status` | 🔴 Haute | → ticket_types |
| `symptoms` | 🟡 Moyenne | - |
| `entities` | 🔴 Haute | → persons, locations, self |
| `locations` | 🔴 Haute | → entities, groups, ticket_status, self |
| `persons` | 🔴 Haute | → entities, locations, self |
| `groups` | 🔴 Haute | → persons |
| `rel_persons_groups` | 🟡 Moyenne | → persons, groups |
| `rel_persons_delegates` | 🟡 Moyenne | → persons |
| `rel_entities_locations` | 🟡 Moyenne | → entities, locations |
| `rel_persons_entities` | 🟡 Moyenne | → persons, entities |

#### Schéma `data`
| Table | Priorité | Relations |
|-------|----------|-----------|
| `configuration_items` | ✅ Fait | - |
| `services` | 🟡 Moyenne | → entities, persons, groups, self |
| `service_offerings` | 🟡 Moyenne | → services, entities |
| `rel_subscribers_serviceofferings` | 🟢 Basse | → service_offerings |

#### Schéma `core`
| Table | Priorité | Relations |
|-------|----------|-----------|
| `tickets` | 🔴 Haute | → configuration_items, persons, ticket_types |
| `rel_parent_child_tickets` | 🟡 Moyenne | → tickets |

#### Schéma `translations`
| Table | Priorité | Relations |
|-------|----------|-----------|
| `ticket_types_translation` | 🟡 Moyenne | → ticket_types |
| `ticket_status_translation` | 🟡 Moyenne | → ticket_status |
| `symptoms_translation` | 🟡 Moyenne | → symptoms |

### Structure cible backend-v2

```
backend-v2/
├── prisma/
│   ├── schema.prisma         # Schéma complet multi-schema
│   └── migrations/           # Migrations Prisma
├── src/
│   ├── config/
│   │   ├── prisma.js         # Client Prisma
│   │   ├── logger.js         # Winston logger
│   │   └── auth.js           # Configuration auth
│   ├── middleware/
│   │   ├── auth.js           # Middleware authentification
│   │   ├── validate.js       # Validation Zod/Joi
│   │   └── errorHandler.js   # Gestion erreurs
│   ├── api/
│   │   └── v1/
│   │       ├── auth/         # Authentification
│   │       ├── configuration_items/
│   │       ├── persons/
│   │       ├── entities/
│   │       ├── locations/
│   │       ├── groups/
│   │       ├── tickets/
│   │       └── [autres]/
│   └── server.js
├── package.json
├── .env.example
└── README.md
```

### Pattern API pour PrimeVue DataTable

Chaque endpoint doit supporter le format PrimeVue :

```javascript
// GET /api/v1/{resource}/search
// Body: { filters, sortField, sortOrder, page, limit }

// Réponse:
{
  data: [...],
  total: number,
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

---

# 🔶 PARTIE B : FRONTEND-V2

## B.1 Analyse du Frontend Actuel

### Composant principal : ObjectsCrud (générique)

Le composant `objectsTab.vue` sera remplacé par un **composant générique** basé sur `ConfigurationItemsCrud.vue` :

```
ObjectsCrud.vue
├── Props: objectType (string) → détermine le modèle
├── DataTable PrimeVue avec filtres intégrés
├── Toolbar (New, Edit, Delete, Export)
├── Dialog pour édition (basé sur ConfigurationItemForm.vue)
└── Colonnes dynamiques via models/{ObjectType}.js
```

### Composant formulaire : ObjectForm (générique)

Le composant `objectCreationsAndUpdates.vue` sera remplacé par un **composant générique** basé sur `ConfigurationItemForm.vue` :

```
ObjectForm.vue
├── Props: objectType, objectData, mode (create/edit)
├── Champs dynamiques via models/{ObjectType}.js
├── Validation intégrée
└── Émission événements (save, cancel)
```

### Fichiers à conserver (réutilisables)
- `config/config.js` ✅
- `i18n/*.js` ✅
- `models/*.js` ✅ (25 modèles)
- `services/apiService.js` ✅ (à adapter)
- `stores/*.js` ✅ (6 stores)
- `composables/usePrimeVueLocale.js` ✅

### Structure cible frontend-v2

```
frontend-v2/
├── src/
│   ├── App.vue
│   ├── main.js
│   ├── assets/
│   │   └── styles/
│   │       └── main.css
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppHeader.vue
│   │   │   ├── AppSidebar.vue
│   │   │   ├── AppTabs.vue
│   │   │   └── ProfileDrawer.vue
│   │   ├── crud/
│   │   │   ├── ObjectsCrud.vue      # Générique (copie de ConfigurationItemsCrud)
│   │   │   └── ObjectForm.vue       # Générique (copie de ConfigurationItemForm)
│   │   ├── form/
│   │   │   ├── STextField.vue
│   │   │   ├── STextArea.vue
│   │   │   ├── SSelect.vue
│   │   │   ├── SDatePicker.vue
│   │   │   ├── SToggle.vue
│   │   │   ├── SCheckbox.vue
│   │   │   ├── SMLTextField.vue
│   │   │   ├── STagsList.vue
│   │   │   ├── SPickList.vue
│   │   │   ├── SFileUpload.vue
│   │   │   └── SRichTextEditor.vue
│   │   ├── admin/
│   │   │   └── PortalsAdmin.vue
│   │   └── common/
│   │       ├── ConfirmModal.vue
│   │       └── RelationsExplorer.vue
│   ├── composables/
│   │   └── usePrimeVueLocale.js
│   ├── config/
│   │   └── config.js
│   ├── i18n/
│   ├── models/
│   ├── services/
│   ├── stores/
│   └── router/
├── index.html
├── package.json
├── vite.config.js
└── postcss.config.js
```

---

# 🎯 PLAN D'ACTION INTÉGRÉ

## Méthodologie : Développement par objet

Pour chaque objet métier :
1. **Backend** : Schéma Prisma + Migration + API
2. **Frontend** : Test avec ObjectsCrud générique
3. **Validation** : Test end-to-end

---

## Phase 0 : Setup des projets (Jour 1)

### Backend-v2
- [ ] **0.1** Initialiser le projet Node.js
- [ ] **0.2** Installer les dépendances :
  - `express`, `cors`, `dotenv`
  - `@prisma/client`, `prisma`
  - `winston`, `zod`
  - `bcrypt`, `jsonwebtoken` (auth)
- [ ] **0.3** Configurer Prisma multi-schema
- [ ] **0.4** Créer la structure de base

### Frontend-v2
- [ ] **0.5** Initialiser le projet Vue 3 + Vite
- [ ] **0.6** Installer les dépendances :
  - `primevue@^4.4.1`, `@primevue/themes@^4.4.1`, `primeicons`
  - `tailwindcss@^4.1.0`, `@tailwindcss/postcss`
  - `vue-router`, `pinia`, `vue-i18n`, `axios`
- [ ] **0.7** Configurer PrimeVue + Tailwind
- [ ] **0.8** Copier fichiers réutilisables (config, i18n, models, stores)

---

## Phase 1 : Configuration Items (Jour 2-3) ✅ Référence

### Backend
- [ ] **1.1** Copier le schéma Prisma existant
- [ ] **1.2** Copier `service.prisma.js` comme référence
- [ ] **1.3** Adapter les routes pour le nouveau projet

### Frontend
- [ ] **1.4** Créer `ObjectsCrud.vue` basé sur `ConfigurationItemsCrud.vue`
- [ ] **1.5** Créer `ObjectForm.vue` basé sur `ConfigurationItemForm.vue`
- [ ] **1.6** Tester avec configuration_items

---

## Phase 2 : Authentification (Jour 4-5)

### Backend
- [ ] **2.1** Ajouter modèle `persons` au schéma Prisma
- [ ] **2.2** Créer endpoint `/api/v1/auth/login`
- [ ] **2.3** Créer endpoint `/api/v1/auth/me`
- [ ] **2.4** Créer middleware JWT

### Frontend
- [ ] **2.5** Créer page Login
- [ ] **2.6** Créer store `authStore`
- [ ] **2.7** Configurer guards de route

---

## Phase 3 : Layout principal (Jour 6-7)

### Frontend uniquement
- [ ] **3.1** Créer `App.vue` avec layout Tailwind
- [ ] **3.2** Créer `AppHeader.vue` (Menubar PrimeVue)
- [ ] **3.3** Créer `AppSidebar.vue` (Menu/PanelMenu)
- [ ] **3.4** Créer `AppTabs.vue` (TabView)
- [ ] **3.5** Créer `ProfileDrawer.vue` (Drawer)
- [ ] **3.6** Implémenter thème dark/light

---

## Phase 4 : Objets de configuration (Jour 8-12)

### 4.1 Entities
- [ ] Backend : Schéma Prisma + API
- [ ] Frontend : Test ObjectsCrud
- [ ] Validation E2E

### 4.2 Locations
- [ ] Backend : Schéma Prisma + API
- [ ] Frontend : Test ObjectsCrud
- [ ] Validation E2E

### 4.3 Groups
- [ ] Backend : Schéma Prisma + API
- [ ] Frontend : Test ObjectsCrud
- [ ] Validation E2E

### 4.4 Persons
- [ ] Backend : Schéma Prisma + API
- [ ] Frontend : Test ObjectsCrud
- [ ] Validation E2E

---

## Phase 5 : Tickets (Jour 13-16)

### 5.1 Ticket Types & Status
- [ ] Backend : Schéma Prisma + API
- [ ] Frontend : Test ObjectsCrud

### 5.2 Tickets (Incidents, Problems, Changes)
- [ ] Backend : Schéma Prisma + API
- [ ] Frontend : Test ObjectsCrud
- [ ] Relations parent/enfant

---

## Phase 6 : Services & Offres (Jour 17-18)

- [ ] Backend : Schéma Prisma services + service_offerings
- [ ] Frontend : Test ObjectsCrud
- [ ] Relations avec entities

---

## Phase 7 : Composants de formulaire (Jour 19-20)

- [ ] **7.1** `STextField.vue` → InputText + FloatLabel
- [ ] **7.2** `STextArea.vue` → Textarea
- [ ] **7.3** `SSelect.vue` → Select
- [ ] **7.4** `SDatePicker.vue` → DatePicker
- [ ] **7.5** `SToggle.vue` → ToggleSwitch
- [ ] **7.6** `SCheckbox.vue` → Checkbox
- [ ] **7.7** `SMLTextField.vue` → Custom multilingue
- [ ] **7.8** `STagsList.vue` → Chips
- [ ] **7.9** `SPickList.vue` → PickList
- [ ] **7.10** `SFileUpload.vue` → FileUpload
- [ ] **7.11** `SRichTextEditor.vue` → Editor

---

## Phase 8 : Portails & Admin (Jour 21-22)

- [ ] Backend : API portals
- [ ] Frontend : PortalsAdmin.vue

---

## Phase 9 : Tests & Optimisation (Jour 23-25)

- [ ] **9.1** Tests unitaires backend
- [ ] **9.2** Tests composants frontend
- [ ] **9.3** Tests E2E
- [ ] **9.4** Optimisation performances
- [ ] **9.5** Documentation

---

# 📋 Composants PrimeVue utilisés

## DataTable (composant principal)
```vue
<DataTable
  v-model:selection="selectedItems"
  v-model:filters="filters"
  :value="items"
  :paginator="true"
  :rows="pageSize"
  :totalRecords="totalRecords"
  :lazy="true"
  filterDisplay="menu"
  @page="onPage"
  @sort="onSort"
>
  <!-- Colonnes dynamiques -->
</DataTable>
```

## Filtres intégrés DataTable
- `filterDisplay="menu"` : Filtres dans le header
- Pas besoin de composants SOneFilter/SMultiFilter séparés
- Conversion automatique vers format Prisma côté backend

---

# ✅ Critères de validation par objet

Pour chaque objet développé :
- [ ] Schéma Prisma créé et migré
- [ ] API CRUD fonctionnelle (GET, POST, PUT, DELETE)
- [ ] API Search avec filtres PrimeVue
- [ ] Frontend affiche les données
- [ ] Filtres DataTable fonctionnels
- [ ] CRUD complet (Create, Read, Update, Delete)
- [ ] Thème dark/light OK
- [ ] i18n OK

---

# 📝 Notes techniques

## Conversion filtres PrimeVue → Prisma
Le service `searchConfigurationItems` dans `service.prisma.js` sert de référence pour la conversion des filtres PrimeVue vers les conditions Prisma.

## Modèles frontend
Les 25 modèles dans `models/` définissent :
- `getColumns()` : Colonnes pour DataTable
- `getFormFields()` : Champs pour formulaire
- Structure identique → composant générique possible

---

**Estimation totale** : 25 jours de développement
