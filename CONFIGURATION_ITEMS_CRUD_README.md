# Configuration Items CRUD - Documentation d'implémentation

## 📋 Vue d'ensemble

Implémentation complète d'un CRUD pour les Configuration Items (CMDB) avec :
- **Backend** : Node.js + Prisma ORM + PostgreSQL
- **Frontend** : Vue.js 3 + PrimeVue v4

## 🎯 Fonctionnalités implémentées

### Backend (Prisma + Node.js)
- ✅ Schéma Prisma avec support multi-schéma PostgreSQL
- ✅ Service Prisma avec toutes les opérations CRUD
- ✅ Validation des champs étendus par type de CI
- ✅ Support des types de CI : UPS, APPLICATION, SERVER, NETWORK_DEVICE, GENERIC
- ✅ API REST complète avec pagination et recherche
- ✅ Logs Winston structurés

### Frontend (Vue.js 3 + PrimeVue v4)
- ✅ Interface CRUD moderne avec DataTable PrimeVue
- ✅ Formulaire modal avec validation
- ✅ Champs dynamiques selon le type de CI
- ✅ Recherche et filtrage en temps réel
- ✅ Export CSV
- ✅ Suppression simple et multiple
- ✅ Notifications toast

## 📁 Structure des fichiers

### Backend
```
backend/
├── prisma/
│   └── schema.prisma                          # Schéma Prisma
├── prisma.config.ts                           # Configuration Prisma v7
├── src/
│   ├── config/
│   │   └── prisma.js                          # Client Prisma centralisé
│   └── api/v1/configuration_items/
│       ├── schemas.js                         # Schémas de validation par type
│       ├── service.prisma.js                  # Service Prisma CRUD
│       ├── controller.js                      # Controller API
│       └── routes.js                          # Routes Express
└── database/scripts/
    └── 30_add_cmdb_fields.sql                 # Migration SQL
```

### Frontend
```
frontend/
├── src/
│   ├── components/admin/
│   │   └── ConfigurationItemsCrud.vue         # Vue CRUD complète
│   ├── services/
│   │   └── configurationItemsService.js       # Service API
│   └── main.js                                # Configuration PrimeVue + Routes
```

## 🚀 Installation et configuration

### 1. Backend - Prisma

#### Installation des dépendances
```bash
cd backend
npm install @prisma/client
npm install -D prisma
```

#### Configuration de la base de données
Le fichier `prisma.config.ts` contient déjà la configuration. Assurez-vous que votre `.env` contient :
```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=data"
```

#### Migration de la base de données
```bash
# Exécuter le script SQL pour ajouter les colonnes
psql -U user -d database -f database/scripts/30_add_cmdb_fields.sql

# Générer le client Prisma
npx prisma generate
```

### 2. Frontend - PrimeVue v4

#### Installation des dépendances
```bash
cd frontend
npm install primevue@^4.0.0 @primevue/themes primeicons
```

PrimeVue est déjà configuré dans `main.js`.

## 📡 API Endpoints

### Configuration Items

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/configuration_items` | Liste avec pagination et recherche |
| GET | `/api/v1/configuration_items/schemas` | Récupérer les schémas de types CI |
| GET | `/api/v1/configuration_items/:uuid` | Détails d'un CI |
| POST | `/api/v1/configuration_items` | Créer un CI |
| PATCH | `/api/v1/configuration_items/:uuid` | Mettre à jour un CI |
| DELETE | `/api/v1/configuration_items/:uuid` | Supprimer un CI |

### Paramètres de requête (GET)
- `search` : Recherche textuelle (nom, description)
- `ci_type` : Filtrer par type (UPS, APPLICATION, etc.)
- `page` : Numéro de page (défaut: 1)
- `limit` : Nombre d'éléments par page (défaut: 50)
- `sortBy` : Champ de tri (défaut: name)
- `sortDirection` : Direction du tri (asc/desc)

### Exemple de requête POST
```json
{
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
}
```

## 🎨 Types de Configuration Items

### UPS
**Champs requis :**
- `voltage` (number)
- `capacity_va` (number)

**Champs optionnels :**
- `battery_autonomy_min` (number)
- `brand` (string)
- `model` (string)
- `serial_number` (string)

### APPLICATION
**Champs requis :**
- `version` (string)

**Champs optionnels :**
- `deployment_date` (string)
- `server_count` (number)
- `language` (string)
- `framework` (string)
- `repository_url` (string)

### SERVER
**Champs requis :**
- `hostname` (string)

**Champs optionnels :**
- `ip_address` (string)
- `cpu_cores` (number)
- `ram_gb` (number)
- `disk_gb` (number)
- `os` (string)
- `location` (string)

### NETWORK_DEVICE
**Champs requis :**
- `device_type` (string)

**Champs optionnels :**
- `ip_address` (string)
- `mac_address` (string)
- `port_count` (number)
- `vlan_support` (boolean)

### GENERIC
Aucun champ spécifique requis.

## 🧪 Tests

### Test de l'API avec cURL

#### Créer un UPS
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

## 🌐 Accès à l'interface

Une fois les serveurs démarrés :

### Backend
```bash
cd backend
npm run dev
```
Le backend sera accessible sur `http://localhost:3000`

### Frontend
```bash
cd frontend
npm run dev
```
Le frontend sera accessible sur `http://localhost:5173`

### Accéder au CRUD
Naviguer vers : `http://localhost:5173/admin/configuration-items`

## 🔧 Commandes utiles

### Prisma
```bash
# Générer le client Prisma
npx prisma generate

# Ouvrir Prisma Studio (GUI)
npx prisma studio

# Formater le schéma
npx prisma format
```

### Développement
```bash
# Backend avec hot-reload
npm run dev

# Frontend avec hot-reload
npm run dev
```

## 📝 Notes importantes

1. **Validation** : Les champs étendus sont validés côté backend selon le type de CI
2. **JSONB** : Les champs étendus sont stockés en JSONB pour flexibilité
3. **Index** : Un index GIN est créé sur `extended_core_fields` pour recherche rapide
4. **Logs** : Tous les logs sont en anglais (backend) selon les règles du projet
5. **i18n** : Le frontend utilise Vue-i18n (à configurer pour les labels)

## 🎯 Prochaines étapes

- [ ] Ajouter l'internationalisation des labels dans le frontend
- [ ] Implémenter la gestion des relations avec les tickets
- [ ] Ajouter des tests unitaires et d'intégration
- [ ] Créer des seeders pour données de test
- [ ] Ajouter la gestion des permissions utilisateur

## 🐛 Dépannage

### Erreur Prisma "Cannot find module"
```bash
npx prisma generate
```

### Erreur de connexion à la base de données
Vérifier que `DATABASE_URL` est correctement configuré dans `.env`

### PrimeVue components non trouvés
```bash
npm install primevue@^4.0.0 @primevue/themes primeicons
```

## 📚 Ressources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PrimeVue v4 Documentation](https://primevue.org/)
- [Vue.js 3 Documentation](https://vuejs.org/)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)

---

**Date de création :** 21 novembre 2025  
**Version :** 1.0.0  
**Auteur :** Cascade AI
