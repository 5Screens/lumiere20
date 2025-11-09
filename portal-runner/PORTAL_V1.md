# 🎨 Portal Self-Service v1 - Documentation

## 📋 Vue d'ensemble

Le portail self-service v1 est une interface utilisateur complète permettant aux employés d'accéder aux services IT de manière autonome.

## 🚀 Démarrage

### Prérequis
- Base de données PostgreSQL avec les scripts exécutés :
  - `database/scripts/18_create_portals.sql`
  - `database/data/18_portals_seed_data.sql`
- Backend Lumière démarré sur `http://localhost:3000`

### Installation
```bash
cd portal-runner
npm install
npm run dev
```

L'application sera disponible sur `http://localhost:7240`

## 🌐 URLs disponibles

Tous les portails sont chargés dynamiquement depuis la base de données via `/:portalCode` :

- **Self-Service L** : `http://localhost:7240/self-service-l` (portail complet)
- **POC Portal** : `http://localhost:7240/poc` (proof of concept)
- **Self-Service S** : `http://localhost:7240/self-service-s` (portail simplifié)

## 🏗️ Architecture

### Composants créés

#### 1. **AlertBanner.vue**
Affiche les alertes configurées en base de données.
- Types supportés : `info`, `warning`, `error`
- Icônes automatiques selon le type
- Styles différenciés par type

#### 2. **QuickActionCard.vue**
Carte d'action rapide cliquable.
- Support des icônes Font Awesome ou images
- Exécution d'API configurée en BDD
- États : normal, hover, loading, disabled
- Émission d'événements success/error

#### 3. **DashboardWidget.vue**
Widget dynamique du dashboard.
- Types supportés : `counter`, `list`, `chart`, `custom`
- Appels API automatiques configurés en BDD
- Auto-refresh configurable
- États : loading, error, data

#### 4. **ChatPanel.vue**
Panneau de chat avec l'assistant Lumière.
- Messages utilisateur et bot
- Textarea auto-extensible (max 25% hauteur)
- Scroll automatique vers le bas
- Réponse par défaut configurable en BDD

#### 5. **PortalViewV1.vue**
Vue principale du portail self-service.
- Layout responsive (75% contenu / 25% chat)
- Thème dynamique depuis BDD
- Sections : header, alerts, welcome, quick actions, widgets, chat, footer
- Toast notifications pour feedback utilisateur

### Services API

#### `portals.js`
```javascript
// Récupérer la config complète du portail
getFullPortal(code)

// Exécuter l'API d'un widget
executeWidgetApi(widget)
```

## 📊 Configuration en base de données

### Table `core.portals`
```sql
- title                    -- "Lumière Self-service"
- subtitle                 -- "Portail des employés"
- welcome_template         -- "Bienvenue {firstName} !"
- logo_url                 -- URL du logo
- theme_primary_color      -- "#FF6B00"
- theme_secondary_color    -- "#111111"
- show_chat                -- true/false
- show_alerts              -- true/false
- chat_default_message     -- "En cours d'implémentation"
```

### Table `core.portal_actions`
```sql
- display_title            -- "Demander l'accès à une application"
- description              -- Description de l'action
- icon_type                -- "fontawesome" | "image"
- icon_value               -- "fa-laptop" | URL
- is_quick_action          -- true/false
- display_order            -- Ordre d'affichage
- is_visible               -- true/false
- http_method              -- POST, GET, etc.
- endpoint                 -- "/api/v1/tickets"
- payload_json             -- Payload de la requête
- headers_json             -- Headers HTTP
```

### Table `core.portal_alerts`
```sql
- message                  -- Texte de l'alerte
- alert_type               -- "info" | "warning" | "error"
- start_date               -- Date de début
- end_date                 -- Date de fin (NULL = permanent)
- is_active                -- true/false
- display_order            -- Ordre d'affichage
```

### Table `core.portal_widgets`
```sql
- widget_code              -- "PENDING_VALIDATIONS"
- display_title            -- "Validations en attente"
- widget_type              -- "counter" | "list" | "chart" | "custom"
- api_endpoint             -- "/api/v1/tickets/search/tasks"
- api_method               -- "POST" | "GET"
- api_params               -- Paramètres JSON de l'API
- refresh_interval         -- Secondes (0 = pas d'auto-refresh)
- is_visible               -- true/false
- display_order            -- Ordre d'affichage
```

