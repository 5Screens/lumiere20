const { WebSocketServer } = require('ws');
const url = require('url');
const logger = require('../../../config/logger');
const { handleSTTConnection } = require('./stt.service');
const { handleTTSConnection } = require('./tts.service');

/**
 * Initialize WebSocket server for speech services (STT and TTS)
 * Uses a single WebSocketServer with manual path routing
 * @param {http.Server} server - HTTP server instance
 */
const initializeWebSocket = (server) => {
  // Single WebSocket server with noServer mode for manual upgrade handling
  const wss = new WebSocketServer({ noServer: true });

  logger.info('WebSocket server initialized for speech services');

  // Handle WebSocket upgrade requests manually
  server.on('upgrade', (request, socket, head) => {
    const pathname = url.parse(request.url).pathname;
    
    logger.info(`WebSocket upgrade request for path: ${pathname}`);

    if (pathname === '/api/v1/speech/stt' || pathname.startsWith('/api/v1/speech/stt?')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        const queryParams = url.parse(request.url, true).query;
        const language = queryParams.lang || 'fr';
        
        const supportedLanguages = ['en', 'fr', 'de', 'es', 'pt'];
        const validLanguage = supportedLanguages.includes(language) ? language : 'fr';

        logger.info(`WebSocket connection established for STT, language: ${validLanguage}`);
        
        handleSTTConnection(ws, validLanguage);
      });
    } else if (pathname === '/api/v1/speech/tts' || pathname.startsWith('/api/v1/speech/tts?')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        const queryParams = url.parse(request.url, true).query;
        const language = queryParams.lang || 'fr';
        
        const supportedLanguages = ['en', 'fr', 'de', 'es', 'pt'];
        const validLanguage = supportedLanguages.includes(language) ? language : 'fr';

        logger.info(`WebSocket connection established for TTS, language: ${validLanguage}`);
        
        handleTTSConnection(ws, validLanguage);
      });
    } else {
      logger.warn(`WebSocket upgrade rejected for unknown path: ${pathname}`);
      socket.destroy();
    }
  });

  wss.on('error', (error) => {
    logger.error(`WebSocket server error: ${error.message}`);
  });

  return wss;
};

module.exports = {
  initializeWebSocket
};
