# Implémentation Frontend - Module Portails

## Vue d'ensemble

Module d'administration permettant de gérer les portails utilisateurs avec activation/désactivation via l'interface principale.

## Architecture

### Services API

**`src/services/portalsService.js`**
- `listPortals(params)` - Liste des portails avec filtres (is_active, q)
- `activatePortal(uuid, is_active)` - Active/désactive un portail
- `listPortalActions(uuid)` - Actions disponibles (future preview)

### Composants

#### 1. **AdminPortals.vue** (Vue principale)
- **Localisation**: `src/components/admin/AdminPortals.vue`
- **Fonctionnalités**:
  - Grille responsive de vignettes de portails
  - Recherche avec debounce (300ms)
  - Filtres par état (Tous/Actifs/Inactifs)
  - Statistiques (total, actifs, inactifs)
  - États: loading, empty, error
  - Mise à jour optimiste avec rollback

#### 2. **PortalCard.vue** (Vignette)
- **Localisation**: `src/components/admin/portals/PortalCard.vue`
- **Contenu**:
  - Miniature (PortalThumbnail)
  - Nom + code + URL
  - Badge état (Actif/Inactif)
  - Toggle d'activation
  - Métadonnées (date de création)

#### 3. **PortalThumbnail.vue** (Miniature)
- **Localisation**: `src/components/admin/portals/PortalThumbnail.vue`
- **Modes**:
  - Image si `thumbnail_url` disponible
  - Iframe live si `base_url` (désactivé par défaut pour performance)
  - Placeholder avec icône + code

#### 4. **PortalToggle.vue** (Bouton switch)
- **Localisation**: `src/components/admin/portals/PortalToggle.vue`
- **Caractéristiques**:
  - Style "pico" moderne (44x24px)
  - États: on/off/loading
  - Accessible (role="switch", aria-checked)
  - Animation fluide

## Intégration

### Menu & Navigation

**`src/stores/paneStore.js`**
```javascript
admin: {
  items: [
    { 
      tabToOpen: 'portals', 
      icon: 'fas fa-portal', 
      label: 'admin.portals', 
      className: null, 
      component: 'AdminPortals' 
    },
    // ... autres items
  ]
}
```

### Système d'onglets

**`src/components/common/hierarchicalTabs.vue`**
- Support des composants personnalisés via `tab.component`
- Utilisation de `<component :is="tab.component" />` pour AdminPortals
- Fallback vers ObjectsTab pour les grilles standard

**`src/App.vue`**
- `handleOpenTab()` - Gère les composants personnalisés
- `handleTooltipItemClick()` - Idem pour le tooltip menu

## Traductions

### Français (`src/i18n/fr.js`)
```javascript
admin: {
  portals: 'Portails'
},
portals: {
  page_title: 'Gestion des portails',
  page_subtitle: 'Gérez les portails utilisateurs et leur activation',
  search_placeholder: 'Rechercher un portail (nom, code)...',
  filter_all: 'Tous les portails',
  filter_active: 'Actifs uniquement',
  filter_inactive: 'Inactifs uniquement',
  // ... autres clés
}
```

### Anglais (`src/i18n/en.js`)
```javascript
admin: {
  portals: 'Portals'
},
portals: {
  page_title: 'Portal Management',
  page_subtitle: 'Manage user portals and their activation',
  // ... autres clés
}
```

## Flux utilisateur

1. **Accès**: Admin → Portails (menu latéral ou tooltip)
2. **Chargement**: GET `/api/v1/portals?lang=fr`
3. **Recherche**: Debounce 300ms → GET avec `?q=query`
4. **Filtrage**: Select état → GET avec `?is_active=true/false`
5. **Activation**: 
   - Clic toggle → Mise à jour optimiste
   - PATCH `/api/v1/portals/:uuid/activate` avec `{ is_active: bool }`
   - Succès → Toast de confirmation
   - Erreur → Rollback + Toast d'erreur

## Gestion d'état

### Loading
- Skeleton cards pendant le chargement initial
- Spinner sur le bouton refresh
- Spinner dans le toggle pendant l'action

### Empty state
- Icône + message si aucun portail
- CTA "Créer" (pour future étape)

