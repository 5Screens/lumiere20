import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { createSTTConnection, isSpeechSupported, isLanguageSupported } from '@/services/speech'

/**
 * Composable for voice input with push-to-talk and VAD auto-stop
 * @param {Object} options - Options
 * @param {Function} options.onAutoStop - Callback when VAD detects user stopped speaking
 * @returns {Object} Voice input state and methods
 */
export const useVoiceInput = (options = {}) => {
  const { onAutoStop } = options
  const { locale, t } = useI18n()
  const toast = useToast()

  // State
  const isRecording = ref(false)
  const isConnecting = ref(false)
  const transcription = ref('')
  const sttConnection = ref(null)

  // Computed
  const isVoiceSupported = computed(() => {
    return isSpeechSupported() && isLanguageSupported(locale.value)
  })

  const canRecord = computed(() => {
    return isVoiceSupported.value && !isConnecting.value
  })

  /**
   * Start recording (push-to-talk start)
   * @returns {Promise<boolean>} Success status
   */
  const startRecording = async () => {
    if (isRecording.value || isConnecting.value) return false

    isConnecting.value = true
    transcription.value = ''

    try {
      // Create STT connection
      sttConnection.value = createSTTConnection(locale.value, {
        onReady: async (config) => {
          console.log('[VoiceInput] STT ready, starting capture')
          const success = await sttConnection.value.startCapture()
          if (success) {
            isRecording.value = true
            isConnecting.value = false
          } else {
            isConnecting.value = false
            sttConnection.value?.close()
            sttConnection.value = null
          }
        },
        onText: (text) => {
          console.log('[VoiceInput] Transcription segment:', text)
          // Accumulate transcription segments (Gradium sends word by word)
          if (transcription.value) {
            transcription.value = transcription.value + ' ' + text
          } else {
            transcription.value = text
          }
          console.log('[VoiceInput] Full transcription:', transcription.value)
        },
        onEndText: () => {
          console.log('[VoiceInput] End of text segment detected')
        },
        onSpeechEnd: () => {
          console.log('[VoiceInput] VAD detected user stopped speaking - auto-stopping')
          // Automatically stop recording when VAD detects user stopped speaking
          if (isRecording.value) {
            const finalText = stopRecording()
            // Emit event for parent component to handle
            if (onAutoStop && typeof onAutoStop === 'function') {
              onAutoStop(finalText)
            }
          }
        },
        onError: (message) => {
          console.error('[VoiceInput] Error:', message)
          isRecording.value = false
          isConnecting.value = false
          
          toast.add({
            severity: 'error',
            summary: t('voice.error'),
            detail: getErrorMessage(message),
            life: 5000,
            position: 'top-center'
          })
          
          sttConnection.value?.close()
          sttConnection.value = null
        },
        onClose: () => {
          console.log('[VoiceInput] Connection closed')
          isRecording.value = false
          isConnecting.value = false
        }
      })

      if (!sttConnection.value) {
        throw new Error('Failed to create connection')
      }

      return true
    } catch (error) {
      console.error('[VoiceInput] Failed to start recording:', error)
      isConnecting.value = false
      
      toast.add({
        severity: 'error',
        summary: t('voice.error'),
        detail: t('voice.connectionFailed'),
        life: 5000,
        position: 'top-center'
      })
      
      return false
    }
  }

  /**
   * Stop recording (push-to-talk release)
   * @returns {string} Final transcription
   */
  const stopRecording = () => {
    if (!isRecording.value && !isConnecting.value) return transcription.value

    console.log('[VoiceInput] Stopping recording')
    
    if (sttConnection.value) {
      sttConnection.value.stopCapture()
      sttConnection.value.close()
      sttConnection.value = null
    }

    isRecording.value = false
    isConnecting.value = false

    return transcription.value
  }

  /**
   * Get localized error message
   * @param {string} errorCode 
   * @returns {string}
   */
  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      'Microphone access denied': t('voice.microphoneDenied'),
      'No microphone found': t('voice.noMicrophone'),
      'Failed to access microphone': t('voice.microphoneError'),
      'Connection error': t('voice.connectionFailed'),
      'Speech service not configured': t('voice.serviceNotConfigured')
    }
    return errorMessages[errorCode] || errorCode
  }

  /**
   * Clear transcription
   */
  const clearTranscription = () => {
    transcription.value = ''
  }

  return {
    // State
    isRecording,
    isConnecting,
    transcription,
    isVoiceSupported,
    canRecord,
    
    // Methods
    startRecording,
    stopRecording,
    clearTranscription
  }
}

export default useVoiceInput
