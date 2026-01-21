const WebSocket = require('ws');
const logger = require('../../../config/logger');

const GRADIUM_API_URL = process.env.GRADIUM_API_URL || 'wss://eu.api.gradium.ai/api/speech/asr';
const GRADIUM_API_KEY = process.env.GRADIUM_API_KEY;

/**
 * Handle STT WebSocket proxy connection
 * Relays audio from client to Gradium and transcription back to client
 * @param {WebSocket} clientWs - WebSocket connection from client
 * @param {string} language - Language code (en, fr, de, es, pt)
 */
const handleSTTConnection = (clientWs, language = 'fr') => {
  logger.info(`STT proxy: New connection for language: ${language}`);

  if (!GRADIUM_API_KEY) {
    logger.error('STT proxy: GRADIUM_API_KEY is not configured');
    clientWs.send(JSON.stringify({ 
      type: 'error', 
      message: 'Speech service not configured',
      code: 500 
    }));
    clientWs.close();
    return;
  }

  let gradiumWs = null;
  let isGradiumReady = false;
  
  // VAD (Voice Activity Detection) tracking
  // When inactivity_prob is high for several consecutive steps, user has stopped speaking
  // Gradium recommends: horizon 2s and inactivity_prob > 0.5
  let consecutiveHighInactivityCount = 0;
  const VAD_INACTIVITY_THRESHOLD = 0.9; // Probability threshold (Gradium recommends > 0.5)
  const VAD_CONSECUTIVE_STEPS_FOR_END = 8; // ~640ms at 80ms per step (faster response with lower threshold)
  let hasReceivedText = false; // Only trigger speech_end if we received some text

  // Connect to Gradium STT
  try {
    gradiumWs = new WebSocket(GRADIUM_API_URL, {
      headers: {
        'x-api-key': GRADIUM_API_KEY
      }
    });
  } catch (error) {
    logger.error(`STT proxy: Failed to create Gradium WebSocket: ${error.message}`);
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
    logger.info('STT proxy: Connected to Gradium');
    
    // Send setup message to Gradium
    const setupMessage = {
      type: 'setup',
      model_name: 'default',
      input_format: 'pcm',
      language: language
    };
    
    gradiumWs.send(JSON.stringify(setupMessage));
    logger.debug(`STT proxy: Sent setup message: ${JSON.stringify(setupMessage)}`);
  });

  // Handle messages from Gradium
  gradiumWs.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      logger.info(`STT proxy: Received from Gradium: ${message.type} - ${JSON.stringify(message)}`);

      switch (message.type) {
        case 'ready':
          isGradiumReady = true;
          // Forward ready message to client
          clientWs.send(JSON.stringify({
            type: 'ready',
            sample_rate: message.sample_rate || 24000,
            frame_size: message.frame_size || 1920
          }));
          break;

        case 'text':
          hasReceivedText = true;
          consecutiveHighInactivityCount = 0; // Reset on new text
          // Forward transcription to client
          clientWs.send(JSON.stringify({
            type: 'text',
            text: message.text,
            start_s: message.start_s
          }));
          break;

        case 'end_text':
          // Forward end of text (VAD detected end of speech)
          clientWs.send(JSON.stringify({
            type: 'end_text',
            stop_s: message.stop_s
          }));
          break;

        case 'step':
          // VAD activity - check for prolonged inactivity
          if (message.vad && message.vad.length > 0) {
            // Use the 2-second horizon for detecting end of speech (Gradium recommendation)
            const vad2s = message.vad.find(v => v.horizon_s === 2);
            if (vad2s && vad2s.inactivity_prob > VAD_INACTIVITY_THRESHOLD) {
              consecutiveHighInactivityCount++;
              
              // If we've had high inactivity for enough steps AND received some text, signal speech end
              if (consecutiveHighInactivityCount >= VAD_CONSECUTIVE_STEPS_FOR_END && hasReceivedText) {
                logger.info(`STT proxy: VAD detected speech end after ${consecutiveHighInactivityCount} inactive steps`);
                clientWs.send(JSON.stringify({ type: 'speech_end' }));
                // Reset to avoid sending multiple speech_end signals
                hasReceivedText = false;
                consecutiveHighInactivityCount = 0;
              }
            } else {
              // Reset counter if activity detected
              consecutiveHighInactivityCount = 0;
            }
          }
          break;

        case 'end_of_stream':
          clientWs.send(JSON.stringify({ type: 'end_of_stream' }));
          break;

        case 'error':
          logger.error(`STT proxy: Gradium error: ${message.message}`);
          clientWs.send(JSON.stringify({
            type: 'error',
            message: message.message || 'Speech recognition error',
            code: message.code || 500
          }));
          break;

        default:
          logger.debug(`STT proxy: Unknown message type from Gradium: ${message.type}`);
      }
    } catch (error) {
      logger.error(`STT proxy: Failed to parse Gradium message: ${error.message}`);
    }
  });

  // Handle Gradium connection errors
  gradiumWs.on('error', (error) => {
    logger.error(`STT proxy: Gradium WebSocket error: ${error.message}`);
    clientWs.send(JSON.stringify({
      type: 'error',
      message: 'Speech service connection error',
      code: 500
    }));
  });

  // Handle Gradium connection close
  gradiumWs.on('close', (code, reason) => {
    logger.info(`STT proxy: Gradium connection closed: ${code} - ${reason}`);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.close();
    }
  });

  // Track audio chunks for debugging
  let audioChunkCount = 0;

  // Handle messages from client
  clientWs.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'audio':
          audioChunkCount++;
          // Log every 10th chunk to avoid spam
          if (audioChunkCount % 10 === 1) {
            logger.debug(`STT proxy: Received audio chunk #${audioChunkCount} (${message.audio?.length || 0} bytes base64)`);
          }
          // Forward audio to Gradium
          if (isGradiumReady && gradiumWs.readyState === WebSocket.OPEN) {
            gradiumWs.send(JSON.stringify({
              type: 'audio',
              audio: message.audio
            }));
          } else {
            logger.warn(`STT proxy: Cannot forward audio - ready: ${isGradiumReady}, ws state: ${gradiumWs?.readyState}`);
          }
          break;

        case 'end_of_stream':
          // Forward end of stream to Gradium
          if (gradiumWs.readyState === WebSocket.OPEN) {
            gradiumWs.send(JSON.stringify({ type: 'end_of_stream' }));
          }
          break;

        default:
          logger.debug(`STT proxy: Unknown message type from client: ${message.type}`);
      }
    } catch (error) {
      logger.error(`STT proxy: Failed to parse client message: ${error.message}`);
    }
  });

  // Handle client connection close
  clientWs.on('close', () => {
    logger.info('STT proxy: Client disconnected');
    if (gradiumWs && gradiumWs.readyState === WebSocket.OPEN) {
      gradiumWs.send(JSON.stringify({ type: 'end_of_stream' }));
      gradiumWs.close();
    }
  });

  // Handle client errors
  clientWs.on('error', (error) => {
    logger.error(`STT proxy: Client WebSocket error: ${error.message}`);
    if (gradiumWs && gradiumWs.readyState === WebSocket.OPEN) {
      gradiumWs.close();
    }
  });
};

module.exports = {
  handleSTTConnection
};
