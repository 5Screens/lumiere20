# Intégration des locales PrimeVue avec Vue-i18n

## Vue d'ensemble

Ce document explique comment les traductions PrimeVue sont intégrées avec le système Vue-i18n de l'application.

## Architecture

### 1. Fichiers de traduction

Les traductions PrimeVue sont stockées dans les fichiers i18n sous la clé `primevue` :

- `frontend/src/i18n/fr.js` - Traductions françaises
- `frontend/src/i18n/en.js` - Traductions anglaises
- `frontend/src/i18n/es.js` - Traductions espagnoles (à compléter)
- `frontend/src/i18n/pt.js` - Traductions portugaises (à compléter)

### 2. Clés de traduction PrimeVue

Les principales clés utilisées pour les filtres DataTable :

```javascript
primevue: {
  // Opérateurs de filtre
  startsWith: 'Commence par',
  contains: 'Contient',
  notContains: 'Ne contient pas',
  endsWith: 'Se termine par',
  equals: 'Égal à',
  notEquals: 'Différent de',
  
  // Opérateurs numériques
  lt: 'Inférieur à',
  lte: 'Inférieur ou égal à',
  gt: 'Supérieur à',
  gte: 'Supérieur ou égal à',
  
  // Opérateurs de date
  dateIs: 'La date est',
  dateIsNot: 'La date n\'est pas',
  dateBefore: 'Avant le',
  dateAfter: 'Après le',
  
  // Actions de filtre
  matchAll: 'Correspond à tous',
  matchAny: 'Au moins un correspond',
  addRule: 'Ajouter une règle',
  removeRule: 'Retirer une règle',
  apply: 'Appliquer',
  clear: 'Effacer',
  
  // Messages
  emptyFilterMessage: 'Aucun résultat trouvé',
  emptyMessage: 'Aucune option disponible'
}
```

### 3. Configuration initiale

Dans `main.js`, PrimeVue est configuré avec la locale de l'utilisateur au démarrage :

```javascript
app.use(PrimeVue, {
    locale: i18n.global.messages.value[userProfileStore.language]?.primevue 
            || i18n.global.messages.value['en'].primevue,
    // ... autres configurations
})
```

### 4. Synchronisation dynamique

Le composable `usePrimeVueLocale` (dans `composables/usePrimeVueLocale.js`) surveille les changements de langue et met à jour automatiquement la locale PrimeVue :

```javascript
import { usePrimeVueLocale } from '@/composables/usePrimeVueLocale'

// Dans le setup() de App.vue
usePrimeVueLocale()
```

Ce composable :
- Écoute les changements de `locale` de Vue-i18n
- Met à jour automatiquement `primevue.config.locale`
- Affiche un message de confirmation dans la console

## Utilisation

### Dans les composants DataTable

Les filtres PrimeVue utiliseront automatiquement les traductions configurées. Aucune configuration supplémentaire n'est nécessaire dans les composants individuels.

Exemple dans `ConfigurationItemsCrud.vue` :

```vue
<DataTable
    v-model:filters="filters"
    filterDisplay="menu"
    :value="items"
>
    <Column field="name" :header="$t('configurationItems.table.columns.name')" sortable>
        <template #filter="{ filterModel }">
            <InputText v-model="filterModel.value" type="text" />
        </template>
    </Column>
</DataTable>
```

Les labels des filtres (Commence par, Contient, etc.) seront automatiquement traduits.

### Changement de langue

Lorsque l'utilisateur change de langue via le `ProfilePane`, la locale PrimeVue est automatiquement mise à jour grâce au composable `usePrimeVueLocale`.

## Ajout de nouvelles langues

Pour ajouter une nouvelle langue :

1. Ajouter la section `primevue` dans le fichier de traduction correspondant (ex: `es.js`, `pt.js`)
2. Copier la structure depuis `fr.js` ou `en.js`
3. Traduire toutes les clés

Exemple pour l'espagnol (`es.js`) :

```javascript
primevue: {
  startsWith: 'Comienza con',
  contains: 'Contiene',
  // ... autres traductions
}
```

## Référence complète

Pour la liste complète des clés de locale PrimeVue, consulter :
- [Documentation PrimeVue Configuration](https://primevue.org/configuration/)
- [PrimeLocale Repository](https://github.com/primefaces/primelocale)

## Notes techniques

- Les traductions PrimeVue sont réactives : tout changement est immédiatement reflété dans l'UI
- Le fallback est toujours l'anglais si une traduction est manquante
- Les logs de changement de locale sont visibles dans la console du navigateur
