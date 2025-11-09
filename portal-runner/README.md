# Portal Runner

Micro-front autonome pour l'exécution de portails Lumière.

## 🚀 Démarrage rapide

### Installation

```bash
npm install
```

### Développement

```bash
npm run dev
```

L'application sera disponible sur `http://localhost:7240`

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## 📋 Configuration

Créer un fichier `.env` à la racine du projet :

```
VITE_API_BASE_URL=http://localhost:3000
```

## 🎯 Routes disponibles

### `/:portalCode`
Page dynamique qui charge un portail depuis la base de données :
1. Appelle `GET /api/v1/portals/resolve?code=:portalCode`
2. Affiche les informations du portail (titre, sous-titre, alertes, widgets)
3. Rend les actions configurées (quick actions)
4. Utilise le composant Vue spécifié dans `view_component` (DemoView, PortalViewV1, etc.)

**Exemples de portails disponibles :**
- `/demo-portal` - Portail de démonstration avec création de tickets
- `/support-portal` - Portail support utilisateurs
- `/admin-portal` - Portail administration

## 🏗️ Architecture

```
portal-runner/
├── src/
│   ├── assets/
│   │   └── base.css           # Styles globaux
│   ├── components/
│   │   ├── ButtonStandard.vue # Bouton avec deux modes (demo/config)
│   │   └── StatusInline.vue   # Affichage succès/erreur
│   ├── router/
│   │   └── index.js           # Configuration Vue Router
│   ├── services/
│   │   ├── api.js             # Instance axios
│   │   ├── portals.js         # API portals
│   │   └── tickets.js         # API tickets
│   ├── views/
│   │   ├── PortalWrapper.vue  # Wrapper dynamique qui charge le bon composant
│   │   ├── PortalViewV1.vue   # Composant portail complet (v1)
│   │   └── PortalView.vue     # Composant portail simple
│   ├── App.vue                # Composant racine
│   └── main.js                # Point d'entrée
├── .env                       # Variables d'environnement
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 🔧 Composants

### ButtonStandard
Bouton intelligent avec deux modes :
- **Mode demo** : Utilise `demoPayload` pour appeler `POST /tickets`
- **Mode config** : Utilise `action` (depuis `/portals/resolve`) pour exécuter l'action configurée

### StatusInline
Affiche les messages de succès (✅) ou d'erreur (❌) après l'exécution d'une action.

## 🌐 CORS

En développement, si l'API et le runner sont sur des ports différents, configurer CORS côté API :

```javascript
app.use(cors({
  origin: 'http://localhost:7240'
}))
```

En production, placer l'API et le runner derrière le même domaine (reverse proxy).

## ✅ Critères d'acceptation

- ✅ Build et run sur port 7240
- ✅ `/demo` affiche Hello world + bouton fonctionnel
- ✅ `/:portalCode` récupère config via `/portals/resolve`
- ✅ Bouton exécute l'action configurée (méthode/endpoint/payload)
- ✅ Gestion loading/erreur/succès
- ✅ Base URL API via `VITE_API_BASE_URL`
- ✅ Code Composition API clair
