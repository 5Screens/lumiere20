# Reverse Links : cardinalité 1:N vs N:N

Dans le projet Lumiere, les objets peuvent avoir des **reverse links** affichés sous forme d'onglets dans `ObjectView.vue`. Le comportement diffère selon la cardinalité.

---

## Cas standard : Reverse Link 1:N (`field_type: 'reverse_link'`)

Pour une relation **1:N** (ex: `timezones` → `calendars`), le champ FK `rel_timezone_uuid` existe directement dans la table cible `calendars`.

### Metadata (object-metadata.js)

```js
{ field_name: 'calendars', field_type: 'reverse_link', relation_object: 'calendars', relation_filter: 'rel_timezone_uuid', ... }
```

### Frontend

Le composant `ReverseLinkTable.vue` affiche les objets liés dans un DataTable avec actions CRUD (edit, duplicate, delete). Il charge les données via :

```
POST /api/v1/calendars/search
{ filters: { rel_timezone_uuid: { value: "<parentUuid>", matchMode: "equals" } } }
```

### Backend

Aucun traitement spécial : `buildPrismaWhereFromFilters` gère nativement le filtre car `rel_timezone_uuid` est une colonne directe de la table.

---

## Cas N:N : Reverse Link Many-to-Many (`field_type: 'reverse_link_mn'`)

Pour une relation **N:N** (ex: `services` ↔ `symptoms`), il n'y a pas de FK directe. La liaison passe par une **table de jointure** (ex: `rel_symptoms_services`).

### Metadata (object-metadata.js)

```js
{ 
  field_name: 'symptoms', 
  field_type: 'reverse_link_mn',          // <-- type distinct
  relation_object: 'symptoms', 
  relation_display: 'code,label,is_active',
  relation_filter: 'rel_service_uuid',    // FK virtuelle pour le search backend
  sync_url: '/services/{parentUuid}/sync-symptoms',  // URL de sync sur l'objet parent
  ...
}
```

Le champ `sync_url` est stocké en base dans `object_fields.sync_url` (colonne ajoutée via migration `20260215225736_add_sync_url_to_object_fields`).

### Frontend

Le composant **`ReverseLinkManyToMany.vue`** (et non `ReverseLinkTable`) est utilisé. Il offre :

- **Liste complète** de tous les objets du type cible avec checkboxes
- **Recherche** sur les champs d'affichage
- **Filtres** : Sélectionné / Non sélectionné (via `SelectButton`)
- **Sélectionner tout / Désélectionner tout** (sur les éléments visibles/filtrés)
- **Compteur** : "X sur Y sélectionnés"
- **Boutons Confirmer / Annuler** : apparaissent uniquement quand il y a des modifications non sauvegardées

Le composant charge les données en deux appels :
1. **Tous les objets** : `POST /api/v1/symptoms/search` (sans filtre, rows: 10000)
2. **Objets déjà liés** : `POST /api/v1/symptoms/search` avec filtre `relation_filter`

Au clic sur **Confirmer**, il calcule le diff (ajouts/suppressions) et appelle :

```
POST /api/v1/services/<parentUuid>/sync-symptoms
{ add: ["uuid1", "uuid2"], remove: ["uuid3"] }
```

### Routage dans ObjectView.vue

```vue
<ReverseLinkManyToMany v-if="item?.uuid && rlField.field_type === 'reverse_link_mn'" ... />
<ReverseLinkTable v-else-if="item?.uuid" ... />
```

### Backend : route sync sur l'objet parent

Chaque objet parent expose sa propre route sync (pas de route générique) :

| Objet parent | Route | Junction table |
|---|---|---|
| `services` | `POST /:uuid/sync-symptoms` | `rel_symptoms_services` |
| `services` | `POST /:uuid/sync-causes` | `rel_causes_services` |
| `holidays` | `POST /:uuid/sync-calendars` | `holidays_calendars` |

Le controller :
1. **Remove** : `deleteMany` sur la junction table pour les UUIDs dans `remove`
2. **Add** : vérifie les doublons existants, puis `createMany` pour les nouveaux liens

Exemple (`services/controller.js` → `syncSymptoms`) :

```js
const syncSymptoms = async (req, res, next) => {
  const { uuid } = req.params;
  const { add = [], remove: toRemove = [] } = req.body;

  // Unlink
  if (toRemove.length > 0) {
    await prisma.rel_symptoms_services.deleteMany({
      where: { rel_service_uuid: uuid, rel_symptom_uuid: { in: toRemove } }
    });
  }

  // Link (skip duplicates)
  if (add.length > 0) {
    const existing = await prisma.rel_symptoms_services.findMany({
      where: { rel_service_uuid: uuid, rel_symptom_uuid: { in: add } },
      select: { rel_symptom_uuid: true }
    });
    const existingSet = new Set(existing.map(e => e.rel_symptom_uuid));
    const toCreate = add.filter(id => !existingSet.has(id));
    if (toCreate.length > 0) {
      await prisma.rel_symptoms_services.createMany({
        data: toCreate.map(symptomUuid => ({
          rel_service_uuid: uuid, rel_symptom_uuid: symptomUuid
        }))
      });
    }
  }

  res.json({ success: true });
};
```

### Backend : interception du filtre dans search()

Le `ReverseLinkManyToMany` utilise aussi `POST /symptoms/search` avec le filtre `relation_filter` pour charger les objets déjà liés. Comme `rel_service_uuid` n'est pas une colonne directe de `symptoms`, le backend doit **intercepter ce filtre** dans `search()` et le convertir en filtre Prisma imbriqué :

```js
// Dans symptoms/service.js search()
if (filters?.rel_service_uuid?.value) {
  where.rel_symptoms_services = {
    some: { rel_service_uuid: filters.rel_service_uuid.value }
  };
  delete filtersCopy.rel_service_uuid;
}
```

---

## Tableau récapitulatif

| | **1:N** (`reverse_link`) | **N:N** (`reverse_link_mn`) |
|---|---|---|
| **FK directe dans table cible** | Oui | Non (table de jointure) |
| **Composant frontend** | `ReverseLinkTable.vue` | `ReverseLinkManyToMany.vue` |
| **UI** | DataTable + CRUD (add, edit, duplicate, delete) | Checkboxes + recherche + filtres + confirm/revert |
| **Metadata `field_type`** | `reverse_link` | `reverse_link_mn` |
| **Metadata `sync_url`** | Non utilisé | Oui (ex: `/services/{parentUuid}/sync-symptoms`) |
| **API sync** | Non (CRUD standard) | `POST /:uuid/sync-xxx` sur l'objet parent |
| **Backend search()** | Natif | Interception filtre → `{ junction: { some: { fk } } }` |

---

## Relations N:N existantes

| Objet A | Objet B | Junction table | Champs |
|---|---|---|---|
| `symptoms` | `services` | `rel_symptoms_services` | `rel_symptom_uuid`, `rel_service_uuid` |
| `causes` | `services` | `rel_causes_services` | `rel_cause_uuid`, `rel_service_uuid` |
| `holidays` | `calendars` | `holidays_calendars` | `rel_holiday_uuid`, `rel_calendar_uuid` |
