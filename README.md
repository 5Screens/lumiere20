# Projet Lumière 16

## Introduction

Lumière 16 est une application web moderne basée sur Vue.js pour le frontend et une API backend. L'application permet la gestion de tickets, défauts et autres entités métier dans une interface utilisateur intuitive et responsive.

## Structure du projet

Le projet est organisé en deux parties principales :

- **Frontend** : Application Vue.js avec composants réutilisables et stores Pinia
- **Backend** : API RESTful pour la gestion des données

## Documentation

Pour une documentation détaillée des composants, API et modèles, veuillez consulter le [Wiki du projet](./WIKI.md).

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
   npm run serve
   ```

## Fonctionnalités principales

- Gestion des tickets et défauts
- Interface à onglets hiérarchiques
- Formulaires dynamiques basés sur des modèles
- Tableaux de données avec pagination et tri
- Système de thème clair/sombre
- Support multilingue

## Architecture technique

L'application utilise une architecture où les données métiers sont manipulées via des composants Vue.js qui interagissent avec une API backend. Les modèles métiers (BaseModel, EntityModel, SymptomModel) encapsulent la logique métier et facilitent la conversion entre le format API et le format d'affichage.

Le système de gestion des onglets utilise un store Pinia centralisé, permettant une meilleure séparation des responsabilités et une gestion plus centralisée de l'état des onglets.
