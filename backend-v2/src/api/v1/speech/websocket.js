const { WebSocketServer } = require('ws');
const url = require('url');
const logger = require('../../../config/logger');
const { handleSTTConnection } = require('./stt.service');

/**
 * Initialize WebSocket server for speech services
 * @param {http.Server} server - HTTP server instance
 */
const initializeWebSocket = (server) => {
  const wss = new WebSocketServer({ 
    server,
    path: '/api/v1/speech/stt'
  });

  logger.info('WebSocket server initialized for STT at /api/v1/speech/stt');

  wss.on('connection', (ws, req) => {
    // Parse query parameters for language
    const queryParams = url.parse(req.url, true).query;
    const language = queryParams.lang || 'fr';
    
    // Validate language
    const supportedLanguages = ['en', 'fr', 'de', 'es', 'pt'];
    const validLanguage = supportedLanguages.includes(language) ? language : 'fr';

    logger.info(`WebSocket connection established for STT, language: ${validLanguage}`);
    
    handleSTTConnection(ws, validLanguage);
  });

  wss.on('error', (error) => {
    logger.error(`WebSocket server error: ${error.message}`);
  });

  return wss;
};

module.exports = {
  initializeWebSocket
};
