// ============================================
// CONFIGURATION FRONTEND - SOURCE DE VÉRITÉ
// ============================================

// === API Configuration ===
export const API_BASE_URL = 'http://localhost:3000/api/v1';

// === Performance & UX ===
export const DEBOUNCE_DELAY_MS = 300;

// === Pagination & Infinite Scroll ===
export const PAGINATION_CONFIG = {
  // Taille de page par défaut
  defaultPageSize: 50,
  
  // Tailles de page par type d'objet
  pageSizes: {
    'Person': 50,
    'Task': 50,
    'Incident': 50,
    'Problem': 25,
    'Change': 25,
    'Entity': 100,
    'Location': 75
  },
  
  // Types d'objets utilisant l'infinite scroll
  infiniteScrollTypes: [
    'Person',
    'Task',
    'Incident'
    // Décommenter pour activer :
    // 'Problem',
    // 'Change',
  ],
  
  // Seuil de déclenchement du chargement (px avant la fin)
  infiniteScrollThreshold: 200
};

// === Filtres ===
export const FILTER_CONFIG = {
  // Délai de debounce pour la recherche
  searchDebounceMs: 300,
  
  // Nombre minimum de caractères pour déclencher une recherche
  minSearchChars: 2,
  
  // Nombre d'items à charger par page dans les filtres lazy
  lazyLoadPageSize: 10,
  
  // Durée de cache des filtres dans localStorage (ms)
  cacheMaxAge: 24 * 60 * 60 * 1000 // 24 heures
};

// === Limites ===
export const LIMITS = {
  // Taille maximale de fichier uploadé (bytes)
  maxFileSize: 10 * 1024 * 1024, // 10 MB
  
  // Nombre maximum de fichiers simultanés
  maxFilesCount: 5,
  
  // Longueur maximale des champs texte
  maxTextLength: 5000,
  
  // Nombre maximum de tags/watchers
  maxTags: 20
};

// === Timeouts ===
export const TIMEOUTS = {
  // Timeout des requêtes API (ms)
  apiTimeout: 30000, // 30 secondes
  
  // Timeout des notifications (ms)
  notificationTimeout: 5000, // 5 secondes
  
  // Délai avant auto-save (ms)
  autoSaveDelay: 2000 // 2 secondes
};

// === Features Flags ===
export const FEATURES = {
  // Activer le mode debug
  debugMode: false,
  
  // Activer les logs détaillés
  verboseLogs: false,
  
  // Activer l'export/import
  enableImportExport: true,
  
  // Activer les notifications desktop
  enableDesktopNotifications: false
};

// === Export par défaut ===
export default {
  API_BASE_URL,
  DEBOUNCE_DELAY_MS,
  PAGINATION_CONFIG,
  FILTER_CONFIG,
  LIMITS,
  TIMEOUTS,
  FEATURES
};
