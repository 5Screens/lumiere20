# Plan d'action : Refactorisation CMDB avec Prisma

**Date de création :** 20 novembre 2025  
**Objectif :** Implémenter la gestion de la CMDB (Configuration Items) avec Prisma en approche hybride  
**Durée estimée :** 2-3 jours

---

## 📋 Vue d'ensemble

### Stratégie : Approche hybride
- ✅ **CMDB (configuration_items)** : Prisma (nouveau)
- ❌ **Tickets, Persons, etc.** : SQL brut (existant, non modifié)

### Architecture de la table CMDB
```sql
configuration_items
├── uuid (PK)
├── name
├── description
├── ci_type (VARCHAR) -- 'UPS', 'APPLICATION', 'SERVER', etc.
├── extended_core_fields (JSONB) -- Attributs spécifiques par type
├── created_at
└── updated_at
```

---

## 🎯 Phase 1 : Installation et configuration Prisma (30 min)

### 1.1 Installation des dépendances
```bash
cd backend
npm install @prisma/client
npm install -D prisma
```

### 1.2 Initialisation Prisma
```bash
npx prisma init
```

### 1.3 Configuration `.env`
Le projet utilise les variables d'environnement existantes (pas de `DATABASE_URL`). Vérifier que `backend/.env` contient :
```env
DB_USER=your_user
DB_HOST=localhost
DB_NAME=your_database
DB_PASSWORD=your_password
DB_PORT=5432
```

### 1.4 Créer le schéma Prisma
**Fichier : `backend/prisma/schema.prisma`**

```prisma
// Prisma schema for Lumiere16 - Configuration Items CRUD
// Database: PostgreSQL with multi-schema support

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema"]
}

datasource db {
  provider = "postgresql"
  schemas  = ["data", "core", "configuration"]
}

// ============================================
// CMDB - Configuration Items
// ============================================
model configuration_items {
  uuid                  String    @id @default(uuid()) @db.Uuid
  name                  String    @db.VarChar(255)
  description           String?   @db.Text
  ci_type               String    @default("GENERIC") @db.VarChar(50)
  extended_core_fields  Json?     @db.JsonB
  created_at            DateTime  @default(now()) @db.Timestamptz(6)
  updated_at            DateTime  @default(now()) @updatedAt @db.Timestamptz(6)
  
  @@index([ci_type])
  @@schema("data")
  @@map("configuration_items")
}
```

> **Note Prisma v7 :** L'URL de la base de données n'est plus dans le schema.prisma mais gérée via l'adaptateur dans `prisma.js`.

### 1.5 Générer le client Prisma
```bash
npx prisma generate
```

### 1.6 Créer le client Prisma centralisé
**Fichier : `backend/src/config/prisma.js`**

```javascript
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const logger = require('./logger');

// Create PostgreSQL connection pool using existing env variables
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

// Create Prisma Client with adapter
const prisma = new PrismaClient({
  adapter,
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.debug(`[PRISMA] Query: ${e.query}`);
    logger.debug(`[PRISMA] Duration: ${e.duration}ms`);
  });
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
```

> **Important :** Cette configuration utilise `@prisma/adapter-pg` pour Prisma v7, ce qui permet d'utiliser les variables d'environnement existantes (DB_USER, DB_HOST, etc.) au lieu de DATABASE_URL.

**✅ Checkpoint 1 :** Prisma installé et configuré

---

## Phase 2 : Migration de la base de données (30 min)

### 2.1 Vérifier la table existante
```bash
# Se connecter à PostgreSQL
psql -U user -d database

# Vérifier la structure actuelle
\d data.configuration_items
```

### 2.2 Ajouter les colonnes manquantes (si nécessaire)
**Fichier : `database/scripts/30_add_cmdb_fields.sql`**

