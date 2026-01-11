# Plan d'Action : MCP Agentic pour le Portail End-User

## 🎯 Use Cases Cibles

| #  | Cas d'usage end-user               | Demande côté portail (front)                              | Logique métier (de bout en bout)                                                                                  | Réponses / tools MCP attendus                                                                    |
|----|-------------------------------------|-----------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------|
| 1  | Trouver une solution               | Description libre du problème                             | Comprendre l'intention → rechercher procédures pertinentes → évaluer la confiance → proposer solution ou escalade | Tool de recherche sémantique (RAG), tool de synthèse, score de confiance, proposition d'articles |
| 2  | Réinitialiser / débloquer un accès | "Mot de passe oublié", "Compte bloqué" + système concerné | Identifier le type de compte → vérifier éligibilité au self-service → proposer procédure ou action                | Tool d'identification compte, tool reset (si autorisé), fallback création ticket                 |
| 3  | Demander un accès / autorisation   | Choix application / rôle / durée                          | Vérifier droits existants → déterminer workflow de validation → préparer la demande                               | Tool catalogue applicatif, tool vérification droits, tool création demande d'accès               |
| 4  | Déclarer un incident               | Description + impact ressenti                             | Qualifier incident → détecter incident connu → lier à un service / CI                                             | Tool qualification incident, tool statut services, tool création incident                        |
| 5  | Faire une demande de service       | Sélection service (logiciel, matériel, config)            | Identifier type de service → appliquer règles standard → estimer délai                                            | Tool catalogue services, tool règles de provisioning, ticket draft                               |
| 6  | Suivre ses demandes                | Consultation / interaction                                | Récupérer demandes de l'utilisateur → déterminer actions possibles                                                | Tool récupération tickets, tool timeline, tool ajout commentaire / pièce jointe                  |
| 7  | Être informé                       | Consultation annonces / incidents                         | Agréger informations pertinentes selon profil utilisateur                                                         | Tool incidents actifs, tool annonces, filtrage par périmètre                                     |
| 8  | Interagir avec le support          | Question / réponse contextuelle                           | Maintenir le contexte de la demande → enrichir l'historique                                                       | Tool conversation contextualisée, tool ajout information ticket                                  |
| 9  | Gérer son profil                   | Paramètres utilisateur                                    | Lire / mettre à jour préférences utilisateur                                                                      | Tool profil utilisateur, tool préférences, droits                                                |
| 10 | Cas transverses & managers         | Validation, suivi, vision équipe                          | Identifier rôle manager → lister équipes → gérer validations → visibilité des droits                              | Tool organisation (équipes), tool droits utilisateurs, tool validation, tool audit              |

---

## 🧠 Liste des Intents

L'agent doit reconnaître les intentions suivantes pour router vers les bons tools MCP :

