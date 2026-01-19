/**
 * Text-to-Speech Service using Gradium via backend WebSocket proxy
 * Streams audio from text using Gradium TTS
 * 
 * Uses buffered playback with precise Web Audio API scheduling to avoid choppy audio.
 * Gradium recommendation: "Audio responses are streamed in chunks - buffer and process appropriately"
 */

let ws = null;
let audioContext = null;

// Buffered playback state
let audioBufferQueue = [];      // Queue of Float32Array audio data
let isPlaying = false;
let hasStartedPlayback = false; // Track if we've called onPlaybackStart
let scheduledSources = [];      // Track scheduled AudioBufferSourceNodes for cleanup
let nextScheduledTime = 0;      // Next time to schedule audio (in AudioContext time)
let streamEnded = false;        // Track if we received end_of_stream

// Buffer settings - accumulate chunks before starting playback
const MIN_BUFFER_CHUNKS = 3;    // Wait for at least 3 chunks before starting (prevents choppy start)
const SCHEDULE_AHEAD_TIME = 0.1; // Schedule 100ms ahead to prevent gaps

// PCM audio specs from Gradium TTS
const PCM_SAMPLE_RATE = 48000;

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
  resetAudioState();

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

      switch (message.type) {
        case 'ready':
          console.log('[TTS] Ready, request_id:', message.request_id);
          callbacks.onReady?.(message);
          break;

        case 'audio':
          // Decode and queue audio for buffered playback
          await queueAudioChunk(message.audio, callbacks);
          break;

        case 'end_of_stream':
          console.log('[TTS] End of stream received');
          streamEnded = true;
          callbacks.onEnd?.();
          // If we have buffered chunks but haven't started yet, start now
          if (!isPlaying && audioBufferQueue.length > 0) {
            startBufferedPlayback(callbacks);
          }
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
    stop: () => stopPlayback(callbacks),
    close: () => closeConnection(callbacks)
  };
};

/**
 * Reset audio state for new playback
 */
const resetAudioState = () => {
  // Stop all scheduled sources
  for (const source of scheduledSources) {
    try {
      source.stop();
    } catch (e) {
      // Ignore - might already be stopped
    }
  }
  
  audioBufferQueue = [];
  isPlaying = false;
  hasStartedPlayback = false;
  scheduledSources = [];
  nextScheduledTime = 0;
  streamEnded = false;
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

/**
 * Queue audio chunk and start buffered playback when ready
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
    audioBufferQueue.push(floatData);

    // Start playback once we have enough buffered chunks
    if (!isPlaying && audioBufferQueue.length >= MIN_BUFFER_CHUNKS) {
      startBufferedPlayback(callbacks);
    } else if (isPlaying) {
      // If already playing, schedule the new chunk
      scheduleNextChunk(callbacks);
    }
  } catch (error) {
    console.error('[TTS] Failed to decode audio:', error);
  }
};

/**
 * Start buffered playback with precise scheduling
 * @param {Object} callbacks - Event callbacks
 */
const startBufferedPlayback = async (callbacks) => {
  if (isPlaying || audioBufferQueue.length === 0) return;

  console.log('[TTS] Starting buffered playback with', audioBufferQueue.length, 'chunks');
  isPlaying = true;

  try {
    // Resume AudioContext if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // Initialize scheduling time
    nextScheduledTime = audioContext.currentTime + SCHEDULE_AHEAD_TIME;

    // Schedule all buffered chunks
    while (audioBufferQueue.length > 0) {
      scheduleNextChunk(callbacks);
    }

    // Notify playback started (only once)
    if (!hasStartedPlayback) {
      hasStartedPlayback = true;
      callbacks.onPlaybackStart?.();
    }
  } catch (error) {
    console.error('[TTS] Failed to start playback:', error);
    isPlaying = false;
  }
};

/**
 * Schedule the next audio chunk for precise playback
 * @param {Object} callbacks - Event callbacks
 */
const scheduleNextChunk = (callbacks) => {
  if (audioBufferQueue.length === 0) return;

  const floatData = audioBufferQueue.shift();

  try {
    // Create AudioBuffer from PCM float data
    const audioBuffer = audioContext.createBuffer(1, floatData.length, PCM_SAMPLE_RATE);
    audioBuffer.getChannelData(0).set(floatData);
    
    // Create source node
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    
    // Calculate duration of this chunk
    const duration = floatData.length / PCM_SAMPLE_RATE;
    
    // Ensure we don't schedule in the past
    if (nextScheduledTime < audioContext.currentTime) {
      nextScheduledTime = audioContext.currentTime + 0.01; // Small buffer
    }
    
    // Schedule playback at precise time
    source.start(nextScheduledTime);
    
    // Track this source for cleanup
    scheduledSources.push(source);
    
    // Clean up old sources (keep last 10)
    if (scheduledSources.length > 10) {
      scheduledSources.shift();
    }
    
    // Update next scheduled time
    nextScheduledTime += duration;
    
    // Set up end handler on the last scheduled source to detect playback completion
    source.onended = () => {
      // Check if this was the last chunk and stream has ended
      if (streamEnded && audioBufferQueue.length === 0) {
        // Small delay to ensure all audio has played
        setTimeout(() => {
          if (audioBufferQueue.length === 0 && streamEnded) {
            console.log('[TTS] Playback complete');
            isPlaying = false;
            hasStartedPlayback = false;
            callbacks.onPlaybackEnd?.();
          }
        }, 100);
      }
    };
  } catch (error) {
    console.error('[TTS] Failed to schedule audio chunk:', error);
  }
};

/**
 * Stop audio playback
 * @param {Object} callbacks - Event callbacks
 */
const stopPlayback = (callbacks) => {
  console.log('[TTS] Stopping playback');
  
  // Stop all scheduled sources
  for (const source of scheduledSources) {
    try {
      source.stop();
    } catch (e) {
      // Ignore - might already be stopped
    }
  }
  
  audioBufferQueue = [];
  scheduledSources = [];
  isPlaying = false;
  
  if (hasStartedPlayback) {
    hasStartedPlayback = false;
    callbacks?.onPlaybackEnd?.();
  }
};

/**
 * Close the TTS connection
 * @param {Object} callbacks - Event callbacks
 */
const closeConnection = (callbacks) => {
  console.log('[TTS] Closing connection');
  stopPlayback(callbacks);
  
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