### Erreurs
- Notification globale via `tabsStore.setMessage()`
- Rollback optimiste en cas d'échec API
- Logs détaillés dans la console

## Styles

### Variables CSS utilisées
- `--primary-color` - Couleur principale
- `--background-primary` - Fond principal
- `--background-secondary` - Fond secondaire
- `--border-color` - Bordures
- `--text-color` - Texte principal
- `--text-secondary` - Texte secondaire

### Responsive
- Grid: `repeat(auto-fill, minmax(320px, 1fr))`
- Mobile: 1 colonne, toolbar en colonne

## Performance

### Optimisations
- Debounce sur la recherche (300ms)
- Keep-alive pour conserver l'état des onglets
- Iframe désactivé par défaut (showIframe=false)
- Lazy loading des images

### Bundle
- Pas de dépendances externes ajoutées
- Composants légers (~15KB total)

## Accessibilité

- Toggle avec `role="switch"` et `aria-checked`
- Images avec `alt` descriptif
- Iframe avec `title`
- Focus visible sur tous les éléments interactifs
- Contraste respecté (WCAG AA)

## Tests manuels

### Checklist
- [ ] Menu Admin → Portails visible
- [ ] Liste se charge au montage
- [ ] Recherche fonctionne avec debounce
- [ ] Filtres par état appliqués
- [ ] Toggle active/désactive un portail
- [ ] Mise à jour optimiste + rollback si erreur
- [ ] Toasts succès/erreur affichés
- [ ] Miniatures affichées (image ou placeholder)
- [ ] Bouton refresh recharge la liste
- [ ] Responsive mobile OK
- [ ] Traductions FR/EN OK
- [ ] Aucun warning console

## Évolutions futures

### Court terme
- Bouton "Créer un portail"
- Modal de création/édition
- Preview iframe au survol (optionnel)

### Moyen terme
- Pagination si > 50 portails
- Tri par colonne (nom, date, état)
- Actions en masse (activer/désactiver plusieurs)
- Export CSV/Excel

### Long terme
- Gestion des permissions par portail
- Statistiques d'utilisation
- Logs d'accès par portail
- Thèmes personnalisés par portail

## Dépendances

### Existantes (réutilisées)
- Vue 3 Composition API
- Pinia (stores)
- Vue-i18n (traductions)
- apiService (requêtes HTTP)
- Font Awesome (icônes)

### Nouvelles
Aucune dépendance externe ajoutée.

## Fichiers créés/modifiés

### Créés (7 fichiers)
1. `frontend/src/services/portalsService.js`
2. `frontend/src/components/admin/AdminPortals.vue`
3. `frontend/src/components/admin/portals/PortalCard.vue`
4. `frontend/src/components/admin/portals/PortalThumbnail.vue`
5. `frontend/src/components/admin/portals/PortalToggle.vue`
6. `frontend/PORTALS_IMPLEMENTATION.md` (ce fichier)

### Modifiés (5 fichiers)
1. `frontend/src/stores/paneStore.js` - Ajout entrée menu
2. `frontend/src/components/common/hierarchicalTabs.vue` - Support composants custom
3. `frontend/src/App.vue` - Gestion composants custom
4. `frontend/src/i18n/fr.js` - Traductions françaises
5. `frontend/src/i18n/en.js` - Traductions anglaises

## Notes techniques

### Pattern composant personnalisé
Le système permet maintenant d'ouvrir des composants Vue arbitraires dans les onglets en spécifiant `component: 'NomComposant'` dans la configuration du menu. Cela évite de passer par le système de grilles (ObjectsTab) pour les pages d'administration spéciales.

### Gestion des erreurs
Toutes les erreurs API sont interceptées et affichées via le système de notification global existant (`tabsStore.setMessage()`). Les logs détaillés sont disponibles dans la console avec le préfixe `[ADMIN PORTALS]` ou `[PORTALS SERVICE]`.

### Cohérence avec l'existant
L'implémentation suit strictement les patterns existants de l'application:
- Structure des composants (Composition API)
- Gestion des états (Pinia stores)
- Styles (variables CSS du thème)
- Traductions (Vue-i18n)
- Logs (console avec préfixes)
