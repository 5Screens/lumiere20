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

## Templates de pagination personnalisés

Pour les templates qui utilisent des placeholders PrimeVue (comme `{first}`, `{last}`, `{totalRecords}`), une computed property est nécessaire car ces placeholders ne passent pas par le système de traduction Vue-i18n.

Exemple dans `ConfigurationItemsCrud.vue` :

```javascript
const paginationTemplate = computed(() => {
    const templates = {
        fr: 'Affichage de {first} à {last} sur {totalRecords} éléments de configuration',
        en: 'Showing {first} to {last} of {totalRecords} configuration items',
        es: 'Mostrando {first} a {last} de {totalRecords} elementos de configuración',
        pt: 'Mostrando {first} a {last} de {totalRecords} itens de configuração'
    };
    return templates[locale.value] || templates.en;
});
```

Utilisation dans le template :

```vue
<DataTable :currentPageReportTemplate="paginationTemplate">
```

## Langues supportées

L'application supporte actuellement 4 langues avec traductions PrimeVue complètes :

- **Français (fr)** - Langue par défaut
- **Anglais (en)** - Fallback
- **Espagnol (es)** - Complet
- **Portugais (pt)** - Complet

## Ajout de nouvelles langues

Pour ajouter une nouvelle langue :

1. Créer un nouveau fichier dans `frontend/src/i18n/` (ex: `de.js` pour l'allemand)
2. Ajouter la section `primevue` avec toutes les traductions
3. Copier la structure depuis `fr.js` ou `en.js`
4. Traduire toutes les clés
5. Ajouter la langue dans `index.js`
6. Mettre à jour les computed properties de pagination si nécessaire

## Référence complète

Pour la liste complète des clés de locale PrimeVue, consulter :
- [Documentation PrimeVue Configuration](https://primevue.org/configuration/)
- [PrimeLocale Repository](https://github.com/primefaces/primelocale)

## Notes techniques

- Les traductions PrimeVue sont réactives : tout changement est immédiatement reflété dans l'UI
- Le fallback est toujours l'anglais si une traduction est manquante
- Les logs de changement de locale sont visibles dans la console du navigateur
