# POC Agent Conversationnel - Guide de démarrage

## 🎯 Objectif du POC

Intégrer un assistant conversationnel dans le portail front-office de Lumière 16 qui communique avec l'API Infomaniak AI (modèle Mixtral).

## 📋 Prérequis

### Configuration Backend

Ajouter ces variables dans `backend/.env` :

```bash
# AI Agent Configuration
INFOMANIAK_AI_API_URL=https://api.infomaniak.com/1/ai/106330/openai/chat/completions
INFOMANIAK_AI_TOKEN=votre_token_ici
INFOMANIAK_AI_MODEL=mixtral
```

⚠️ **Important** : Remplacer `votre_token_ici` par le token API Infomaniak réel.

## 🚀 Démarrage

### 1. Backend

```bash
cd backend
npm install
npm start
```

Le serveur démarre sur `http://localhost:3000`

### 2. Portal Runner (Frontend)

```bash
cd portal-runner
npm install
npm run dev
```

Le portail démarre sur `http://localhost:5173` (ou autre port Vite)

## 🧪 Tests

### Test 1 : Health Check de l'Agent

```bash
curl http://localhost:3000/api/v1/agent/health
```

**Réponse attendue** :
```json
{
  "status": "ok",
  "configured": true,
  "model": "mixtral"
}
```

### Test 2 : Envoi d'un message via API

```bash
curl -X POST http://localhost:3000/api/v1/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Bonjour, comment vas-tu ?"
  }'
```

**Réponse attendue** :
```json
{
  "success": true,
  "data": {
    "message": "Bonjour ! Je vais bien, merci...",
    "model": "mixtral",
    "usage": {
      "input_tokens": 8,
      "output_tokens": 50,
      "total_tokens": 58
    }
  }
}
```

### Test 3 : Interface Utilisateur

1. Ouvrir le navigateur : `http://localhost:5173/portal/DEMO` (ou le code de votre portail)
2. Le panneau de chat apparaît à droite (si `show_chat` est activé dans le portail)
3. Taper un message dans le champ de saisie
4. Appuyer sur Entrée ou cliquer sur le bouton d'envoi
5. Observer :
   - Message utilisateur affiché en bleu à droite
   - Indicateur de chargement (3 points animés)
   - Réponse de l'IA affichée en gris à gauche

## 📁 Architecture

### Backend

```
backend/src/api/v1/agent/
├── routes.js       # Routes API (/chat, /health)
├── controller.js   # Logique de contrôle
├── service.js      # Appel API Infomaniak
└── validation.js   # Validation Joi des requêtes
```

### Frontend

```
portal-runner/src/
├── services/
│   └── agent.js              # Service API agent
└── components/
    └── AgenticPanel.vue      # Widget de chat
```

## 🔧 Fonctionnalités implémentées

### Backend
- ✅ Route POST `/api/v1/agent/chat` pour envoyer des messages
- ✅ Route GET `/api/v1/agent/health` pour vérifier la configuration
- ✅ Validation des messages (min 1, max 5000 caractères)
- ✅ Support de l'historique conversationnel (max 50 messages)
- ✅ Gestion des erreurs (timeout, auth, config manquante)
- ✅ Logging détaillé avec préfixes [AGENT SERVICE], [AGENT CONTROLLER], etc.

### Frontend
- ✅ Widget de chat intégré dans PortalViewV1
- ✅ Interface utilisateur moderne avec animations
- ✅ Indicateur de chargement pendant l'appel API
- ✅ Affichage des messages utilisateur et IA
- ✅ Copie des réponses de l'IA
- ✅ Gestion des messages longs (collapse/expand)
- ✅ Historique conversationnel envoyé au backend
- ✅ Gestion des erreurs avec messages utilisateur

## 🐛 Dépannage

### Erreur : "AI configuration missing"

**Cause** : Variables d'environnement non définies dans `backend/.env`

**Solution** : Vérifier que `INFOMANIAK_AI_API_URL` et `INFOMANIAK_AI_TOKEN` sont bien définis

### Erreur : "AI service authentication failed"

**Cause** : Token Infomaniak invalide ou expiré

**Solution** : Vérifier le token dans le dashboard Infomaniak et le mettre à jour dans `.env`

### Erreur : "AI service timeout"

**Cause** : L'API Infomaniak met trop de temps à répondre (> 30s)

**Solution** : Vérifier la connexion internet et le statut de l'API Infomaniak

### Le panneau de chat n'apparaît pas

**Cause** : `show_chat` est désactivé dans la configuration du portail

**Solution** : Vérifier dans la base de données que `configuration.portals.show_chat = true`

## 📊 Format des données

### Requête POST /api/v1/agent/chat

```json
{
  "message": "Votre message ici",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Message précédent de l'utilisateur"
    },
    {
      "role": "assistant",
      "content": "Réponse précédente de l'IA"
    }
  ]
}
```

### Réponse de l'API Infomaniak

```json
{
  "model": "mixtral",
  "id": "",
  "object": "chat.completion",
  "created": 1762450670,
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Réponse de l'IA..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "input_tokens": 8,
    "output_tokens": 461,
    "total_tokens": 469
  }
}
```

## 🔜 Prochaines étapes

### Phase 2 : Tools & Orchestration
- [ ] Définir les intents (créer ticket, rechercher KB, etc.)
- [ ] Implémenter les tools (function calling)
- [ ] Ajouter la détection d'intent
- [ ] Implémenter les confirmations utilisateur

### Phase 3 : Mémoire & Contexte
- [ ] Stocker les conversations en base de données
- [ ] Récupérer le contexte utilisateur (person_uuid, entité, etc.)
- [ ] Implémenter la mémoire conversationnelle longue

### Phase 4 : Sécurité & Conformité
- [ ] Masquage des PII
- [ ] Rate limiting
- [ ] Anti-prompt-injection
- [ ] Audit des conversations

### Phase 5 : Observabilité
- [ ] Métriques (CSAT, FCR, latence)
- [ ] Dashboard de supervision
- [ ] Alerting sur erreurs

## 📝 Notes

- Le POC utilise actuellement un timeout de 30 secondes pour les appels API
- L'historique conversationnel est limité à 50 messages pour éviter les tokens excessifs
- Les messages sont limités à 5000 caractères
- Le widget est visible uniquement si `portal.show_chat === true`

## 🆘 Support

En cas de problème, vérifier les logs :
- Backend : Console du serveur Node.js
- Frontend : Console du navigateur (F12)

Les logs utilisent des préfixes pour faciliter le débogage :
- `[AGENT SERVICE]`
- `[AGENT CONTROLLER]`
- `[AGENT ROUTES]`
- `[AGENT VALIDATION]`
- `[Agent Service]` (frontend)
- `[AgenticPanel]` (composant Vue)
