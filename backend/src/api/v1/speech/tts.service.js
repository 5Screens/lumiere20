const WebSocket = require('ws');
const logger = require('../../../config/logger');

const GRADIUM_TTS_URL = process.env.GRADIUM_TTS_URL || 'wss://eu.api.gradium.ai/api/speech/tts';
const GRADIUM_API_KEY = process.env.GRADIUM_API_KEY;

// Voice IDs per locale from environment
const VOICE_IDS = {
  fr: process.env.VOICE_ID_FR || 'b35yykvVppLXyw_l',
  en: process.env.VOICE_ID_EN || 'YTpq7expH9539ERJ',
  de: process.env.VOICE_ID_DE || '-uP9MuGtBqAvEyxI',
  pt: process.env.VOICE_ID_PT || 'pYcGZz9VOo4n2ynh',
  es: process.env.VOICE_ID_ES || 'B36pbz5_UoWn4BDl'
};

/**
 * Get voice ID for a given locale
 * @param {string} locale - Language code (en, fr, de, es, pt)
 * @returns {string} Voice ID
 */
const getVoiceIdForLocale = (locale) => {
  const lang = locale.split('-')[0].toLowerCase();
  return VOICE_IDS[lang] || VOICE_IDS.en;
};

/**
 * Handle TTS WebSocket proxy connection
 * Relays text from client to Gradium and audio back to client
 * @param {WebSocket} clientWs - WebSocket connection from client
 * @param {string} language - Language code (en, fr, de, es, pt)
 */
const handleTTSConnection = (clientWs, language = 'fr') => {
  logger.info(`TTS proxy: New connection for language: ${language}`);

  if (!GRADIUM_API_KEY) {
    logger.error('TTS proxy: GRADIUM_API_KEY is not configured');
    clientWs.send(JSON.stringify({ 
      type: 'error', 
      message: 'Speech service not configured',
      code: 500 
    }));
    clientWs.close();
    return;
  }

  const voiceId = getVoiceIdForLocale(language);
  logger.info(`TTS proxy: Using voice ID: ${voiceId} for language: ${language}`);

  let gradiumWs = null;
  let isGradiumReady = false;

  // Connect to Gradium TTS
  try {
    gradiumWs = new WebSocket(GRADIUM_TTS_URL, {
      headers: {
        'x-api-key': GRADIUM_API_KEY
      }
    });
  } catch (error) {
    logger.error(`TTS proxy: Failed to create Gradium WebSocket: ${error.message}`);
    clientWs.send(JSON.stringify({ 
      type: 'error', 
      message: 'Failed to connect to speech service',
      code: 500 
    }));
    clientWs.close();
    return;
  }

  // Gradium connection opened
  gradiumWs.on('open', () => {
    logger.info('TTS proxy: Connected to Gradium TTS');
    
    // Send setup message to Gradium
    // Use PCM format - WAV chunks cannot be decoded individually by Web Audio API
    // padding_bonus: negative = faster speech, positive = slower speech (range: -4.0 to 4.0)
    const setupMessage = {
      type: 'setup',
      model_name: 'default',
      voice_id: voiceId,
      output_format: 'pcm',
      json_config: {
        padding_bonus: -2.5,  // Slightly faster speech for more natural conversation
        rewrite_rules: language  // Enable language-specific rewrite rules (dates, numbers, etc.)
      }
    };
    
    gradiumWs.send(JSON.stringify(setupMessage));
    logger.debug(`TTS proxy: Sent setup message: ${JSON.stringify(setupMessage)}`);
  });

  // Handle messages from Gradium
  gradiumWs.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      logger.debug(`TTS proxy: Received from Gradium: ${message.type}`);

      switch (message.type) {
        case 'ready':
          isGradiumReady = true;
          logger.info('TTS proxy: Gradium TTS ready');
          // Forward ready message to client
          clientWs.send(JSON.stringify({
            type: 'ready',
            request_id: message.request_id
          }));
          break;

        case 'audio':
          // Forward audio chunk to client (streaming)
          clientWs.send(JSON.stringify({
            type: 'audio',
            audio: message.audio
          }));
          break;

        case 'end_of_stream':
          logger.info('TTS proxy: Gradium TTS end of stream');
          clientWs.send(JSON.stringify({ type: 'end_of_stream' }));
          break;

        case 'error':
          logger.error(`TTS proxy: Gradium error: ${message.message}`);
          clientWs.send(JSON.stringify({
            type: 'error',
            message: message.message || 'Text-to-speech error',
            code: message.code || 500
          }));
          break;

        default:
          logger.debug(`TTS proxy: Unknown message type from Gradium: ${message.type}`);
      }
    } catch (error) {
      logger.error(`TTS proxy: Failed to parse Gradium message: ${error.message}`);
    }
  });

  // Handle Gradium connection errors
  gradiumWs.on('error', (error) => {
    logger.error(`TTS proxy: Gradium WebSocket error: ${error.message}`);
    clientWs.send(JSON.stringify({
      type: 'error',
      message: 'Speech service connection error',
      code: 500
    }));
  });

  // Handle Gradium connection close
  gradiumWs.on('close', (code, reason) => {
    logger.info(`TTS proxy: Gradium connection closed: ${code} - ${reason}`);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.close();
    }
  });

  // Handle messages from client
  clientWs.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      logger.debug(`TTS proxy: Received from client: ${message.type}`);
      
      switch (message.type) {
        case 'text':
          // Forward text to Gradium for synthesis
          if (isGradiumReady && gradiumWs.readyState === WebSocket.OPEN) {
            logger.info(`TTS proxy: Sending text to Gradium: "${message.text?.substring(0, 50)}..."`);
            gradiumWs.send(JSON.stringify({
              type: 'text',
              text: message.text
            }));
          } else {
            logger.warn(`TTS proxy: Cannot forward text - ready: ${isGradiumReady}, ws state: ${gradiumWs?.readyState}`);
          }
          break;

        case 'end_of_stream':
          // Forward end of stream to Gradium
          if (gradiumWs.readyState === WebSocket.OPEN) {
            gradiumWs.send(JSON.stringify({ type: 'end_of_stream' }));
          }
          break;

        default:
          logger.debug(`TTS proxy: Unknown message type from client: ${message.type}`);
      }
    } catch (error) {
      logger.error(`TTS proxy: Failed to parse client message: ${error.message}`);
    }
  });

  // Handle client connection close
  clientWs.on('close', () => {
    logger.info('TTS proxy: Client disconnected');
    if (gradiumWs && gradiumWs.readyState === WebSocket.OPEN) {
      gradiumWs.send(JSON.stringify({ type: 'end_of_stream' }));
      gradiumWs.close();
    }
  });

  // Handle client errors
  clientWs.on('error', (error) => {
    logger.error(`TTS proxy: Client WebSocket error: ${error.message}`);
    if (gradiumWs && gradiumWs.readyState === WebSocket.OPEN) {
      gradiumWs.close();
    }
  });
};

module.exports = {
  handleTTSConnection,
  getVoiceIdForLocale
};
