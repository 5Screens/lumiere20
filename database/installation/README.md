# Reconstruction de la base de données Lumiere v17

Ce dossier contient tous les scripts nécessaires pour reconstruire la base de données from scratch.

## 🪟 Windows (PowerShell)

```powershell
cd database
.\rebuild_database.ps1
```

## 🐧 Linux (Debian/Ubuntu)

```bash
cd database
chmod +x rebuild_database.sh
./rebuild_database.sh
```

## 🐳 Docker (Multi-plateforme)

### Construction et démarrage
```bash
cd database
docker-compose up -d
```

### Vérification des logs
```bash
docker-compose logs -f
```

### Connexion à la base
```bash
docker exec -it lumiere-db-v17 psql -U postgres -d lumiere-db-v17
```

### Reconstruction complète
```bash
docker-compose down -v
docker-compose up -d
```

## 📋 Ordre d'exécution des scripts

### Phase 1 : Initialisation
- `00_init_database.sql` - Création de la base lumiere-db-v17

### Phase 2 : Structure (01-17)
- Extensions PostgreSQL
- Tables principales
- Schéma d'audit
- Index et triggers
- Tables métier (incidents, problèmes, changements, etc.)

### Phase 3 : Données de test (data/)
- Configuration de base
- Données de référence
- Jeux de données de test

## ⚙️ Configuration du backend

Après reconstruction, modifier `backend/.env` :

```env
DB_NAME=lumiere-db-v17
DB_USER=postgres
DB_HOST=localhost
DB_PASSWORD=votre_mot_de_passe
DB_PORT=5432
```

## 🔧 Prérequis

### Windows
- PostgreSQL 17 installé
- PowerShell 5.1+

### Linux
- PostgreSQL 17 installé
- Bash

### Docker
- Docker Engine 20.10+
- Docker Compose 2.0+

## 📝 Notes

- L'ancienne base `lumiere_v16` est conservée
- La nouvelle base `lumiere-db-v17` est créée from scratch
- Aucune modification nécessaire sur le frontend
- Les scripts sont idempotents (peuvent être réexécutés)
