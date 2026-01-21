import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'

/**
 * Composable for full-duplex voice conversation
 * 
 * Flow:
 * 1. User clicks wave button to start session
 * 2. Microphone stays open continuously (STT active)
 * 3. When VAD detects user stopped speaking → send to LLM
 * 4. LLM response → TTS playback
 * 5. If user speaks during TTS → interrupt TTS, go back to step 3
 * 6. User clicks wave button again to end session
 * 
 * @param {Object} options
 * @param {Function} options.onUserMessage - Called with transcribed text when user finishes speaking
 * @param {Function} options.onStateChange - Called when session state changes
 * @returns {Object} Full-duplex voice state and methods
 */
export const useFullDuplexVoice = (options = {}) => {
  const { onUserMessage, onStateChange } = options
  const { locale, t } = useI18n()
  const toast = useToast()

  // Session state
  const isSessionActive = ref(false)
  const isConnecting = ref(false)
  
  // STT state
  const sttWs = ref(null)
  const isSTTReady = ref(false)
  const transcription = ref('')
  const isUserSpeaking = ref(false)
  
  // TTS state
  const ttsWs = ref(null)
  const isTTSReady = ref(false)
  const isSpeaking = ref(false) // AI is speaking
  
  // Audio capture state
  const audioContext = ref(null)
  const mediaStream = ref(null)
  const processor = ref(null)
  const source = ref(null)
  
  // TTS playback state
  const ttsAudioContext = ref(null)
  const masterGainNode = ref(null)
  const audioBufferQueue = ref([])
  const scheduledSources = ref([])
  const nextScheduledTime = ref(0)
  const streamEnded = ref(false)
  const hasStartedPlayback = ref(false)
  
  // VAD tracking for detecting when user stops speaking
  let consecutiveHighInactivityCount = 0
  const VAD_INACTIVITY_THRESHOLD = 0.5
  const VAD_CONSECUTIVE_STEPS_FOR_END = 8 // ~640ms
  let hasReceivedText = false
  
  // TTS settings
  const PCM_SAMPLE_RATE = 48000
  const MIN_BUFFER_CHUNKS = 3
  const SCHEDULE_AHEAD_TIME = 0.1

  const SUPPORTED_LANGUAGES = ['en', 'fr', 'de', 'es', 'pt']

  // Computed
  const isSupported = computed(() => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.WebSocket)
  })

  const currentState = computed(() => {
    if (!isSessionActive.value) return 'idle'
    if (isConnecting.value) return 'connecting'
    if (isSpeaking.value) return 'speaking' // AI speaking
    if (isUserSpeaking.value) return 'listening' // User speaking
    return 'waiting' // Waiting for user to speak
  })

  // Watch state changes
  watch(currentState, (newState) => {
    console.log('[FullDuplex] State changed to:', newState)
    onStateChange?.(newState)
  })

  /**
   * Start full-duplex voice session
   */
  const startSession = async () => {
    if (isSessionActive.value || isConnecting.value) {
      console.log('[FullDuplex] Session already active or connecting')
      return false
    }

    console.log('[FullDuplex] Starting full-duplex session')
    isConnecting.value = true
    transcription.value = ''

    try {
      // Initialize TTS audio context first
      await initTTSAudioContext()
      
      // Connect to STT WebSocket
      const sttConnected = await connectSTT()
      if (!sttConnected) {
        throw new Error('Failed to connect to STT service')
      }

      // Connect to TTS WebSocket
      const ttsConnected = await connectTTS()
      if (!ttsConnected) {
        throw new Error('Failed to connect to TTS service')
      }

      // Start microphone capture
      const captureStarted = await startMicrophoneCapture()
      if (!captureStarted) {
        throw new Error('Failed to start microphone capture')
      }

      isSessionActive.value = true
      isConnecting.value = false
      console.log('[FullDuplex] Session started successfully')
      return true
    } catch (error) {
      console.error('[FullDuplex] Failed to start session:', error)
      isConnecting.value = false
      cleanup()
      
      toast.add({
        severity: 'error',
        summary: t('voice.error'),
        detail: error.message,
        life: 5000
      })
      
      return false
    }
  }

  /**
   * Stop full-duplex voice session
   */
  const stopSession = () => {
    console.log('[FullDuplex] Stopping session')
    cleanup()
    isSessionActive.value = false
    isConnecting.value = false
  }

  /**
   * Toggle session (start/stop)
   */
  const toggleSession = async () => {
    if (isSessionActive.value) {
      stopSession()
      return false
    } else {
      return await startSession()
    }
  }

  /**
   * Speak text via TTS (called when LLM responds)
   */
  const speak = (text) => {
    if (!text || !text.trim()) {
      console.log('[FullDuplex] No text to speak')
      return
    }

    if (!isSessionActive.value) {
      console.log('[FullDuplex] Session not active, cannot speak')
      return
    }

    console.log('[FullDuplex] Speaking:', text.substring(0, 50) + '...')
    
    // Reset TTS state for new utterance
    resetTTSPlaybackState()
    
    // Send text to TTS
    if (ttsWs.value && ttsWs.value.readyState === WebSocket.OPEN && isTTSReady.value) {
      ttsWs.value.send(JSON.stringify({ type: 'text', text }))
      ttsWs.value.send(JSON.stringify({ type: 'end_of_stream' }))
    } else {
      console.error('[FullDuplex] TTS WebSocket not ready')
      // Try to reconnect TTS
      reconnectTTS()
    }
  }

  /**
   * Interrupt TTS playback (called when user starts speaking)
   */
  const interruptTTS = () => {
    if (!isSpeaking.value) return
    
    console.log('[FullDuplex] Interrupting TTS - user is speaking')
    stopTTSPlayback()
  }

  // ============================================
  // STT Connection and Handling
  // ============================================

  const connectSTT = () => {
    return new Promise((resolve) => {
      const validLanguage = SUPPORTED_LANGUAGES.includes(locale.value) ? locale.value : 'fr'
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/api/v1/speech/stt?lang=${validLanguage}`
      
      console.log('[FullDuplex] Connecting to STT:', wsUrl)
      
      try {
        sttWs.value = new WebSocket(wsUrl)
      } catch (error) {
        console.error('[FullDuplex] Failed to create STT WebSocket:', error)
        resolve(false)
        return
      }

      sttWs.value.onopen = () => {
        console.log('[FullDuplex] STT WebSocket connected')
      }

      sttWs.value.onmessage = (event) => {
        handleSTTMessage(JSON.parse(event.data), resolve)
      }

      sttWs.value.onerror = (error) => {
        console.error('[FullDuplex] STT WebSocket error:', error)
        resolve(false)
      }

      sttWs.value.onclose = () => {
        console.log('[FullDuplex] STT WebSocket closed')
        isSTTReady.value = false
        
        // If session is still active, try to reconnect
        if (isSessionActive.value) {
          console.log('[FullDuplex] Attempting STT reconnection...')
          setTimeout(() => reconnectSTT(), 1000)
        }
      }
    })
  }

  const handleSTTMessage = (message, resolveConnect) => {
    switch (message.type) {
      case 'ready':
        console.log('[FullDuplex] STT ready')
        isSTTReady.value = true
        resolveConnect?.(true)
        break

      case 'text':
        // User is speaking - accumulate transcription
        isUserSpeaking.value = true
        hasReceivedText = true
        consecutiveHighInactivityCount = 0
        
        if (transcription.value) {
          transcription.value = transcription.value + ' ' + message.text
        } else {
          transcription.value = message.text
        }
        console.log('[FullDuplex] Transcription:', transcription.value)
        
        // If TTS is playing, interrupt it
        if (isSpeaking.value) {
          interruptTTS()
        }
        break

      case 'step':
        // VAD activity detection
        if (message.vad && message.vad.length > 0) {
          const vad2s = message.vad.find(v => v.horizon_s === 2)
          if (vad2s && vad2s.inactivity_prob > VAD_INACTIVITY_THRESHOLD) {
            consecutiveHighInactivityCount++
            
            if (consecutiveHighInactivityCount >= VAD_CONSECUTIVE_STEPS_FOR_END && hasReceivedText) {
              console.log('[FullDuplex] VAD detected user stopped speaking')
              handleUserFinishedSpeaking()
            }
          } else {
            consecutiveHighInactivityCount = 0
          }
        }
        break

      case 'end_text':
        console.log('[FullDuplex] End of text segment')
        break

      case 'speech_end':
        // Backend VAD detected user stopped speaking
        console.log('[FullDuplex] Backend VAD detected speech end')
        if (hasReceivedText && transcription.value.trim()) {
          handleUserFinishedSpeaking()
        }
        break

      case 'error':
        console.error('[FullDuplex] STT error:', message.message)
        break
    }
  }

  const handleUserFinishedSpeaking = () => {
    if (!transcription.value.trim()) return
    
    const finalText = transcription.value.trim()
    console.log('[FullDuplex] User finished speaking:', finalText)
    
    // Reset for next utterance
    isUserSpeaking.value = false
    hasReceivedText = false
    consecutiveHighInactivityCount = 0
    transcription.value = ''
    
    // Notify parent component
    onUserMessage?.(finalText)
  }

  const reconnectSTT = async () => {
    if (!isSessionActive.value) return
    
    console.log('[FullDuplex] Reconnecting STT...')
    const connected = await connectSTT()
    if (connected && mediaStream.value) {
      // Microphone is still active, just need to reconnect WebSocket
      console.log('[FullDuplex] STT reconnected successfully')
    }
  }

  // ============================================
  // TTS Connection and Handling
  // ============================================

  const connectTTS = () => {
    return new Promise((resolve) => {
      const validLanguage = SUPPORTED_LANGUAGES.includes(locale.value) ? locale.value : 'fr'
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/api/v1/speech/tts?lang=${validLanguage}`
      
      console.log('[FullDuplex] Connecting to TTS:', wsUrl)
      
      try {
        ttsWs.value = new WebSocket(wsUrl)
      } catch (error) {
        console.error('[FullDuplex] Failed to create TTS WebSocket:', error)
        resolve(false)
        return
      }

      ttsWs.value.onopen = () => {
        console.log('[FullDuplex] TTS WebSocket connected')
      }

      ttsWs.value.onmessage = async (event) => {
        await handleTTSMessage(JSON.parse(event.data), resolve)
      }

      ttsWs.value.onerror = (error) => {
        console.error('[FullDuplex] TTS WebSocket error:', error)
        resolve(false)
      }

      ttsWs.value.onclose = () => {
        console.log('[FullDuplex] TTS WebSocket closed')
        isTTSReady.value = false
        
        // If session is still active, try to reconnect
        if (isSessionActive.value) {
          console.log('[FullDuplex] Attempting TTS reconnection...')
          setTimeout(() => reconnectTTS(), 1000)
        }
      }
    })
  }

  const handleTTSMessage = async (message, resolveConnect) => {
    switch (message.type) {
      case 'ready':
        console.log('[FullDuplex] TTS ready')
        isTTSReady.value = true
        resolveConnect?.(true)
        break

      case 'audio':
        await queueAudioChunk(message.audio)
        break

      case 'end_of_stream':
        console.log('[FullDuplex] TTS end of stream')
        streamEnded.value = true
        // If we have buffered chunks but haven't started yet, start now
        if (!hasStartedPlayback.value && audioBufferQueue.value.length > 0) {
          startBufferedPlayback()
        }
        break

      case 'error':
        console.error('[FullDuplex] TTS error:', message.message)
        break
    }
  }

  const reconnectTTS = async () => {
    if (!isSessionActive.value) return
    
    console.log('[FullDuplex] Reconnecting TTS...')
    await connectTTS()
  }

  // ============================================
  // Microphone Capture
  // ============================================

  const startMicrophoneCapture = async () => {
    try {
      mediaStream.value = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      })

      audioContext.value = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 24000
      })

      source.value = audioContext.value.createMediaStreamSource(mediaStream.value)
      processor.value = audioContext.value.createScriptProcessor(2048, 1, 1)

      processor.value.onaudioprocess = (event) => {
        if (!isSTTReady.value || !sttWs.value || sttWs.value.readyState !== WebSocket.OPEN) return

        const inputData = event.inputBuffer.getChannelData(0)
        
        // Convert Float32 to Int16 PCM
        const pcmData = new Int16Array(inputData.length)
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]))
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
        }

        // Convert to base64
        const base64Audio = arrayBufferToBase64(pcmData.buffer)

        // Send to STT
        sttWs.value.send(JSON.stringify({
          type: 'audio',
          audio: base64Audio
        }))
      }

      source.value.connect(processor.value)
      processor.value.connect(audioContext.value.destination)

      console.log('[FullDuplex] Microphone capture started')
      return true
    } catch (error) {
      console.error('[FullDuplex] Failed to start microphone:', error)
      return false
    }
  }

  const stopMicrophoneCapture = () => {
    if (processor.value) {
      processor.value.disconnect()
      processor.value = null
    }

    if (source.value) {
      source.value.disconnect()
      source.value = null
    }

    if (audioContext.value) {
      audioContext.value.close()
      audioContext.value = null
    }

    if (mediaStream.value) {
      mediaStream.value.getTracks().forEach(track => track.stop())
      mediaStream.value = null
    }
  }

  // ============================================
  // TTS Audio Playback
  // ============================================

  const initTTSAudioContext = async () => {
    if (!ttsAudioContext.value) {
      ttsAudioContext.value = new (window.AudioContext || window.webkitAudioContext)()
    }

    if (!masterGainNode.value) {
      masterGainNode.value = ttsAudioContext.value.createGain()
      masterGainNode.value.gain.value = 1
      masterGainNode.value.connect(ttsAudioContext.value.destination)
    } else {
      try {
        masterGainNode.value.gain.setValueAtTime(1, ttsAudioContext.value.currentTime)
      } catch (e) {
        // Ignore
      }
    }
  }

  const resetTTSPlaybackState = () => {
    // Stop any currently playing audio
    stopTTSPlayback()
    
    audioBufferQueue.value = []
    scheduledSources.value = []
    nextScheduledTime.value = 0
    streamEnded.value = false
    hasStartedPlayback.value = false

    if (masterGainNode.value && ttsAudioContext.value) {
      try {
        masterGainNode.value.gain.setValueAtTime(1, ttsAudioContext.value.currentTime)
      } catch (e) {
        // Ignore
      }
    }
  }

  const queueAudioChunk = async (base64Audio) => {
    try {
      const binaryString = atob(base64Audio)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const pcmData = new Int16Array(bytes.buffer)
      const floatData = new Float32Array(pcmData.length)
      for (let i = 0; i < pcmData.length; i++) {
        floatData[i] = pcmData[i] / 32768.0
      }

      audioBufferQueue.value.push(floatData)

      if (!hasStartedPlayback.value && audioBufferQueue.value.length >= MIN_BUFFER_CHUNKS) {
        startBufferedPlayback()
      } else if (hasStartedPlayback.value) {
        scheduleNextChunk()
      }
    } catch (error) {
      console.error('[FullDuplex] Failed to decode audio:', error)
    }
  }

  const startBufferedPlayback = async () => {
    if (hasStartedPlayback.value || audioBufferQueue.value.length === 0) return

    console.log('[FullDuplex] Starting TTS playback with', audioBufferQueue.value.length, 'chunks')

    try {
      if (ttsAudioContext.value.state === 'suspended') {
        await ttsAudioContext.value.resume()
      }

      nextScheduledTime.value = ttsAudioContext.value.currentTime + SCHEDULE_AHEAD_TIME
      hasStartedPlayback.value = true
      isSpeaking.value = true

      while (audioBufferQueue.value.length > 0) {
        scheduleNextChunk()
      }
    } catch (error) {
      console.error('[FullDuplex] Failed to start playback:', error)
      hasStartedPlayback.value = false
    }
  }

  const scheduleNextChunk = () => {
    if (audioBufferQueue.value.length === 0) return

    const floatData = audioBufferQueue.value.shift()

    try {
      const audioBuffer = ttsAudioContext.value.createBuffer(1, floatData.length, PCM_SAMPLE_RATE)
      audioBuffer.getChannelData(0).set(floatData)
      
      const sourceNode = ttsAudioContext.value.createBufferSource()
      sourceNode.buffer = audioBuffer
      sourceNode.connect(masterGainNode.value)
      
      const duration = floatData.length / PCM_SAMPLE_RATE
      
      if (nextScheduledTime.value < ttsAudioContext.value.currentTime) {
        nextScheduledTime.value = ttsAudioContext.value.currentTime + 0.01
      }

      sourceNode.start(nextScheduledTime.value)
      scheduledSources.value.push(sourceNode)
      nextScheduledTime.value += duration
      
      sourceNode.onended = () => {
        const idx = scheduledSources.value.indexOf(sourceNode)
        if (idx !== -1) {
          scheduledSources.value.splice(idx, 1)
        }

        // Check if playback is complete
        if (streamEnded.value && audioBufferQueue.value.length === 0 && scheduledSources.value.length === 0) {
          setTimeout(() => {
            if (audioBufferQueue.value.length === 0 && streamEnded.value) {
              console.log('[FullDuplex] TTS playback complete')
              isSpeaking.value = false
              hasStartedPlayback.value = false
            }
          }, 100)
        }
      }
    } catch (error) {
      console.error('[FullDuplex] Failed to schedule audio chunk:', error)
    }
  }

  const stopTTSPlayback = () => {
    console.log('[FullDuplex] Stopping TTS playback')

    // Mute immediately
    if (masterGainNode.value && ttsAudioContext.value) {
      try {
        masterGainNode.value.gain.setValueAtTime(0, ttsAudioContext.value.currentTime)
      } catch (e) {
        // Ignore
      }
    }

    // Stop all scheduled sources
    for (const sourceNode of scheduledSources.value) {
      try {
        sourceNode.disconnect()
        sourceNode.stop(0)
      } catch (e) {
        // Ignore
      }
    }

    audioBufferQueue.value = []
    scheduledSources.value = []
    isSpeaking.value = false
    hasStartedPlayback.value = false
    streamEnded.value = true

    // Reset gain for next playback
    if (masterGainNode.value && ttsAudioContext.value) {
      try {
        masterGainNode.value.gain.setValueAtTime(1, ttsAudioContext.value.currentTime)
      } catch (e) {
        // Ignore
      }
    }
  }

  // ============================================
  // Cleanup
  // ============================================

  const cleanup = () => {
    console.log('[FullDuplex] Cleaning up...')
    
    // Stop microphone
    stopMicrophoneCapture()
    
    // Stop TTS playback
    stopTTSPlayback()
    
    // Close STT WebSocket
    if (sttWs.value) {
      if (sttWs.value.readyState === WebSocket.OPEN) {
        sttWs.value.send(JSON.stringify({ type: 'end_of_stream' }))
        sttWs.value.close()
      }
      sttWs.value = null
    }
    isSTTReady.value = false
    
    // Close TTS WebSocket
    if (ttsWs.value) {
      if (ttsWs.value.readyState === WebSocket.OPEN) {
        ttsWs.value.close()
      }
      ttsWs.value = null
    }
    isTTSReady.value = false
    
    // Reset state
    transcription.value = ''
    isUserSpeaking.value = false
    hasReceivedText = false
    consecutiveHighInactivityCount = 0
  }

  // ============================================
  // Utilities
  // ============================================

  const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  return {
    // State
    isSessionActive,
    isConnecting,
    isSupported,
    currentState,
    transcription,
    isUserSpeaking,
    isSpeaking,
    
    // Methods
    startSession,
    stopSession,
    toggleSession,
    speak,
    interruptTTS
  }
}

export default useFullDuplexVoice