```sql
-- Add ci_type column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'data' 
        AND table_name = 'configuration_items' 
        AND column_name = 'ci_type'
    ) THEN
        ALTER TABLE data.configuration_items 
        ADD COLUMN ci_type VARCHAR(50) DEFAULT 'GENERIC';
    END IF;
END $$;

-- Add extended_core_fields column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'data' 
        AND table_name = 'configuration_items' 
        AND column_name = 'extended_core_fields'
    ) THEN
        ALTER TABLE data.configuration_items 
        ADD COLUMN extended_core_fields JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Create index on ci_type
CREATE INDEX IF NOT EXISTS idx_ci_type 
ON data.configuration_items (ci_type);

-- Create GIN index on JSONB for fast search
CREATE INDEX IF NOT EXISTS idx_ci_extended_fields_gin 
ON data.configuration_items USING GIN (extended_core_fields);

-- Update existing records with default ci_type
UPDATE data.configuration_items 
SET ci_type = 'GENERIC' 
WHERE ci_type IS NULL;

-- Make ci_type NOT NULL
ALTER TABLE data.configuration_items 
ALTER COLUMN ci_type SET NOT NULL;
```

### 2.3 Exécuter la migration
```bash
psql -U user -d database -f database/scripts/30_add_cmdb_fields.sql
```

### 2.4 Synchroniser Prisma avec la DB
```bash
npx prisma db pull
npx prisma generate
```

**✅ Checkpoint 2 :** Base de données migrée

---

## Phase 3 : Schémas de validation par type de CI (1h)

### 3.1 Créer le fichier de schémas
**Fichier : `backend/src/api/v1/configuration_items/schemas.js`**

```javascript
/**
 * Schémas de validation pour les types de Configuration Items
 */
const CI_TYPE_SCHEMAS = {
  UPS: {
    required: ['voltage', 'capacity_va'],
    optional: ['battery_autonomy_min', 'brand', 'model', 'serial_number'],
    types: {
      voltage: 'number',
      capacity_va: 'number',
      battery_autonomy_min: 'number',
      brand: 'string',
      model: 'string',
      serial_number: 'string'
    }
  },
  APPLICATION: {
    required: ['version'],
    optional: ['deployment_date', 'server_count', 'language', 'framework', 'repository_url'],
    types: {
      version: 'string',
      deployment_date: 'string',
      server_count: 'number',
      language: 'string',
      framework: 'string',
      repository_url: 'string'
    }
  },
  SERVER: {
    required: ['hostname'],
    optional: ['ip_address', 'cpu_cores', 'ram_gb', 'disk_gb', 'os', 'location'],
    types: {
      hostname: 'string',
      ip_address: 'string',
      cpu_cores: 'number',
      ram_gb: 'number',
      disk_gb: 'number',
      os: 'string',
      location: 'string'
    }
  },
  NETWORK_DEVICE: {
    required: ['device_type'],
    optional: ['ip_address', 'mac_address', 'port_count', 'vlan_support'],
    types: {
      device_type: 'string',
      ip_address: 'string',
      mac_address: 'string',
      port_count: 'number',
      vlan_support: 'boolean'
    }
  },
  GENERIC: {
    required: [],
    optional: [],
    types: {}
  }
};

/**
 * Validate extended fields based on CI type
 */
const validateExtendedFields = (ciType, extendedFields) => {
  const schema = CI_TYPE_SCHEMAS[ciType];
  
  if (!schema) {
    return {
      valid: false,
      errors: [`Unknown CI type: ${ciType}. Valid types: ${Object.keys(CI_TYPE_SCHEMAS).join(', ')}`]
    };
  }
  
  const errors = [];
  
  // Check required fields
  for (const field of schema.required) {
    if (!(field in extendedFields)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Check field types
  for (const [field, value] of Object.entries(extendedFields)) {
    const expectedType = schema.types[field];
    
    if (!expectedType) {
      errors.push(`Unknown field: ${field} for CI type ${ciType}`);
      continue;
    }
    
    const actualType = typeof value;
    if (actualType !== expectedType) {
      errors.push(`Invalid type for ${field}: expected ${expectedType}, got ${actualType}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = {
  CI_TYPE_SCHEMAS,
  validateExtendedFields
};
```

**✅ Checkpoint 3 :** Schémas de validation créés

---

## Phase 4 : Service CMDB avec Prisma (2h)

### 4.1 Créer le service Prisma
**Fichier : `backend/src/api/v1/configuration_items/service.prisma.js`**

```javascript
const prisma = require('../../../config/prisma');
const logger = require('../../../config/logger');

/**
 * Get all configuration items with pagination and search
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Paginated results
 */
