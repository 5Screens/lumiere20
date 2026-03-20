# Lumière — Plateforme ITSM Nouvelle Génération

> **IT Service Management · Portail Utilisateur · Agent IA Conversationnel**

---

## Le Problème

Les entreprises dépendent d'outils ITSM souvent **rigides, coûteux et difficiles à personnaliser** (ServiceNow, BMC Remedy, Jira Service Management). Les équipes IT perdent du temps à administrer l'outil au lieu de servir leurs utilisateurs. Les utilisateurs finaux, eux, se retrouvent face à des interfaces complexes qui découragent l'adoption.

## La Solution : Lumière

**Lumière** est une plateforme ITSM moderne, modulaire et intelligente qui réunit en un seul produit :

- Un **back-office IT complet** pour les techniciens et managers
- Un **portail utilisateur** simple et personnalisable
- Un **agent IA conversationnel** (texte + voix) pour l'assistance autonome

---

## 🏗️ Architecture & Technologie

| Couche | Technologie | Avantage |
|--------|------------|----------|
| **Frontend IT** | Vue.js 3, PrimeVue 4, Tailwind CSS 4 | Interface réactive, moderne, accessible |
| **Portail Utilisateur** | Application Vue.js dédiée | Expérience simplifiée pour les end-users |
| **API Backend** | Node.js, Express, API RESTful | Performant, scalable, facile à intégrer |
| **Base de données** | PostgreSQL 16, Prisma ORM | Fiable, multi-schémas, migrations automatisées |
| **IA** | Mistral AI (LLM), Gradium (Voix) | IA souveraine européenne |
| **Déploiement** | Docker Compose, Nginx, Let's Encrypt SSL | Production-ready en quelques minutes |

---

## ✨ Fonctionnalités Implémentées

### 1. Gestion des Tickets — Multi-types

Lumière gère nativement **plusieurs types de tickets**, chacun avec son propre cycle de vie :

- **Incidents** — Signaler et résoudre les pannes
- **Problèmes** — Identifier les causes racines
- **Changements** — Planifier et suivre les évolutions
- **Demandes** — Traiter les requêtes utilisateurs
- **Projets** — Piloter les initiatives IT
- **Défauts** — Suivre les bugs applicatifs

**Points forts :**
- Champs étendus dynamiques par type de ticket (formulaires adaptatifs)
- Assignation à un groupe et/ou une personne
- Relations parent/enfant entre tickets (dépendances)
- Watchers (observateurs) pour le suivi transverse
- Pièces jointes polymorphiques (fichiers, documents)

---

### 2. CMDB — Configuration Management Database

Un référentiel complet des actifs IT avec **catégorisation hiérarchique** :