| Domaine | Intent | Description | Exemples de phrases utilisateur |
|---------|--------|-------------|--------------------------------|
| **Recherche** | `search_solution` | Chercher une solution à un problème | "Mon écran est noir", "Outlook ne marche plus", "Comment faire pour..." |
| **Recherche** | `search_article` | Chercher un article KB spécifique | "Où trouver la doc sur VPN ?", "Procédure installation Teams" |
| **Accès** | `password_reset` | Réinitialiser un mot de passe | "J'ai oublié mon mot de passe", "Reset MDP SAP" |
| **Accès** | `account_unlock` | Débloquer un compte | "Mon compte est bloqué", "Compte verrouillé AD" |
| **Accès** | `request_access` | Demander un accès/rôle | "Je voudrais accès à Salesforce", "Demande de droits admin" |
| **Accès** | `check_access` | Vérifier ses droits actuels | "Quels sont mes accès ?", "Est-ce que j'ai accès à..." |
| **Incident** | `report_incident` | Déclarer un incident | "Ça ne marche pas", "Bug sur l'appli RH", "Erreur 500" |
| **Incident** | `check_known_incident` | Vérifier si incident connu | "Y a-t-il un problème sur Teams ?", "C'est général ou juste moi ?" |
| **Service** | `request_service` | Demander un service | "Je voudrais un nouveau PC", "Installer Adobe", "Demande de téléphone" |
| **Service** | `browse_catalog` | Parcourir le catalogue | "Qu'est-ce que je peux demander ?", "Liste des services disponibles" |
| **Tickets** | `track_ticket` | Suivre une demande | "Où en est ma demande ?", "Statut du ticket 12345" |
| **Tickets** | `list_tickets` | Lister ses demandes | "Mes demandes en cours", "Historique de mes tickets" |
| **Tickets** | `update_ticket` | Ajouter info à un ticket | "Je veux ajouter une info", "Voici la capture d'écran" |
| **Info** | `get_announcements` | Consulter les annonces | "Y a-t-il des maintenances prévues ?", "Actualités IT" |
| **Info** | `get_active_incidents` | Voir les incidents en cours | "Quels sont les problèmes actuels ?", "Statut des services" |
| **Profil** | `view_profile` | Voir son profil | "Mon profil", "Mes informations" |
| **Profil** | `update_preferences` | Modifier ses préférences | "Changer ma langue", "Modifier mes notifications" |
| **Manager** | `view_team` | Voir son équipe | "Mon équipe", "Liste de mes collaborateurs" |
| **Manager** | `view_team_rights` | Voir les droits d'un collaborateur | "Droits de Jean Dupont", "Accès de mon équipe" |
| **Manager** | `pending_approvals` | Voir les validations en attente | "Demandes à valider", "Mes approbations" |
| **Manager** | `approve_request` | Valider une demande | "Je valide", "Approuver la demande" |
| **Manager** | `reject_request` | Refuser une demande | "Je refuse", "Rejeter la demande" |
| **Conversation** | `greeting` | Salutation | "Bonjour", "Hello", "Salut" |
| **Conversation** | `thanks` | Remerciement | "Merci", "Super, merci !" |
| **Conversation** | `clarify` | Réponse à une clarification | (réponse à une question de l'agent) |
| **Conversation** | `confirm` | Confirmation d'action | "Oui", "OK", "Confirmer" |
| **Conversation** | `cancel` | Annulation | "Non", "Annuler", "Laisse tomber" |
| **Fallback** | `unknown` | Intention non reconnue | (confiance < seuil) |
| **Fallback** | `out_of_scope` | Hors périmètre | "Quel temps fait-il ?", "Raconte une blague" |

**Total : 27 intents** répartis en 8 domaines.

### Mapping Intent → Tools MCP

| Intent | Tools MCP déclenchés |
|--------|---------------------|
| `search_solution` | `semantic_search_kb` → `generate_solution_steps` → `evaluate_confidence` |
| `search_article` | `semantic_search_kb` |
| `password_reset` | `identify_account_type` → `reset_password` |
| `account_unlock` | `identify_account_type` → `unlock_account` |
| `request_access` | `list_user_accesses` → `list_available_roles` → `prepare_access_request` |
| `check_access` | `list_user_accesses` |
| `report_incident` | `check_known_incident` → `qualify_incident` → `create_incident` |
| `check_known_incident` | `check_known_incident` → `list_active_incidents` |
| `request_service` | `list_service_catalog` → `prepare_service_request` → `submit_ticket` |
| `browse_catalog` | `list_service_catalog` |
| `track_ticket` | `get_ticket_details` |
| `list_tickets` | `list_user_tickets` |
| `update_ticket` | `add_ticket_comment` / `add_ticket_attachment` |
| `get_announcements` | `list_announcements` |
| `get_active_incidents` | `list_active_incidents` |
| `view_profile` | `get_user_profile` |
| `update_preferences` | `update_user_preferences` |
| `view_team` | `list_team_members` |
| `view_team_rights` | `get_user_rights` |
| `pending_approvals` | `list_pending_validations` |
| `approve_request` | `approve_request` |
| `reject_request` | `reject_request` |

### Stratégie de Fallback : Recherche Web

Quand la KB interne ne contient pas de solution (ex: "Comment créer un TCD dans Excel ?"), l'agent bascule automatiquement vers une recherche web sur des sources fiables.

**Flux de fallback :**

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Utilisateur : "Comment créer un TCD dans Excel ?"           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. semantic_search_kb → Aucun résultat pertinent               │
│     confidence < 0.3                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. evaluate_confidence → "low", reason: "no_kb_match"          │
│     → suggestedNextTools: ["web_search_solution"]               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. web_search_solution                                         │
│     - Recherche sur sources fiables (Microsoft Learn, etc.)     │
│     - Filtre par domaine de confiance                           │
│     - Retourne EvidenceRef avec source="web"                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. generate_solution_steps                                     │
│     - Synthétise à partir des sources web                       │
│     - Ajoute disclaimer : "Source externe, non validée IT"      │
└─────────────────────────────────────────────────────────────────┘
```

**Nouveau Tool : `web_search_solution`**

| Champ | Valeur |
|-------|--------|
| **Domaine** | Recherche |
| **Objectif** | Rechercher une solution sur le web quand la KB interne est vide |
| **Entrées** | `UserContext`, `WebSearchQuery:{text, productHint?, trustedDomains?}` |
| **Sorties** | `WebSearchResults:{items:EvidenceRef[], disclaimer}` + `ToolResultMeta` |

**Domaines de confiance par défaut :**

```javascript
const TRUSTED_DOMAINS = [
  // Microsoft
  'support.microsoft.com',
  'learn.microsoft.com',
  'docs.microsoft.com',
  // Google
  'support.google.com',
  // Apple
  'support.apple.com',
  // Autres éditeurs majeurs
  'help.salesforce.com',
  'help.sap.com',
  // Communautés validées
  'stackoverflow.com',
  'superuser.com'
]
```

**Comportement :**

1. **Détection du produit** : Extraire le nom du produit (Excel, Outlook, Teams...)
2. **Recherche ciblée** : Prioriser la doc officielle de l'éditeur
3. **Disclaimer** : Toujours indiquer que la source est externe
4. **Option de création KB** : Proposer de créer un article interne si la solution fonctionne

**Mise à jour du mapping Intent → Tools :**

| Intent | Tools MCP (avec fallback web) |
|--------|-------------------------------|
| `search_solution` | `semantic_search_kb` → (si vide) `web_search_solution` → `generate_solution_steps` → `evaluate_confidence` |

---

## 📋 Résumé Exécutif

**Objectif** : Transformer l'agent conversationnel actuel (mode "chat bavard") en un agent **agentic** capable d'exécuter des actions métier via un serveur MCP (Model Context Protocol).

**État actuel** :
- `backend/src/api/v1/agent/` : Agent v1 fonctionnel (chat simple avec Infomaniak LLM)
- `portal-runner/src/components/AgenticPanel.vue` : Interface chat existante
- `portal-runner/src/views/PortalViewV1.vue` : Portail end-user avec panneau agent

**Cible** : Agent capable de comprendre les intentions, exécuter des tools MCP, et orchestrer des workflows ITSM complets.

---

## 🏗️ Architecture Cible

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FRONTEND (portal-runner-v2)                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  AgenticPanel.vue                                               │   │
│  │  - Affichage messages + actions suggérées                       │   │
│  │  - Formulaires dynamiques (clarification)                       │   │
│  │  - Confirmations utilisateur avant actions                      │   │
│  │  - Indicateurs de progression                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                          POST /api/v1/agent/chat
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    BACKEND (backend-v2 port 3001)                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  backend-v2/src/api/v1/agent/                                   │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │  Orchestrator                                             │  │   │
│  │  │  - intent-analyzer.js (appel LLM)                         │  │   │
│  │  │  - tool-executor.js (exécution tools)                     │  │   │
│  │  │  - response-builder.js (appel LLM)                        │  │   │
│  │  │  - context-manager.js                                     │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │  Tools (37 tools)                                         │  │   │
│  │  │  - search/ (semantic_search_kb, web_search_solution...)   │  │   │
│  │  │  - tickets/ (create_ticket_draft, submit_ticket...)       │  │   │
│  │  │  - incidents/ (qualify_incident, create_incident...)      │  │   │
│  │  │  - access/, catalog/, info/, profile/, validation/        │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                               │
│  - Infomaniak LLM (Mixtral) - via variables .env existantes            │
│  - PostgreSQL (via Prisma) - tickets KNOWLEDGE pour la KB              │
│  - Web Search (TRUSTED_DOMAINS) - fallback si KB vide                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Composants à Développer

### 1. Agent Agentic (`backend-v2/src/api/v1/agent/`)

API REST classique dans le backend existant, exposant l'agent agentic avec tous les tools métier.

```
backend-v2/src/api/v1/agent/
├── routes.js                 # POST /chat, GET /health
├── controller.js             # Validation et réponse HTTP
├── service.js                # Orchestration principale
├── orchestrator/
│   ├── intent-analyzer.js    # Analyse d'intention (appel LLM)
│   ├── tool-executor.js      # Exécution des tools
│   ├── response-builder.js   # Construction réponse (appel LLM)
│   └── context-manager.js    # Gestion contexte conversation
├── tools/
│   ├── index.js              # Registry des tools
│   ├── comprehension/
│   │   └── analyze_user_intent.js
│   ├── search/
│   │   ├── semantic_search_kb.js
│   │   ├── check_known_incident.js
│   │   └── web_search_solution.js
│   ├── synthesis/
│   │   └── generate_solution_steps.js
│   ├── orchestration/
│   │   ├── evaluate_confidence.js
│   │   └── decide_next_step.js
│   ├── clarification/
│   │   └── ask_clarifying_question.js
│   ├── access/
│   │   ├── identify_account_type.js
│   │   ├── reset_password.js
│   │   ├── unlock_account.js
│   │   ├── list_user_accesses.js
│   │   ├── list_available_roles.js
│   │   └── prepare_access_request.js
│   ├── catalog/
│   │   ├── list_service_catalog.js
│   │   └── prepare_service_request.js
│   ├── incidents/
│   │   ├── qualify_incident.js
│   │   └── create_incident.js
│   ├── tickets/
│   │   ├── create_ticket_draft.js
│   │   ├── submit_ticket.js
│   │   ├── list_user_tickets.js
│   │   ├── get_ticket_details.js
│   │   ├── add_ticket_comment.js
│   │   └── add_ticket_attachment.js
│   ├── info/
│   │   ├── list_active_incidents.js
│   │   └── list_announcements.js
│   ├── profile/
│   │   ├── get_user_profile.js
│   │   └── update_user_preferences.js
│   ├── organization/
│   │   ├── get_user_role.js
│   │   ├── list_team_members.js
│   │   └── get_user_rights.js
│   └── validation/
│       ├── list_pending_validations.js
│       ├── approve_request.js
│       ├── reject_request.js
│       └── get_validation_history.js
├── schemas/
│   ├── common.js             # UserContext, ToolResultMeta
│   ├── search.js             # SearchQuery, EvidenceRef
│   ├── tickets.js            # TicketDraft, TicketCreated
│   └── ...
└── utils/
    ├── llm-client.js         # Client Infomaniak (réutilise config existante)
    └── context-builder.js    # Construction UserContext
```

**Endpoint principal** : `POST /api/v1/agent/chat`

Ce endpoint orchestre les appels aux tools via des appels au LLM.

**Flux d'orchestration :**

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Message utilisateur arrive                                  │
│     "J'ai oublié mon mot de passe Outlook"                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. APPEL LLM #1 : Analyse d'intention                          │
│     - Prompt système avec liste des intents possibles           │
│     - LLM retourne : intent="password_reset", entities={app:    │
│       "outlook"}, confidence=0.92                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. APPEL MCP TOOL : identify_account_type                      │
│     - Exécution locale (pas de LLM)                             │
│     - Retourne : accountType="AD", eligibleSelfService=true     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. APPEL LLM #2 : Décision next step                           │
│     - Contexte : intent + résultat tool                         │
│     - LLM décide : "proposer reset self-service"                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. APPEL LLM #3 : Génération réponse utilisateur               │
│     - Formule la réponse en langage naturel                     │
│     - Propose les actions disponibles                           │
└─────────────────────────────────────────────────────────────────┘
```

**Types d'appels par composant :**

| Composant | Appel LLM ? | Rôle |
|-----------|-------------|------|
| `intent-analyzer.js` | ✅ Oui | Comprendre l'intention utilisateur |
| `tool-executor.js` | ❌ Non | Exécuter les tools (DB, API) |
| `context-manager.js` | ❌ Non | Gérer le contexte conversation |
| `response-builder.js` | ✅ Oui | Formuler la réponse finale |

### 2. Frontend Portal Runner v2 (`portal-runner-v2/`)

**Migration complète** du portal-runner vers PrimeVue v4 + Tailwind CSS v4 (comme frontend-v2).

#### Architecture Multi-Portail (à conserver)

Le système actuel permet de créer autant de portails que souhaité, chacun avec sa propre configuration :

```
┌─────────────────────────────────────────────────────────────────┐
│  URL: /portal/:portalCode                                       │
│  Ex: /portal/self-service-l, /portal/self-service-s, /portal/poc│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  PortalWrapper.vue                                              │
│  - Charge portalData via getFullPortal(portalCode)              │
│  - Résout view_component → composant dynamique                  │
│  - componentMap: { 'PortalViewV1', 'PortalViewV2', ... }        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  <component :is="currentComponent" :portal-data="portalData"/>  │
│  → Composant de vue dynamique selon configuration               │
└─────────────────────────────────────────────────────────────────┘
```

#### Modèle de données existant (à réutiliser)

| Table | Rôle |
|-------|------|
| `core.portal_models` | Modèles de vue disponibles (PortalViewV1, PortalViewV2...) |
| `core.portals` | Configuration de chaque portail (code, titre, thème, flags) |
| `core.portal_actions` | Actions globales (CREATE_TASK, CREATE_INCIDENT...) |
| `core.portal_alerts` | Alertes globales (maintenance, info) |
| `core.portal_widgets` | Widgets globaux (compteurs, listes) |
| `core.portal__portal_actions` | Liaison portail ↔ actions (N:N) |
| `core.portal__portal_alerts` | Liaison portail ↔ alertes (N:N) |
| `core.portal__portal_widgets` | Liaison portail ↔ widgets (N:N) |

**Champs clés de `core.portals` :**

```sql
code                    -- Identifiant unique (ex: 'self-service-l')
view_component          -- Composant Vue à utiliser (ex: 'PortalViewV2')
title, subtitle         -- Branding
welcome_template        -- Template avec {firstName}
theme_primary_color     -- Couleur primaire (#FF6B00)
theme_secondary_color   -- Couleur secondaire (#111111)
show_chat               -- Afficher le panneau agent
show_alerts             -- Afficher les alertes
show_actions            -- Afficher les actions rapides
show_widgets            -- Afficher les widgets
chat_default_message    -- Message par défaut du chat
```

#### Stack technique :
- **Vue.js 3** (Composition API)
- **PrimeVue v4** avec preset Aura (dark mode automatique)
- **Tailwind CSS v4** avec `@import "tailwindcss"` syntax
- **Vue-i18n** pour l'internationalisation
- **Lucide Icons** pour les icônes

**Structure du projet :**

```
portal-runner-v2/
├── src/
│   ├── assets/
│   │   └── main.css          # Tailwind + PrimeVue layers
│   ├── components/
│   │   ├── layout/
│   │   │   ├── PortalHeader.vue
│   │   │   ├── PortalFooter.vue
│   │   │   └── PortalSidebar.vue
│   │   ├── widgets/
│   │   │   ├── AlertBanner.vue
│   │   │   ├── QuickActionCard.vue
│   │   │   └── DashboardWidget.vue
│   │   └── agentic/
│   │       ├── AgenticPanel.vue      # Panneau principal
│   │       ├── MessageBubble.vue     # Message avec actions
│   │       ├── ActionCard.vue        # Carte d'action suggérée
│   │       ├── ClarifyForm.vue       # Formulaire de clarification
│   │       ├── ConfirmDialog.vue     # Confirmation avant action
│   │       ├── TicketPreview.vue     # Aperçu ticket avant création
│   │       ├── SolutionSteps.vue     # Affichage étapes solution
│   │       └── ProgressIndicator.vue # Indicateur de progression
│   ├── composables/
│   │   ├── useAgent.js               # Logique agent
│   │   ├── usePortal.js              # Logique portail
│   │   └── useAuth.js                # Authentification
│   ├── services/
│   │   ├── api.js                    # Client API
│   │   ├── agent.js                  # Service agent v2
│   │   └── portal.js                 # Service portail
│   ├── views/
│   │   ├── PortalView.vue            # Vue principale
│   │   └── NotFound.vue
│   ├── router/
│   │   └── index.js
│   ├── i18n/
│   │   ├── index.js
│   │   └── locales/
│   │       ├── fr.json
│   │       ├── en.json
│   │       └── ...
│   ├── App.vue
│   └── main.js
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

**Composants PrimeVue utilisés :**

| Composant | Usage |
|-----------|-------|
| `Button` | Actions, envoi message |
| `InputText` / `Textarea` | Saisie utilisateur |
| `Dialog` | Confirmations, clarifications |
| `Card` | Actions rapides, widgets |
| `Message` / `Toast` | Alertes, notifications |
| `ProgressSpinner` | Chargement |
| `Avatar` | Profil utilisateur |
| `Menu` / `Menubar` | Navigation |
| `Skeleton` | Loading states |
| `Tag` | Statuts tickets |
| `Timeline` | Historique ticket |
| `Steps` | Étapes solution |

**CSS Layers (main.css) :**

```css
@layer theme, base, primevue, components, utilities;
@import "tailwindcss";
```

---

## 🗓️ Phases de Développement

> **Ordre optimisé** : Le frontend (Phases 3-4) est développé juste après l'agent backend (Phases 1-2) pour permettre de tester directement dans le portail dès le début.

### Phase 1 : Agent Backend - Structure & Orchestration (2-3 semaines)

**Objectif** : Créer l'API agent dans `backend-v2/src/api/v1/agent/`.

| Tâche | Description | Priorité |
|-------|-------------|----------|
| 1.1 | Créer la structure `backend-v2/src/api/v1/agent/` (routes, controller, service) | 🔴 Haute |
| 1.2 | Implémenter les schemas communs (UserContext, ToolResultMeta) | 🔴 Haute |
| 1.3 | Implémenter `orchestrator/intent-analyzer.js` (appel LLM) | 🔴 Haute |
| 1.4 | Implémenter `orchestrator/tool-executor.js` | 🔴 Haute |
| 1.5 | Implémenter `orchestrator/response-builder.js` (appel LLM) | 🔴 Haute |
| 1.6 | Implémenter `orchestrator/context-manager.js` | 🟡 Moyenne |
| 1.7 | Implémenter `utils/llm-client.js` (réutilise config Infomaniak) | 🔴 Haute |
| 1.8 | Enregistrer route dans `server.js` | 🔴 Haute |

**Livrables** :
- Endpoint `POST /api/v1/agent/chat` fonctionnel
- Orchestration LLM opérationnelle

---

### Phase 2 : Agent Backend - Tools Prioritaires (2-3 semaines)

**Objectif** : Implémenter les tools pour les use cases 1, 4, 6 + fallback web.

| Tâche | Description | Priorité |
|-------|-------------|----------|
| 2.1 | Implémenter `tools/search/semantic_search_kb.js` (tickets KNOWLEDGE) | 🔴 Haute |
| 2.2 | Implémenter `tools/search/web_search_solution.js` (TRUSTED_DOMAINS) | 🔴 Haute |
| 2.3 | Implémenter `tools/synthesis/generate_solution_steps.js` | 🔴 Haute |
| 2.4 | Implémenter `tools/incidents/qualify_incident.js` | 🔴 Haute |
| 2.5 | Implémenter `tools/incidents/create_incident.js` | 🔴 Haute |
| 2.6 | Implémenter `tools/tickets/list_user_tickets.js` | 🔴 Haute |
| 2.7 | Implémenter `tools/tickets/get_ticket_details.js` | 🔴 Haute |
| 2.8 | Implémenter `tools/index.js` (registry des tools) | 🔴 Haute |
| 2.9 | Tests d'intégration tools | 🟡 Moyenne |

**Livrables** :
- Use cases 1 (Trouver solution), 4 (Déclarer incident), 6 (Suivre demandes) fonctionnels
- Fallback web opérationnel

---

### Phase 3 : Migration Portal Runner v2 (3-4 semaines)

**Objectif** : Créer portal-runner-v2 avec PrimeVue v4 + Tailwind CSS v4.

| Tâche | Description | Priorité |
|-------|-------------|----------|
| 3.1 | Initialiser projet portal-runner-v2 (Vite + Vue 3) | 🔴 Haute |
| 3.2 | Configurer PrimeVue v4 + Tailwind CSS v4 + CSS layers | 🔴 Haute |
| 3.3 | Configurer Vue-i18n avec locales fr/en | 🔴 Haute |
| 3.4 | Migrer PortalWrapper.vue (architecture multi-portail) | 🔴 Haute |
| 3.5 | Migrer PortalHeader, PortalFooter, PortalSidebar | 🔴 Haute |
| 3.6 | Migrer AlertBanner, QuickActionCard, DashboardWidget | 🟡 Moyenne |
| 3.7 | Créer PortalViewV2.vue principal | 🔴 Haute |
| 3.8 | Configurer router et services API | 🔴 Haute |
| 3.9 | Tests de non-régression portail | 🟡 Moyenne |

**Livrables** :
- portal-runner-v2 fonctionnel avec même UX que v1
- Stack moderne PrimeVue v4 + Tailwind CSS v4

---

### Phase 4 : Composants Agentic (2-3 semaines)

**Objectif** : Créer les composants agentic dans portal-runner-v2.

| Tâche | Description | Priorité |
|-------|-------------|----------|
| 4.1 | Créer AgenticPanel.vue (panneau principal) | 🔴 Haute |
| 4.2 | Créer MessageBubble.vue avec actions | 🔴 Haute |
| 4.3 | Créer ClarifyForm.vue (formulaire clarification) | 🔴 Haute |
| 4.4 | Créer ConfirmDialog.vue (confirmation avant action) | 🔴 Haute |
| 4.5 | Créer TicketPreview.vue (aperçu ticket) | 🟡 Moyenne |
| 4.6 | Créer SolutionSteps.vue (étapes solution) | 🟡 Moyenne |
| 4.7 | Créer ProgressIndicator.vue | 🟡 Moyenne |
| 4.8 | Intégrer dans PortalViewV2.vue | 🔴 Haute |
| 4.9 | Connecter au service agent v2 | 🔴 Haute |

**Livrables** :
- Interface agentic complète
- **Tests end-to-end MCP via le portail** ✅

---

### Phase 5 : Tools Tickets & Incidents (2-3 semaines)

**Objectif** : Permettre la création et le suivi de tickets.

| Tâche | Description | Priorité |
|-------|-------------|----------|
| 5.1 | Implémenter `qualify_incident` | 🔴 Haute |
| 5.2 | Implémenter `create_ticket_draft` | 🔴 Haute |
| 5.3 | Implémenter `submit_ticket` | 🔴 Haute |
| 5.4 | Implémenter `list_user_tickets` | 🔴 Haute |
| 5.5 | Implémenter `get_ticket_details` | 🟡 Moyenne |
| 5.6 | Implémenter `add_ticket_comment` | 🟡 Moyenne |
| 5.7 | Implémenter `create_incident` | 🟡 Moyenne |
| 5.8 | Tests d'intégration tickets | 🟡 Moyenne |

**Livrables** :
- Workflow complet de création de ticket via agent
- Use cases 4, 5, 6 fonctionnels

---

### Phase 6 : Recherche & Synthèse (2 semaines)

**Objectif** : Permettre la recherche de solutions dans la KB.

| Tâche | Description | Priorité |
|-------|-------------|----------|
| 6.1 | Implémenter `semantic_search_kb` | 🔴 Haute |
| 6.2 | Implémenter `check_known_incident` | 🔴 Haute |
| 6.3 | Implémenter `generate_solution_steps` | 🔴 Haute |
| 6.4 | Implémenter `web_search_solution` (fallback web) | 🔴 Haute |
| 6.5 | Implémenter `ask_clarifying_question` | 🟡 Moyenne |
| 6.6 | Intégration RAG (si disponible) | 🟢 Basse |

**Livrables** :
- Use case 1 (Trouver une solution) fonctionnel
- Système de clarification + fallback web

---

### Phase 7 : Accès & Identité (2 semaines)

**Objectif** : Gérer les demandes d'accès et reset de mots de passe.

| Tâche | Description | Priorité |
|-------|-------------|----------|
| 7.1 | Implémenter `identify_account_type` | 🔴 Haute |
| 7.2 | Implémenter `list_user_accesses` | 🔴 Haute |
| 7.3 | Implémenter `prepare_access_request` | 🔴 Haute |
| 7.4 | Implémenter `reset_password` (mock/stub) | 🟡 Moyenne |
| 7.5 | Implémenter `unlock_account` (mock/stub) | 🟡 Moyenne |
| 7.6 | Implémenter `list_available_roles` | 🟡 Moyenne |

**Livrables** :
- Use cases 2, 3 fonctionnels
- Workflow de demande d'accès

---

### Phase 8 : Catalogue & Services (1-2 semaines)

**Objectif** : Permettre les demandes de services.

| Tâche | Description | Priorité |
|-------|-------------|----------|
| 8.1 | Implémenter `list_service_catalog` | 🟡 Moyenne |
| 8.2 | Implémenter `prepare_service_request` | 🟡 Moyenne |
| 8.3 | Tests use case 5 | 🟡 Moyenne |

**Livrables** :
- Use case 5 (Demande de service) fonctionnel

---

### Phase 9 : Information & Profil (1 semaine)

**Objectif** : Informer l'utilisateur et gérer son profil.

| Tâche | Description | Priorité |
|-------|-------------|----------|
| 9.1 | Implémenter `list_active_incidents` | 🟡 Moyenne |
| 9.2 | Implémenter `list_announcements` | 🟡 Moyenne |
| 9.3 | Implémenter `get_user_profile` | 🟡 Moyenne |
| 9.4 | Implémenter `update_user_preferences` | 🟢 Basse |

**Livrables** :
- Use cases 7, 9 fonctionnels

---

### Phase 10 : Organisation & Validation (2 semaines)

**Objectif** : Fonctionnalités managers.

| Tâche | Description | Priorité |
|-------|-------------|----------|
| 10.1 | Implémenter `get_user_role` | 🟡 Moyenne |
| 10.2 | Implémenter `list_team_members` | 🟡 Moyenne |
| 10.3 | Implémenter `list_pending_validations` | 🟡 Moyenne |
| 10.4 | Implémenter `approve_request` | 🟡 Moyenne |
| 10.5 | Implémenter `reject_request` | 🟡 Moyenne |
| 10.6 | Implémenter `get_validation_history` | 🟢 Basse |
| 10.7 | Implémenter `get_user_rights` | 🟢 Basse |

**Livrables** :
- Use case 10 (Managers) fonctionnel

---

### Phase 11 : Sécurité & Observabilité (2 semaines)

**Objectif** : Sécuriser et monitorer l'agent.

| Tâche | Description | Priorité |
|-------|-------------|----------|
| 11.1 | Rate limiting par utilisateur | 🔴 Haute |
| 11.2 | Anti-prompt-injection | 🔴 Haute |
| 11.3 | Masquage PII dans logs | 🔴 Haute |
| 11.4 | Audit des conversations | 🟡 Moyenne |
| 11.5 | Métriques (latence, tokens, erreurs) | 🟡 Moyenne |
| 11.6 | Dashboard supervision | 🟢 Basse |

**Livrables** :
- Agent sécurisé et monitoré

---

## 📊 Mapping Use Cases → Tools

| Use Case | Tools Principaux |
|----------|------------------|
| 1. Trouver une solution | `analyze_user_intent` → `semantic_search_kb` → `generate_solution_steps` → `evaluate_confidence` |
| 2. Reset/Débloquer accès | `analyze_user_intent` → `identify_account_type` → `reset_password` / `unlock_account` |
| 3. Demander un accès | `analyze_user_intent` → `list_user_accesses` → `list_available_roles` → `prepare_access_request` |
| 4. Déclarer un incident | `analyze_user_intent` → `check_known_incident` → `qualify_incident` → `create_incident` |
| 5. Demande de service | `analyze_user_intent` → `list_service_catalog` → `prepare_service_request` → `submit_ticket` |
| 6. Suivre ses demandes | `list_user_tickets` → `get_ticket_details` → `add_ticket_comment` |
| 7. Être informé | `list_active_incidents` → `list_announcements` |
| 8. Interagir support | `get_ticket_details` → `add_ticket_comment` → `add_ticket_attachment` |
| 9. Gérer son profil | `get_user_profile` → `update_user_preferences` |
| 10. Cas managers | `get_user_role` → `list_team_members` → `list_pending_validations` → `approve_request` |

---

## 🔧 Schemas Communs

### UserContext (passé à tous les tools)

```javascript
{
  userId: "uuid",           // person_uuid
  displayName: "John Doe",
  email: "john@example.com",
  locale: "fr",
  timezone: "Europe/Paris",
  entityUuid: "uuid",       // Entité de rattachement
  roles: ["user", "manager"],
  sessionId: "uuid",        // Session conversation
  channel: "portal"         // portal | mobile | teams
}
```

### ToolResultMeta (retourné par tous les tools)

```javascript
{
  toolName: "analyze_user_intent",
  executionTimeMs: 150,
  success: true,
  errorCode: null,
  errorMessage: null,
  warnings: [],
  suggestedNextTools: ["semantic_search_kb"]
}
```

### EvidenceRef (référence à une source)

```javascript
{
  type: "kb_article" | "procedure" | "incident" | "ticket",
  id: "uuid",
  title: "Comment réinitialiser son mot de passe",
  url: "/kb/articles/123",
  relevanceScore: 0.92,
  snippet: "Pour réinitialiser votre mot de passe..."
}
```

---

## 📝 Notes Techniques

### Intégration avec l'existant

1. **Réutiliser** `backend/src/api/v1/agent/service.js` pour l'appel LLM Infomaniak
2. **Réutiliser** les services Prisma existants dans `backend-v2/src/api/v1/`
3. **Conserver** la compatibilité avec PortalViewV1 (v2 sera optionnel)

### Configuration MCP

Le serveur MCP sera configuré via variables d'environnement :

```bash
# MCP Configuration
MCP_SERVER_PORT=3001
MCP_LOG_LEVEL=info

# LLM Configuration (existant)
INFOMANIAK_AI_API_URL=...
INFOMANIAK_AI_TOKEN=...
INFOMANIAK_AI_MODEL=mixtral
```

### Gestion des erreurs

Chaque tool doit :
1. Retourner `ToolResultMeta` avec `success: false` en cas d'erreur
2. Logger l'erreur avec contexte
3. Ne jamais exposer de données sensibles dans les messages d'erreur

---

## 🚀 Quick Start (Phase 1)

```bash
# 1. Créer la structure MCP
mkdir -p backend-v2/src/mcp/tools/{comprehension,orchestration}
mkdir -p backend-v2/src/mcp/schemas
mkdir -p backend-v2/src/mcp/utils

# 2. Installer les dépendances MCP
cd backend-v2
npm install @modelcontextprotocol/sdk

# 3. Créer le serveur MCP de base
# (voir backend-v2/src/mcp/server.js)

# 4. Tester le serveur
node src/mcp/server.js
```

---

## 📚 Ressources

- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [MCP SDK TypeScript](https://github.com/modelcontextprotocol/typescript-sdk)
- [Infomaniak AI API](https://api.infomaniak.com/doc/)
- Documentation existante : `documentation/AGENT_POC_README.md`

---

## ✅ Critères de Succès

| Critère | Cible |
|---------|-------|
| Temps de réponse moyen | < 3s |
| Taux de résolution au 1er contact | > 40% |
| Satisfaction utilisateur (CSAT) | > 4/5 |
| Taux d'erreur tools | < 1% |
| Couverture des 10 use cases | 100% |

---

*Document créé le : 2026-01-11*
*Dernière mise à jour : 2026-01-11*
*Version : 1.0*
