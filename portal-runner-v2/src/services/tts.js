/**
 * Text-to-Speech Service using Gradium via backend WebSocket proxy
 * Streams audio from text using Gradium TTS
 */

let ws = null;
let audioContext = null;
let audioQueue = [];
let isPlaying = false;
let currentSource = null;

/**
 * Create a TTS WebSocket connection
 * @param {string} language - Language code (en, fr, de, es, pt)
 * @param {Object} callbacks - Event callbacks
 * @returns {Object} Connection control object
 */
export const createTTSConnection = (language = 'fr', callbacks = {}) => {
  console.log('[TTS] Creating connection for language:', language);

  // Close existing connection if any
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close();
  }

  // Reset audio state
  audioQueue = [];
  isPlaying = false;
  if (currentSource) {
    try {
      currentSource.stop();
    } catch (e) {
      // Ignore
    }
    currentSource = null;
  }

  // Create AudioContext if needed
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  // Build WebSocket URL (relative to current host)
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/api/v1/speech/tts?lang=${language}`;
  
  console.log('[TTS] Connecting to:', wsUrl);

  try {
    ws = new WebSocket(wsUrl);
  } catch (error) {
    console.error('[TTS] Failed to create WebSocket:', error);
    callbacks.onError?.('Failed to connect to speech service');
    return null;
  }

  ws.onopen = () => {
    console.log('[TTS] WebSocket connected');
    callbacks.onOpen?.();
  };

  ws.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log('[TTS] Received:', message.type);

      switch (message.type) {
        case 'ready':
          console.log('[TTS] Ready, request_id:', message.request_id);
          callbacks.onReady?.(message);
          break;

        case 'audio':
          console.log('[TTS] Audio chunk received');
          // Decode and queue audio for playback
          await queueAudioChunk(message.audio, callbacks);
          break;

        case 'end_of_stream':
          console.log('[TTS] End of stream');
          callbacks.onEnd?.();
          break;

        case 'error':
          console.error('[TTS] Server error:', message.message);
          callbacks.onError?.(message.message);
          break;
          
        default:
          console.log('[TTS] Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('[TTS] Failed to parse message:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('[TTS] WebSocket error:', error);
    callbacks.onError?.('Connection error');
  };

  ws.onclose = () => {
    console.log('[TTS] WebSocket closed');
    callbacks.onClose?.();
  };

  return {
    sendText: (text) => sendText(text),
    stop: () => stopPlayback(),
    close: () => closeConnection()
  };
};

/**
 * Send text to be synthesized
 * @param {string} text - Text to synthesize
 */
const sendText = (text) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.error('[TTS] WebSocket not connected');
    return false;
  }

  console.log('[TTS] Sending text:', text.substring(0, 50) + '...');
  
  ws.send(JSON.stringify({
    type: 'text',
    text: text
  }));

  // Signal end of text
  ws.send(JSON.stringify({ type: 'end_of_stream' }));

  return true;
};

// PCM audio specs from Gradium TTS
const PCM_SAMPLE_RATE = 48000;

/**
 * Queue and play audio chunk
 * @param {string} base64Audio - Base64 encoded PCM audio (48kHz, 16-bit signed integer, mono)
 * @param {Object} callbacks - Event callbacks
 */
const queueAudioChunk = async (base64Audio, callbacks) => {
  try {
    // Decode base64 to ArrayBuffer
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Convert PCM Int16 to Float32 for Web Audio API
    const pcmData = new Int16Array(bytes.buffer);
    const floatData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      // Convert Int16 (-32768 to 32767) to Float32 (-1.0 to 1.0)
      floatData[i] = pcmData[i] / 32768.0;
    }

    // Queue the float audio data
    audioQueue.push(floatData);

    // Start playback if not already playing
    if (!isPlaying) {
      playNextChunk(callbacks);
    }
  } catch (error) {
    console.error('[TTS] Failed to decode audio:', error);
  }
};

/**
 * Play the next audio chunk from the queue
 * @param {Object} callbacks - Event callbacks
 */
const playNextChunk = async (callbacks) => {
  if (audioQueue.length === 0) {
    isPlaying = false;
    console.log('[TTS] Playback complete');
    callbacks.onPlaybackEnd?.();
    return;
  }

  isPlaying = true;
  const floatData = audioQueue.shift();

  try {
    // Resume AudioContext if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // Create AudioBuffer from PCM float data
    const audioBuffer = audioContext.createBuffer(1, floatData.length, PCM_SAMPLE_RATE);
    audioBuffer.getChannelData(0).set(floatData);
    
    // Create and play source
    currentSource = audioContext.createBufferSource();
    currentSource.buffer = audioBuffer;
    currentSource.connect(audioContext.destination);
    
    currentSource.onended = () => {
      playNextChunk(callbacks);
    };

    currentSource.start(0);
    callbacks.onPlaybackStart?.();
  } catch (error) {
    console.error('[TTS] Failed to play audio:', error);
    // Try next chunk
    playNextChunk(callbacks);
  }
};

/**
 * Stop audio playback
 */
const stopPlayback = () => {
  console.log('[TTS] Stopping playback');
  audioQueue = [];
  isPlaying = false;
  
  if (currentSource) {
    try {
      currentSource.stop();
    } catch (e) {
      // Ignore - might already be stopped
    }
    currentSource = null;
  }
};

/**
 * Close the TTS connection
 */
const closeConnection = () => {
  console.log('[TTS] Closing connection');
  stopPlayback();
  
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close();
  }
  ws = null;
};

/**
 * Check if TTS is supported
 * @returns {boolean}
 */
export const isTTSSupported = () => {
  return !!(window.WebSocket && (window.AudioContext || window.webkitAudioContext));
};