- **Types de CI** configurables : Serveurs, Postes, Réseaux, Contrats, Licences, Applications...
- **Catégories de CI** avec icônes et organisation visuelle
- **Champs étendus par type** : chaque type de CI possède ses propres attributs (RAM, CPU, IP pour un serveur ; date d'expiration pour un contrat, etc.)
- **Relation modèle/instances** : un modèle de serveur peut avoir N instances physiques
- **Lien avec les tickets** : chaque ticket peut être rattaché à un CI

---

### 3. Catalogue de Services — ITIL-compliant

Une gestion complète du catalogue de services conforme aux bonnes pratiques ITIL :

- **Services** — Avec criticité business, entité propriétaire, responsables
- **Offres de services** (Service Offerings) — Déclinaisons d'un service par environnement, modèle tarifaire, devise
- **Engagements SLA** (Commitments) — Lien entre SLA et offres de services avec pourcentage cible
- **Définitions SLA** — Temps de résolution, temps de réponse, disponibilité, avec calendrier associé
- **Catalogue de demandes** (Request Catalog Items) — Éléments commandables par les utilisateurs, avec formulaires dynamiques et icônes
- **Souscriptions** — Abonnement des groupes d'utilisateurs, entités, sites aux offres de services
- **Périmètre CI** — Association des CIs couverts par chaque offre de service

---

### 4. Gestion Organisationnelle

- **Entités** — Organisations (entreprises, départements, filiales) avec hiérarchie parent/enfant, approbateur budget, siège
- **Sites / Locations** — Adresses, criticité, heures d'ouverture, hiérarchie géographique, réseau & télécom
- **Personnes** — Profils complets : rôle, langue, entité, site, manager, téléphones, délégations, utilisateur critique, externe
- **Groupes** — Équipes de support avec niveaux, superviseur, manager, membres
- **Rôles** — Système de rôles avec permissions (user, technician, manager, admin)
- **Relations N:N** — Personnes ↔ Groupes, Personnes ↔ Entités, Entités ↔ Sites, Personnes ↔ Délégués

---

### 5. Moteur de Workflows Graphique

Un éditeur visuel de workflows basé sur **Vue Flow** permettant de modéliser graphiquement les cycles de vie :

- **Éditeur drag-and-drop** — Canvas interactif avec nœuds (statuts) et arêtes (transitions)
- **4 catégories de statuts** — À faire, En cours, En attente, Terminé (couleurs configurables)
- **Transitions multi-sources** — Une transition peut avoir plusieurs statuts d'origine
- **Option "Accessible depuis n'importe quel état"** — Pour les statuts globaux (ex: Annulé)
- **Statut initial** — Définition du point d'entrée du workflow
- **Actions automatisées** — Déclencheurs on_enter/on_exit/on_transition avec 15+ types d'actions :
  - Recherche/Création/Mise à jour/Suppression d'enregistrements
  - Envoi d'emails et notifications
  - Appels REST externes
  - Approbations
  - Conditions, boucles, parallélisme
- **Association flexible** — Un workflow par type d'objet ou par sous-type (ex: workflow spécifique pour les incidents vs les problèmes)
- **Panel latéral** — Édition des propriétés de chaque statut et transition
- **Audit** — Traçabilité complète des changements de statut

---

### 6. Agent IA Conversationnel

Un assistant intelligent intégré, propulsé par **Mistral AI** :

- **Chat textuel** — Interface conversationnelle dans le portail utilisateur
- **Function Calling** — L'agent peut exécuter des actions concrètes :
  - Rechercher et consulter des tickets
  - Créer de nouveaux tickets
  - Interroger la base de connaissances
  - Fallback vers les connaissances générales du LLM
- **Boucle agentique** — Jusqu'à 5 itérations d'outils par requête pour des réponses précises
- **Historique des conversations** — Persisté en base, reprise de contexte
- **Feedback utilisateur** — Boutons pouce haut/pouce bas sur chaque réponse
- **Multilingue** — Répond dans la langue de l'utilisateur (FR, EN, ES, PT, DE)
- **Health check** — Monitoring de la connectivité LLM et base de données

---

### 7. Interface Vocale (STT/TTS)

Intégration avec **Gradium** pour une interaction voix naturelle :

- **Speech-to-Text** — Transcription en temps réel via WebSocket (latence < 300ms)
- **Text-to-Speech** — Synthèse vocale naturelle avec voix dédiées par langue
- **Full-duplex** — Mode conversation naturelle (parler et écouter simultanément)
- **5 langues** — Français, Anglais, Allemand, Espagnol, Portugais
- **Voix personnalisables** — Une voix configurée par langue
- **IA souveraine** — Serveurs européens (Gradium EU)

---

### 8. Portail Utilisateur (Self-Service)

Une application dédiée aux utilisateurs finaux :

- **Portails configurables** — Chaque portail a son thème (couleurs primaire/secondaire), logo, titre, sous-titre
- **Message de bienvenue personnalisé** — Templates dynamiques
- **Actions rapides** — Boutons configurables (créer un ticket, consulter le catalogue, etc.)
- **Alertes** — Messages d'information/avertissement avec sévérité, dates de validité et icônes
- **Widgets** — Composants configurables (statistiques, raccourcis, etc.)
- **Chat IA intégré** — Agent conversationnel texte + voix
- **OCR de documents** — Upload et reconnaissance optique de caractères
- **Gestion des documents** — Tiroir de documents uploadés
- **Authentification** — Login sécurisé avec session management

---

### 9. Système de Métadonnées Dynamiques (No-Code)

Un moteur de configuration sans code pour personnaliser l'application :

- **Object Types** — Définition des types d'objets métier avec endpoint API, tri par défaut, champs d'affichage
- **Object Fields** — Configuration de chaque champ : type, validation, visibilité table/formulaire/détail, tri, filtre, édition inline, traductibilité
- **Types de champs supportés** — text, number, boolean, date, datetime, select, multiselect, relation, reverse_link, reverse_link_mn, textarea
- **Visibilité conditionnelle** — Expressions logiques pour afficher/masquer des champs (AND, OR, comparaisons, parenthèses)
- **Object Setup** — Valeurs de référence configurable (catégories, urgences, impacts, sévérités, codes résolution...) avec icônes, couleurs, style de police
- **Champs étendus CI/Tickets** — Chaque type de CI et type de ticket peut avoir ses propres champs personnalisés stockés en JSON

---

### 10. Internationalisation Complète

- **Interface multilingue** — Français, Anglais (extensible ES, PT, DE, ZH...)
- **Traductions dynamiques** — Table `translated_fields` pour traduire n'importe quel label, description, nom de statut, etc.
- **Champs traduisibles** — Les champs marqués `is_translatable` dans les métadonnées sont automatiquement traduits selon la locale de l'utilisateur
- **Composant TranslatableInput** — Saisie des traductions directement dans les formulaires
- **Locale PrimeVue intégrée** — Calendriers, filtres, messages de validation dans la langue de l'utilisateur

---

### 11. Gestion du Temps & SLA

- **Calendriers** — Plannings hebdomadaires configurables (horaires d'ouverture par jour) avec héritage parent/enfant
- **Fuseaux horaires** — Table de référence complète avec offset UTC
- **Jours fériés** — Gestion des jours fériés par pays, récurrents ou ponctuels
- **Association fériés ↔ calendriers** — Relation N:N configurable
- **SLA** — Définitions avec type de métrique (temps de résolution, temps de réponse, disponibilité), valeur cible, unité, priorité, calendrier associé

---

### 12. Sécurité & Audit

- **Authentification JWT** — Tokens sécurisés avec rôle utilisateur
- **Système de rôles** — 4 niveaux (user, technician, manager, admin) avec permissions JSON
- **Mot de passe** — Hash sécurisé, reset forcé, verrouillage de compte
- **Audit complet** — Chaque création, modification, suppression est tracée avec :
  - Utilisateur responsable
  - Type d'événement
  - Champ modifié
  - Ancienne et nouvelle valeur
  - Horodatage
- **Vue d'audit** — Interface dédiée pour consulter l'historique des modifications d'un objet

---

### 13. Interface Utilisateur Moderne

- **Thème clair/sombre** — Basculement instantané avec variables CSS dynamiques
- **Système d'onglets hiérarchiques** — Navigation parent/enfant avec persistance
- **Recherche globale** — Recherche transversale sur tickets, CIs, personnes, entités, sites, groupes, symptômes
- **Infinite scroll** — Pagination serveur transparente pour les grandes listes
- **Filtres avancés** — 4 types (recherche texte, checkbox, select, plage de dates)
- **Tri intelligent** — Tri côté serveur avec mapping de colonnes calculées
- **Édition inline** — Modification directe des champs depuis la vue détail
- **Profil utilisateur** — Tiroir latéral avec préférences (langue, thème, date format)
- **Animations subtiles** — Transitions fluides sur les menus, apparition du contenu
- **Responsive design** — Adaptation automatique à la taille d'écran

---

### 14. Symptômes & Causes

- **Catalogue de symptômes** — Symptômes observés par les utilisateurs (traduisibles)
- **Catalogue de causes** — Causes racines des incidents/problèmes (traduisibles)
- **Association N:N avec les services** — Chaque service peut avoir ses symptômes et causes spécifiques
- **Interface checkboxes** — Sélection/désélection avec recherche, filtres, select all/deselect all, compteur

---

### 15. User Sets — Ensembles Dynamiques d'Utilisateurs

Définition d'audiences par critères combinés :

- **9 filtres combinables** — Rôle, langue, entité, site, manager approbateur, actif, critique, externe, email
- **Critères stockés en JSON** — Flexibilité maximale
- **Utilisable pour les souscriptions** — Abonner un ensemble d'utilisateurs à une offre de service

---

### 16. Déploiement Production-Ready

- **Docker Compose** — 5 services orchestrés (PostgreSQL, Backend, Frontend, Portal, Nginx)
- **SSL automatique** — Certbot pour les certificats Let's Encrypt
- **Reverse proxy Nginx** — Routage frontend/backend/portal
- **Script de déploiement** — `deploy.sh` et `upload-to-server.ps1` pour un déploiement en une commande
- **Variables d'environnement** — Configuration sécurisée sans données sensibles dans le code

---

## 📊 Chiffres Clés

| Métrique | Valeur |
|----------|--------|
| **Modules API backend** | 40 |
| **Modèles de données Prisma** | 38 tables |
| **Schémas PostgreSQL** | 6 (data, core, configuration, translations, audit, workflow) |
| **Composants frontend** | 73+ composants Vue.js |
| **Services frontend** | 31 services API |
| **Langues supportées** | 2 actuellement (FR, EN), extensible à 10+ |
| **Types de tickets** | Configurable (Incident, Problem, Change, Request, Project, Defect...) |
| **Types d'actions workflow** | 15+ |
| **Filtres User Sets** | 9 critères combinables |

---

## 🎯 Positionnement Marché

### vs ServiceNow
| | ServiceNow | Lumière |
|---|---|---|
| **Prix** | 75-150€/utilisateur/mois | Licence flexible |
| **Déploiement** | Cloud uniquement | On-premise ou Cloud |
| **Personnalisation** | Complexe (GlideScript) | No-code via métadonnées |
| **IA** | Virtual Agent (basique) | Agent conversationnel + Voix |
| **Mise en service** | 3-12 mois | Quelques jours |

### vs Jira Service Management
| | Jira SM | Lumière |
|---|---|---|
| **CMDB** | Module séparé (Insight) | Intégré nativement |
| **Workflows** | Éditeur basique | Éditeur graphique avancé avec actions |
| **Portail** | Limité | Portail dédié configurable |
| **IA vocale** | Absent | STT/TTS intégré |
| **Souveraineté** | Cloud Atlassian (US) | IA européenne (Mistral + Gradium) |

### vs GLPI
| | GLPI | Lumière |
|---|---|---|
| **UX** | Interface datée | UI moderne (Vue.js 3 + PrimeVue) |
| **IA** | Absent | Agent conversationnel complet |
| **Portail** | Basique | Portail riche avec chat IA + voix |
| **Workflows** | Règles métier basiques | Éditeur graphique + actions automatisées |
| **Multi-langue** | Traductions statiques | Traductions dynamiques par entité |

---

## 🚀 Cas d'Usage Cibles

1. **PME / ETI** (200-5000 employés) — Alternative moderne à GLPI/iTop sans la complexité ServiceNow
2. **Infogérance / MSP** — Plateforme multi-tenant pour gérer plusieurs clients
3. **DSI grandes entreprises** — Module complémentaire ou remplacement progressif
4. **Collectivités / Administrations** — Hébergement on-premise, IA souveraine européenne
5. **ESN / Intégrateurs** — Solution white-label personnalisable

---

## 💡 Points Différenciants Clés

1. **IA Conversationnelle + Voix** — Unique sur le marché ITSM mid-market
2. **Souveraineté Numérique** — Mistral AI + Gradium = 100% européen
3. **No-Code Metadata Engine** — Personnalisation profonde sans développement
4. **Workflow Editor Graphique** — Modélisation visuelle des cycles de vie
5. **Architecture Moderne** — Stack JavaScript full-stack, déploiement Docker
6. **Time-to-Value** — Opérationnel en jours, pas en mois
7. **Coût Total de Possession** — Pas de licence par utilisateur excessive

---

## 📞 Contact

**Lumière ITSM** — *IT Service Management, Reinvented.*

---

*Document généré le 19 mars 2026*
