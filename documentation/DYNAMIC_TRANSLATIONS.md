# Dynamic Translations Architecture

## Overview

Lumiere supports dynamic translations for user-created content. Unlike static UI translations (stored in `frontend-v2/src/i18n/`), dynamic translations are stored in the database and can be managed at runtime.

## Use Cases

- **CI Types**: When a user creates a new CI type (e.g., "CUSTOM_DEVICE"), they can provide translations for label and description in multiple languages
- **Ticket Status**: Custom ticket statuses with translated labels
- **Any user-defined configuration**: Symptoms, categories, etc.

## Database Schema

### Single Generic Table: `translations.translated_fields`

All translations are stored in a single table for simplicity and maintainability.

```sql
translated_fields (
  uuid            UUID PRIMARY KEY,
  entity_type     VARCHAR(100),  -- 'ci_types', 'ticket_status', 'symptoms', etc.
  entity_uuid     UUID,          -- UUID of the translated entity
  field_name      VARCHAR(100),  -- 'label', 'description', etc.
  locale          VARCHAR(10),   -- 'fr', 'en', 'es', 'pt', 'de', 'zh', etc.
  value           TEXT,          -- The translated value
  created_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ,
  
  UNIQUE(entity_type, entity_uuid, field_name, locale)
)
```

**Indexes:**
- `(entity_type, entity_uuid)` - Fast lookup by entity
- `(locale)` - Filter by language

### Metadata Column

The `object_fields` table includes an `is_translatable` column to indicate which fields support dynamic translations:

```javascript
// In object-metadata.js seed
{ 
  field_name: 'label', 
  label_key: 'ciTypes.label', 
  field_type: 'text', 
  is_translatable: true,  // <-- This field supports translations
  ...
}
```

## API Design

### Request Locale

The API determines the locale from:
1. Query parameter: `?locale=fr`
2. `Accept-Language` header: `Accept-Language: fr-FR,fr;q=0.9`
3. Default: `en`

### Response Format

When fetching entities with translations:

```json
{
  "uuid": "...",
  "code": "UPS",
  "label": "Onduleur (UPS)",        // Translated value for requested locale
  "description": "Alimentation sans interruption",
  "icon": "pi-bolt",
  "color": "yellow",
  "_translations": {                 // All translations for editing
    "label": {
      "fr": "Onduleur (UPS)",
      "en": "UPS",
      "es": "SAI",
      "de": "USV"
    },
    "description": {
      "fr": "Alimentation sans interruption",
      "en": "Uninterruptible Power Supply",
      "es": "Sistema de alimentación ininterrumpida",
      "de": "Unterbrechungsfreie Stromversorgung"
    }
  }
}
```

### Creating/Updating with Translations

```json
POST /api/v1/ci_types
{
  "code": "CUSTOM_DEVICE",
  "label": "Custom Device",           // Default/fallback value
  "description": "A custom device",
  "icon": "pi-cog",
  "color": "blue",
  "_translations": {
    "label": {
      "fr": "Appareil personnalisé",
      "en": "Custom Device",
      "es": "Dispositivo personalizado"
    },
    "description": {
      "fr": "Un appareil personnalisé",
      "en": "A custom device",
      "es": "Un dispositivo personalizado"
    }
  }
}
```

## Frontend Integration

### Fetching Options with Locale

The frontend should pass the current locale when fetching options:

```javascript
// In metadataService.js
const fetchOptions = async (endpoint, locale) => {
  const response = await api.get(endpoint, {
    headers: {
      'Accept-Language': locale
    }
  });
  return response.data;
};
```

### Displaying Translated Values

For translatable fields, the API returns the translated value directly. The frontend displays it as-is:

```vue
<template>
  <Tag :value="ciType.label" />  <!-- Already translated by API -->
</template>
```

### Editing Translations

For forms editing translatable fields, use the `_translations` object:

```vue
<template>
  <div v-for="locale in availableLocales" :key="locale">
    <label>{{ locale.toUpperCase() }}</label>
    <InputText v-model="item._translations.label[locale]" />
  </div>
</template>
```

## Fallback Strategy

1. **API returns translated value** for the requested locale
2. **If no translation exists**, the default value (stored in the entity) is returned
3. **Default value** is typically in English (the "fallback" language)

## Adding a New Translatable Entity

1. **Add translation table** in Prisma schema (or use `entity_translations`)
2. **Mark fields as translatable** in `object_fields` metadata (`is_translatable: true`)
3. **Update service** to include translations in queries
4. **Update controller** to pass locale to service
5. **Seed initial translations** if needed

## Supported Locales

Lumiere supports any locale code. Common ones:
- `fr` - French
- `en` - English
- `es` - Spanish
- `pt` - Portuguese
- `de` - German
- `it` - Italian
- `zh` - Chinese
- `ja` - Japanese
- `ar` - Arabic
- etc.

## Migration Notes

When migrating from `label_key`/`description_key` to dynamic translations:

1. Replace `label_key` with `label` (direct value)
2. Replace `description_key` with `description` (direct value)
3. Create translation records for each locale
4. Remove hardcoded translations from `frontend-v2/src/i18n/*.js`

## Files Modified

- `backend-v2/prisma/schema.prisma` - Added `translated_fields` table and `is_translatable` column
- `backend-v2/prisma/seeds/ci-types.js` - Updated to create translations in `translated_fields`
- `backend-v2/prisma/seeds/object-metadata.js` - Added `is_translatable` flag
- `backend-v2/src/api/v1/ci_types/service.js` - Translation support using `translated_fields`
- `backend-v2/src/api/v1/ci_types/controller.js` - Locale handling via `Accept-Language` header
- `backend-v2/src/api/v1/translations/service.js` - Generic translation service
- `frontend-v2/src/services/api.js` - Added `Accept-Language` header to all requests
- `frontend-v2/src/components/layout/AppHeader.vue` - Cache clear on locale change
- `frontend-v2/src/i18n/fr.js` - Removed hardcoded CI type translations
- `frontend-v2/src/i18n/en.js` - Removed hardcoded CI type translations
