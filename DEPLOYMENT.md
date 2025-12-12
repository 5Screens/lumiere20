# Lumiere - Guide de Déploiement Production

## Repartir de zéro sur le serveur

  cd /var/www/lumiere

  # Arrêter et supprimer tous les containers et volumes
  docker compose down -v

  # Supprimer tous les fichiers
  cd /var/www
  sudo rm -rf lumiere

  # Recréer le dossier vide
  sudo mkdir lumiere
  sudo chown debian:debian lumiere

## Prérequis

- **VPS Debian** avec accès SSH
- **Domaine** pointant vers l'IP du VPS (DNS configuré)
- **Ports 80 et 443** ouverts dans le firewall de l'hébergeur

---

## Étape 1 : Préparation locale (Windows)

### 1.1 Vérifier les fichiers Docker

S'assurer que ces fichiers existent et sont à jour :

- `backend-v2/Dockerfile`
- `backend-v2/prisma.config.ts`
- `frontend-v2/Dockerfile`
- `frontend-v2/nginx.conf`
- `docker-compose.yml`
- `nginx/nginx.conf`
- `nginx/conf.d/default.conf`
- `.env.production.example`

### 1.2 Vérifier le docker-compose.yml

```yaml
# S'assurer que VITE_API_URL contient /api/v1
frontend:
  build:
    args:
      VITE_API_URL: /api/v1
```

### 1.3 Vérifier le backend-v2/Dockerfile

```dockerfile
# Doit contenir ces lignes pour Prisma v7
COPY prisma.config.ts ./

# Et ces lignes pour le build
RUN echo "DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy" > .env
RUN npx prisma generate
RUN rm .env
```

### 1.4 Vérifier le backend-v2/prisma.config.ts

```typescript
import path from 'node:path'
import { defineConfig } from 'prisma/config'

// Try to load .env file if it exists (for local dev)
try {
  const { loadEnvFile } = await import('node:process')
  loadEnvFile()
} catch (e) {
  // .env file not found, using environment variables from Docker
}

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    seed: 'node prisma/seed.js',
  },
})
```

### 1.5 Transférer les fichiers

```powershell
cd C:\Users\MarcOliva\CascadeProjects\lumiere16
.\upload-to-server.ps1
```

---

## Étape 2 : Configuration du serveur

### 2.1 Connexion SSH

```powershell
ssh -i C:\Users\MarcOliva\Downloads\id_rsa_lumiere_prod.txt debian@83.228.218.52
```

### 2.2 Vérifier le firewall Infomaniak

Dans le Manager Infomaniak > VPS > Firewall, s'assurer que ces règles existent :
- **TCP 80** - Toutes - HTTP
- **TCP 443** - Toutes - HTTPS

### 2.3 Créer le fichier .env

```bash
cd /var/www/lumiere
cp .env.production.example .env
nano .env
```

Contenu :
```env
# Database
POSTGRES_USER=lumiere
POSTGRES_PASSWORD=MotDePasseSecurise123!
POSTGRES_DB=lumiere_db

# Backend
JWT_SECRET=Lum13r3Pr0d!xK9mP2vL8nQ4wR7tY1uI5oA3sD6fG0hJ2024
CORS_ORIGIN=https://lumiere.mindcentra.com

# Domain
DOMAIN=lumiere.mindcentra.com
```

Sauvegarder : `Ctrl+O`, `Entrée`, `Ctrl+X`

---

## Étape 3 : Installation Docker

```bash
# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh

# Se déconnecter et reconnecter pour appliquer les permissions
exit
```

Reconnecter :
```powershell
ssh -i C:\Users\MarcOliva\Downloads\id_rsa_lumiere_prod.txt debian@83.228.218.52
cd /var/www/lumiere
```

---

## Étape 4 : Obtenir le certificat SSL

### 4.1 Créer les dossiers

```bash

mkdir -p certbot/conf certbot/www
```

### 4.2 Configurer nginx temporairement (HTTP uniquement)

```bash
cat > nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name lumiere.mindcentra.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'Waiting for SSL setup...';
        add_header Content-Type text/plain;
    }
}
EOF
```

### 4.3 Démarrer les containers (sans SSL)

```bash
docker compose up -d postgres backend frontend nginx
```

### 4.4 Installer Certbot et obtenir le certificat

```bash
sudo apt update && sudo apt install -y certbot
sudo certbot certonly --webroot -w /var/www/lumiere/certbot/www -d lumiere.mindcentra.com --email 3pparisquinze@gmail.com --agree-tos --no-eff-email
```

### 4.5 Copier les certificats

