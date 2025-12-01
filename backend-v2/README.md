# Backend V2 - Lumiere

## Description

Backend Node.js avec Prisma ORM pour l'application Lumiere.

## Stack technique

- **Runtime** : Node.js
- **Framework** : Express.js
- **ORM** : Prisma (multi-schema PostgreSQL)
- **Auth** : JWT (jsonwebtoken + bcrypt)
- **Validation** : Zod
- **Logging** : Winston

## Structure

```
backend-v2/
├── prisma/
│   ├── schema.prisma         # Schéma complet multi-schema
│   └── migrations/           # Migrations Prisma
├── src/
│   ├── config/
│   │   ├── prisma.js         # Client Prisma
│   │   ├── logger.js         # Winston logger
│   │   └── auth.js           # Configuration auth
│   ├── middleware/
│   │   ├── auth.js           # Middleware authentification
│   │   ├── validate.js       # Validation Zod
│   │   └── errorHandler.js   # Gestion erreurs
│   ├── api/
│   │   └── v1/
│   │       ├── auth/
│   │       ├── configuration_items/
│   │       ├── persons/
│   │       ├── entities/
│   │       ├── locations/
│   │       ├── groups/
│   │       ├── tickets/
│   │       └── [autres]/
│   └── server.js
├── package.json
├── .env.example
└── README.md
```

## Installation

```bash
npm install
cp .env.example .env
# Éditer .env avec vos paramètres
npx prisma generate
npx prisma migrate dev
npm run dev
```

## Scripts

- `npm run dev` : Démarrage en mode développement
- `npm run start` : Démarrage en production
- `npm run prisma:generate` : Génération du client Prisma
- `npm run prisma:migrate` : Exécution des migrations
- `npm run prisma:studio` : Interface Prisma Studio

## API Pattern pour PrimeVue

Chaque endpoint supporte le format PrimeVue DataTable :

```javascript
// POST /api/v1/{resource}/search
// Body:
{
  filters: {
    global: { value: "search", matchMode: "contains" },
    name: { 
      operator: "AND",
      constraints: [{ value: "test", matchMode: "contains" }]
    }
  },
  sortField: "name",
  sortOrder: 1,  // 1 = asc, -1 = desc
  page: 1,
  limit: 50
}

// Réponse:
{
  data: [...],
  total: 100,
  pagination: {
    page: 1,
    limit: 50,
    total: 100,
    totalPages: 2
  }
}
```

## Référence

Le fichier `service.prisma.js` dans `configuration_items/` sert de référence pour :
- Conversion des filtres PrimeVue vers Prisma
- Structure des réponses API
- Gestion des erreurs
