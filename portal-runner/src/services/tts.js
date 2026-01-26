/**
 * Text-to-Speech Service using Gradium via backend WebSocket proxy
 * Streams audio from text using Gradium TTS
 * 
 * Uses buffered playback with precise Web Audio API scheduling to avoid choppy audio.
 * Gradium recommendation: "Audio responses are streamed in chunks - buffer and process appropriately"
 */

let ws = null;
let audioContext = null;
let masterGainNode = null;

// Buffered playback state
let audioBufferQueue = [];      // Queue of Float32Array audio data
let isPlaying = false;
let hasStartedPlayback = false; // Track if we've called onPlaybackStart
let scheduledSources = [];      // Track scheduled AudioBufferSourceNodes for cleanup
let nextScheduledTime = 0;      // Next time to schedule audio (in AudioContext time)
let streamEnded = false;        // Track if we received end_of_stream
let stoppedManually = false;    // Track if playback was stopped manually (to ignore onended callbacks)

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

  // Ensure master gain node exists and is connected (used for instant stop/mute)
  if (!masterGainNode) {
    masterGainNode = audioContext.createGain();
    masterGainNode.gain.value = 1;
    masterGainNode.connect(audioContext.destination);
  } else {
    // Reset gain for a new playback session
    try {
      masterGainNode.gain.setValueAtTime(1, audioContext.currentTime);
    } catch (e) {
      // Ignore
    }
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
      source.disconnect();
      source.stop(0);
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
  stoppedManually = false; // Reset for new playback session

  // Reset master gain as well
  if (masterGainNode && audioContext) {
    try {
      masterGainNode.gain.setValueAtTime(1, audioContext.currentTime);
    } catch (e) {
      // Ignore
    }
  }
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
    if (masterGainNode) {
      source.connect(masterGainNode);
    } else {
      // Fallback (should not happen because masterGainNode is created in createTTSConnection)
      source.connect(audioContext.destination);
    }
    
    // Calculate duration of this chunk
    const duration = floatData.length / PCM_SAMPLE_RATE;
    
    // Ensure we don't schedule in the past
    if (nextScheduledTime < audioContext.currentTime) {
      nextScheduledTime = audioContext.currentTime + 0.01; // Small buffer
    }

    const scheduledAheadSeconds = nextScheduledTime - audioContext.currentTime;
    if (scheduledAheadSeconds > 1) {
      console.log('[TTS] Scheduling audio far ahead:', scheduledAheadSeconds.toFixed(2), 's', 'scheduledSources:', scheduledSources.length);
    }
    
    // Schedule playback at precise time
    source.start(nextScheduledTime);
    
    // Track this source for cleanup
    scheduledSources.push(source);
    
    // Update next scheduled time
    nextScheduledTime += duration;
    
    // Set up end handler on the last scheduled source to detect playback completion
    source.onended = () => {
      // Remove this source from the tracked list (prevents memory growth)
      const idx = scheduledSources.indexOf(source);
      if (idx !== -1) {
        scheduledSources.splice(idx, 1);
      }

      // Ignore if playback was stopped manually
      if (stoppedManually) {
        return;
      }
      // Check if this was the last chunk and stream has ended
      if (streamEnded && audioBufferQueue.length === 0) {
        // Small delay to ensure all audio has played
        setTimeout(() => {
          if (audioBufferQueue.length === 0 && streamEnded && !stoppedManually) {
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
  console.log('[TTS] stopPlayback called - scheduledSources:', scheduledSources.length, 'audioBufferQueue:', audioBufferQueue.length, 'isPlaying:', isPlaying);
  
  // Mark as manually stopped to ignore onended callbacks
  stoppedManually = true;

  // Hard mute immediately (guarantees instant stop even if something is still playing)
  if (masterGainNode && audioContext) {
    try {
      masterGainNode.gain.setValueAtTime(0, audioContext.currentTime);
      console.log('[TTS] Master gain muted at', audioContext.currentTime.toFixed(3));
    } catch (e) {
      // Ignore
    }
  }
  
  // Stop all scheduled sources IMMEDIATELY
  // source.stop(0) forces immediate stop, and disconnect() removes from audio graph
  let stoppedCount = 0;
  for (const source of scheduledSources) {
    try {
      source.disconnect(); // Disconnect from audio graph first
      source.stop(0);      // Force immediate stop (0 = now)
      stoppedCount++;
    } catch (e) {
      // Ignore - might already be stopped or disconnected
    }
  }
  console.log('[TTS] Stopped', stoppedCount, 'audio sources immediately');
  
  audioBufferQueue = [];
  scheduledSources = [];
  isPlaying = false;
  streamEnded = true; // Mark stream as ended to prevent further scheduling
  
  if (hasStartedPlayback) {
    console.log('[TTS] Calling onPlaybackEnd callback');
    hasStartedPlayback = false;
    callbacks?.onPlaybackEnd?.();
  }
  console.log('[TTS] stopPlayback complete');
};

/**
 * Close the TTS connection
 * @param {Object} callbacks - Event callbacks
 */
const closeConnection = (callbacks) => {
  console.log('[TTS] closeConnection called - ws state:', ws?.readyState);
  stopPlayback(callbacks);
  
  if (ws && ws.readyState === WebSocket.OPEN) {
    console.log('[TTS] Closing WebSocket');
    ws.close();
  }
  ws = null;
  console.log('[TTS] closeConnection complete');
};

/**
 * Check if TTS is supported
 * @returns {boolean}
 */
export const isTTSSupported = () => {
  return !!(window.WebSocket && (window.AudioContext || window.webkitAudioContext));
};