```bash
sudo mkdir -p /var/www/lumiere/certbot/conf/live
sudo mkdir -p /var/www/lumiere/certbot/conf/archive
sudo cp -rL /etc/letsencrypt/live/lumiere.mindcentra.com /var/www/lumiere/certbot/conf/live/
sudo cp -rL /etc/letsencrypt/archive/lumiere.mindcentra.com /var/www/lumiere/certbot/conf/archive/
sudo chown -R debian:debian /var/www/lumiere/certbot/conf/
```

### 4.6 Configurer nginx avec SSL

```bash
cat > nginx/conf.d/default.conf << 'EOF'
# HTTP - Redirect to HTTPS
server {
    listen 80;
    server_name lumiere.mindcentra.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name lumiere.mindcentra.com;

    ssl_certificate /etc/letsencrypt/live/lumiere.mindcentra.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lumiere.mindcentra.com/privkey.pem;

    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    location / {
        proxy_pass http://frontend:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
```

### 4.7 Redémarrer nginx

```bash
docker compose restart nginx
```

---

## Étape 5 : Migrations et Seeds

### 5.1 Exécuter les migrations Prisma

```bash
docker compose exec backend npx prisma migrate deploy
```

### 5.2 Exécuter les seeds

```bash
docker compose exec backend node prisma/seeds/run-single.js languages
docker compose exec backend node prisma/seeds/run-single.js ci-types
docker compose exec backend node prisma/seeds/run-single.js ci-type-fields
docker compose exec backend node prisma/seeds/run-single.js object-metadata
docker compose exec backend node prisma/seeds/run-single.js default-admin
```

### 5.3 Compte administrateur par défaut

Le seed `default-admin` crée un compte administrateur pour la première connexion :

| Champ | Valeur |
|-------|--------|
| Email | `admin@lumiere.local` |
| Mot de passe | `Lumiere2024!` |
| Rôle | `admin` |

⚠️ **IMPORTANT** : Changez le mot de passe après la première connexion !

---

## Étape 6 : Vérification

### 6.1 Tester l'accès HTTPS

```bash
curl -I https://lumiere.mindcentra.com
```

Doit retourner `HTTP/2 200`

### 6.2 Tester l'API

```bash
curl https://lumiere.mindcentra.com/api/v1/health
```

Doit retourner `{"status":"ok",...}`

### 6.3 Ouvrir dans le navigateur

https://lumiere.mindcentra.com

---

## Commandes utiles

### Voir les logs

```bash
docker compose logs -f              # Tous les logs
docker compose logs backend -f      # Logs backend uniquement
docker compose logs nginx -f        # Logs nginx uniquement
```

### Statut des containers

```bash
docker compose ps
```

### Redémarrer un service

```bash
docker compose restart backend
docker compose restart frontend
docker compose restart nginx
```

### Arrêter l'application

```bash
docker compose down
```

### Relancer l'application

```bash
docker compose up -d
```

### Rebuild après modification du code

# 1A Backend
docker compose build backend --no-cache && docker compose up -d backend

# 1B Frontend
docker compose build frontend --no-cache && docker compose up -d frontend

# 1CTout reconstruire (après un nouvel upload)
docker compose down
docker compose build --no-cache
docker compose up -d


## Résolution de problèmes

### Erreur "port 80 non accessible"

→ Vérifier le firewall Infomaniak (ports 80 et 443)

### Erreur Certbot bloqué

→ Utiliser Certbot installé sur Debian (pas le container Docker)

### Erreur "ENOENT .env" lors de prisma migrate

→ Vérifier que `prisma.config.ts` gère l'absence de `.env` avec try/catch

### Erreur 404 sur /api/auth/register

→ Vérifier que `VITE_API_URL` est `/api/v1` dans docker-compose.yml

### Base de données vide après connexion

→ Exécuter les seeds (voir Étape 5.2)

### Lignes vides dans les tableaux (données non affichées)

→ Exécuter le seed object-metadata :
```bash
docker compose exec backend node prisma/seeds/run-single.js object-metadata
```

### Anciennes versions affichées après déploiement

→ Le cache Docker n'a pas été invalidé. Reconstruire sans cache :
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        INTERNET                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                    ┌─────▼─────┐
                    │   NGINX   │ :80 (→ :443)
                    │   :443    │ SSL/HTTPS
                    └─────┬─────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
    ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
    │ FRONTEND  │   │  BACKEND  │   │  CERTBOT  │
    │   :80     │   │   :3000   │   │  (renew)  │
    │  (Vue.js) │   │ (Node.js) │   └───────────┘
    └───────────┘   └─────┬─────┘
                          │
                    ┌─────▼─────┐
                    │ POSTGRES  │
                    │   :5432   │
                    └───────────┘
```
