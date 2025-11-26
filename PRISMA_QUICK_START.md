# 🚀 Quick Start - Configuration Items CRUD

## Démarrage rapide en 5 minutes

### 1️⃣ Exécuter la migration SQL (1 min)

```bash
# Depuis la racine du projet
psql -U votre_user -d votre_database -f database/scripts/30_add_cmdb_fields.sql
```

Cette commande ajoute les colonnes `ci_type` et `extended_core_fields` à la table `configuration_items`.

### 2️⃣ Configurer l'environnement backend (1 min)

Vérifier que le fichier `backend/.env` contient :
```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=data"
```

### 3️⃣ Générer le client Prisma (1 min)

```bash
cd backend
npx prisma generate
```

### 4️⃣ Démarrer le backend (30 sec)

```bash
# Depuis backend/
npm run dev
```

Le serveur démarre sur `http://localhost:3000`

### 5️⃣ Démarrer le frontend (30 sec)

```bash
# Depuis frontend/
npm run dev
```

Le frontend démarre sur `http://localhost:5173`

### 6️⃣ Accéder à l'interface CRUD (30 sec)

Ouvrir dans le navigateur :
```
http://localhost:5173/admin/configuration-items
```

## ✅ Test rapide

### Créer un premier Configuration Item

1. Cliquer sur **"New"**
2. Remplir :
   - **Name** : `Mon premier serveur`
   - **Description** : `Serveur de test`
   - **Type** : `SERVER`
   - **Hostname** : `srv-test-01`
3. Cliquer sur **"Save"**

Votre premier CI est créé ! 🎉

## 🔍 Fonctionnalités disponibles

- ✅ **Créer** : Bouton "New"
- ✅ **Modifier** : Icône crayon sur chaque ligne
- ✅ **Supprimer** : Icône poubelle sur chaque ligne
- ✅ **Rechercher** : Champ de recherche en haut à droite
- ✅ **Filtrer par type** : Menu déroulant "Filter by Type"
- ✅ **Exporter** : Bouton "Export" pour CSV
- ✅ **Sélection multiple** : Cases à cocher + bouton "Delete"

## 📊 Types de CI disponibles

| Type | Champs requis | Exemple d'usage |
|------|---------------|-----------------|
| **UPS** | voltage, capacity_va | Onduleurs |
| **APPLICATION** | version | Applications métier |
| **SERVER** | hostname | Serveurs physiques/virtuels |
| **NETWORK_DEVICE** | device_type | Switchs, routeurs |
| **GENERIC** | aucun | Autres équipements |

## 🐛 Problèmes courants

### Le backend ne démarre pas
```bash
# Vérifier que les dépendances sont installées
cd backend
npm install
```

### Le frontend affiche une erreur
```bash
# Vérifier que PrimeVue est installé
cd frontend
npm install
```

### Erreur Prisma
```bash
# Régénérer le client
cd backend
npx prisma generate
```

## 📚 Documentation complète

Pour plus de détails, consulter : `CONFIGURATION_ITEMS_CRUD_README.md`

---

**Temps total d'installation : ~5 minutes** ⏱️
