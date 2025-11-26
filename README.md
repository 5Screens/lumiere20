# Projet Lumière 16

## Introduction

Lumière 16 est une application web moderne basée sur Vue.js pour le frontend et une API backend. L'application permet la gestion de tickets, défauts et autres entités métier dans une interface utilisateur intuitive et responsive.

## Structure du projet

Le projet est organisé en deux parties principales :

- **Frontend** : Application Vue.js avec composants réutilisables et stores Pinia
- **Backend** : API RESTful pour la gestion des données

## Documentation

Pas de doc détaillée....

## Démarrage rapide

### Prérequis

- Node.js (version recommandée : 16.x ou supérieure)
- npm ou yarn

### Installation

1. Cloner le dépôt
2. Installer les dépendances du frontend :
   ```
   cd frontend
   npm install
   ```
3. Installer les dépendances du backend :
   ```
   cd backend
   npm install
   ```

### Lancement en développement

1. Démarrer le backend :
   ```
   cd backend
   npm run dev
   ```
2. Démarrer le frontend :
   ```
   cd frontend
   npm run dev
   ```

## Fonctionnalités principales

- Gestion des tickets et défauts
- Interface à onglets hiérarchiques
- Formulaires dynamiques basés sur des modèles
- Tableaux de données avec infinite scroll (via une pagination), filtre avancé et tri
- Système de thème clair/sombre
- Support multilingue

## Architecture technique

### Stack technologique

**Frontend**
- Vue.js 3 (Composition API) avec Vue Router
- Pinia (state management avec persistance localStorage via pinia-plugin-persistedstate)
- Vue-i18n (internationalisation FR/EN)/ES/PT/+ à venir)
- Axios (via apiService centralisé)

**Backend**
- Node.js + Express (architecture RESTful)
- Winston (logging avec format `YYYY-MM-DD HH:mm:ss`)
- Joi (validation des données)

**Base de données**
- PostgreSQL avec schémas multiples (core, configuration, translations, audit)
- Extensions: uuid-ossp, unaccent
- Système d'audit automatique via triggers
- Support multilingue via tables de traduction

### Architecture applicative

**Pattern MVC standardisé** pour chaque module backend :
```
api/v1/<module>/
├── controller.js   # Gestion des requêtes HTTP
├── service.js      # Logique métier et requêtes SQL
├── routes.js       # Définition des routes
└── validation.js   # Schémas Joi
```

**Architecture frontend** :
- **Modèles métiers** : Classes JavaScript (Task, Incident, Problem, Change, etc.) encapsulant la logique métier et facilitant la conversion entre format API et format d'affichage
- **Stores Pinia** : Gestion centralisée de l'état (tabsStore, filterStore, paneStore, userProfileStore, popoverStore, objectStore)
- **Composants réutilisables** : Tableaux dynamiques, filtres avancés, formulaires génériques, champs de saisie spécialisés
- **Système d'onglets hiérarchiques** : Gestion des onglets parents/enfants avec persistance et activation intelligente

**Fonctionnalités clés** :
- Infinite scroll avec pagination côté serveur
- Filtrage avancé multilingue (4 types: search, checkbox, select, date_range)
- Tri intelligent avec mapping de colonnes calculées
- Formulaires dynamiques basés sur métadonnées
- Gestion des relations (assignations, observateurs, relations parent-enfant)
- Audit complet des modifications avec traçabilité
- Thèmes clair/sombre avec variables CSS dynamiques
