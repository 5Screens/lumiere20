# Documentation Projet Lumière 16

Ce wiki documente les composants, API et modèles du projet Lumière 16. Il sert de référence rapide pour les développeurs.

## Table des matières

- [Architecture](#architecture)
- [Composants](#composants)
  - [Composants communs](#composants-communs)
  - [Formulaires](#formulaires)
  - [Panneaux](#panneaux)
- [Modèles](#modèles)
- [API](#api)
- [Stores](#stores)

## Architecture

L'application utilise une architecture où les données métiers sont manipulées via des composants Vue.js qui interagissent avec une API backend. Les modèles métiers (BaseModel, EntityModel, SymptomModel) encapsulent la logique métier et facilitent la conversion entre le format API et le format d'affichage.

Le système de gestion des onglets a été refactorisé pour utiliser un store Pinia centralisé, permettant une meilleure séparation des responsabilités et une gestion plus centralisée de l'état des onglets.

## Composants

### Composants communs

#### ButtonStandard

Un bouton réutilisable et personnalisable.

**Props:**
- `label` (String): Texte du bouton
- `type` (String, default: 'button'): Type HTML du bouton ('button', 'submit', 'reset')
- `disabled` (Boolean, default: false): Si true, désactive le bouton
- `loading` (Boolean, default: false): Si true, affiche un indicateur de chargement
- `icon` (String, default: ''): Classe d'icône à afficher à gauche du texte
- `block` (Boolean, default: false): Si true, le bouton occupe toute la largeur
- `variant` (String, default: 'primary'): Style du bouton ('primary', 'secondary', 'danger')

**Événements:**
- `click`: Émis lorsque le bouton est cliqué (si non désactivé ou en chargement)

**Exemple d'utilisation:**
```vue
<ButtonStandard
  label="Enregistrer"
  variant="primary"
  @click="handleSave"
/>
```

#### RgButton

Un composant de bouton spécialisé pour les actions de confirmation/annulation.

**Événements:**
- `confirm`: Émis lorsque l'action est confirmée
- `cancel`: Émis lorsque l'action est annulée

**Exemple d'utilisation:**
```vue
<RgButton
  @confirm="confirmAction"
  @cancel="cancelAction"
  :disabled="isDisabled"
/>
```

#### STextField

Champ de texte avec support d'édition et de mise à jour via API.

**Props:**
- `label` (String, default: ''): Étiquette du champ
- `modelValue` (String|Number, required): Valeur liée au v-model
- `placeholder` (String, default: ''): Texte d'indication
- `disabled` (Boolean, default: false): Si true, désactive le champ
- `readonly` (Boolean, default: false): Si true, rend le champ en lecture seule
- `required` (Boolean, default: false): Si true, marque le champ comme requis
- `error` (String, default: ''): Message d'erreur à afficher
- `helperText` (String, default: ''): Texte d'aide à afficher
- `inputType` (String, default: 'text'): Type d'input ('text', 'number', 'email', 'password', 'tel')
- `min` (Number|String): Valeur minimale (pour type number)
- `max` (Number|String): Valeur maximale (pour type number)
- `step` (Number|String): Pas d'incrémentation (pour type number)
- `uuid` (String, default: ''): UUID de l'entité pour les requêtes API
- `fieldName` (String, default: ''): Nom du champ pour les requêtes API
- `apiEndpoint` (String, default: ''): Point d'API pour les mises à jour
- `editMode` (Boolean, default: false): Si true, active le mode d'édition avec boutons de confirmation

**Événements:**
- `update:modelValue`: Émis lorsque la valeur change
- `field-updated`: Émis après une mise à jour réussie via API
- `field-change-cancelled`: Émis lorsque l'édition est annulée

**Exemple d'utilisation:**
```vue
<STextField
  v-model="entity.name"
  label="Nom"
  required
  :uuid="entity.id"
  fieldName="name"
  apiEndpoint="/api/v1/entities"
  editMode
  @field-updated="handleUpdate"
/>
```

#### SSelectField

Champ de sélection avec chargement d'options via API et support d'édition.

**Props:**
- `modelValue` (String, default: ''): Valeur liée au v-model
- `mode` (String, required): Mode d'utilisation ('creation', 'edition')
- `initialValue` (String, default: ''): Valeur initiale
- `uuid` (String): UUID de l'entité pour les requêtes API
- `optionsEndpoint` (String, required): Point d'API pour charger les options
- `patchEndpoint` (String): Point d'API pour les mises à jour
- `label` (String, default: ''): Étiquette du champ
- `required` (Boolean, default: false): Si true, marque le champ comme requis
- `fieldName` (String, default: 'entity_type'): Nom du champ pour les requêtes API

**Événements:**
- `update:modelValue`: Émis lorsque la valeur change
- `change`: Émis lorsque la sélection change
- `update:success`: Émis après une mise à jour réussie via API
- `update:error`: Émis en cas d'erreur lors de la mise à jour
- `update:cancelled`: Émis lorsque l'édition est annulée

**Exemple d'utilisation:**
```vue
<SSelectField
  v-model="data.type"
  label="Type"
  required
  :options-endpoint="'types?lang=fr&toSelect=yes'"
  mode="edition"
  :uuid="data.id"
  patchEndpoint="/api/v1/entities"
  @update:success="handleSuccess"
/>
```

#### HierarchicalTabs

Système d'onglets hiérarchiques pour organiser le contenu.

**Utilisation:**
Le composant HierarchicalTabs utilise un store Pinia centralisé pour gérer les onglets. Les onglets peuvent être ajoutés, fermés et organisés hiérarchiquement.

#### ReusableTableTab

Composant de tableau réutilisable avec pagination et fonctionnalités de tri.

### Formulaires

#### ObjectEditView

Composant modal pour la création d'objets (Ticket ou Defect).

**Props:**
- `visible` (Boolean, default: false): Contrôle la visibilité du modal

**Événements:**
- `close`: Émis lorsque le modal est fermé
- `submit`: Émis lorsque le formulaire est soumis, avec les données du formulaire

**Exemple d'utilisation:**
```vue
<ObjectEditView
  :visible="showModal"
  @close="closeModal"
  @submit="handleSubmit"
/>
```

#### EntityForm

Formulaire pour la création et l'édition d'entités.

#### SymptomsForm

Formulaire pour la création et l'édition de symptômes.

### Panneaux

#### SprintCenterPane

Panneau de gestion des sprints.

#### AdminPane

Panneau d'administration.

#### ConfigurationPane

Panneau de configuration.

#### DataPane

Panneau de gestion des données.

#### ProfilePane

Panneau de profil utilisateur.

#### ServiceHubPane

Panneau de gestion des services.

## Modèles

### BaseModel

Classe de base pour tous les modèles avec fonctionnalités communes.

### EntityModel

Modèle pour les entités.

### SymptomModel

Modèle pour les symptômes.

### Ticket

Modèle pour les tickets.

### Defect

Modèle pour les défauts.

## API

L'application utilise un service API centralisé (`apiService`) pour communiquer avec le backend. Ce service gère les requêtes HTTP et la gestion des erreurs.

### Points d'API principaux

- `/api/v1/entities` - Gestion des entités
- `/api/v1/symptoms` - Gestion des symptômes
- `/api/v1/ticket_types` - Types de tickets
- `/api/v1/tickets` - Gestion des tickets
- `/api/v1/defects` - Gestion des défauts

## Stores

L'application utilise Pinia pour la gestion d'état centralisée.

### TabsStore

Store pour la gestion des onglets dans l'application.

### UserProfileStore

Store pour la gestion des informations de profil utilisateur.