## 🎨 Personnalisation

### Thème
Les couleurs sont configurables par portail :
```javascript
// Appliqué automatiquement via CSS variables
--primary-color: #FF6B00
--secondary-color: #111111
```

### Message de bienvenue
Template avec placeholders :
```
"Bienvenue {firstName} !"
```
Actuellement hardcodé à "John" pour le POC.

### Icônes
Deux types supportés :
- **Font Awesome** : `icon_type: 'fontawesome'`, `icon_value: 'fa-laptop'`
- **Image** : `icon_type: 'image'`, `icon_value: 'https://...'`

## 📱 Responsive

### Desktop (> 768px)
- Layout 75% / 25% (contenu / chat)
- Grilles multi-colonnes pour actions et widgets

### Mobile (≤ 768px)
- Chat en haut (300px fixe)
- Contenu en dessous
- Grilles en colonne unique
- Chat prioritaire (comme spécifié)

## 🔧 Développement

### Ajouter une nouvelle action rapide
1. Insérer dans `core.portal_actions` avec `is_quick_action = true`
2. Définir `display_title`, `description`, `icon_value`
3. Configurer `http_method`, `endpoint`, `payload_json`
4. L'action apparaît automatiquement

### Ajouter un nouveau widget
1. Insérer dans `core.portal_widgets`
2. Définir `widget_type` (counter, list, chart, custom)
3. Configurer `api_endpoint`, `api_method`, `api_params`
4. Optionnel : `refresh_interval` pour auto-refresh
5. Le widget apparaît automatiquement

### Ajouter une alerte
1. Insérer dans `core.portal_alerts`
2. Définir `alert_type` (info, warning, error)
3. Configurer `start_date` et `end_date`
4. L'alerte s'affiche automatiquement dans la période

## ✅ Fonctionnalités implémentées

- ✅ Configuration 100% en base de données
- ✅ Thème dynamique (couleurs configurables)
- ✅ 4 actions rapides avec icônes
- ✅ Alertes avec types et dates de validité
- ✅ Widgets dashboard avec auto-refresh
- ✅ Chat fonctionnel avec réponse par défaut
- ✅ Responsive mobile-first
- ✅ Toast notifications
- ✅ Loading states
- ✅ Error handling
- ✅ Animations fluides

## 🚧 Améliorations futures

- [ ] Authentification utilisateur réelle
- [ ] Récupération du firstName depuis le profil
- [ ] Chat avec IA (remplacer message par défaut)
- [ ] Widgets chart avec graphiques
- [ ] Filtres sur les widgets
- [ ] Historique des actions
- [ ] Notifications push
- [ ] Multi-langue (i18n)
- [ ] Dark mode
- [ ] Accessibilité (ARIA)

## 📝 Notes techniques

### Gestion des widgets
Les widgets appellent automatiquement leur API configurée :
- Format POST : `api_params` envoyé dans le body
- Format GET : `api_params` envoyé en query string
- Réponse attendue : `{ total, data: [...] }` ou `[...]`

### Gestion du chat
- Messages stockés en mémoire (session)
- Textarea auto-extensible jusqu'à 25% hauteur
- Scroll automatique vers les nouveaux messages
- Réponse bot configurable en BDD

### Sécurité
- Headers sensibles masqués côté backend
- Validation Joi sur tous les endpoints
- CORS configuré pour le portal-runner
- Pas de secrets exposés côté frontend

## 🎯 Endpoints API utilisés

- `GET /api/v1/portals/:code/full` - Configuration complète du portail
- `POST /api/v1/tickets` - Création de tickets (via actions)
- `POST /api/v1/tickets/search/tasks` - Recherche de tickets (via widgets)
- `GET /api/v1/notifications/unread` - Notifications (via widgets)

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs backend (`[SERVICE]`, `[CONTROLLER]`, `[ROUTES]`)
2. Vérifier les logs frontend (console navigateur)
3. Vérifier la configuration en BDD (tables `core.portal_*`)
