# Voice Assistant - Intégration Gradium

> **Statut** : Phase de réflexion  
> **Date** : 2026-01-08  
> **Cible** : `portal-runner`

## Objectif

Permettre aux utilisateurs finaux de parler en langage naturel avec le LLM Lumière via une interface vocale intégrée dans les portails.

---

## API Gradium

### Documentation
- **OpenAPI** : `gradium.openapi.json` (racine du projet)
- **Doc en ligne** : https://gradium.ai/api_docs.html

### Endpoints WebSocket

| Service | URL Europe | URL USA | Fonction |
|---------|-----------|---------|----------|
| **TTS** | `wss://eu.api.gradium.ai/api/speech/tts` | `wss://us.api.gradium.ai/api/speech/tts` | Texte → Audio |
| **STT** | `wss://eu.api.gradium.ai/api/speech/asr` | `wss://us.api.gradium.ai/api/speech/asr` | Audio → Texte |

### Authentification
```
Header: x-api-key: <GRADIUM_API_KEY>
```

### Langues supportées
- Français (fr) ✅
- Anglais (en)
- Allemand (de)
- Espagnol (es)
- Portugais (pt)

### Caractéristiques
- **Latence** : < 300ms time-to-first-token
- **Voice cloning** : Possible avec un échantillon de 10 secondes
- **Serveurs** : Europe (EU) et USA (US)

---

## Flux de communication

### STT (Speech-to-Text) - Micro → Texte

```
Client → { type: "setup", model_name: "default", input_format: "pcm" }
Server → { type: "ready", sample_rate: 24000, frame_size: 1920 }
Client → { type: "audio", audio: "base64..." }  // streaming depuis le micro
Server → { type: "text", text: "transcription...", start_s: 0.5 }
Server → { type: "end_text", stop_s: 2.5 }  // VAD détecte fin de phrase
Client → { type: "end_of_stream" }
```

**Format audio requis (PCM input)** :
- Sample Rate : 24000 Hz (24kHz)
- Format : PCM 16-bit signed integer (little-endian)
- Channels : Mono
- Chunk Size : 1920 samples (80ms à 24kHz)

### TTS (Text-to-Speech) - Texte → Audio

```
Client → { type: "setup", voice_id: "xxx", model_name: "default", output_format: "pcm" }
Server → { type: "ready", request_id: "uuid" }
Client → { type: "text", text: "Bonjour!" }
Server → { type: "audio", audio: "base64..." }  // streaming audio
Client → { type: "end_of_stream" }
Server → { type: "end_of_stream" }
```

**Format audio sortie (PCM output)** :
- Sample Rate : 48000 Hz (48kHz)
- Format : PCM 16-bit signed integer
- Channels : Mono
- Chunk Size : 3840 samples (80ms à 48kHz)

---

## Architecture proposée

### Flux utilisateur complet

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PORTAL-RUNNER                                │
│                                                                      │
│  ┌──────────┐    ┌─────────────┐    ┌─────────┐    ┌─────────────┐  │
│  │   🎤     │───▶│  Gradium    │───▶│   LLM   │───▶│   Gradium   │──▶│ 🔊
│  │  Micro   │    │    STT      │    │ Lumière │    │    TTS      │  │
│  └──────────┘    └─────────────┘    └─────────┘    └─────────────┘  │
│                                                                      │
│  1. User parle   2. Transcription  3. Traitement  4. Synthèse vocale │
└─────────────────────────────────────────────────────────────────────┘
```

### Composants à créer

| Composant | Chemin | Rôle |
|-----------|--------|------|
| `VoiceAssistant.vue` | `portal-runner/src/components/` | Composant principal avec bouton micro et feedback visuel |
| `gradium.js` | `portal-runner/src/services/` | Service WebSocket pour STT et TTS |
| `llm.js` | `portal-runner/src/services/` | Service pour appeler le LLM Lumière |
| `useVoiceChat.js` | `portal-runner/src/composables/` | Logique réutilisable (état, enregistrement, lecture) |

### APIs Browser nécessaires
- `navigator.mediaDevices.getUserMedia()` - Accès au microphone
- `MediaRecorder` - Enregistrement audio
- `AudioContext` - Traitement et lecture audio
- `WebSocket` - Communication avec Gradium

---

## Points en suspend ❓

### 1. LLM Lumière
- [ ] Où est hébergé le LLM ?
- [ ] Quelle API ? (OpenAI-compatible ? Custom endpoint ?)
- [ ] Authentification requise ?
- [ ] Contexte système à fournir ?

### 2. Voix TTS
- [ ] Utiliser une voix du catalogue Gradium ?
- [ ] Créer une voix custom "Lumière" (voice cloning) ?
- [ ] Quelle langue par défaut ?

### 3. UX / Interaction
- [ ] **Mode d'activation** : Push-to-talk (maintenir) ou Toggle (clic start/stop) ?
- [ ] Afficher la transcription en temps réel pendant que l'utilisateur parle ?
- [ ] Afficher la réponse texte en plus de l'audio ?
- [ ] Indicateur visuel pendant l'écoute / le traitement / la lecture ?

### 4. Contexte et capacités
- [ ] Le LLM doit-il avoir accès aux données du portail (tickets, CI, etc.) ?
- [ ] Quelles actions le LLM peut-il déclencher ? (créer ticket, rechercher, etc.)
- [ ] Historique de conversation à maintenir ?

### 5. Configuration
- [ ] Clé API Gradium : variable d'environnement `VITE_GRADIUM_API_KEY` ?
- [ ] Serveur à utiliser : EU ou US ?
- [ ] Fallback si Gradium indisponible ?

### 6. Sécurité
- [ ] La clé API Gradium peut-elle être exposée côté client ?
- [ ] Faut-il un proxy backend pour les appels Gradium ?
- [ ] Permissions micro : gestion du refus utilisateur ?

---

## Prochaines étapes

1. Répondre aux points en suspend
2. Créer le service `gradium.js` avec les WebSockets STT/TTS
3. Créer le composable `useVoiceChat.js`
4. Créer le composant `VoiceAssistant.vue`
5. Intégrer dans un portail de test
6. Connecter au LLM Lumière
7. Tests et ajustements UX

---

## Ressources

- [Gradium API Documentation](https://gradium.ai/api_docs.html)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