const getConfigurationItems = async (options = {}) => {
  try {
    const {
      search = '',
      page = 1,
      limit = 50,
      sortBy = 'name',
      sortDirection = 'asc'
    } = options;
    
    logger.info('[CMDB SERVICE PRISMA] Getting configuration items', { search, page, limit });
    
    const skip = (page - 1) * limit;
    
    // Build search conditions
    const where = search.trim() ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    } : {};
    
    // Count total
    const total = await prisma.configuration_items.count({ where });
    
    // Fetch data
    const items = await prisma.configuration_items.findMany({
      where,
      orderBy: { [sortBy]: sortDirection },
      skip,
      take: limit,
      include: {
        tickets: {
          select: {
            uuid: true,
            title: true,
            ticket_type_code: true
          },
          take: 5 // Limit related tickets
        }
      }
    });
    
    logger.info(`[CMDB SERVICE PRISMA] Found ${items.length} configuration items`);
    
    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('[CMDB SERVICE PRISMA] Error getting configuration items:', error);
    throw error;
  }
};

/**
 * Get configuration item by UUID
 * @param {string} uuid - Configuration item UUID
 * @returns {Promise<Object>} - Configuration item details
 */
const getConfigurationItemById = async (uuid) => {
  try {
    logger.info(`[CMDB SERVICE PRISMA] Getting configuration item: ${uuid}`);
    
    const item = await prisma.configuration_items.findUnique({
      where: { uuid },
      include: {
        tickets: {
          select: {
            uuid: true,
            title: true,
            ticket_type_code: true,
            ticket_status_code: true,
            created_at: true
          },
          orderBy: { created_at: 'desc' }
        }
      }
    });
    
    if (!item) {
      logger.warn(`[CMDB SERVICE PRISMA] Configuration item not found: ${uuid}`);
      return null;
    }
    
    logger.info(`[CMDB SERVICE PRISMA] Found configuration item: ${item.name}`);
    return item;
  } catch (error) {
    logger.error('[CMDB SERVICE PRISMA] Error getting configuration item:', error);
    throw error;
  }
};

/**
 * Create new configuration item
 * @param {Object} data - Configuration item data
 * @returns {Promise<Object>} - Created configuration item
 */
const createConfigurationItem = async (data) => {
  try {
    logger.info('[CMDB SERVICE PRISMA] Creating configuration item:', data.name);
    
    const item = await prisma.configuration_items.create({
      data: {
        name: data.name,
        description: data.description,
        ci_type: data.ci_type,
        extended_core_fields: data.extended_core_fields
      }
    });
    
    logger.info(`[CMDB SERVICE PRISMA] Created configuration item: ${item.name}`);
    return item;
  } catch (error) {
    logger.error('[CMDB SERVICE PRISMA] Error creating configuration item:', error);
    throw error;
  }
};

// ... autres fonctions (voir exemples précédents)

module.exports = {
  getConfigurationItems,
  getConfigurationItemById,
  createConfigurationItem,
  // ... autres fonctions
};
```

**✅ Checkpoint 4 :** Service Prisma implémenté

---

## Phase 5 : Controller et Routes (1h)

### 5.1 Créer le controller
**Fichier : `backend/src/api/v1/configuration_items/controller.js`**

```javascript
const service = require('./service.prisma');
const logger = require('../../../config/logger');

