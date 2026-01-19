/**
 * Speech-to-Text service using WebSocket proxy to Gradium
 * Handles microphone capture and audio streaming
 */

const SUPPORTED_LANGUAGES = ['en', 'fr', 'de', 'es', 'pt'];

/**
 * Create STT WebSocket connection
 * @param {string} language - Language code (en, fr, de, es, pt)
 * @param {Object} callbacks - Callback functions
 * @param {Function} callbacks.onReady - Called when connection is ready
 * @param {Function} callbacks.onText - Called with transcription text
 * @param {Function} callbacks.onEndText - Called when speech ends (VAD)
 * @param {Function} callbacks.onError - Called on error
 * @param {Function} callbacks.onClose - Called when connection closes
 * @returns {Object} - WebSocket connection and control methods
 */
export const createSTTConnection = (language, callbacks) => {
  const validLanguage = SUPPORTED_LANGUAGES.includes(language) ? language : 'fr';
  
  // Build WebSocket URL (relative to current host)
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/api/v1/speech/stt?lang=${validLanguage}`;
  
  console.log(`[Speech] Connecting to STT WebSocket: ${wsUrl}`);
  
  let ws = null;
  let isReady = false;
  let audioContext = null;
  let mediaStream = null;
  let processor = null;
  let source = null;

  try {
    ws = new WebSocket(wsUrl);
  } catch (error) {
    console.error('[Speech] Failed to create WebSocket:', error);
    callbacks.onError?.('Failed to connect to speech service');
    return null;
  }

  ws.onopen = () => {
    console.log('[Speech] WebSocket connected');
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log('[Speech] Received:', message.type, message);

      switch (message.type) {
        case 'ready':
          isReady = true;
          console.log('[Speech] Ready with config:', message);
          callbacks.onReady?.(message);
          break;

        case 'text':
          console.log('[Speech] Transcription text:', message.text);
          callbacks.onText?.(message.text, message.start_s);
          break;

        case 'end_text':
          console.log('[Speech] End of text at:', message.stop_s);
          callbacks.onEndText?.(message.stop_s);
          break;

        case 'end_of_stream':
          console.log('[Speech] End of stream received');
          callbacks.onClose?.();
          break;

        case 'error':
          console.error('[Speech] Server error:', message.message);
          callbacks.onError?.(message.message);
          break;
          
        default:
          console.log('[Speech] Unknown message type:', message.type, message);
      }
    } catch (error) {
      console.error('[Speech] Failed to parse message:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('[Speech] WebSocket error:', error);
    callbacks.onError?.('Connection error');
  };

  ws.onclose = () => {
    console.log('[Speech] WebSocket closed');
    isReady = false;
    callbacks.onClose?.();
  };

  /**
   * Start capturing audio from microphone
   * @returns {Promise<boolean>} - Success status
   */
  const startCapture = async () => {
    try {
      // Request microphone access
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      // Create AudioContext with target sample rate
      audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 24000
      });

      source = audioContext.createMediaStreamSource(mediaStream);

      // Create ScriptProcessor for audio processing
      // Buffer size of 1920 samples = 80ms at 24kHz (Gradium requirement)
      processor = audioContext.createScriptProcessor(2048, 1, 1);

      processor.onaudioprocess = (event) => {
        if (!isReady || ws.readyState !== WebSocket.OPEN) return;

        const inputData = event.inputBuffer.getChannelData(0);
        
        // Convert Float32 to Int16 PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Convert to base64
        const base64Audio = arrayBufferToBase64(pcmData.buffer);

        // Send to server
        ws.send(JSON.stringify({
          type: 'audio',
          audio: base64Audio
        }));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      console.log('[Speech] Audio capture started');
      return true;
    } catch (error) {
      console.error('[Speech] Failed to start capture:', error);
      if (error.name === 'NotAllowedError') {
        callbacks.onError?.('Microphone access denied');
      } else if (error.name === 'NotFoundError') {
        callbacks.onError?.('No microphone found');
      } else {
        callbacks.onError?.('Failed to access microphone');
      }
      return false;
    }
  };

  /**
   * Stop capturing audio
   */
  const stopCapture = () => {
    console.log('[Speech] Stopping capture');

    if (processor) {
      processor.disconnect();
      processor = null;
    }

    if (source) {
      source.disconnect();
      source = null;
    }

    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      mediaStream = null;
    }

    // Send end of stream to server
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'end_of_stream' }));
    }
  };

  /**
   * Close the connection
   */
  const close = () => {
    stopCapture();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  };

  return {
    startCapture,
    stopCapture,
    close,
    isReady: () => isReady
  };
};

/**
 * Convert ArrayBuffer to base64 string
 * @param {ArrayBuffer} buffer 
 * @returns {string}
 */
const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * Check if speech recognition is supported
 * @returns {boolean}
 */
export const isSpeechSupported = () => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

/**
 * Check if language is supported for STT
 * @param {string} language 
 * @returns {boolean}
 */
export const isLanguageSupported = (language) => {
  return SUPPORTED_LANGUAGES.includes(language);
};

export default {
  createSTTConnection,
  isSpeechSupported,
  isLanguageSupported
};