const getConfigurationItems = async (req, res) => {
  try {
    const options = {
      search: req.query.search || '',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      sortBy: req.query.sortBy || 'name',
      sortDirection: req.query.sortDirection || 'asc'
    };
    
    const result = await service.getConfigurationItems(options);
    res.json(result);
  } catch (error) {
    logger.error('[CMDB CONTROLLER] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ... autres fonctions (voir exemples précédents)

module.exports = {
  getConfigurationItems,
  getConfigurationItemById,
  createConfigurationItem,
  // ... autres fonctions
};
```

### 5.2 Créer les routes
**Fichier : `backend/src/api/v1/configuration_items/routes.js`**

```javascript
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.get('/', controller.getConfigurationItems);
router.get('/schemas', controller.getCITypeSchemas);
router.get('/:uuid', controller.getConfigurationItemById);
router.get('/:uuid/tickets', controller.getConfigurationItemTickets);
router.post('/', controller.createConfigurationItem);
router.patch('/:uuid', controller.updateConfigurationItem);
router.delete('/:uuid', controller.deleteConfigurationItem);

module.exports = router;
```

### 5.3 Enregistrer les routes dans server.js
**Fichier : `backend/src/server.js`**

```javascript
// Ajouter après les autres imports de routes
const configurationItemsRoutes = require('./api/v1/configuration_items/routes');

// Ajouter après les autres app.use
app.use('/api/v1/configuration_items', configurationItemsRoutes);
```

**✅ Checkpoint 5 :** API REST complète

---

## Phase 6 : Tests (1h)

### 6.1 Tester avec cURL ou Postman

#### Créer un onduleur
```bash
curl -X POST http://localhost:3000/api/v1/configuration_items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "UPS-DATACENTER-01",
    "description": "Onduleur principal datacenter",
    "ci_type": "UPS",
    "extended_core_fields": {
      "voltage": 220,
      "capacity_va": 3000,
      "battery_autonomy_min": 30,
      "brand": "APC",
      "model": "Smart-UPS 3000"
    }
  }'
```

#### Créer une application
```bash
curl -X POST http://localhost:3000/api/v1/configuration_items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Lumiere ITSM",
    "description": "Application de gestion des tickets",
    "ci_type": "APPLICATION",
    "extended_core_fields": {
      "version": "16.0.0",
      "deployment_date": "2025-01-15",
      "server_count": 3,
      "language": "JavaScript",
      "framework": "Vue.js 3 + Node.js"
    }
  }'
```

#### Lister les CIs
```bash
curl http://localhost:3000/api/v1/configuration_items?page=1&limit=10
```

#### Filtrer par type
```bash
curl http://localhost:3000/api/v1/configuration_items?ci_type=UPS
```

#### Rechercher
```bash
curl http://localhost:3000/api/v1/configuration_items?search=datacenter
```

**✅ Checkpoint 6 :** Tests fonctionnels OK

---

## Checklist complète

### Installation
- [ ] `npm install @prisma/client`
- [ ] `npm install -D prisma`
- [ ] `npm install @prisma/adapter-pg pg`
- [ ] `npx prisma init`
- [ ] Configurer `DB_USER`, `DB_HOST`, `DB_NAME`, `DB_PASSWORD`, `DB_PORT` dans `.env`

### Configuration
- [ ] Créer `prisma/schema.prisma`
- [ ] Créer `src/config/prisma.js`
- [ ] `npx prisma generate`

### Migration DB
- [ ] Créer `database/scripts/30_add_cmdb_fields.sql`
- [ ] Exécuter la migration SQL
- [ ] `npx prisma db pull`

### Code
- [ ] Créer `api/v1/configuration_items/schemas.js`
- [ ] Créer `api/v1/configuration_items/service.prisma.js`
- [ ] Créer `api/v1/configuration_items/controller.js`
- [ ] Créer `api/v1/configuration_items/routes.js`
- [ ] Enregistrer routes dans `server.js`

### Tests
- [ ] Tester création UPS
- [ ] Tester création APPLICATION
- [ ] Tester création SERVER
- [ ] Tester liste avec pagination
- [ ] Tester recherche
- [ ] Tester filtrage par type
- [ ] Tester mise à jour
- [ ] Tester suppression
- [ ] Tester validation des champs

### Documentation
- [ ] Documenter les schémas de CI types
- [ ] Documenter l'API REST
- [ ] Mettre à jour le README

---

## 🚀 Commandes utiles

### Prisma
```bash
# Générer le client
npx prisma generate

# Synchroniser avec la DB
npx prisma db pull

# Ouvrir Prisma Studio (GUI)
npx prisma studio

# Formater le schéma
npx prisma format
```

### Développement
```bash
# Démarrer le serveur
npm run dev

# Logs Prisma
NODE_ENV=development npm run dev
```

---

## 📚 Ressources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [Prisma JSONB Support](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields)

---

## ⚠️ Points d'attention

1. **Validation obligatoire** : Toujours valider `extended_core_fields` avant insertion
2. **Index JSONB** : Créer des index GIN pour les recherches fréquentes
3. **Transactions** : Utiliser `prisma.$transaction` pour opérations multiples
4. **Logs** : Activer les logs Prisma en développement uniquement
5. **Graceful shutdown** : Toujours appeler `prisma.$disconnect()`

---

## 🎯 Prochaines étapes (après CMDB)

1. Migrer `persons` vers Prisma
2. Migrer `groups` vers Prisma
3. Évaluer migration des tickets (complexe)
4. Créer des seeders Prisma
5. Mettre en place des migrations versionnées

---

**Bonne chance ! 🚀**